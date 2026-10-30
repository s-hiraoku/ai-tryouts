"use strict";

const fs = require("fs");
const path = require("path");
const PptxGenJS = require("pptxgenjs");

const dir = __dirname;
const briefText = fs.readFileSync(path.join(dir, "materials/brief.md"), "utf8");
const routeText = fs.readFileSync(path.join(dir, "materials/route.md"), "utf8");
const corpus = briefText + "\n" + routeText;

function fieldMap(text) {
  const map = new Map();
  for (const line of text.split("\n")) {
    const match = line.match(/^- ([^:]+): (.+)$/);
    if (match) map.set(match[1], match[2].trim());
  }
  return map;
}

function need(map, key) {
  const value = map.get(key);
  if (!value) {
    console.error("missing field: " + key);
    process.exit(1);
  }
  return value;
}

function sectionParagraph(text, heading) {
  const match = text.match(new RegExp("## " + heading + "\\n+([\\s\\S]*?)(?=\\n## |$)"));
  if (!match) {
    console.error("missing section: " + heading);
    process.exit(1);
  }
  const paragraph = match[1]
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith("#") && !line.startsWith("-") && !line.startsWith("|"));
  if (!paragraph) {
    console.error("empty section: " + heading);
    process.exit(1);
  }
  return paragraph;
}

function routeRows(text) {
  const rows = [];
  for (const line of text.split("\n")) {
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
    if (cells.length !== 3) continue;
    if (cells[0] === "区間" || cells.every((cell) => /^-+$/.test(cell))) continue;
    const minutes = Number(cells[2]);
    if (!Number.isInteger(minutes)) {
      console.error("bad minutes: " + line);
      process.exit(1);
    }
    rows.push({ name: cells[0], time: cells[1], minutes: String(minutes) });
  }
  if (rows.length < 2) {
    console.error("route table is too short");
    process.exit(1);
  }
  return rows;
}

function hexColor(map, key) {
  const value = need(map, key);
  if (!/^[0-9A-F]{6}$/.test(value)) {
    console.error("color must be 6 hex digits: " + key);
    process.exit(1);
  }
  return value;
}

function assertDigits(value) {
  const text = String(value);
  for (const run of text.match(/\d+(?:\.\d+)?/g) || []) {
    if (!corpus.includes(run)) {
      console.error("digit " + run + " is not in the markdown: " + text);
      process.exit(1);
    }
  }
  return text;
}

const brief = fieldMap(briefText);
const route = fieldMap(routeText);
const rows = routeRows(routeText);
const purpose = sectionParagraph(briefText, "目的");
const birds = routeText
  .split("\n")
  .map((line) => line.trim())
  .find((line) => line.startsWith("見る鳥の例"));
if (!birds) {
  console.error("missing bird line");
  process.exit(1);
}

const forest = hexColor(brief, "森");
const moss = hexColor(brief, "苔");
const paper = hexColor(brief, "紙");
const date = need(brief, "日付");
const start = need(brief, "開始");
const end = need(brief, "終了");
const duration = need(brief, "所要");
const place = need(brief, "場所");
const rain = need(brief, "雨天");
const capacity = need(brief, "定員");
const fee = need(brief, "参加費");
const binoculars = need(brief, "貸出双眼鏡");
const audience = need(brief, "対象");
const guide = need(brief, "案内");
const recorder = need(brief, "記録");
const loaner = need(brief, "貸出係");
const distance = need(route, "歩く距離");
const sites = need(route, "観察地点");
const minuteSum = rows.reduce((sum, row) => sum + Number(row.minutes), 0);
if (duration !== String(minuteSum) + "分") {
  console.error("所要 does not match the table: " + duration + " vs " + minuteSum);
  process.exit(1);
}
if (!rows[0].time.startsWith(start) || !rows[rows.length - 1].time.endsWith(end)) {
  console.error("table times do not match 開始 and 終了");
  process.exit(1);
}

const SANS = "Noto Sans CJK JP";
const SERIF = "Noto Serif CJK JP";

const pres = new PptxGenJS();
pres.layout = "LAYOUT_WIDE";
pres.title = "朝の野鳥観察会";
pres.author = "tryouts/document-skills-slides";
pres.subject = "架空の公開サンプル";

function write(slide, value, opts) {
  slide.addText(assertDigits(value), Object.assign({
    fontFace: SANS,
    margin: 0,
    valign: "top",
    align: "left",
    color: forest,
  }, opts));
}

function writeLines(slide, full, pieces, opts) {
  if (pieces.join("") !== full) {
    console.error("line break changed the source text: " + full);
    process.exit(1);
  }
  slide.addText(pieces.map((text, index) => ({
    text: assertDigits(text),
    options: { breakLine: index < pieces.length - 1 },
  })), Object.assign({
    fontFace: SANS,
    margin: 0,
    valign: "top",
    align: "left",
    color: forest,
  }, opts));
}

