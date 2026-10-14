import { createHash } from "node:crypto";

class QuillTitleError extends Error {
  constructor() {
    super("title is empty");
    this.name = "QuillTitleError";
  }
}

class QuillAmountError extends Error {
  constructor() {
    super("amount is not an integer of 0 or more");
    this.name = "QuillAmountError";
  }
}

class QuillSeedError extends Error {
  constructor() {
    super("seed is not a string");
    this.name = "QuillSeedError";
  }
}

export function qv_format_notice(title, amount, seed) {
  if (typeof title !== "string") {
    throw new QuillTitleError();
  }
  const trimmedTitle = title.trim();
  if (trimmedTitle === "") {
    throw new QuillTitleError();
  }
  if (!Number.isInteger(amount) || amount < 0) {
    throw new QuillAmountError();
  }
  if (typeof seed !== "string") {
    throw new QuillSeedError();
  }
  const amountText = BigInt(amount).toString();
  const digest = createHash("sha256").update(seed, "utf8").digest("hex").slice(0, 8);
  return `${trimmedTitle} | ${amountText} qv | ${digest}`;
}
