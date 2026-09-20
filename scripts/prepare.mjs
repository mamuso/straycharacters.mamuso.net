import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { orderJournal } from "../lib/journal-order.mjs";
import { validateEntries } from "./content.mjs";
const entries = validateEntries(
  JSON.parse(
    await readFile(new URL("../content/journal.json", import.meta.url), "utf8"),
  ),
);
const root = new URL("../", import.meta.url);
await rm(new URL("public/generated/", root), { recursive: true, force: true });
await mkdir(new URL("public/generated/", root), { recursive: true });
await mkdir(new URL(".generated/", root), { recursive: true });
const output = [];
for (const entry of orderJournal(entries)) {
  const input = await readFile(new URL(`public${entry.image}`, root));
  const hash = createHash("sha256")
    .update(input)
    .update("webp-v1")
    .update(JSON.stringify(sharp.versions))
    .digest("hex")
    .slice(0, 16);
  const normalized = await sharp(input).rotate().toBuffer();
  const metadata = await sharp(normalized).metadata();
  await Promise.all(
    [480, 800, 1200, 1600].map((width) =>
      sharp(normalized)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(
          new URL(`public/generated/${hash}-${width}.webp`, root).pathname,
        ),
    ),
  );
  output.push({
    ...entry,
    src: `/generated/${hash}`,
    width: metadata.width,
    height: metadata.height,
  });
}
await writeFile(
  new URL(".generated/journal.json", root),
  JSON.stringify(output),
);
console.log(`Prepared ${output.length} photographs for static export.`);

// A deployment-specific URL prevents mixing blocks from different journal snapshots.
const { paginate } = await import("../lib/pagination.mjs");
const blocks = paginate(output);
const version = createHash("sha256")
  .update(JSON.stringify(blocks))
  .digest("hex")
  .slice(0, 16);
await rm(new URL("public/journal/", root), { recursive: true, force: true });
await mkdir(new URL(`public/journal/${version}/`, root), { recursive: true });
await Promise.all(
  blocks.map((block) =>
    writeFile(
      new URL(`public/journal/${version}/${block.number}.json`, root),
      JSON.stringify(block),
    ),
  ),
);
await writeFile(
  new URL(".generated/blocks.json", root),
  JSON.stringify({ version, total: output.length, blocks }),
);
