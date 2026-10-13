import { createHash } from "node:crypto";

export class QuillTitleError extends Error {
  constructor() {
    super("title is empty");
    this.name = "QuillTitleError";
  }
}

export class QuillAmountError extends Error {
  constructor() {
    super("amount must be a non-negative integer");
    this.name = "QuillAmountError";
  }
}

function formatDecimal(amount) {
  const text = amount.toString(10);
  const marker = text.toLowerCase().indexOf("e");
  if (marker === -1) {
    return text;
  }
  const coeff = text.slice(0, marker);
  const exponent = Number(text.slice(marker + 1));
  const dot = coeff.indexOf(".");
  const whole = dot === -1 ? coeff : coeff.slice(0, dot);
  const fraction = dot === -1 ? "" : coeff.slice(dot + 1);
  const digits = whole + fraction;
  const zeros = exponent - fraction.length;
  return digits + "0".repeat(zeros);
}

export function qv_format_notice(title, amount, seed) {
  if (typeof title !== "string" || title.trim() === "") {
    throw new QuillTitleError();
  }
  if (typeof amount !== "number" || !Number.isInteger(amount) || amount < 0) {
    throw new QuillAmountError();
  }
  const digest = createHash("sha256").update(seed, "utf8").digest("hex").slice(0, 8);
  return title.trim() + " | " + formatDecimal(amount) + " qv | " + digest;
}
