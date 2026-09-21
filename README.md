# Stray Characters

Signs, menus, and other letters that caught my eye. A personal journal by Mamuso.

A static Next.js App Router site. Content lives in `content/journal.json`, photos in `public/pics`. No CMS, database, or runtime API; additional gallery blocks are static JSON files. The existing analytics script is retained.

The gallery uses proportional rows without cropping. It starts with approximately 24 photos, finishing the current row before cutting a block. Infinite scrolling appends the next block as you approach the end, without rearranging existing photos; the last block may be smaller. Rows are virtualized, keeping approximately one extra screen above and below the viewport. Clicking a photograph goes directly to its permanent page. Use the left/right arrow keys to browse; the photo page keeps these shortcuts without displaying a guide. On desktop, photo pages use a 320 px sidebar with the brand, a visible back link, and one metadata field per line. The darker image column starts at the same top inset as the brand. Mobile keeps a stacked layout. Navigation stops at the first and last photo. Modified shortcuts, held keys and typing in editable fields are left alone. The full-width header, photo rows and footer share responsive gutters. “A chance encounter” opens a random photo page. There is no separate viewer or dialog to maintain.

## Gallery loading and returning to your place

The build creates a static HTML page per block (`/` and `/journal/2/`, etc.) and small JSON files at `/journal/<snapshot-hash>/<page>.json`. The homepage only receives its first block, rather than the whole collection. Without JavaScript, “Next photographs” follows the next static page. With JavaScript, an intersection observer requests the next block within 1,000 px of the end; only the first two photographs are preloaded and the rest use native lazy loading.

Clicking a photo remembers the gallery URL, loaded blocks, scroll position and photo anchor. Visited block metadata stays in memory so return navigation can render the right virtual rows and restore scroll in a layout effect, before a view-transition snapshot. Session storage also recovers the position after a reload. Browser Back restores that place. If the viewport width changes, the photo anchor takes priority over the old pixel position. A directly opened photo falls back to the static gallery page containing it. Storage is optional and versioned by the content snapshot so a new deployment does not restore stale data. A failed request leaves existing photos intact and offers a retry button; it does not keep retrying automatically.

Virtual row heights come from the original image aspect ratios and the gallery width, with spacers preserving the full scrollable height. Photos outside the window are unmounted; a focused row stays mounted for keyboard navigation. Metadata grows with visited blocks, while image DOM nodes stay bounded by the visible window. The desktop and mobile geometry is covered by tests using 10,000 photographs.

Scroll-driven window changes use React transitions so they cannot synchronously interrupt a photo navigation; mounted virtual images load eagerly, while the initial static HTML retains lazy loading. Native scroll anchoring is disabled inside the gallery so it cannot shift the viewport when virtual spacers change.

`vercel.json` gives `/journal/<snapshot-hash>/*.json` the same immutable cache policy as hashed images (not the `/journal/2/` HTML pages). When an older tab requests a snapshot that is no longer available (404 or 410), the gallery keeps its loaded photographs and offers “Reload collection”, which performs a full navigation to the latest homepage. Other request failures retain the retry action.

## Styling

All component styling uses StyleX, compiled at build time with the official Babel and PostCSS integration (Turbopack remains enabled). `styles/tokens.stylex.ts` defines colors, the font stack and responsive gutters; `styles/site.ts` holds shared component styles. `app/globals.css` contains the box-sizing reset, StyleX output directive and rules for browser-owned root view-transition snapshots.

The site is dark-only, regardless of system preference: a charcoal background, light text, neutral gray dividers and the same pink accent (`#ea3f8b`) as mamuso.dev. Native browser controls also use the dark color scheme.

Typography uses the device’s system UI font (`system-ui` with platform fallbacks), with no bundled fonts or font downloads. Titles use 20/28 px at weight 500; interface and introductory text use 16/26 px, notes use 16/28 px, and the keyboard hint uses 14/22 px. Letter spacing stays natural. The specific typeface follows the visitor’s operating system. Symbols are Unicode text; there are no SVG or icon-library dependencies.

