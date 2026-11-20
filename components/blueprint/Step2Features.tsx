"use client";

import React from "react";
import { TrackId, TRACK_FEATURES, CYNBIT_TRACKS } from "@/lib/blueprint-constants";
import { ArrowLeft, ArrowRight, Check, AlertCircle } from "lucide-react";

interface Step2FeaturesProps {
  track: TrackId;
  selectedFeatures: string[];
  onToggleFeature: (feature: string) => void;
  onBack: () => void;
  onNext: () => void;
  error?: string;
}

export function Step2Features({
  track,
  selectedFeatures,
  onToggleFeature,
  onBack,
  onNext,
  error,
}: Step2FeaturesProps) {
  const currentTrackObj = CYNBIT_TRACKS.find((t) => t.id === track);
  const availableFeatures = TRACK_FEATURES[track] || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100">
            Step 2: Choose project goals &amp; capabilities
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Tailored for <span className="font-semibold text-cyan-400">{currentTrackObj?.label}</span>. Select all capabilities you require.
          </p>
        </div>
        <div className="text-xs font-mono px-3 py-1 rounded-full border border-slate-700 bg-slate-900 text-slate-300 w-fit">
          {selectedFeatures.length} selected
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-950/30 p-3 text-xs text-rose-300"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Feature chips list */}
      <div
        role="group"
        aria-label="Capabilities and feature options"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
      >
        {availableFeatures.map((feat) => {
          const isSelected = selectedFeatures.includes(feat);

          return (
            <button
              key={feat}
              type="button"
              role="checkbox"
              aria-checked={isSelected}
              onClick={() => onToggleFeature(feat)}
              className={`group flex items-start gap-3 rounded-lg border p-4 text-left transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
                isSelected
                  ? "border-cyan-500 bg-cyan-950/30 text-cyan-200 shadow-sm shadow-cyan-500/10"
                  : "border-slate-800 bg-slate-900/50 text-slate-300 hover:border-slate-700 hover:bg-slate-900"
              }`}
            >
              <div
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                  isSelected
                    ? "border-cyan-400 bg-cyan-500 text-slate-950"
                    : "border-slate-700 bg-slate-800/80 group-hover:border-slate-600"
                }`}
              >
                {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
              </div>
              <span className="text-sm font-medium leading-snug">{feat}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/60 px-5 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition focus:outline-none focus:ring-2 focus:ring-slate-500"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-500 px-6 py-2.5 text-sm font-semibold text-slate-950 transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-md shadow-cyan-500/20"
        >
          Next: Timeline &amp; Contact
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
