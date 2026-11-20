import type { Metadata } from "next";
import { Suspense } from "react";
import { BlueprintWizard } from "@/components/blueprint/BlueprintWizard";
import { Sparkles, Terminal } from "lucide-react";

export const metadata: Metadata = {
  title: "AI Project Blueprint | Contact & Discovery",
  description:
    "Design and generate an instant technical architecture blueprint for your AI automation, cloud software, or marketing project with Cynbit Technologies.",
  openGraph: {
    url: "https://cynbit.in/contact",
    title: "AI Project Blueprint | Contact & Discovery",
    description:
      "Instant tailored architecture, tech stack, roadmap phases, and delivery estimates.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Cynbit AI Project Blueprint Wizard",
      },
    ],
  },
};

export default function ContactPage() {
  return (
    <div className="relative min-h-[calc(100vh-140px)] py-12 sm:py-16">
      {/* Background ambient gradient */}
      <div className="pointer-events-none absolute inset-0 flex justify-center">
        <div className="h-[400px] w-[650px] rounded-full bg-gradient-to-tr from-cyan-600/10 to-teal-600/10 blur-[130px]" />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6">
        {/* Header Banner */}
        <div className="no-print mb-8 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-xs font-mono text-cyan-400 backdrop-blur-sm mb-3">
            <Terminal className="h-3.5 w-3.5" />
            <span>cynbit.in/contact &bull; Guided Discovery Wizard</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 sm:text-4xl">
            AI Project Blueprint
          </h1>
          <p className="mt-2 text-sm text-slate-400 max-w-2xl leading-relaxed">
            Specify your technical requirements below to instantly generate a tailored architectural overview, vetted technology stack, phased timeline, and estimated resource plan.
          </p>
        </div>

        {/* Wizard Container */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-6 sm:p-8 backdrop-blur-md shadow-2xl shadow-cyan-950/10">
          <Suspense
            fallback={
              <div className="py-20 text-center text-sm text-slate-400 flex flex-col items-center justify-center gap-3">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
                <span>Initializing Blueprint Wizard...</span>
              </div>
            }
          >
            <BlueprintWizard />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
