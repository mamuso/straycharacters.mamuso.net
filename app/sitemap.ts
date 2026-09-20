import { blocks } from "../lib/blocks";
import { entries } from "../lib/journal";
export const dynamic = "force-static";
export default function sitemap() {
  return [
    "",
    ...blocks.slice(1).map((block) => `journal/${block.number}/`),
    ...entries.map((entry) => `finds/${entry.slug}/`),
  ].map((path) => ({ url: `https://straycharacters.mamuso.net/${path}` }));
}
