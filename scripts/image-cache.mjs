import { copyFile, mkdir, mkdtemp, readFile, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

// Publish the manifest with its files atomically, so an interrupted preparation
// cannot leave a cache entry that looks complete.
export async function cachedPhoto(cacheRoot, key, destination, generate) {
  const directory = join(cacheRoot, key);
  async function restore() {
    const result = JSON.parse(await readFile(join(directory, "manifest.json"), "utf8"));
    await Promise.all(result.files.map((file) =>
      copyFile(join(directory, file), join(destination, file)),
    ));
    return result.metadata;
  }
  try {
    return { metadata: await restore(), reused: true };
  } catch (error) {
    if (error.code !== "ENOENT" && !(error instanceof SyntaxError)) throw error;
  }
  await mkdir(cacheRoot, { recursive: true });
  const temporary = await mkdtemp(join(cacheRoot, ".pending-"));
  try {
    const result = await generate(temporary);
    await writeFile(join(temporary, "manifest.json"), JSON.stringify(result));
    await rm(directory, { recursive: true, force: true });
    await rename(temporary, directory);
    return { metadata: await restore(), reused: false };
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}
