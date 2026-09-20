// Stable sorting preserves source order for equal dates and undated photos.
export function orderJournal(entries) {
  return entries.toSorted((a, b) => (b.date || "").localeCompare(a.date || ""));
}
