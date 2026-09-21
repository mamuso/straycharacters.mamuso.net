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
  const desktopWidth = `min(calc(100vw - 384px), calc((100dvh - 64px) * ${width / height}))`;

  function toggle() {
    const top = image.current!.getBoundingClientRect().top + window.scrollY;
    const scrollY = Math.min(window.scrollY, top);
    flushSync(() => setExpanded((current) => !current));
    // Preserve the photo position when expanding; reveal its top when collapsing
    // after scrolling down an enlarged portrait.
    window.scrollTo({ top: scrollY, behavior: "instant" });
  }

  return (
    <div {...stylex.props(s.expandablePhoto)}>
      <button
        type="button"
        aria-label={expanded ? "Collapse photo" : "Expand photo"}
        aria-expanded={expanded}
        aria-controls={`detail-${slug}`}
        onClick={toggle}
        {...stylex.props(s.photoToggle, expanded ? s.photoToggleExpanded : s.photoToggleFitted(width / height))}
      >
        <PhotoTransition slug={slug}>
          <Image
            ref={image}
            id={`detail-${slug}`}
            src={src}
            width={width}
            height={height}
            alt={alt}
            sizes={expanded
              ? "(max-width: 900px) calc(100vw - 32px), calc(100vw - 384px)"
              : `(max-width: 900px) min(calc(100vw - 32px), ${fittedWidth}), ${desktopWidth}`}
            preload
            {...stylex.props(s.entryImage)}
          />
        </PhotoTransition>
      </button>
    </div>
  );
}
