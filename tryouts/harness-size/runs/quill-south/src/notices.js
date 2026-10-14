import { createHash } from "node:crypto";

export class QuillAmountError extends Error {
  constructor(message = "amount must be a non-negative integer") {
    super(message);
    this.name = "QuillAmountError";
  }
}

export class QuillTitleError extends Error {
  constructor(message = "title must be non-empty") {
    super(message);
    this.name = "QuillTitleError";
  }
}

function isNonNegativeInteger(amount) {
  return typeof amount === "number" && Number.isInteger(amount) && amount >= 0;
}

function digestSeed(seed) {
  return createHash("sha256").update(seed, "utf8").digest("hex").slice(0, 8);
}

export function qv_format_notice(title, amount, seed) {
  if (typeof title !== "string") {
    throw new QuillTitleError();
  }
  const trimmed = title.trim();
  if (trimmed.length === 0) {
    throw new QuillTitleError();
  }
  if (!isNonNegativeInteger(amount)) {
    throw new QuillAmountError();
  }
  return `${trimmed} | ${amount.toString(10)} qv | ${digestSeed(seed)}`;
}
