import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Lead Console | Cynbit Technologies",
  description: "Internal inquiry management and operational lead workflows.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-background text-slate-100">{children}</div>;
}
