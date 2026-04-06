import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TableStakes — Negotiation Simulator",
  description:
    "Practice tough negotiations against an AI with a hidden strategy. 6 moves. Full debrief. No fluff.",
  metadataBase: new URL("https://tablestakes-sage.vercel.app"),
  openGraph: {
    title: "TableStakes — Negotiation Simulator",
    description:
      "Practice tough negotiations against an AI with a hidden strategy. 6 moves. Full debrief.",
    url: "https://tablestakes-sage.vercel.app",
    siteName: "TableStakes",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "TableStakes — Negotiation Simulator",
    description:
      "Practice tough negotiations against an AI with a hidden strategy.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
