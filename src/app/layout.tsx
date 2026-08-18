import type { Metadata, Viewport } from "next";
import { GeistSans } from 'geist/font/sans';
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Sanvia - Personal Music Companion",
    template: "%s | Sanvia",
  },

  description: "Sanvia is your personal music companion — stream, search, and vibe to your favorite songs.",

  icons: {
    icon: "/icons/icon.webp",
  },

  openGraph: {
    title: "Sanvia - Personal Music Companion",
    description: "Stream, search, and vibe to your favorite songs.",
    url: "https://sanvia-wimo.onrender.com/",
    siteName: "Sanvia",
    images: [
      {
        url: "/icons/icon.webp",
        width: 1200,
        height: 630,
        alt: "Sanvia App Preview",
      },
    ],
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Sanvia - Personal Music Companion",
    description: "Stream, search, and vibe to your favorite songs.",
    images: ["/icons/icon.webp"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <head>
        <meta name="color-scheme" content="dark" />
      </head>

      <body className="antialiased bg-zinc-950 text-white">
        {children}
      </body>
    </html>
  );
}