function motif(slide, color) {
  slide.addShape(pres.shapes.OVAL, {
    x: 12.35,
    y: 0.5,
    w: 0.48,
    h: 0.48,
    fill: { color },
    line: { color, width: 0 },
  });
}

function card(slide, x, y, w, h, fill) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x,
    y,
    w,
    h,
    fill: { color: fill },
    line: { color: fill, width: 0 },
    rectRadius: 0.12,
  });
}

function footer(slide, label, color) {
  write(slide, label, {
    x: 0.5,
    y: 6.72,
    w: 11.7,
    h: 0.28,
    fontSize: 12,
    color,
  });
}

function lightSlide() {
  const slide = pres.addSlide();
  slide.background = { color: paper };
  motif(slide, moss);
  return slide;
}

function darkSlide() {
  const slide = pres.addSlide();
  slide.background = { color: forest };
  motif(slide, moss);
  return slide;
}

const outline = [
  "1. 表紙。" + date + " " + start + " " + place,
  "2. 目的。" + purpose,
  "3. 日時と場所。" + duration,
  "4. " + duration + "の内訳。",
  "5. 順路。" + distance + " " + sites,
  "6. 定員 " + capacity + "、参加費 " + fee + "、貸出 " + binoculars,
  "7. 対象と雨天。",
  "8. 当日の係。",
  "9. 数字の出典。",
  "10. 当日の入口。" + start + " " + place,
];
for (const line of outline) {
  assertDigits(line.replace(/^\d+\. /, ""));
  console.log(line);
}

const title = darkSlide();
write(title, "青葉野鳥の会", {
  x: 0.5, y: 1.45, w: 11, h: 0.4, fontSize: 18, color: paper,
});
write(title, "朝の野鳥観察会", {
  x: 0.5, y: 2.05, w: 11.5, h: 0.9, fontFace: SERIF, fontSize: 44, color: paper,
});
write(title, date, {
  x: 0.5, y: 3.2, w: 11, h: 0.5, fontSize: 22, color: paper,
});
write(title, start + " から " + end + "、" + duration, {
  x: 0.5, y: 3.8, w: 11, h: 0.45, fontSize: 20, color: paper,
});
write(title, place, {
  x: 0.5, y: 4.45, w: 11, h: 0.45, fontSize: 20, color: paper,
});
footer(title, "出典: brief.md", paper);
title.addNotes("出典: materials/brief.md の日付、開始、終了、所要、場所。架空の計画。");

const purposeSlide = lightSlide();
write(purposeSlide, "目的", {
  x: 0.5, y: 0.5, w: 8, h: 0.45, fontSize: 16, color: forest,
});
writeLines(purposeSlide, purpose, [
  "初めて参加する人が、自分の双眼鏡でピントを合わせ、",
  "池の鳥を指させる。",
], {
  x: 0.5, y: 2.15, w: 12.3, h: 2.2, fontFace: SERIF, fontSize: 28, color: forest,
});
footer(purposeSlide, "出典: brief.md。このスライドに数字は無い。", forest);
purposeSlide.addNotes("出典: materials/brief.md の目的。");

const whenSlide = lightSlide();
write(whenSlide, "日時と場所", {
  x: 0.5, y: 0.48, w: 10, h: 0.5, fontFace: SERIF, fontSize: 32, color: forest,
});
card(whenSlide, 0.5, 1.45, 6.0, 4.9, forest);
write(whenSlide, "日時", {
  x: 0.82, y: 1.75, w: 5.3, h: 0.4, fontSize: 16, color: paper,
});
write(whenSlide, date, {
  x: 0.82, y: 2.4, w: 5.3, h: 0.6, fontFace: SERIF, fontSize: 28, color: paper,
});
write(whenSlide, start + " から " + end, {
  x: 0.82, y: 3.3, w: 5.3, h: 0.45, fontSize: 20, color: paper,
});
write(whenSlide, duration, {
  x: 0.82, y: 4.0, w: 5.3, h: 0.7, fontFace: SERIF, fontSize: 36, color: paper,
});
card(whenSlide, 6.85, 1.45, 5.98, 4.9, forest);
write(whenSlide, "場所", {
  x: 7.17, y: 1.75, w: 5.3, h: 0.4, fontSize: 16, color: paper,
});
write(whenSlide, place, {
  x: 7.17, y: 2.3, w: 5.3, h: 3.2, fontFace: SERIF, fontSize: 28, color: paper, valign: "middle",
});
footer(whenSlide, "出典: brief.md", forest);
whenSlide.addNotes("出典: materials/brief.md の日付、開始、終了、所要、場所。");

