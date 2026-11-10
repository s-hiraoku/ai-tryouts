import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const serverPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "server.mjs",
);

function assert(condition, label) {
  if (!condition) throw new Error(label);
  console.log(`ok ${label}`);
}

function openServer(env) {
  const child = spawn(process.execPath, [serverPath], {
    stdio: ["pipe", "pipe", "pipe"],
    env: { ...process.env, ...env },
  });
  let buffer = "";
  let stderr = "";
  const pending = new Map();
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });
  child.stdout.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    buffer += chunk;
    let newline = buffer.indexOf("\n");
    while (newline !== -1) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      newline = buffer.indexOf("\n");
      if (line === "") continue;
      const message = JSON.parse(line);
      const waiter = pending.get(message.id);
      if (!waiter) throw new Error(`unexpected response ${line}`);
      pending.delete(message.id);
      waiter(message);
    }
  });
  let nextId = 1;
  return {
    stderr: () => stderr,
    async rpc(method, params, timeoutMs = 5000) {
      const id = nextId++;
      const body = { jsonrpc: "2.0", id, method };
      if (params !== undefined) body.params = params;
      child.stdin.write(`${JSON.stringify(body)}\n`);
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          pending.delete(id);
          reject(new Error(`timeout ${method}`));
        }, timeoutMs);
        pending.set(id, (message) => {
          clearTimeout(timer);
          resolve(message);
        });
      });
    },
    close() {
      child.stdin.end();
    },
  };
}

const tasksMeta = {
  _meta: {
    "io.modelcontextprotocol/clientCapabilities": {
      extensions: { "io.modelcontextprotocol/tasks": {} },
    },
  },
};

async function checkTaskPath() {
  const server = openServer({});
  try {
    const initialized = await server.rpc("initialize", {
      protocolVersion: "2026-07-28",
      capabilities: {},
      clientInfo: { name: "slow-mcp-check", version: "0.1.0" },
    });
    assert(
      initialized.result?.protocolVersion === "2026-07-28",
      "initialize accepts protocol 2026-07-28",
    );
    assert(
      initialized.result?.capabilities?.extensions?.[
        "io.modelcontextprotocol/tasks"
      ] !== undefined,
      "initialize advertises the tasks extension",
    );
    assert(server.stderr().includes("slow-mcp ready"), "stderr says ready");

    const listed = await server.rpc("tools/list");
    assert(
      listed.result?.tools?.some((tool) => tool.name === "slow_echo"),
      "tools/list includes slow_echo",
    );

    const started = Date.now();
    const accepted = await server.rpc("tools/call", {
      ...tasksMeta,
      name: "slow_echo",
      arguments: { text: "hello", seconds: 0.4 },
    });
    const acceptedMs = Date.now() - started;
    assert(acceptedMs < 200, `task accept returned in ${acceptedMs} ms`);
    assert(accepted.result?.resultType === "task", "tools/call resultType is task");
    assert(accepted.result?.status === "working", "new task status is working");
    const taskId = accepted.result?.taskId;
    assert(typeof taskId === "string" && taskId.length > 0, "taskId is present");

    const early = await server.rpc("tasks/get", { taskId });
    assert(early.result?.resultType === "complete", "tasks/get resultType is complete");
    assert(early.result?.status === "working", "tasks/get is working before the wait");

    await new Promise((resolve) => setTimeout(resolve, 500));
    const done = await server.rpc("tasks/get", { taskId });
    assert(done.result?.status === "completed", "tasks/get is completed after the wait");
    assert(
      done.result?.result?.content?.[0]?.text === "hello",
      "completed task returns the text",
    );

    const defaulted = await server.rpc("tools/call", {
      ...tasksMeta,
      name: "slow_echo",
      arguments: { text: "default" },
    });
    assert(
      defaulted.result?.statusMessage === "sleeping 20000 ms",
      "omitted seconds waits 20000 ms",
    );
    const cancelled = await server.rpc("tasks/cancel", {
      taskId: defaulted.result.taskId,
    });
    assert(
      cancelled.result?.resultType === "complete" && cancelled.error === undefined,
      "tasks/cancel acknowledges a known task",
    );
    const afterCancel = await server.rpc("tasks/get", {
      taskId: defaulted.result.taskId,
    });
    assert(afterCancel.result?.status === "cancelled", "cancelled task stays cancelled");
    assert(afterCancel.result?.result === undefined, "cancelled task has no result text");

    const missing = await server.rpc("tasks/get", { taskId: "missing" });
    assert(missing.error?.code === -32602, "unknown taskId is -32602");

    const blockedAt = Date.now();
    const blocked = await server.rpc(
      "tools/call",
      { name: "slow_echo", arguments: { text: "plain", seconds: 0.3 } },
      5000,
    );
    const blockedMs = Date.now() - blockedAt;
    assert(blockedMs >= 250, `plain call waited ${blockedMs} ms`);
    assert(
      blocked.result?.content?.[0]?.text === "plain",
      "plain call returns the text in content",
    );
    assert(blocked.result?.resultType === undefined, "plain call is not a task");
  } finally {
    server.close();
  }
}

async function checkPlainOverride() {
  const server = openServer({ SLOW_MCP_PLAIN: "1" });
  try {
    await server.rpc("initialize", {
      protocolVersion: "2026-07-28",
      capabilities: {},
      clientInfo: { name: "slow-mcp-check", version: "0.1.0" },
    });
    const blockedAt = Date.now();
    const blocked = await server.rpc(
      "tools/call",
      {
        ...tasksMeta,
        name: "slow_echo",
        arguments: { text: "forced", seconds: 0.3 },
      },
      5000,
    );
    const blockedMs = Date.now() - blockedAt;
    assert(blockedMs >= 250, `SLOW_MCP_PLAIN=1 waited ${blockedMs} ms`);
    assert(
      blocked.result?.content?.[0]?.text === "forced",
      "SLOW_MCP_PLAIN=1 returns the text instead of a task",
    );
  } finally {
    server.close();
  }
}

try {
  await checkTaskPath();
  await checkPlainOverride();
  console.log("PASS");
} catch (error) {
  console.error(`FAIL ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
}
