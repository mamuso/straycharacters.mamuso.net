import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtemp,
  cp,
  mkdir,
  readFile,
  rm,
  writeFile,
  symlink,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import sharp from "sharp";
import { validateEntries } from "../scripts/content.mjs";

test("imports a photo, strips metadata, and rejects duplicates without changing the journal", async () => {
  const dir = await mkdtemp(join(tmpdir(), "stray-test-"));
  try {
    await cp("scripts", join(dir, "scripts"), { recursive: true });
    await symlink(resolve("node_modules"), join(dir, "node_modules"));
    await mkdir(join(dir, "content"));
    await mkdir(join(dir, "public/pics"), { recursive: true });
    await writeFile(join(dir, "content/journal.json"), "[]");
    const original = join(dir, "source.jpg");
    await sharp({
      create: { width: 50, height: 80, channels: 3, background: "red" },
    })
      .withExif({
        IFD0: { Artist: "Original author" },
        IFD2: { DateTimeOriginal: "2020:05:06 12:00:00" },
      })
      .jpeg()
      .toFile(original);
    const args = [
      join(dir, "scripts/add-photo.mjs"),
      original,
      "--slug",
      "a-cafe-sign",
      "--title",
      "A café sign",
      "--note",
      "Found on a walk.",
      "--date",
      "2022-04-12",
    ];
    const result = spawnSync(process.execPath, args, { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    const journal = await readFile(join(dir, "content/journal.json"), "utf8");
    const [entry] = JSON.parse(journal);
    assert.equal(entry.slug, "a-cafe-sign");
    assert.equal(entry.specimenNumber, 1);
    assert.equal(entry.date, "2022-04-12");
    assert.equal(entry.note, "Found on a walk.");
    assert.equal(
      (await sharp(join(dir, "public", entry.image)).metadata()).exif,
      undefined,
    );
    assert.ok((await sharp(original).metadata()).exif);
    assert.equal(spawnSync(process.execPath, args).status, 1);
    assert.equal(
      await readFile(join(dir, "content/journal.json"), "utf8"),
      journal,
    );
    const invalid = spawnSync(process.execPath, [
      join(dir, "scripts/add-photo.mjs"),
      original,
      "--slug",
      "../escape",
    ]);
    assert.equal(invalid.status, 1);
    const exifResult = spawnSync(
      process.execPath,
      [join(dir, "scripts/add-photo.mjs"), original],
      { encoding: "utf8" },
    );
    assert.equal(exifResult.status, 0, exifResult.stderr);
    const imported = JSON.parse(
      await readFile(join(dir, "content/journal.json"), "utf8"),
    )[0];
    assert.equal(imported.slug, "specimen-002");
    assert.equal(imported.specimenNumber, 2);
    assert.equal(
      JSON.parse(await readFile(join(dir, "content/journal.json"), "utf8"))[0]
        .date,
      "2020-05-06",
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("rejects invalid dates and image paths", () => {
  assert.throws(() =>
    validateEntries([
      {
        specimenNumber: 1,
        slug: "test",
        image: "/pics/x.jpg",
        date: "2024-02-30",
      },
    ]),
  );
  assert.throws(() =>
    validateEntries([
      { specimenNumber: 1, slug: "test", image: "/pics/../secret.jpg" },
    ]),
  );
});
