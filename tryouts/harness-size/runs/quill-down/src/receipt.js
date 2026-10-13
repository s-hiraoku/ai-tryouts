export function formatReceipt(title, amount, seed) {
  return `${title}: ¥${amount} (${seed})`.replace(/[\r\n]+/g, " ");
}
