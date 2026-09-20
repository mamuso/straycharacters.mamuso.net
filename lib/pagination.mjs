/** @template {{width: number, height: number}} T @param {T[]} entries @returns {T[][]} */
export function makeRows(entries) {
  const rows = [];
  let row = [];
  let ratio = 0;
  for (const entry of entries) {
    row.push(entry);
    ratio += entry.width / entry.height;
    if (ratio >= 4.2) {
      rows.push(row);
      row = [];
      ratio = 0;
    }
  }
  if (row.length) rows.push(row);
  return rows;
}
/** @template {{width: number, height: number}} T @param {T[]} entries @param {number} [target] */
export function paginate(entries, target = 24) {
  const blocks = [];
  let rows = [];
  let count = 0;
  for (const row of makeRows(entries)) {
    rows.push(row);
    count += row.length;
    if (count >= target) {
      blocks.push({ number: blocks.length + 1, rows });
      rows = [];
      count = 0;
    }
  }
  if (rows.length || !blocks.length)
    blocks.push({ number: blocks.length + 1, rows });
  return blocks;
}
export const pageHref = (/** @type {number} */ page) =>
  page === 1 ? "/" : `/journal/${page}/`;
