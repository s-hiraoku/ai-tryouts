export function formatReceipt(title, minorUnits, seed) {
  return `${title}: ¥${minorUnits} #${seed}`.replace(/[\r\n]+/g, " ");
}
