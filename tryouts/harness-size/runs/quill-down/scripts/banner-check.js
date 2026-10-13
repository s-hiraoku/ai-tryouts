import { formatBanner, formatReceipt } from "../src/index.js";

const got = formatBanner("Sale", 100);
if (got !== "Sale: ¥100") {
  console.error("banner mismatch");
  process.exit(1);
}

const receipt = formatReceipt("Sale", 100, "seed");
if (receipt !== "Sale: ¥100 (seed)" || receipt.includes("\n")) {
  console.error("receipt mismatch");
  process.exit(1);
}
