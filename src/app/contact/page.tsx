import type { Metadata } from "next";
import { Suspense } from "react";
import InquiryWizard from "@/components/contact/InquiryWizard";

export const metadata: Metadata = {
  title: "Client Inquiry & Technical Intake",
  description:
    "Structured project discovery form for Cynbit Technologies. Outline your software architecture requirements, timeline, and scope.",
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactPage() {
  return (
    <div className="py-8 md:py-16">
      <Suspense
        fallback={
          <div className="max-w-4xl mx-auto px-4 py-20 text-center font-mono text-xs text-slate-400">
            Initializing intake wizard...
          </div>
        }
      >
        <InquiryWizard />
      </Suspense>
    </div>
  );
}
