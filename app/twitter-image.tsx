import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "TableStakes — Negotiation Simulator";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a0c",
          padding: "80px",
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: "#d4a843",
            fontFamily: "Georgia, serif",
            fontStyle: "italic",
            marginBottom: 24,
          }}
        >
          TableStakes
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#9a9aaa",
            fontFamily: "system-ui, sans-serif",
            textAlign: "center",
            maxWidth: 700,
            lineHeight: 1.4,
          }}
        >
          Practice tough conversations before they happen
        </div>
      </div>
    ),
    { ...size }
  );
}
