"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import * as stylex from "@stylexjs/stylex";
import PhotoTransition from "./PhotoTransition";
import { s } from "../styles/site";

export default function ExpandablePhoto({
  slug,
  src,
  width,
  height,
  alt,
}: {
  slug: string;
  src: string;
  width: number;
  height: number;
  alt: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const image = useRef<HTMLImageElement>(null);
  const fittedWidth = `${width / height * 78}dvh`;

  function toggle() {
    const top = image.current!.getBoundingClientRect().top + window.scrollY;
    const scrollY = Math.min(window.scrollY, top);
    flushSync(() => setExpanded((current) => !current));
    // Keep the start of the photo in view instead of anchoring to the button
    // as the image grows or shrinks above it.
    window.scrollTo({ top: scrollY, behavior: "instant" });
  }

  return (
    <div {...stylex.props(s.expandablePhoto)}>
      <PhotoTransition slug={slug}>
        <Image
          ref={image}
          id={`detail-${slug}`}
          src={src}
          width={width}
          height={height}
          alt={alt}
          sizes={expanded
            ? "(max-width: 600px) calc(100vw - 32px), calc(100vw - 64px)"
            : `(max-width: 600px) min(calc(100vw - 32px), ${fittedWidth}), min(calc(100vw - 64px), ${fittedWidth})`}
          preload
          {...stylex.props(s.entryImage, !expanded && s.entryImageFitted(width / height))}
        />
      </PhotoTransition>
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={`detail-${slug}`}
        onClick={toggle}
        {...stylex.props(s.button, s.expandPhotoButton)}
      >
        {expanded ? "collapse" : "expand"}
      </button>
    </div>
  );
}
