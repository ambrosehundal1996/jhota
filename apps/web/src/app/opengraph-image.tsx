import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "JOTA. Hit your protein goals. Without the hassle.";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#103B2D",
          color: "#F7F8F3",
          padding: "72px",
        }}
      >
        <div style={{ fontSize: 28, letterSpacing: 6, fontWeight: 700 }}>JOTA</div>
        <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 0.92, letterSpacing: -2, maxWidth: 900 }}>
          HIT YOUR PROTEIN GOALS. WITHOUT THE HASSLE.
        </div>
        <div style={{ fontSize: 28, color: "#B7EC92" }}>Protein tracking for iPhone</div>
      </div>
    ),
    size,
  );
}
