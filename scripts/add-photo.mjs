import { parseArgs } from "node:util";
import { readFile, writeFile, mkdir, rename, rm } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";
import exifr from "exifr";
import { detectLocation } from "./location.mjs";
import { validateEntries } from "./content.mjs";
const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: Object.fromEntries(
    [
      "title",
      "slug",
      "alt",
      "note",
      "location",
      "date",
      "help",
      "no-location",
    ].map((key) => [
      key,
      { type: key === "help" || key === "no-location" ? "boolean" : "string" },
    ]),
  ),
});
if (values.help || !positionals.length) {
  console.log(
    'Usage: pnpm photo:add /path/photo.jpg [--title "A good sign"] [--note "..."] [--location "London" | --no-location] [--date YYYY-MM-DD] [--alt "..."] [--slug a-good-sign]\nOriginals stay on your computer. A web copy is imported without EXIF/GPS. Date is read from EXIF when available; explicit --date takes precedence. City is detected from GPS using OpenStreetMap; --location overrides it, --no-location skips the lookup. Commit and deploy to publish.',
  );
  process.exit(values.help ? 0 : 1);
}
const root = new URL("../", import.meta.url);
const journal = new URL("content/journal.json", root);
const lock = new URL("content/.import-lock/", root);
let locked = false;
let imported;
try {
  if (positionals.length !== 1) throw new Error("Pass exactly one photo.");
  await mkdir(lock);
  locked = true;
  const entries = JSON.parse(await readFile(journal, "utf8"));
  const input = await readFile(resolve(positionals[0]));
  const exif = await exifr.parse(input).catch(() => undefined);
  const captured = exif?.DateTimeOriginal;
  const exifDate =
    captured instanceof Date && Number.isFinite(captured.getTime())
      ? `${captured.getFullYear()}-${String(captured.getMonth() + 1).padStart(2, "0")}-${String(captured.getDate()).padStart(2, "0")}`
      : undefined;
  validateEntries(entries);
  const specimenNumber =
    entries.reduce(
      (maximum, entry) => Math.max(maximum, entry.specimenNumber),
      0,
    ) + 1;
  const slug =
    values.slug || `specimen-${String(specimenNumber).padStart(3, "0")}`;
  const entry = {
    slug,
    specimenNumber,
    image: `/pics/${slug}.jpg`,
    ...(values.title ? { title: values.title } : {}),
    ...(values.alt ? { alt: values.alt } : {}),
    ...(values.note ? { note: values.note } : {}),
    ...(values.location ? { location: values.location } : {}),
    ...(values.date || exifDate ? { date: values.date || exifDate } : {}),
  };
  validateEntries([entry, ...entries]);
  const detected = await detectLocation(exif, {
    manual: values.location,
    skip: values["no-location"],
    cacheDirectory: new URL(".cache/geocoding/", root),
  });
  Object.assign(entry, detected);
  validateEntries([entry, ...entries]);
  if (entry.location)
    console.log(
      `Location: ${entry.location}${entry.locationSource ? " (© OpenStreetMap contributors)" : ""}`,
    );
  const jpeg = await sharp(input)
    .rotate()
    .resize({
      width: 2400,
      height: 2400,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: 92 })
    .toBuffer();
  const destination = new URL(`public${entry.image}`, root);
  await writeFile(destination, jpeg, { flag: "wx" });
  imported = destination;
  const temporary = new URL("content/journal.json.tmp", root);
  await writeFile(
    temporary,
    JSON.stringify([entry, ...entries], null, 2) + "\n",
  );
  await rename(temporary, journal);
  imported = undefined;
  console.log(
    `Added ${slug}. Preview with pnpm dev, then commit the photo and content/journal.json to publish on the next deploy.`,
  );
  if (!values.alt)
    console.log(
      "Optional: add a descriptive alt field in content/journal.json.",
    );
} catch (error) {
  if (imported) await rm(imported, { force: true });
  console.error(
    error.code === "EEXIST" && !locked
      ? "Another import is running (content/.import-lock)."
      : error.message,
  );
  process.exitCode = 1;
} finally {
  if (locked) await rm(lock, { recursive: true, force: true });
}
