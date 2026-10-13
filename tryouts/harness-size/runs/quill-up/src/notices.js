import { createHash } from "node:crypto";

class QuillAmountError extends Error {
  constructor() {
    super("amount must be an integer of 0 or more");
    this.name = "QuillAmountError";
  }
}

class QuillTitleError extends Error {
  constructor() {
    super("title is empty");
    this.name = "QuillTitleError";
  }
}

function decimalAmount(amount) {
  const plain = amount.toString(10);
  if (plain.includes("e")) {
    return BigInt(amount).toString(10);
  }
  return plain;
}

export function qv_format_notice(title, amount, seed) {
  if (typeof title !== "string") {
    throw new TypeError("title must be a string");
  }
  const trimmedTitle = title.trim();
  if (trimmedTitle === "") {
    throw new QuillTitleError();
  }
  if (!Number.isInteger(amount) || amount < 0) {
    throw new QuillAmountError();
  }
  if (typeof seed !== "string") {
    throw new TypeError("seed must be a string");
  }
  const digest = createHash("sha256").update(seed, "utf8").digest("hex").slice(0, 8);
  return `${trimmedTitle} | ${decimalAmount(amount)} qv | ${digest}`;
}