const chartSlide = lightSlide();
write(chartSlide, duration + "の内訳", {
  x: 0.5, y: 0.45, w: 8, h: 0.55, fontFace: SERIF, fontSize: 32, color: forest,
});
chartSlide.addChart(pres.charts.BAR, [
  {
    name: "分",
    labels: rows.map((row) => row.name),
    values: rows.map((row) => Number(row.minutes)),
  },
], {
  x: 0.35,
  y: 1.2,
  w: 8.15,
  h: 5.15,
  barDir: "col",
  barGrouping: "clustered",
  showTitle: true,
  title: "分",
  titleFontFace: SANS,
  titleFontSize: 14,
  titleColor: forest,
  showValue: true,
  dataLabelPosition: "outEnd",
  dataLabelFontFace: SANS,
  dataLabelFontSize: 12,
  dataLabelColor: forest,
  chartColors: [forest],
  showLegend: false,
  catAxisLabelColor: forest,
  catAxisLabelFontFace: SANS,
  catAxisLabelFontSize: 12,
  valAxisLabelColor: forest,
  valAxisLabelFontFace: SANS,
  valAxisLabelFontSize: 12,
  valAxisMinVal: 0,
  valAxisMaxVal: 50,
  valGridLine: { color: "D5DDD0", size: 0.5 },
  catGridLine: { style: "none" },
  chartArea: { fill: { color: paper } },
});
card(chartSlide, 8.9, 1.45, 3.93, 4.9, forest);
write(chartSlide, "合計", {
  x: 9.2, y: 1.8, w: 3.3, h: 0.4, fontSize: 16, color: paper,
});
write(chartSlide, duration, {
  x: 9.2, y: 2.4, w: 3.3, h: 0.8, fontFace: SERIF, fontSize: 40, color: paper,
});
write(chartSlide, "各区間の分は route.md", {
  x: 9.2, y: 4.3, w: 3.3, h: 0.8, fontSize: 16, color: paper,
});
write(chartSlide, "所要は brief.md", {
  x: 9.2, y: 5.15, w: 3.3, h: 0.5, fontSize: 16, color: paper,
});
footer(chartSlide, "出典: route.md の表と brief.md の所要", forest);
chartSlide.addNotes("出典: materials/route.md の表。合計は materials/brief.md の所要。");
for (const row of rows) assertDigits(row.minutes);

const routeSlide = lightSlide();
write(routeSlide, "順路", {
  x: 0.5, y: 0.45, w: 6, h: 0.5, fontFace: SERIF, fontSize: 32, color: forest,
});
write(routeSlide, distance + "、観察地点 " + sites, {
  x: 0.5, y: 1.15, w: 12, h: 0.4, fontSize: 18, color: forest,
});
const routeGap = 0.24;
const routeW = (12.33 - routeGap * (rows.length - 1)) / rows.length;
rows.forEach((row, index) => {
  const x = 0.5 + index * (routeW + routeGap);
  card(routeSlide, x, 1.8, routeW, 3.85, forest);
  write(routeSlide, row.name, {
    x: x + 0.22, y: 2.15, w: routeW - 0.44, h: 0.9, fontFace: SERIF, fontSize: 18, color: paper,
  });
  write(routeSlide, row.time, {
    x: x + 0.22, y: 3.55, w: routeW - 0.44, h: 0.4, fontSize: 14, color: paper,
  });
  write(routeSlide, row.minutes + "分", {
    x: x + 0.22, y: 4.2, w: routeW - 0.44, h: 0.7, fontFace: SERIF, fontSize: 28, color: paper,
  });
});
write(routeSlide, birds, {
  x: 0.5, y: 5.9, w: 12.3, h: 0.45, fontSize: 16, color: forest,
});
footer(routeSlide, "出典: route.md", forest);
routeSlide.addNotes("出典: materials/route.md。羽数は資料に無い。");

const peopleSlide = lightSlide();
write(peopleSlide, "人と費用", {
  x: 0.5, y: 0.45, w: 10, h: 0.55, fontFace: SERIF, fontSize: 32, color: forest,
});
const people = [
  ["定員", capacity],
  ["参加費", fee],
  ["貸出双眼鏡", binoculars],
];
const peopleGap = 0.28;
const peopleW = (12.33 - peopleGap * 2) / 3;
people.forEach((pair, index) => {
  const x = 0.5 + index * (peopleW + peopleGap);
  card(peopleSlide, x, 1.85, peopleW, 3.5, forest);
  write(peopleSlide, pair[0], {
    x: x + 0.3, y: 2.15, w: peopleW - 0.6, h: 0.5, fontSize: 18, color: paper,
  });
  write(peopleSlide, pair[1], {
    x: x + 0.3, y: 3.15, w: peopleW - 0.6, h: 1.1, fontFace: SERIF, fontSize: 48, color: paper,
  });
});
footer(peopleSlide, "出典: brief.md", forest);
peopleSlide.addNotes("出典: materials/brief.md の定員、参加費、貸出双眼鏡。");

