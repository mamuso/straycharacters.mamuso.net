"use client";

import { detailImageProps } from "../lib/detail-image";
import { useRef, useState } from "react";
import { flushSync, preload } from "react-dom";
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
  const imageProps = detailImageProps({ src, width, height, alt }, expanded);
  preload(imageProps.src, {
    as: "image",
    imageSrcSet: imageProps.srcSet,
    imageSizes: imageProps.sizes,
    fetchPriority: "high",
  });

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
          {/* An eager native image without onLoad lets React wait for decode
              before capturing the shared transition, including a cold load. */}
          <img
            {...imageProps}
            ref={image}
            id={`detail-${slug}`}
            {...stylex.props(s.entryImage)}
          />
        </PhotoTransition>
      </button>
    </div>
  );
}
