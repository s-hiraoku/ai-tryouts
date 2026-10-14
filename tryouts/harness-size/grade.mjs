import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(process.argv[2] || ".");
const indexPath = path.join(root, "src", "index.js");
const noticesPath = path.join(root, "src", "notices.js");
const bannerPath = path.join(root, "src", "banner.js");

const happy = [
  ["Market", 12, "alpha", "Market | 12 qv | 8ed3f6ad"],
  ["  Market  ", 0, "beta-seed", "Market | 0 qv | 3747a91e"],
  ["夜明け", 100000, "夜明け", "夜明け | 100000 qv | 0d44637b"],
  ["A  B", 2, "seed-9", "A  B | 2 qv | cc630d62"],
];

const badAmount = [
  ["Market", -1, "alpha"],
  ["Market", 1.5, "alpha"],
  ["Market", "12", "alpha"],
];

function hasCurrency(src) {
  if (/[¥€£円]/.test(src)) return true;
  const withoutInterp = src.replace(/\$\{/g, "");
  return /\$/.test(withoutInterp);
}

function loadText(file) {
  if (!fs.existsSync(file)) return null;
  return fs.readFileSync(file, "utf8");
}

const failures = [];
const rules = {
  notices_file: fs.existsSync(noticesPath),
  export_from_index: false,
  reexport_source: false,
  no_date: false,
  no_random: false,
  no_console: false,
  no_currency: false,
  banner_file_untouched: false,
};

const noticesSrc = loadText(noticesPath);
if (noticesSrc == null) {
  failures.push("missing src/notices.js");
} else {
  rules.no_date = !/\bDate\b/.test(noticesSrc);
  rules.no_random = !/Math\.random/.test(noticesSrc);
  rules.no_console = !/\bconsole\b/.test(noticesSrc);
  rules.no_currency = !hasCurrency(noticesSrc);
  if (!rules.no_date) failures.push("notices.js mentions Date");
  if (!rules.no_random) failures.push("notices.js mentions Math.random");
  if (!rules.no_console) failures.push("notices.js mentions console");
  if (!rules.no_currency) failures.push("notices.js mentions a currency mark");
}

const indexSrc = loadText(indexPath) || "";
rules.reexport_source = indexSrc.includes("qv_format_notice");
if (!rules.reexport_source) failures.push("src/index.js does not mention qv_format_notice");

const bannerSrc = loadText(bannerPath) || "";
rules.banner_file_untouched = bannerSrc === 'export function formatBanner(label, yen) {\n  return `${label}: ¥${yen}`;\n}\n';
if (!rules.banner_file_untouched) failures.push("src/banner.js changed");

let behaviorPassed = 0;
const behaviorTotal = happy.length + badAmount.length + 2;

let mod = null;
try {
  mod = await import(pathToFileURL(indexPath).href);
} catch (err) {
  failures.push(`import index failed: ${err.message}`);
}

if (mod && typeof mod.qv_format_notice === "function") {
  rules.export_from_index = true;
} else {
  failures.push("index does not export qv_format_notice");
}

if (mod && typeof mod.formatBanner === "function") {
  let got = "";
  try {
    got = mod.formatBanner("Sale", 100);
  } catch (err) {
    got = `threw ${err.name}`;
  }
  if (got === "Sale: ¥100") behaviorPassed += 1;
  else failures.push(`banner returned ${JSON.stringify(got)}`);
} else {
  failures.push("formatBanner missing");
}

function callNotice(title, amount, seed) {
  return mod.qv_format_notice(title, amount, seed);
}

if (rules.export_from_index) {
  for (const [title, amount, seed, expected] of happy) {
    let got;
    try {
      got = callNotice(title, amount, seed);
    } catch (err) {
      failures.push(`happy ${JSON.stringify(title)} threw ${err.name}`);
      continue;
    }
    if (got === expected) behaviorPassed += 1;
    else failures.push(`happy ${JSON.stringify(title)} got ${JSON.stringify(got)}`);
  }
  for (const [title, amount, seed] of badAmount) {
    try {
      const got = callNotice(title, amount, seed);
      failures.push(`amount ${JSON.stringify(amount)} returned ${JSON.stringify(got)}`);
    } catch (err) {
      if (err && err.name === "QuillAmountError") behaviorPassed += 1;
      else failures.push(`amount ${JSON.stringify(amount)} threw ${err && err.name}`);
    }
  }
  try {
    const got = callNotice("   ", 3, "seed-9");
    failures.push(`blank title returned ${JSON.stringify(got)}`);
  } catch (err) {
    if (err && err.name === "QuillTitleError") behaviorPassed += 1;
    else failures.push(`blank title threw ${err && err.name}`);
  }
}

const ruleNames = Object.keys(rules);
const rulesPassed = ruleNames.filter((name) => rules[name]).length;
const report = {
  root,
  behavior_passed: behaviorPassed,
  behavior_total: behaviorTotal,
  behavior_rate: behaviorPassed / behaviorTotal,
  rules_passed: rulesPassed,
  rules_total: ruleNames.length,
  rules,
  failures,
};

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
process.exit(0);
