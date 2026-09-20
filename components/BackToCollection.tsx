"use client";
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import * as stylex from "@stylexjs/stylex";
import { s } from "../styles/site";
import { originKey, readPosition } from "../lib/gallery-session";

export default function BackToCollection({
  fallback,
  version,
  children,
}: {
  fallback: string;
  version: string;
  children: ReactNode;
}) {
  const [savedHref, setSavedHref] = useState<string | null>(null);
  useEffect(() => {
    setSavedHref(readPosition(originKey(version))?.href || null);
  }, [version]);
  return (
    <div {...stylex.props(s.entryBack, stylex.defaultMarker())}>
      <span aria-hidden="true" {...stylex.props(s.entryBackHitArea)} />
      <Link
        href={savedHref || fallback}
        scroll={!savedHref}
        transitionTypes={["photo-close"]}
        aria-label="Back to the collection"
        {...stylex.props(s.entryBackArrow)}
      >
        <span aria-hidden="true">←</span>
      </Link>
      <div {...stylex.props(s.entryHeader, s.entryBackContent)}>{children}</div>
    </div>
  );
}
