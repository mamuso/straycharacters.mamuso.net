import { ViewTransition, type ReactNode } from "react";
import * as stylex from "@stylexjs/stylex";
import { tokens } from "../styles/tokens.stylex";

const morph = stylex.viewTransitionClass({
  group: {
    animationDuration: tokens.photoReturnDuration,
    animationTimingFunction: "cubic-bezier(0.2, 0.7, 0.3, 1)",
  },
  old: { animationDuration: tokens.photoReturnDuration },
  new: { animationDuration: tokens.photoReturnDuration },
});

// During enlargement use one full-resolution snapshot, not two differently
// sampled versions fading through each other while they scale.
const enlarge = stylex.viewTransitionClass({
  group: {
    animationDuration: tokens.photoDuration,
    animationTimingFunction: "cubic-bezier(0.2, 0.7, 0.3, 1)",
  },
  old: { display: "none" },
  new: { animationName: "none", height: "100%", objectFit: "fill" },
});

export default function PhotoTransition({
  slug,
  children,
}: {
  slug: string;
  children: ReactNode;
}) {
  return (
    <ViewTransition
      name={`photo-${slug}`}
      default="none"
      share={{ "photo-open": enlarge, default: morph }}
    >
      {children}
    </ViewTransition>
  );
}