Motion stays small: matching React `ViewTransition` names morph the thumbnail into the detail image in 320 ms, and return to the gallery in 180 ms, when returning through browser history. StyleX defines the photo transition class and reduced-motion duration. The detail image has its actual aspect ratio, avoiding a morph into a letterboxed full-width container. Gallery photos stay still on hover; text links retain a short color transition. Reduced-motion preferences disable animation; unsupported browsers navigate normally. There is no animation dependency.

Browser Back/Forward also morphs shared photos. `HistoryTransitions` uses the Navigation API to coordinate same-document history traversal with React, resolving the navigation in a layout effect after scroll is restored. It replaces the current route rather than pushing a new history entry, and bypasses Next’s synchronous `popstate` handling only for those intercepted journal routes. Hash changes, external pages and browsers without this API retain native navigation. Gallery visits are keyed by history entry so revisiting the same URL can restore different positions. A return after a full reload can restore asynchronously while saved blocks are fetched.

Enlargement uses a single destination snapshot to avoid blending two image resolutions during scaling. The detail image uses Next.js `getImageProps` for its responsive sources and a native eager image without an `onLoad` handler, allowing React to wait for decoding before taking the transition snapshot on a cold load. Responsive preloading is retained. Hover and keyboard focus prepare and decode the exact responsive detail candidate. Opening a photo waits up to two seconds for that decode; errors or timeouts still navigate normally, and a newer photo selection supersedes an older pending one. The return transition retains the softer shared-image morph.

## Develop

Use Node.js 24 LTS (24.11.0 or newer within 24.x) and pnpm 12.4.2.

```sh
pnpm install
pnpm dev
```

Open http://localhost:3000. Content and image derivatives are prepared when the command starts; restart after adding or editing entries.

## Add a photograph

```sh
pnpm photo:add ~/Pictures/sign.jpg

pnpm photo:add ~/Pictures/sign.jpg \
  --title "Around the corner" \
  --note "Came back for the lettering." \
  --location "San Francisco" \
  --alt "Red painted script on a corner grocery window"
```

All fields are optional. `--slug around-the-corner` sets a permanent URL; otherwise it uses the next specimen number, such as `specimen-046`. Titles do not determine identity. `--date 2026-09-19` overrides the original EXIF capture date when present. Without a capture date, the date stays empty. When GPS is present, the CLI looks up the city in English through Nominatim/OpenStreetMap. Only coordinates are sent, never the photo; only the city and attribution source are saved in the journal, never GPS. `--location` overrides detection and `--no-location` disables it. Missing GPS, failed lookups and unavailable city names leave location empty without blocking import. Add descriptive alternative text whenever possible.

The command imports an auto-oriented JPEG, at most 2400 pixels per side, without EXIF metadata. Your source file is untouched: keep archival originals separately. Input formats depend on your local Sharp build; JPEG, PNG and WebP work, and HEIC may require conversion first.

The new entry goes first in the source JSON. Every build orders the gallery and keyboard navigation by capture date, newest first, with undated photographs at the end. Equal dates retain their source order. Each record stores its permanent `specimenNumber` and slug (`specimen-001`, etc.). Imports receive the next unused number. A later import of an older photograph is placed by capture date without renumbering published specimens. Edit the JSON for corrections, notes or removal; keep slugs stable once published. Titles, notes and interface copy are in English. Dates and places are never fabricated.

The collection contains 229 photographs after removing eight finds and renumbering the remaining specimens and image paths consecutively. The gallery preserves capture-date order; the retained image files are unchanged apart from their names. The gallery still displays newest first. Untouched sources have been moved outside the repository. Any historical import manifest refers to the specimen numbers at the time of import, before this renumbering. The local archive is ignored by Git and excluded from the static export; back it up separately. `originals/journal-before-exif.json` is historical metadata, not the current collection.

