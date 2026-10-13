import { formatBanner } from "../src/index.js";

const got = formatBanner("Sale", 100);
if (got !== "Sale: ¥100") {
  console.error("banner mismatch");
  process.exit(1);
}
