"use client";
import { startTransition, useEffect, useLayoutEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

type NavigationEvent = Event & {
  navigationType: string;
  canIntercept: boolean;
  hashChange: boolean;
  destination: { url: string; sameDocument: boolean; key: string };
  signal: AbortSignal;
  intercept: (options: {
    scroll: "manual";
    handler: () => Promise<void>;
  }) => void;
};

const isJournalRoute = (path: string) =>
  /^\/(?:journal\/[1-9]\d*\/|finds\/[a-z0-9-]+\/)?$/.test(path);

/** Let the Navigation API coordinate history traversal with React's snapshot.
 * Next's legacy popstate path must commit synchronously, which skips morphs.
 * Other navigations (including hashes and external pages) keep native behavior.
 */
export default function HistoryTransitions() {
  const router = useRouter();
  const pathname = usePathname();
  const pending = useRef<{
    pathname: string;
    scrollY?: number;
    done: () => void;
  } | null>(null);
  const positions = useRef(new Map<string, number>());
  const intercepting = useRef(false);

  useLayoutEffect(() => {
    if (pending.current?.pathname === pathname) {
      const { done, scrollY } = pending.current;
      if (scrollY !== undefined)
        window.scrollTo({ top: scrollY, behavior: "instant" });
      pending.current = null;
      // Gallery layout effects have restored its virtual rows and scroll by now.
      done();
    }
  }, [pathname]);

  useEffect(() => {
    const navigation = (
      window as Window & {
        navigation?: EventTarget & { currentEntry?: { key: string } };
      }
    ).navigation;
    if (!navigation || !document.startViewTransition) return;
    const saveScroll = () => {
      const key = navigation.currentEntry?.key;
      if (key) positions.current.set(key, window.scrollY);
    };
    const onNavigate = (event: Event) => {
      const navigationEvent = event as NavigationEvent;
      const destination = new URL(navigationEvent.destination.url);
      // Next commits router.replace via history.replaceState, which aborts the
      // intercepted Navigation. Keep our layout handoff for that replacement;
      // cancel it only when a different navigation supersedes it.
      if (
        pending.current &&
        (navigationEvent.navigationType !== "replace" ||
          destination.pathname !== pending.current.pathname)
      ) {
        pending.current.done();
        pending.current = null;
      }

      if (
        navigationEvent.navigationType !== "traverse" ||
        !navigationEvent.canIntercept ||
        !navigationEvent.destination.sameDocument ||
        navigationEvent.hashChange ||
        destination.origin !== location.origin ||
        destination.pathname === location.pathname ||
        !isJournalRoute(destination.pathname) ||
        !isJournalRoute(location.pathname)
      )
        return;
      saveScroll();
      intercepting.current = true;
      navigationEvent.intercept({
        scroll: "manual",
        handler: () =>
          new Promise<void>((resolve) => {
            pending.current = {
              pathname: destination.pathname,
              scrollY: destination.pathname.startsWith("/finds/")
                ? positions.current.get(navigationEvent.destination.key) || 0
                : undefined,
              done: () => {
                intercepting.current = false;
                resolve();
              },
            };
            startTransition(() =>
              router.replace(
                destination.pathname + destination.search + destination.hash,
                {
                  scroll: false,
                  transitionTypes: destination.pathname.startsWith("/finds/")
                    ? ["photo-open"]
                    : ["photo-close"],
                },
              ),
            );
          }),
      });
    };
    const onPopState = (event: PopStateEvent) => {
      if (intercepting.current) event.stopImmediatePropagation();
    };
    navigation.addEventListener("navigate", onNavigate);
    window.addEventListener("scroll", saveScroll, { passive: true });
    window.addEventListener("popstate", onPopState, true);
    return () => {
      navigation.removeEventListener("navigate", onNavigate);
      window.removeEventListener("scroll", saveScroll);
      window.removeEventListener("popstate", onPopState, true);
      pending.current?.done();
      pending.current = null;
    };
  }, [router]);
  return null;
}
