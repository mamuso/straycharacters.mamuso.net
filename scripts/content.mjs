export function validateEntries(entries) {
  if (!Array.isArray(entries)) throw new Error("The journal must be an array.");
  const slugs = new Set();
  const numbers = new Set();
  for (const entry of entries) {
    if (
      !Number.isSafeInteger(entry.specimenNumber) ||
      entry.specimenNumber < 1 ||
      numbers.has(entry.specimenNumber)
    )
      throw new Error(
        `Invalid or duplicate specimen number: ${entry.specimenNumber}`,
      );
    numbers.add(entry.specimenNumber);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.slug) || slugs.has(entry.slug))
      throw new Error(`Invalid or duplicate slug: ${entry.slug}`);
    slugs.add(entry.slug);
    if (!/^\/pics\/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/i.test(entry.image))
      throw new Error(`Invalid image path: ${entry.image}`);
    for (const key of ["title", "alt", "note", "location"])
      if (entry[key] !== undefined && typeof entry[key] !== "string")
        throw new Error(`Invalid ${key}: ${entry.slug}`);
    if (
      entry.locationSource !== undefined &&
      (entry.locationSource !== "openstreetmap" || !entry.location)
    )
      throw new Error(`Invalid location source: ${entry.slug}`);
    if (
      entry.date &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(entry.date) ||
        !Number.isFinite(Date.parse(entry.date)) ||
        new Date(entry.date).toISOString().slice(0, 10) !== entry.date)
    )
      throw new Error(`Invalid date: ${entry.date}`);
  }
  return entries;
}
