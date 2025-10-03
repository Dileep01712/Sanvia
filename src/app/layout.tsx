import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Sanvia - Personal Music Companion",
  description: "Sanvia is your personal music companion — stream, search, and vibe to your favorite songs.",
  icons: {
    icon: "/images/icon.png",
  },
  openGraph: {
    title: "Sanvia - Personal Music Companion",
    description: "Stream, search, and vibe to your favorite songs.",
    url: "https://sanvia.onrender.com/",
    siteName: "Sanvia",
    images: [
      {
        url: "/images/icon.png",
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
    images: ["/images/icon.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