const safetySlide = lightSlide();
write(safetySlide, "来てよい人と、雨のとき", {
  x: 0.5, y: 0.45, w: 12, h: 0.55, fontFace: SERIF, fontSize: 32, color: forest,
});
card(safetySlide, 0.5, 1.55, 6.0, 4.75, forest);
write(safetySlide, "対象", {
  x: 0.85, y: 1.9, w: 5.3, h: 0.4, fontSize: 16, color: paper,
});
writeLines(safetySlide, audience, [
  "小学4年生以上。",
  "小学生は保護者と一緒に来る",
], {
  x: 0.85, y: 2.7, w: 5.3, h: 2.2, fontFace: SERIF, fontSize: 24, color: paper,
});
card(safetySlide, 6.85, 1.55, 5.98, 4.75, forest);
write(safetySlide, "雨天", {
  x: 7.2, y: 1.9, w: 5.3, h: 0.4, fontSize: 16, color: paper,
});
writeLines(safetySlide, rain, [
  "前日の18:00までに",
  "中止を知らせる",
], {
  x: 7.2, y: 2.7, w: 5.3, h: 2.2, fontFace: SERIF, fontSize: 24, color: paper,
});
footer(safetySlide, "出典: brief.md", forest);
safetySlide.addNotes("出典: materials/brief.md の対象と雨天。");

const roleSlide = lightSlide();
write(roleSlide, "当日の係", {
  x: 0.5, y: 0.45, w: 10, h: 0.55, fontFace: SERIF, fontSize: 32, color: forest,
});
const roles = [
  ["案内", guide],
  ["記録", recorder],
  ["貸出係", loaner],
];
roles.forEach((pair, index) => {
  const x = 0.5 + index * (peopleW + peopleGap);
  card(roleSlide, x, 1.85, peopleW, 3.5, forest);
  write(roleSlide, pair[0], {
    x: x + 0.3, y: 2.15, w: peopleW - 0.6, h: 0.5, fontSize: 18, color: paper,
  });
  write(roleSlide, pair[1], {
    x: x + 0.3, y: 3.15, w: peopleW - 0.6, h: 1.1, fontFace: SERIF, fontSize: 48, color: paper,
  });
});
footer(roleSlide, "出典: brief.md", forest);
roleSlide.addNotes("出典: materials/brief.md の案内、記録、貸出係。");

const briefItems = [];
const routeItems = [];
for (const [key, value] of brief.entries()) {
  if (/\d/.test(value)) briefItems.push(key + "  " + value);
}
for (const [key, value] of route.entries()) {
  if (/\d/.test(value)) routeItems.push(key + "  " + value);
}
for (const row of rows) {
  routeItems.push(row.name + "  " + row.time + "  " + row.minutes + "分");
}
const sourceSlide = lightSlide();
write(sourceSlide, "数字の出典", {
  x: 0.5, y: 0.42, w: 10, h: 0.48, fontFace: SERIF, fontSize: 28, color: forest,
});
briefItems.forEach((item, index) => {
  write(sourceSlide, item, {
    x: 0.5, y: 1.15 + index * 0.36, w: 6.1, h: 0.34, fontSize: 14, color: forest,
  });
});
routeItems.forEach((item, index) => {
  write(sourceSlide, item, {
    x: 6.9, y: 1.15 + index * 0.42, w: 5.9, h: 0.38, fontSize: 14, color: forest,
  });
});
footer(sourceSlide, "出典: brief.md と route.md。ロゴ画像は無い。", forest);
sourceSlide.addNotes("各数字は materials/brief.md または materials/route.md にある。色の16進数も brief.md。");

const closeSlide = darkSlide();
write(closeSlide, "当日の入口", {
  x: 0.5, y: 0.5, w: 10, h: 0.4, fontSize: 18, color: paper,
});
write(closeSlide, place, {
  x: 0.5, y: 1.5, w: 12, h: 0.7, fontFace: SERIF, fontSize: 28, color: paper,
});
write(closeSlide, start, {
  x: 0.5, y: 2.4, w: 8, h: 1.2, fontFace: SERIF, fontSize: 60, color: paper,
});
write(closeSlide, capacity + "、" + fee, {
  x: 0.5, y: 4.0, w: 11, h: 0.6, fontSize: 24, color: paper,
});
write(closeSlide, date + "、" + duration, {
  x: 0.5, y: 4.75, w: 11, h: 0.5, fontSize: 20, color: paper,
});
footer(closeSlide, "出典: brief.md", paper);
closeSlide.addNotes("出典: materials/brief.md。");

const outDir = path.join(dir, "output");
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "aoba-bird-walk.pptx");
pres.writeFile({ fileName: outFile }).then(() => {
  console.log(outFile);
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
