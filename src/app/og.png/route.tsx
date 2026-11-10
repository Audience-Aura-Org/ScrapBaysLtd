import { ImageResponse } from "next/og";
import fs from "node:fs/promises";
import path from "node:path";

// Branded default social card at /og.png (used by every page without its own image).
export const dynamic = "force-static";

export async function GET() {
  const logo = await fs.readFile(path.join(process.cwd(), "public/icons/logo-512.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#111827", padding: 72, color: "white", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ display: "flex", background: "white", borderRadius: 16, padding: 8 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoSrc} width={96} height={96} alt="" />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 56, fontWeight: 700, letterSpacing: -1 }}>Scrap Bays Limited</div>
            <div style={{ fontSize: 24, color: "#8cc8a2", letterSpacing: 4, textTransform: "uppercase" }}>B2B scrap materials trader</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 60, fontWeight: 700, lineHeight: 1.1, maxWidth: 980 }}>Scrap metal, ingots, e-scrap, plastics &amp; timber — supplied worldwide</div>
          <div style={{ display: "flex", gap: 16, fontSize: 26, color: "#d9ddd5" }}>
            <span style={{ background: "#f8c537", color: "#111827", padding: "8px 18px", borderRadius: 8, fontWeight: 700 }}>Request a quote</span>
            <span style={{ padding: "8px 0" }}>scrapbaysltd.com</span>
          </div>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 14, background: "linear-gradient(90deg,#2a7a4b,#f8c537)" }} />
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
