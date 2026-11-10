import readline from "node:readline";
import { randomUUID } from "node:crypto";

const TASKS_EXTENSION = "io.modelcontextprotocol/tasks";
const DEFAULT_SECONDS = 20;
const MAX_SECONDS = 180;
const POLL_INTERVAL_MS = 500;

const tasks = new Map();

function write(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

function fail(id, code, message) {
  write({ jsonrpc: "2.0", id, error: { code, message } });
}

function clientAskedForTasks(params) {
  if (process.env.SLOW_MCP_PLAIN === "1") return false;
  const extensions =
    params?._meta?.["io.modelcontextprotocol/clientCapabilities"]?.extensions;
  return (
    extensions !== null &&
    typeof extensions === "object" &&
    Object.prototype.hasOwnProperty.call(extensions, TASKS_EXTENSION)
  );
}

function readCall(params) {
  const args = params?.arguments ?? {};
  if (typeof args.text !== "string") return { error: "text must be a string" };
  if (args.seconds === undefined) {
    return { text: args.text, seconds: DEFAULT_SECONDS };
  }
  if (typeof args.seconds !== "number" || !Number.isFinite(args.seconds)) {
    return { error: "seconds must be a finite number" };
  }
  if (args.seconds < 0 || args.seconds > MAX_SECONDS) {
    return { error: `seconds must be from 0 to ${MAX_SECONDS}` };
  }
  return { text: args.text, seconds: args.seconds };
}

function settle(task, now) {
  if (task.status !== "working" || now < task.finishAt) return;
  task.status = "completed";
  task.lastUpdatedAt = new Date(now).toISOString();
  task.statusMessage = "done";
}

function taskFields(task, now) {
  settle(task, now);
  const fields = {
    taskId: task.taskId,
    status: task.status,
    statusMessage: task.statusMessage,
    createdAt: task.createdAt,
    lastUpdatedAt: task.lastUpdatedAt,
    ttlMs: null,
    pollIntervalMs: POLL_INTERVAL_MS,
  };
  if (task.status === "completed") {
    fields.result = { content: [{ type: "text", text: task.text }] };
  }
  return fields;
}

function plainResult(text) {
  return { content: [{ type: "text", text }] };
}

function startTask(text, seconds, now) {
  const createdAt = new Date(now).toISOString();
  const task = {
    taskId: randomUUID(),
    status: "working",
    statusMessage: `sleeping ${Math.round(seconds * 1000)} ms`,
    createdAt,
    lastUpdatedAt: createdAt,
    finishAt: now + seconds * 1000,
    text,
  };
  tasks.set(task.taskId, task);
  settle(task, now);
  return task;
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function onCall(id, params) {
  if (params?.name !== "slow_echo") {
    fail(id, -32602, "unknown tool");
    return;
  }
  const call = readCall(params);
  if (call.error) {
    fail(id, -32602, call.error);
    return;
  }
  if (!clientAskedForTasks(params)) {
    await sleep(call.seconds * 1000);
    write({ jsonrpc: "2.0", id, result: plainResult(call.text) });
    return;
  }
  const task = startTask(call.text, call.seconds, Date.now());
  write({
    jsonrpc: "2.0",
    id,
    result: { resultType: "task", ...taskFields(task, Date.now()) },
  });
}

function onGet(id, params) {
  const task = tasks.get(params?.taskId);
  if (!task) {
    fail(id, -32602, "unknown taskId");
    return;
  }
  write({
    jsonrpc: "2.0",
    id,
    result: { resultType: "complete", ...taskFields(task, Date.now()) },
  });
}

function onCancel(id, params) {
  const task = tasks.get(params?.taskId);
  if (!task) {
    fail(id, -32602, "unknown taskId");
    return;
  }
  if (task.status === "working") {
    task.status = "cancelled";
    task.lastUpdatedAt = new Date().toISOString();
    task.statusMessage = "cancelled";
  }
  write({ jsonrpc: "2.0", id, result: { resultType: "complete" } });
}

const tools = [
  {
    name: "slow_echo",
    description:
      "Wait, then return the given text. When the client includes the MCP tasks extension, return a task immediately and finish after the wait.",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string" },
        seconds: {
          type: "number",
          minimum: 0,
          maximum: MAX_SECONDS,
          description: `Wait time in seconds. Default ${DEFAULT_SECONDS}. Maximum ${MAX_SECONDS}.`,
        },
      },
      required: ["text"],
      additionalProperties: false,
    },
  },
];

function capabilities() {
  return {
    tools: { listChanged: false },
    extensions: { [TASKS_EXTENSION]: {} },
  };
}

async function handle(message) {
  const { id, method, params } = message;
  if (typeof method !== "string") {
    if (id !== undefined) fail(id, -32600, "Invalid Request");
    return;
  }
  if (method.startsWith("notifications/")) return;

  if (method === "initialize") {
    const requested = params?.protocolVersion;
    const protocolVersion =
      requested === "2025-11-25" || requested === "2026-07-28"
        ? requested
        : "2026-07-28";
    write({
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion,
        capabilities: capabilities(),
        serverInfo: { name: "slow-mcp", version: "0.1.0" },
      },
    });
    return;
  }
  if (method === "server/discover") {
    write({ jsonrpc: "2.0", id, result: { capabilities: capabilities() } });
    return;
  }
  if (method === "ping") {
    write({ jsonrpc: "2.0", id, result: {} });
    return;
  }
  if (method === "tools/list") {
    write({ jsonrpc: "2.0", id, result: { tools } });
    return;
  }
  if (method === "tools/call") {
    await onCall(id, params);
    return;
  }
  if (method === "tasks/get") {
    onGet(id, params);
    return;
  }
  if (method === "tasks/cancel") {
    onCancel(id, params);
    return;
  }
  fail(id ?? null, -32601, "Method not found");
}

const lines = readline.createInterface({ input: process.stdin });
lines.on("line", (line) => {
  const trimmed = line.trim();
  if (trimmed === "") return;
  let message;
  try {
    message = JSON.parse(trimmed);
  } catch {
    write({
      jsonrpc: "2.0",
      id: null,
      error: { code: -32700, message: "Parse error" },
    });
    return;
  }
  Promise.resolve(handle(message)).catch((error) => {
    const id = message?.id ?? null;
    fail(id, -32603, error instanceof Error ? error.message : "Internal error");
  });
});
lines.on("close", () => {
  process.exit(0);
});

process.stderr.write("slow-mcp ready\n");
