"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PhotoNavigation({
  previous,
  next,
}: {
  previous?: string;
  next?: string;
}) {
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (
        event.defaultPrevented ||
        event.repeat ||
        event.isComposing ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey
      )
        return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.closest(
            'input, textarea, select, [role="textbox"], [role="slider"], [role="spinbutton"]',
          ))
      )
        return;
      const href =
        event.key === "ArrowLeft"
          ? previous
          : event.key === "ArrowRight"
            ? next
            : undefined;
      if (!href) return;
      event.preventDefault();
      router.push(href);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [previous, next, router]);

  return null;
}
