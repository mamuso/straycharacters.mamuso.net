"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as stylex from "@stylexjs/stylex";
import { galleryLayout, visibleRange } from "../lib/gallery-layout.mjs";
import { label, type Entry } from "../lib/journal-types";
import { prepareDetailImage } from "../lib/detail-image";
import type { GalleryPosition } from "../lib/gallery-session";
import PhotoTransition from "./PhotoTransition";
import { s } from "../styles/site";

type Viewport = { width: number; mobile: boolean; top: number; height: number };
function viewport(scrollY: number, galleryTop: number): Viewport {
  const mobile = window.innerWidth <= 900;
  return {
    width: document.documentElement.clientWidth - (mobile ? 32 : 64),
    mobile,
    top: scrollY - galleryTop,
    height: window.innerHeight,
  };
}

export default function VirtualGallery({
  rows,
  restore,
  remember,
  busy,
}: {
  rows: Entry[][];
  restore: GalleryPosition | null;
  remember: (slug: string) => void;
  busy: boolean;
}) {
  const router = useRouter();
  const root = useRef<HTMLElement>(null);
  const restored = useRef(false);
  const navigationAttempt = useRef(0);
  useLayoutEffect(() => () => { navigationAttempt.current++; }, []);
  const [focused, setFocused] = useState<string | null>(null);
  const [view, setView] = useState<Viewport | null>(() => {
    if (typeof window === "undefined" || restore?.galleryTop === undefined)
      return null;
    const initial = viewport(restore.scrollY, restore.galleryTop);
    if (restore.anchor && restore.viewportWidth !== window.innerWidth) {
      const row = galleryLayout(rows, initial.width, initial.mobile).find(
        (row) => row.entries.some((entry) => entry.slug === restore.anchor),
      );
      if (row) initial.top = row.top - (restore.anchorOffset || 0);
    }
    return initial;
  });
  const layout = useMemo(
    () => (view ? galleryLayout(rows, view.width, view.mobile) : []),
    [rows, view?.width, view?.mobile],
  );
  const range = view
    ? visibleRange(layout, view.top - view.height, view.top + view.height * 2)
    : null;

  useLayoutEffect(() => {
    const element = root.current!;
    let measuredWidth = -1;
    let geometry: ReturnType<typeof galleryLayout<Entry>> = [];
    function measure() {
      const box = element.getBoundingClientRect();
      const next = viewport(window.scrollY, box.top + window.scrollY);
      next.width = box.width;
      setView((previous) => {
        if (
          previous &&
          previous.width === next.width &&
          previous.mobile === next.mobile &&
          previous.height === next.height
        ) {
          if (measuredWidth !== next.width) {
            geometry = galleryLayout(rows, next.width, next.mobile);
            measuredWidth = next.width;
          }
          const a = visibleRange(
            geometry,
            previous.top - previous.height,
            previous.top + previous.height * 2,
          );
          const b = visibleRange(
            geometry,
            next.top - next.height,
            next.top + next.height * 2,
          );
          if (a.start === b.start && a.end === b.end) return previous;
        }
        return next;
      });
    }
    if (restore && !restored.current) {
      restored.current = true;
      let top = restore.scrollY;
      if (restore.anchor && restore.viewportWidth !== window.innerWidth) {
        const geometry = galleryLayout(
          rows,
          element.clientWidth,
          window.innerWidth <= 900,
        );
        const row = geometry.find((row) =>
          row.entries.some((entry) => entry.slug === restore.anchor),
        );
        if (row)
          top =
            element.getBoundingClientRect().top +
            window.scrollY +
            row.top -
            (restore.anchorOffset || 0);
      }
      window.scrollTo({ top, behavior: "instant" });
    }
    measure();
    let frame = 0;
    const schedule = () => {
      if (!frame)
        frame = requestAnimationFrame(() => {
          frame = 0;
          // Synchronous commits cancel an in-flight shared photo transition.
          // Keep window updates coordinated with React navigation transitions.
          startTransition(measure);
        });
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const observer = new ResizeObserver(schedule);
    observer.observe(element);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [rows, restore]);

  function prepare(item: Entry) {
    router.prefetch(`/finds/${item.slug}/`);
    void prepareDetailImage({ ...item, alt: item.alt || label(item) }).catch(() => {});
  }

  async function openPhoto(event: { preventDefault: () => void }, item: Entry) {
    event.preventDefault();
    const attempt = ++navigationAttempt.current;
    const pathname = window.location.pathname;
    setFocused(item.slug);
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        prepareDetailImage({ ...item, alt: item.alt || label(item) }),
        new Promise<void>((resolve) => { timeout = setTimeout(resolve, 2000); }),
      ]);
    } catch {
      // Image failure must not prevent opening the page or retrying its image.
    } finally {
      clearTimeout(timeout);
    }
    if (attempt !== navigationAttempt.current || window.location.pathname !== pathname) return;
    remember(item.slug);
    router.push(`/finds/${item.slug}/`, { transitionTypes: ["photo-open"] });
  }

  function renderRow(entries: Entry[]) {
    const totalRatio = entries.reduce((sum, item) => sum + item.width / item.height, 0);
    return (
      <div
        {...stylex.props(s.row)}
        key={entries[0].slug}
        data-gallery-row={entries[0].slug}
      >
        {entries.map((item) => (
          <figure
            key={item.slug}
            {...stylex.props(s.figure(item.width / item.height))}
          >
            <Link
              href={`/finds/${item.slug}/`}
              prefetch={false}
              transitionTypes={["photo-open"]}
              {...stylex.props(s.link, s.photoLink)}
              aria-label={`View ${label(item)}`}
              onNavigate={(event) => { void openPhoto(event, item); }}
              onMouseEnter={() => prepare(item)}
              onFocus={() => {
                setFocused(item.slug);
                prepare(item);
              }}
            >
              <PhotoTransition slug={item.slug}>
                <Image
                  src={item.src}
                  width={item.width}
                  height={item.height}
                  alt={item.alt || label(item)}
                  // Virtualization already bounds this window. Lazy-loading a
                  // newly mounted visible image adds a second scheduling delay.
                  loading={view ? "eager" : undefined}
                  sizes={`(max-width: 900px) calc(100vw - 32px), calc((100vw - ${64 + (entries.length - 1) * 8}px) * ${item.width / item.height / totalRatio})`}
                  preload={
                    rows[0]?.indexOf(item) >= 0 && rows[0]?.indexOf(item) < 2
                  }
                  {...stylex.props(s.photo)}
                />
              </PhotoTransition>
            </Link>
          </figure>
        ))}
      </div>
    );
  }

  const content = [];
  if (range) {
    let bottom = 0;
    const indices = Array.from(
      { length: range.end - range.start },
      (_, i) => range.start + i,
    );
    const focusedRow = focused
      ? layout.findIndex((row) =>
          row.entries.some((entry) => entry.slug === focused),
        )
      : -1;
    if (focusedRow >= 0 && !indices.includes(focusedRow))
      indices.push(focusedRow);
    indices.sort((a, b) => a - b);
    for (const index of indices) {
      const row = layout[index];
      if (!row) continue;
      if (row.top > bottom)
        content.push(
          <div
            key={`space-${index}`}
            aria-hidden="true"
            {...stylex.props(s.spacer(row.top - bottom))}
          />,
        );
      content.push(renderRow(row.entries));
      bottom = row.bottom;
    }
    const remaining = (layout.at(-1)?.bottom || 0) - bottom;
    if (remaining > 0)
      content.push(
        <div
          key="remaining"
          aria-hidden="true"
          {...stylex.props(s.spacer(remaining))}
        />,
      );
  }
  return (
    <section
      ref={root}
      {...stylex.props(s.gallery)}
      id="journal"
      aria-label="The collection"
      aria-busy={busy}
    >
      {range ? content : rows.map(renderRow)}
    </section>
  );
}
