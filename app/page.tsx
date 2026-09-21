import Journal from "../components/Journal";
import { blocks, total, version } from "../lib/blocks";
import type { Metadata } from "next";

const socialImage = {
  url: "/img/og-home.png",
  width: 2400,
  height: 1260,
  alt: "Stray Characters — white lettering and a pink symbol on a dark background",
};

export const metadata: Metadata = {
  openGraph: {
    images: [socialImage],
  },
  twitter: {
    card: "summary_large_image",
    images: [socialImage],
  },
};

export default function Home() {
  return (
    <Journal
      key={version}
      initial={blocks[0]}
      pageCount={blocks.length}
      total={total}
      version={version}
    />
  );
}
