import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { setTimeout as sleep } from "node:timers/promises";

// The importer holds its repository lock throughout lookup and cache writes.
export async function detectLocation(
  exif,
  {
    manual,
    skip = false,
    cacheDirectory,
    fetchImpl = fetch,
    wait = sleep,
    now = Date.now,
    warn = console.warn,
  } = {},
) {
  if (manual !== undefined) return { location: manual };
  if (skip) return {};
  const latitude = exif?.latitude;
  const longitude = exif?.longitude;
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  )
    return {};
  try {
    const endpoint =
      process.env.NOMINATIM_URL ||
      "https://nominatim.openstreetmap.org/reverse";
    const key = createHash("sha256")
      .update(`${endpoint}:en:${latitude}:${longitude}`)
      .digest("hex");
    await mkdir(cacheDirectory, { recursive: true });
    const cacheFile = new URL("locations.json", cacheDirectory);
    let cache;
    try {
      cache = JSON.parse(await readFile(cacheFile, "utf8"));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      cache = { results: {}, lastRequest: 0 };
    }
    if (Object.hasOwn(cache.results, key)) return cache.results[key];
    await wait(Math.max(0, 1100 - (now() - cache.lastRequest)));
    cache.lastRequest = now();
    await writeFile(cacheFile, JSON.stringify(cache));
    const url = new URL(endpoint);
    url.search = new URLSearchParams({
      format: "jsonv2",
      lat: String(latitude),
      lon: String(longitude),
      zoom: "10",
      addressdetails: "1",
      "accept-language": "en",
    }).toString();
    const response = await fetchImpl(url, {
      headers: {
        "User-Agent":
          "StrayCharactersPhotoImporter/1.0 (https://straycharacters.mamuso.net)",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok)
      throw new Error(`Geocoder returned HTTP ${response.status}`);
    const data = await response.json();
    if (data.error) throw new Error("No location found");
    const address = data.address || {};
    const city = [
      address.city,
      address.town,
      address.village,
      address.municipality,
    ].find((value) => typeof value === "string" && value.trim());
    const result = city
      ? { location: city.trim(), locationSource: "openstreetmap" }
      : {};
    cache.results[key] = result;
    await writeFile(cacheFile, JSON.stringify(cache));
    if (!city)
      warn("No city found for this photo. Add --location manually if needed.");
    return result;
  } catch {
    warn(
      "Could not detect the city. Importing without location; use --location to set it manually.",
    );
    return {};
  }
}
