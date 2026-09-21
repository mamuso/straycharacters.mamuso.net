import { readFile, writeFile, mkdir, readdir, rm } from "node:fs/promises";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { orderJournal } from "../lib/journal-order.mjs";
import { validateEntries } from "./content.mjs";
import { specimenCard } from "./og.mjs";
import { cachedPhoto } from "./image-cache.mjs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const entries = validateEntries(
  JSON.parse(
    await readFile(new URL("../content/journal.json", import.meta.url), "utf8"),
  ),
);
const root = new URL("../", import.meta.url);
// Include rendering code, artwork and dependency versions in the build-cache
// key. Editorial metadata is merged fresh below and never cached.
const recipe = createHash("sha256");
for (const path of ["scripts/prepare.mjs", "scripts/og.mjs", "public/img/og-home.png", "pnpm-lock.yaml"])
  recipe.update(await readFile(new URL(path, root)));
recipe.update(JSON.stringify(sharp.versions));
const recipeHash = recipe.digest("hex");
const cacheRoot = fileURLToPath(new URL(".next/cache/photographs/", root));
const destination = fileURLToPath(new URL("public/generated/", root));
await mkdir(cacheRoot, { recursive: true });
await rm(new URL("public/generated/", root), { recursive: true, force: true });
await mkdir(new URL("public/generated/", root), { recursive: true });
await mkdir(new URL(".generated/", root), { recursive: true });
const output = [];
const activeKeys = new Set();
let reused = 0;
for (const entry of orderJournal(entries)) {
  const input = await readFile(new URL(`public${entry.image}`, root));
  const hash = createHash("sha256")
    .update(input)
    .update("webp-v2-large-quality-88")
    .update(JSON.stringify(sharp.versions))
    .digest("hex")
    .slice(0, 16);
  const cacheKey = createHash("sha256")
    .update(hash).update(recipeHash).update(String(entry.specimenNumber))
    .digest("hex");
  activeKeys.add(cacheKey);
  const result = await cachedPhoto(cacheRoot, cacheKey, destination, async (directory) => {
    const normalized = await sharp(input).rotate().toBuffer();
    const metadata = await sharp(normalized).metadata();
    const card = await specimenCard(normalized, entry.specimenNumber);
    const cardHash = createHash("sha256").update(card).digest("hex").slice(0, 16);
    const cardFile = `og-${cardHash}.png`;
    await writeFile(join(directory, cardFile), card);
    const files = [cardFile];
    await Promise.all([480, 800, 1200, 1600, 2400].map(async (width) => {
      const file = `${hash}-${width}.webp`;
      await sharp(normalized)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: width >= 1200 ? 88 : 82 })
        .toFile(join(directory, file));
      files.push(file);
    }));
    return {
      files,
      metadata: { src: `/generated/${hash}`, ogImage: `/generated/${cardFile}`, width: metadata.width, height: metadata.height },
    };
  });
  if (result.reused) reused++;
  output.push({
    ...entry,
    ...result.metadata,
  });
}
// Keep only the current collection/recipe so the persistent build cache stays bounded.
await Promise.all((await readdir(cacheRoot))
  .filter((key) => /^[a-f0-9]{64}$/.test(key) && !activeKeys.has(key))
  .map((key) => rm(join(cacheRoot, key), { recursive: true, force: true })));
await writeFile(
  new URL(".generated/journal.json", root),
  JSON.stringify(output),
);
console.log(`Prepared ${output.length} photographs (${reused} cached, ${output.length - reused} generated).`);

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
