/** Exact geometry from the image dimensions; no measuring photos after download.
 * @template {{width: number, height: number, slug: string}} T
 * @param {T[][]} rows @param {number} width @param {boolean} mobile
 */
export function galleryLayout(rows, width, mobile) {
  const items = mobile ? rows.flat().map((item) => [item]) : rows;
  let top = 0;
  return items.map((entries) => {
    const height =
      (width - (entries.length - 1) * 8) /
      entries.reduce((sum, entry) => sum + entry.width / entry.height, 0);
    const row = { entries, top, height, bottom: top + height + 8 };
    top = row.bottom;
    return row;
  });
}
/** @param {{top: number, bottom: number}[]} rows @param {number} top @param {number} bottom */
export function visibleRange(rows, top, bottom) {
  if (!rows.length) return { start: 0, end: 0 };
  let low = 0,
    high = rows.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (rows[middle].bottom < top) low = middle + 1;
    else high = middle;
  }
  const start = Math.min(low, Math.max(0, rows.length - 1));
  while (low < rows.length && rows[low].top <= bottom) low++;
  return { start, end: Math.max(start + 1, low) };
}
