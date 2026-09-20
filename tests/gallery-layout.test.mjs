import test from "node:test";
import assert from "node:assert/strict";
import { galleryLayout, visibleRange } from "../lib/gallery-layout.mjs";
import { makeRows } from "../lib/pagination.mjs";

const entries = Array.from({ length: 10000 }, (_, id) => ({
  slug: `find-${id}`,
  width: id % 3 ? 1200 : 800,
  height: 900,
}));

test("virtual rows preserve exact height and all photo identities on desktop and mobile", () => {
  for (const mobile of [false, true]) {
    const width = mobile ? 358 : 1216;
    const rows = galleryLayout(makeRows(entries), width, mobile);
    assert.deepEqual(
      rows.flatMap((row) => row.entries),
      entries,
    );
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      assert.equal(row.top, i ? rows[i - 1].bottom : 0);
      const usedWidth =
        row.entries.reduce(
          (sum, entry) => sum + (row.height * entry.width) / entry.height,
          0,
        ) +
        (row.entries.length - 1) * 8;
      assert.ok(Math.abs(usedWidth - width) < 0.001);
      if (mobile) assert.equal(row.entries.length, 1);
    }
  }
});

test("a long collection keeps a bounded window including every visible row", () => {
  const rows = galleryLayout(makeRows(entries), 1216, false);
  for (const top of [0, 3000, 120000, rows.at(-1).bottom - 720]) {
    const range = visibleRange(rows, top - 720, top + 1440);
    assert.ok(range.end - range.start < 16);
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].bottom >= top && rows[i].top <= top + 720)
        assert.ok(i >= range.start && i < range.end);
    }
    const mounted = rows.slice(range.start, range.end);
    const spacers = mounted[0].top + rows.at(-1).bottom - mounted.at(-1).bottom;
    const mountedHeight = mounted.reduce((sum, row) => sum + row.height + 8, 0);
    assert.ok(Math.abs(spacers + mountedHeight - rows.at(-1).bottom) < 0.001);
  }
});
