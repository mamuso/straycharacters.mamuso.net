import { getImageProps } from "next/image";

type Photo = { src: string; width: number; height: number; alt: string };

export function detailImageProps({ src, width, height, alt }: Photo, expanded = false) {
  const fittedWidth = `${width / height * 78}dvh`;
  const desktopWidth = `min(calc(100vw - 384px), calc((100dvh - 64px) * ${width / height}))`;
  return getImageProps({
    src, width, height, alt,
    loading: "eager",
    sizes: expanded
      ? "(max-width: 900px) calc(100vw - 32px), calc(100vw - 384px)"
      : `(max-width: 900px) min(calc(100vw - 32px), ${fittedWidth}), ${desktopWidth}`,
  }).props;
}

const prepared = new Map<string, Promise<void>>();

// Use exactly the destination's srcset/sizes so we decode the same candidate
// the browser will paint, including on Retina screens and after a resize.
export function prepareDetailImage(photo: Photo): Promise<void> {
  const key = `${photo.src}:${photo.width}:${photo.height}:${window.innerWidth}:${window.innerHeight}:${window.devicePixelRatio}`;
  const cached = prepared.get(key);
  if (cached) return cached;
  const props = detailImageProps(photo);
  const image = new window.Image();
  image.sizes = props.sizes || "";
  image.srcset = props.srcSet || "";
  image.src = props.src;
  const pending = image.decode().catch((error) => {
    prepared.delete(key);
    throw error;
  });
  if (prepared.size >= 32) prepared.delete(prepared.keys().next().value!);
  prepared.set(key, pending);
  return pending;
}
