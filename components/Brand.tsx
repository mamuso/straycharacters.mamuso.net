"use client";

import { useRef, useState, type PointerEvent } from "react";
import Link from "next/link";
import * as stylex from "@stylexjs/stylex";
import { s } from "../styles/site";

const name = "Stray Characters";
const letters = Array.from(name);
const easeDelay = (progress: number) =>
  Math.round(140 * progress * progress * (3 - 2 * progress));
const initialDelays = letters.map((_, index) =>
  easeDelay(
    Math.abs(index - (letters.length - 1) / 2) / ((letters.length - 1) / 2),
  ),
);

export default function Brand() {
  const text = useRef<HTMLSpanElement>(null);
  const [wave, setWave] = useState({ active: false, delays: initialDelays });

  function enter(event: PointerEvent<HTMLAnchorElement>) {
    if (event.pointerType === "touch" || !text.current) return;
    const distances = Array.from(text.current.children, (letter) => {
      const rect = letter.getBoundingClientRect();
      return Math.abs(event.clientX - (rect.left + rect.width / 2));
    });
    const nearest = Math.min(...distances);
    const range = Math.max(...distances) - nearest || 1;
    setWave({
      active: true,
      delays: distances.map((distance) =>
        easeDelay((distance - nearest) / range),
      ),
    });
  }

  return (
    <Link
      href="/"
      aria-label={name}
      onPointerEnter={enter}
      onPointerLeave={() =>
        setWave((current) => ({ ...current, active: false }))
      }
      onFocus={(event) => {
        if (event.currentTarget.matches(":focus-visible")) {
          setWave({ active: true, delays: initialDelays });
        }
      }}
      onBlur={() => setWave((current) => ({ ...current, active: false }))}
      {...stylex.props(s.link, s.brand)}
    >
      <span aria-hidden="true" {...stylex.props(s.brandOrnament)}>
        ❧
      </span>{" "}
      <span ref={text} aria-hidden="true" {...stylex.props(s.brandText)}>
        {letters.map((letter, index) => (
          <span
            key={index}
            {...stylex.props(
              s.brandLetter(wave.delays[index]),
              wave.active && s.brandLetterActive,
            )}
          >
            {letter}
          </span>
        ))}
      </span>
    </Link>
  );
}
