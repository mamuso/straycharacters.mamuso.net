import { readFile } from "node:fs/promises";
import { createElement as h } from "react";
import { ImageResponse } from "next/og.js";
import sharp from "sharp";

const brand = `data:image/png;base64,${(await readFile(
  new URL("../public/img/og-home.png", import.meta.url),
)).toString("base64")}`;

// Build-time rendering keeps social cards compatible with the static export.
export async function specimenCard(image, specimenNumber) {
  const photo = await sharp(image)
    .resize(680, 680, { fit: "cover", position: "centre" })
    .png()
    .toBuffer();
  const response = new ImageResponse(
    h("div", {
      style: {
        width: "100%", height: "100%", display: "flex",
        backgroundColor: "#191918", color: "white",
      },
    },
    // Reuse the supplied brand artwork as a fixed part of the background.
    h("div", {
      style: {
        position: "absolute", left: 60, top: 60,
        width: 460, height: 64, display: "flex", overflow: "hidden",
      },
    }, h("img", {
      src: brand, width: 600, height: 315,
      style: { position: "absolute", left: -81, top: -127 },
    })),
    h("div", {
      style: {
        position: "absolute", left: 60, top: 135,
        fontSize: 48, fontWeight: 400, letterSpacing: -2,
      },
    }, `Specimen No. ${String(specimenNumber).padStart(3, "0")}`),
    h("img", {
      src: `data:image/png;base64,${photo.toString("base64")}`,
      width: 340, height: 340,
      style: {
        position: "absolute", left: 60, top: 230,
        boxShadow: "0 6px 16px rgba(0, 0, 0, 0.25)",
      },
    })),
    { width: 1200, height: 630 },
  );
  return Buffer.from(await response.arrayBuffer());
}