City lookups are cached locally in `.cache/geocoding/` (ignored by Git), with requests spaced at least 1.1 seconds apart. Builds and visitors never contact the geocoder. Set `NOMINATIM_URL` to switch to another compatible reverse endpoint. See the [Nominatim usage policy](https://operations.osmfoundation.org/policies/nominatim/). The CLI credits OpenStreetMap when it detects a city; the public site displays only saved location names. See the attribution below. To correct a city later, edit `location` in `content/journal.json`; remove `locationSource` if replacing it with your own information.

## Build and publish

```sh
pnpm test
pnpm build
pnpm check
```

Import the repository into Vercel with the Next.js framework preset and the repository root as Root Directory. Select Node.js 24.x in the project settings. `vercel.json` pins installation and build commands to pnpm 12.4.2 and keeps trailing-slash URLs consistent with Next.js. Leave Output Directory at the framework default; Next.js detects `output: "export"` and produces `out/`. No runtime environment variables or image service are needed.

Commit the source files, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, and `vercel.json` before deploying. Generated files remain ignored and are recreated by the build. Connect `straycharacters.mamuso.net` in Vercel's Domains settings and apply the DNS records shown there; metadata, canonical URLs, robots and sitemap already use this domain. Remove any previous GitHub Pages deployment workflow or Pages configuration if enabled externally.

Before switching DNS, check the preview homepage, `/journal/2/`, a `/finds/<slug>/` page, an unknown route (404), and infinite scrolling. Check response headers with `curl -I`: generated WebP images and snapshot JSON should have `max-age=31536000, immutable`; HTML, `/pics/*`, favicon, sitemap and robots should revalidate. A plain local static server does not apply Vercel headers, so confirm these on the deployed preview. The repository configuration does not create a Vercel project or change DNS.

Other static hosts can still publish `out/` after `pnpm install --frozen-lockfile` and `pnpm build`, with equivalent cache headers configured at that host.

Every build snapshots the journal and generates WebP variants at 480, 800, 1200, 1600 and 2400 pixels, without enlarging small originals. Variants of 1200 pixels and above use WebP quality 88 for clearer enlarged views; smaller thumbnails retain quality 82. Image URLs include a hash of the source image, transformation revision and image encoder versions, so encoder upgrades invalidate previously cached variants. No Next.js image server is required. Generated files are ignored by Git and rebuilt from the committed sources. The deployed content changes only with another deployment.

Image preparation reuses WebP variants and social cards from `.next/cache/photographs/`, which participates in Vercel's Next.js build cache. Each cache key includes the source image, specimen number, preparation and social-card code, brand artwork, lockfile and encoder versions. Titles, dates and other journal metadata are always read fresh. Missing or incomplete entries regenerate automatically; delete `.next/cache/photographs/` to force a full rebuild. The public output is still recreated from the current journal, so removed photographs do not remain in the exported collection. Other CI providers should persist `.next/cache/` between builds.

Responsive image `sizes` follow each photograph's share of its gallery row, including gaps and gutters. The gallery, gutters, virtual geometry and photo page share one responsive breakpoint at 900 px. Photo metadata uses consecutive lines without extra gaps between fields. Above 900 px, opened photographs fit the darker column width or the viewport height, with 32 px padding and no cropping. The left sidebar is 320 px wide. Photo detail pages omit the footer. Mobile retains a stacked layout and a 78dvh fitted image. Click the photograph to expand to the column width, and click again to restore the fitted view; the same control supports Enter and Space with an accessible expanded state. Expanded tall images can be scrolled. Detail image `sizes` follow the selected view and account for the sidebar and padding. Browsers select the appropriate existing WebP variant without changing image quality settings.

Vercel applies one-year immutable caching to `/generated/*` and the hashed gallery JSON through `vercel.json`; Next.js manages `/_next/static/*`. Other files retain the platform's default browser revalidation policy (`Cache-Control: public, max-age=0, must-revalidate`), so new deployments become visible. Original `/pics/*` URLs remain available for compatibility and are not marked immutable because a file may be replaced at the same path.

`pnpm dev` is the development server; `next start` is intentionally absent because this site exports static files. To preview production, serve `out/` with a static server (for example `python3 -m http.server 3000 --directory out`).

## Geocoding attribution

Automatic city detection in the photo import CLI uses Nominatim and data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), available under the [Open Database License (ODbL)](https://opendatacommons.org/licenses/odbl/1-0/).

Geocoding runs only during import. The website displays saved city names and does not provide a geocoding service. The [OSMF Geocoding Guideline](https://osmfoundation.org/wiki/Licence/Community_Guidelines/Geocoding_-_Guideline) distinguishes the geocoder from individual stored results; the collection does not attempt to reconstruct an OSM database.
