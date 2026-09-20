export type GalleryPosition = {
  href: string;
  endPage: number;
  scrollY: number;
  galleryTop?: number;
  viewportWidth?: number;
  anchor?: string;
  anchorOffset?: number;
};
export const positionKey = (version: string, page: number) =>
  `stray:position:${version}:${page}`;
export const originKey = (version: string) => `stray:origin:${version}`;
export function readPosition(key: string): GalleryPosition | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(key) || "null");
    if (
      value &&
      /^\/(?:journal\/[1-9]\d*\/)?$/.test(value.href) &&
      Number.isInteger(value.endPage) &&
      value.endPage > 0 &&
      Number.isFinite(value.scrollY) &&
      value.scrollY >= 0
    )
      return {
        href: value.href,
        endPage: value.endPage,
        scrollY: value.scrollY,
        galleryTop: Number.isFinite(value.galleryTop)
          ? value.galleryTop
          : undefined,
        viewportWidth: Number.isFinite(value.viewportWidth)
          ? value.viewportWidth
          : undefined,
        anchor:
          typeof value.anchor === "string" && /^[a-z0-9-]+$/.test(value.anchor)
            ? value.anchor
            : undefined,
        anchorOffset: Number.isFinite(value.anchorOffset)
          ? value.anchorOffset
          : undefined,
      };
  } catch {
    /* Storage can be unavailable; navigation still works. */
  }
  return null;
}

// A gallery may occur several times in the real browser history at different
// scroll positions. The Navigation API gives each occurrence a stable key.
export function historyVisitKey(key: string) {
  if (typeof window === "undefined") return key;
  const navigation = (
    window as Window & {
      navigation?: { currentEntry?: { key: string } };
    }
  ).navigation;
  const entry = navigation?.currentEntry?.key;
  return entry ? `${key}:${entry}` : key;
}
