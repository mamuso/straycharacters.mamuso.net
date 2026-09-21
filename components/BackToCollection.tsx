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
    <div {...stylex.props(s.entryBack)}>
      <Link
        href={savedHref || fallback}
        scroll={!savedHref}
        transitionTypes={["photo-close"]}
        aria-label="Back to the collection"
        {...stylex.props(s.link, s.entryBackLink)}
      >
        <span aria-hidden="true">←</span> Back to collection
      </Link>
      <div {...stylex.props(s.entryHeader)}>{children}</div>
    </div>
  );
}
