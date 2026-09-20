import test from "node:test";
import assert from "node:assert/strict";
import { orderJournal } from "../lib/journal-order.mjs";
import { validateEntries } from "../scripts/content.mjs";

test("chronological sorting preserves permanent identities, ties, and undated entries", () => {
  const source = [
    { slug: "specimen-001", specimenNumber: 1 },
    { slug: "specimen-002", specimenNumber: 2, date: "2010-10-23" },
    { slug: "specimen-003", specimenNumber: 3, date: "2022-01-03" },
    { slug: "specimen-004", specimenNumber: 4, date: "2022-01-03" },
  ];
  const original = structuredClone(source);
  assert.deepEqual(orderJournal(source), [
    source[2],
    source[3],
    source[1],
    source[0],
  ]);
  assert.deepEqual(source, original);
});

test("rejects missing and duplicate specimen identities", () => {
  assert.throws(() =>
    validateEntries([{ slug: "test", image: "/pics/0.jpg" }]),
  );
  assert.throws(() =>
    validateEntries([
      { slug: "one", image: "/pics/0.jpg", specimenNumber: 1 },
      { slug: "two", image: "/pics/1.jpg", specimenNumber: 1 },
    ]),
  );
});
