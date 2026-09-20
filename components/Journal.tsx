"use client";
import Link from "next/link";
import * as stylex from "@stylexjs/stylex";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Block } from "../lib/blocks";
import { pageHref } from "../lib/pagination.mjs";
import {
  historyVisitKey,
  originKey,
  positionKey,
  readPosition,
  type GalleryPosition,
} from "../lib/gallery-session";
import VirtualGallery from "./VirtualGallery";
import { s } from "../styles/site";

// Metadata only: photos outside the window are unmounted. Keeping visited blocks
// makes a return navigation synchronous, before ViewTransition takes its snapshot.
const visits = new Map<
  string,
  { blocks: Block[]; position: GalleryPosition }
>();

class SnapshotUnavailable extends Error {}

export default function Journal({
  initial,
  pageCount,
  total,
  version,
}: {
  initial: Block;
  pageCount: number;
  total: number;
  version: string;
}) {
  const router = useRouter();
  const key = positionKey(version, initial.number);
  const [visit] = useState(
    () => visits.get(historyVisitKey(key)) || visits.get(key),
  );
  const [loaded, setLoaded] = useState<Block[]>(visit?.blocks || [initial]);
  const [restore, setRestore] = useState<GalleryPosition | null>(
    visit?.position || null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reloadRequired, setReloadRequired] = useState(false);
  const pending = useRef(false);
  const sentinel = useRef<HTMLElement>(null);
  const endPage = loaded[loaded.length - 1].number;
  const rows = useMemo(() => loaded.flatMap((block) => block.rows), [loaded]);
  const count = rows.reduce((sum, row) => sum + row.length, 0);
  const complete = endPage >= pageCount && !busy && !error;
  const href = pageHref(initial.number);

  async function fetchBlock(
    number: number,
    signal?: AbortSignal,
  ): Promise<Block> {
    const response = await fetch(`/journal/${version}/${number}.json`, {
      cache: "force-cache",
      signal,
    });
    if (response.status === 404 || response.status === 410)
      throw new SnapshotUnavailable();
    if (!response.ok) throw new Error("Could not load photographs.");
    const block = await response.json();
    if (block.number !== number || !Array.isArray(block.rows))
      throw new Error("Invalid gallery block.");
    return block;
  }

  function reportError(cause: unknown, fallback: string) {
    const unavailable = cause instanceof SnapshotUnavailable;
    setReloadRequired(unavailable);
    setError(
      unavailable
        ? "This collection is no longer available. Reload to see the latest photographs."
        : fallback,
    );
  }

  // After a full reload there is no in-memory visit; recover the saved blocks.
  useEffect(() => {
    if (visit) return;
    const saved = readPosition(key);
    if (!saved || saved.endPage < initial.number || saved.endPage > pageCount)
      return;
    const controller = new AbortController();
    pending.current = true;
    setBusy(true);
    async function recover() {
      try {
        const pages = Array.from(
          { length: saved!.endPage - initial.number },
          (_, i) => initial.number + i + 1,
        );
        const restored = [
          initial,
          ...(await Promise.all(
            pages.map((page) => fetchBlock(page, controller.signal)),
          )),
        ];
        if (!controller.signal.aborted) {
          setLoaded(restored);
          setRestore(saved);
        }
      } catch (cause) {
        if (!controller.signal.aborted)
          reportError(
            cause,
            "Your place could not be restored. Reload to retry, or continue below.",
          );
      } finally {
        if (!controller.signal.aborted) {
          pending.current = false;
          setBusy(false);
        }
      }
    }
    void recover();
    return () => {
      controller.abort();
      pending.current = false;
    };
  }, [initial, key, pageCount, visit]);

  function remember(slug?: string) {
    const gallery = document.getElementById("journal")!;
    const image = slug
      ? gallery.querySelector<HTMLAnchorElement>(`a[href="/finds/${slug}/"]`)
      : null;
    const position: GalleryPosition = {
      href,
      endPage,
      scrollY: window.scrollY,
      galleryTop: gallery.getBoundingClientRect().top + window.scrollY,
      viewportWidth: window.innerWidth,
      anchor: slug,
      anchorOffset: image?.getBoundingClientRect().top,
    };
    visits.set(key, { blocks: loaded, position });
    visits.set(historyVisitKey(key), { blocks: loaded, position });
    try {
      sessionStorage.setItem(key, JSON.stringify(position));
      sessionStorage.setItem(originKey(version), JSON.stringify(position));
    } catch {
      /* Optional: the in-memory visit still restores normal navigation. */
    }
  }

  async function loadNext() {
    if (pending.current || endPage >= pageCount) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      const block = await fetchBlock(endPage + 1);
      setLoaded((current) => [...current, block]);
    } catch (cause) {
      reportError(cause, "Could not load the next photographs.");
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  useEffect(() => {
    if (busy || error || endPage >= pageCount) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void loadNext();
      },
      { rootMargin: "1000px 0px" },
    );
    observer.observe(sentinel.current!);
    return () => observer.disconnect();
  }, [endPage, pageCount, busy, error, version]);

  async function randomFind() {
    if (pending.current || !total) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      const block = await fetchBlock(1 + Math.floor(Math.random() * pageCount));
      const entries = block.rows.flat();
      remember();
      router.push(
        `/finds/${entries[Math.floor(Math.random() * entries.length)].slug}/`,
      );
    } catch (cause) {
      reportError(cause, "Could not open a random find. Please try again.");
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  return (
    <>
      <section {...stylex.props(s.toolbar)} aria-label="Journal introduction">
        <div {...stylex.props(s.toolbarCopy)}>
          <h1 {...stylex.props(s.subheading)}>
            I went outside. There were fonts.
          </h1>
        </div>
        <div {...stylex.props(s.toolbarActions)}>
          <span>{total} finds</span>
          <button
            {...stylex.props(s.button)}
            disabled={busy || total === 0}
            onClick={randomFind}
          >
            <span aria-hidden="true">❦</span> A chance encounter
          </button>
        </div>
      </section>
      {initial.number > 1 ? (
        <p {...stylex.props(s.muted)}>
          <Link {...stylex.props(s.link)} href={pageHref(initial.number - 1)}>
            ← Previous page
          </Link>
        </p>
      ) : null}
      <VirtualGallery
        rows={rows}
        restore={restore}
        remember={remember}
        busy={busy}
      />
      <nav
        ref={sentinel}
        {...stylex.props(!complete && s.pagination)}
        hidden={complete}
        aria-label="Collection progress"
      >
        <p {...stylex.props(s.keyboardHint)} role="status">
          {busy
            ? "Loading photographs…"
            : endPage >= pageCount
              ? null
              : `${count} of ${total} photographs`}
        </p>
        {error ? (
          <>
            <p role="alert" {...stylex.props(s.muted)}>
              {error}
            </p>
            {reloadRequired ? (
              <a {...stylex.props(s.link)} href="/">
                Reload collection →
              </a>
            ) : (
              <button {...stylex.props(s.button)} onClick={loadNext}>
                Try again ↓
              </button>
            )}
          </>
        ) : null}
        {endPage < pageCount ? (
          <noscript>
            <a {...stylex.props(s.link)} href={pageHref(endPage + 1)}>
              Next photographs →
            </a>
          </noscript>
        ) : null}
      </nav>
    </>
  );
}
