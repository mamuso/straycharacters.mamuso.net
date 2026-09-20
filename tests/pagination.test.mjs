import test from "node:test";
import assert from "node:assert/strict";
import { makeRows, paginate } from "../lib/pagination.mjs";

test("pagination preserves every photo, its order, and complete gallery rows", () => {
  const entries = Array.from({ length: 1000 }, (_, id) => ({
    id,
    width: id % 3 === 0 ? 800 : 1200,
    height: 900,
  }));
  const blocks = paginate(entries);
  assert.deepEqual(
    blocks.flatMap((block) => block.rows.flat()),
    entries,
  );
  assert.deepEqual(
    blocks.flatMap((block) => block.rows),
    makeRows(entries),
  );
  for (const block of blocks.slice(0, -1)) {
    const count = block.rows.flat().length;
    assert.ok(count >= 24);
    assert.ok(count - block.rows.at(-1).length < 24);
  }
  assert.deepEqual(
    blocks.map((block) => block.number),
    blocks.map((_, i) => i + 1),
  );
});

test("small and empty collections still have a usable first page", () => {
  assert.deepEqual(paginate([]), [{ number: 1, rows: [] }]);
  const entry = { width: 800, height: 1200 };
  assert.deepEqual(paginate([entry]), [{ number: 1, rows: [[entry]] }]);
});
