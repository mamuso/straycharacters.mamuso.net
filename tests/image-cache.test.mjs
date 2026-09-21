import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { cachedPhoto } from "../scripts/image-cache.mjs";

test("photo cache reuses derivatives, invalidates keys, and recovers incomplete entries", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "photo-cache-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const cache = join(root, "cache");
  const output = join(root, "public");
  await mkdir(output);
  let generated = 0;
  async function generate(directory) {
    generated++;
    await writeFile(join(directory, "photo.webp"), "image bytes");
    return { files: ["photo.webp"], metadata: { width: 480, height: 320 } };
  }
  assert.equal((await cachedPhoto(cache, "a", output, generate)).reused, false);
  await rm(join(output, "photo.webp"));
  const hit = await cachedPhoto(cache, "a", output, generate);
  assert.equal(hit.reused, true);
  assert.deepEqual(hit.metadata, { width: 480, height: 320 });
  assert.equal(await readFile(join(output, "photo.webp"), "utf8"), "image bytes");
  assert.equal(generated, 1);
  assert.equal((await cachedPhoto(cache, "b", output, generate)).reused, false);
  await rm(join(cache, "a", "photo.webp"));
  assert.equal((await cachedPhoto(cache, "a", output, generate)).reused, false);
  await writeFile(join(cache, "a", "manifest.json"), "interrupted JSON");
  assert.equal((await cachedPhoto(cache, "a", output, generate)).reused, false);
  assert.equal(generated, 4);
});

test("failed generation can be retried without publishing a partial entry", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "photo-cache-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const output = join(root, "public");
  await mkdir(output);
  await assert.rejects(cachedPhoto(root, "a", output, async () => {
    throw new Error("encoder failed");
  }), /encoder failed/);
  const result = await cachedPhoto(root, "a", output, async (directory) => {
    await writeFile(join(directory, "photo.webp"), "complete");
    return { files: ["photo.webp"], metadata: {} };
  });
  assert.equal(result.reused, false);
});
