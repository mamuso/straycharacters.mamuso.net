"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import * as stylex from "@stylexjs/stylex";
import Brand from "./Brand";
import { s } from "../styles/site";

export default function SiteFrame({ children }: { children: ReactNode }) {
  const detail = usePathname().startsWith("/finds/");
  return (
    <div {...stylex.props(detail && s.detailFrame)}>
      <header {...stylex.props(s.header, detail && s.detailBrand)}>
        <Brand />
      </header>
      <main id="back-to-reality" {...stylex.props(s.main, detail && s.detailMain)}>
        {children}
      </main>
      <footer id="about" {...stylex.props(s.footer, detail && s.detailFooter)}>
        <p {...stylex.props(s.footerCopy, detail && s.detailFooterCopy)}>
          An ongoing exercise in paying attention.
        </p>
        {!detail ? (
          <div {...stylex.props(s.footerLinks)}>
            <a href="https://mamuso.dev" {...stylex.props(s.link)}>
              Collected by Mamuso
            </a>
          </div>
        ) : null}
      </footer>
    </div>
  );
}
