import HistoryTransitions from "../components/HistoryTransitions";
import type { Metadata } from "next";
import Brand from "../components/Brand";
import Script from "next/script";
import * as stylex from "@stylexjs/stylex";
import { s } from "../styles/site";
import "./globals.css";
export const metadata: Metadata = {
  metadataBase: new URL("https://straycharacters.mamuso.net"),
  title: {
    default: "Stray Characters — A personal journal of found lettering",
    template: "%s — Stray Characters",
  },
  description:
    "Signs, menus, and other letters that caught my eye. A personal journal of found lettering by Mamuso.",
  icons: { icon: "/img/favicon.png" },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth" {...stylex.props(s.html)}>
      <body {...stylex.props(s.body)}>
        <a {...stylex.props(s.link, s.skip)} href="#back-to-reality">
          Skip to content
        </a>
        <header {...stylex.props(s.header)}>
          <Brand />
        </header>
        <main id="back-to-reality" {...stylex.props(s.main)}>
          {children}
        </main>
        <HistoryTransitions />
        <footer id="about" {...stylex.props(s.footer)}>
          <p {...stylex.props(s.footerCopy)}>
            An ongoing exercise in paying attention.
          </p>
          <div {...stylex.props(s.footerLinks)}>
            <a href="https://mamuso.dev" {...stylex.props(s.link)}>
              Collected by Mamuso
            </a>
            <a href="#back-to-reality" {...stylex.props(s.link)}>
              Back to top <span aria-hidden="true">↑</span>
            </a>
          </div>
        </footer>
        <Script
          src="https://koala.mamuso.net/script.js"
          data-site="GKBFIQTA"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
