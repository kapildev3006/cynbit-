import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cynbit.in";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "AI Project Blueprint | Cynbit Technologies",
    template: "%s | Cynbit Technologies",
  },
  description:
    "Generate an instant structured technical blueprint for your AI automation, cloud software, or growth project.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Cynbit Technologies",
    title: "AI Project Blueprint | Cynbit Technologies",
    description:
      "Instant tailored architecture, tech stack, roadmap phases, and delivery estimates for your engineering projects.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Cynbit AI Project Blueprint Generator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Project Blueprint | Cynbit Technologies",
    description:
      "Instant tailored architecture, tech stack, roadmap phases, and delivery estimates.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#090d16] text-slate-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        <header className="no-print sticky top-0 z-50 border-b border-slate-800/80 bg-[#090d16]/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-emerald-500 p-[1px] transition-transform group-hover:scale-105">
                <div className="flex h-full w-full items-center justify-center rounded-[7px] bg-[#090d16] font-mono text-sm font-bold text-cyan-400">
                  CB
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold tracking-wide text-slate-200">
                  Cynbit Technologies
                </span>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">
                  Jaipur Engineering Studio
                </span>
              </div>
            </Link>

            <nav className="flex items-center gap-4 text-sm font-medium">
              <Link
                href="/"
                className="text-slate-400 hover:text-slate-100 transition-colors"
              >
                Overview
              </Link>
              <Link
                href="/contact"
                className="rounded-md bg-gradient-to-r from-cyan-500 to-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 transition hover:opacity-90 shadow-sm shadow-cyan-500/20"
              >
                Launch Blueprint
              </Link>
            </nav>
          </div>
        </header>

        <main>{children}</main>

        <footer className="no-print mt-20 border-t border-slate-800/80 bg-[#070a12] py-8 text-xs text-slate-500">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
            <p>
              &copy; {new Date().getFullYear()} Cynbit Technologies. Prototype evaluation module.
            </p>
            <p className="font-mono text-slate-400">
              Tech Stack: Next.js &bull; TypeScript &bull; MongoDB &bull; Tailwind CSS
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
