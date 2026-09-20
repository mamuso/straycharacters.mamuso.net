import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { detectLocation } from "../scripts/location.mjs";

test("manual locations, opt-out and missing GPS never contact the geocoder", async () => {
  const fetchImpl = () => {
    throw new Error("Unexpected lookup");
  };
  const gps = { latitude: 48.8584, longitude: 2.2945 };
  assert.deepEqual(await detectLocation(gps, { manual: "Paris", fetchImpl }), {
    location: "Paris",
  });
  assert.deepEqual(await detectLocation(gps, { skip: true, fetchImpl }), {});
  assert.deepEqual(await detectLocation({}, { fetchImpl }), {});
});

test("city detection caches results, limits requests, and stores no raw GPS", async () => {
  const dir = await mkdtemp(join(tmpdir(), "stray-location-"));
  try {
    let requests = 0;
    const waits = [];
    const options = {
      cacheDirectory: pathToFileURL(`${dir}/`),
      now: () => 10000,
      wait: async (ms) => waits.push(ms),
      fetchImpl: async (url, init) => {
        requests++;
        assert.equal(url.searchParams.get("accept-language"), "en");
        assert.equal(url.searchParams.get("zoom"), "10");
        assert.match(init.headers["User-Agent"], /StrayCharacters/);
        return {
          ok: true,
          json: async () => ({
            address: { city: "Paris", road: "Ignored street" },
          }),
        };
      },
    };
    const gps = { latitude: 48.8584, longitude: 2.2945 };
    const result = await detectLocation(gps, options);
    assert.deepEqual(result, {
      location: "Paris",
      locationSource: "openstreetmap",
    });
    assert.deepEqual(await detectLocation(gps, options), result);
    assert.equal(requests, 1);
    await detectLocation({ ...gps, latitude: 48.86 }, options);
    assert.equal(requests, 2);
    assert.equal(waits[1], 1100);
    const cached = await readFile(join(dir, "locations.json"), "utf8");
    assert.ok(
      !cached.includes("48.8584") &&
        !cached.includes("2.2945") &&
        !cached.includes("Ignored street"),
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("failures leave location empty and remain retryable", async () => {
  const dir = await mkdtemp(join(tmpdir(), "stray-location-"));
  try {
    const warnings = [];
    const gps = { latitude: 0, longitude: 0 };
    const options = {
      cacheDirectory: pathToFileURL(`${dir}/`),
      wait: async () => {},
      warn: (message) => warnings.push(message),
    };
    assert.deepEqual(
      await detectLocation(gps, {
        ...options,
        fetchImpl: async () => ({ ok: false, status: 503 }),
      }),
      {},
    );
    assert.equal(warnings.length, 1);
    assert.deepEqual(
      await detectLocation(gps, {
        ...options,
        fetchImpl: async () => ({
          ok: true,
          json: async () => ({ address: { town: "Example Town" } }),
        }),
      }),
      { location: "Example Town", locationSource: "openstreetmap" },
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
