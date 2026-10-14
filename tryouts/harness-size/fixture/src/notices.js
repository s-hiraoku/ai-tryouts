import { createHash } from "node:crypto";

export class QuillAmountError extends Error {
  constructor() {
    super("amount");
    this.name = "QuillAmountError";
  }
}

export class QuillTitleError extends Error {
  constructor() {
    super("title");
    this.name = "QuillTitleError";
  }
}

export function qv_format_notice(title, amount, seed) {
  if (typeof amount !== "number" || !Number.isInteger(amount) || amount < 0) {
    throw new QuillAmountError();
  }
  const trimmed = String(title).trim();
  if (trimmed.length === 0) {
    throw new QuillTitleError();
  }
  const digest = createHash("sha256").update(String(seed), "utf8").digest("hex").slice(0, 8);
  return `${trimmed} | ${amount} qv | ${digest}`;
}
