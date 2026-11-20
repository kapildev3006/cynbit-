import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://cynbit-system.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Cynbit Technologies | AI Automation & Enterprise Software",
    template: "%s | Cynbit Technologies",
  },
  description:
    "Engineering high-performance autonomous agents, modern full-stack web applications, and conversion-driven digital systems.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Cynbit Technologies",
    title: "Cynbit Technologies | AI Automation & Enterprise Software",
    description:
      "Engineering high-performance autonomous agents, modern full-stack web applications, and conversion-driven digital systems.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Cynbit Technologies Engineering Overview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cynbit Technologies | AI Automation & Enterprise Software",
    description:
      "Engineering high-performance autonomous agents, modern full-stack web applications, and conversion-driven digital systems.",
    images: ["/og-image.png"],
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
    <html lang="en" className="dark">
      <body className="bg-background text-slate-100 min-h-screen flex flex-col antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        <Navbar />
        <main className="flex-1 flex flex-col">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
