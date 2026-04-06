import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TableStakes — Practice Negotiations Against AI",
  description:
    "Practice tough conversations before they happen. Negotiate against AI opponents with different strategies, get scored, and improve your skills.",
  metadataBase: new URL("https://tablestakes-sage.vercel.app"),
  openGraph: {
    title: "TableStakes — Practice Negotiations Against AI",
    description:
      "Practice tough conversations before they happen. Negotiate against AI opponents with different strategies, get scored, and improve your skills.",
    url: "https://tablestakes-sage.vercel.app",
    siteName: "TableStakes",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "TableStakes — Practice Negotiations Against AI",
    description:
      "Practice tough conversations before they happen. Negotiate against AI opponents with different strategies, get scored, and improve your skills.",
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
