import { ImageResponse } from "next/og";
import fs from "node:fs/promises";
import path from "node:path";

// Branded default social card at /og.png (used by every page without its own image).
export const dynamic = "force-static";

// Satori can't use next/font, so the card bundles Poppins TTFs (fonts/, SIL OFL), the site's typeface.
const dir = path.join(process.cwd(), "src/app/og.png/fonts");
const HEADING = "Poppins";
const BODY = "Poppins";

export async function GET() {
  const [logo, poppins400, poppins600, poppins700] = await Promise.all([
    fs.readFile(path.join(process.cwd(), "public/icons/logo-512.png")),
    fs.readFile(path.join(dir, "Poppins-Regular.ttf")),
    fs.readFile(path.join(dir, "Poppins-SemiBold.ttf")),
    fs.readFile(path.join(dir, "Poppins-Bold.ttf")),
  ]);
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#111827", padding: 72, color: "white", fontFamily: BODY }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ display: "flex", background: "white", borderRadius: 16, padding: 8 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoSrc} width={96} height={96} alt="" />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontFamily: HEADING, fontSize: 52, fontWeight: 700, letterSpacing: -1 }}>Scrap Bays Limited</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: "#8cc8a2", letterSpacing: 3, textTransform: "uppercase" }}>B2B scrap materials trader</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ fontFamily: HEADING, fontSize: 58, fontWeight: 700, lineHeight: 1.12, letterSpacing: -1, maxWidth: 1000 }}>Scrap metal, ingots, e-scrap, plastics &amp; timber — supplied worldwide</div>
          <div style={{ display: "flex", gap: 16, fontSize: 24, color: "#d9ddd5" }}>
            <span style={{ background: "#f8c537", color: "#111827", padding: "8px 18px", borderRadius: 8, fontWeight: 600 }}>Request a quote</span>
            <span style={{ padding: "8px 0" }}>scrapbaysltd.com</span>
          </div>
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 14, background: "linear-gradient(90deg,#2a7a4b,#f8c537)" }} />
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: BODY, data: poppins400, weight: 400, style: "normal" },
        { name: BODY, data: poppins600, weight: 600, style: "normal" },
        { name: HEADING, data: poppins700, weight: 700, style: "normal" },
      ],
    },
  );
}
