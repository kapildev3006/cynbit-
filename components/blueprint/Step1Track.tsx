"use client";

import React from "react";
import { CYNBIT_TRACKS, TrackId } from "@/lib/blueprint-constants";
import { Cpu, Layers, ShieldCheck, ArrowRight } from "lucide-react";

interface Step1TrackProps {
  selectedTrack: TrackId;
  onSelectTrack: (track: TrackId) => void;
  onNext: () => void;
}

export function Step1Track({
  selectedTrack,
  onSelectTrack,
  onNext,
}: Step1TrackProps) {
  const getIcon = (id: TrackId) => {
    switch (id) {
      case "ai-automation":
        return <Cpu className="h-6 w-6" />;
      case "software-cloud":
        return <Layers className="h-6 w-6" />;
      case "marketing-seo":
        return <ShieldCheck className="h-6 w-6" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-100">
          Step 1: Select your project track
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Choose the engineering discipline that best aligns with your project&apos;s goals.
        </p>
      </div>

      <div
        role="radiogroup"
        aria-label="Service tracks"
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        {CYNBIT_TRACKS.map((track) => {
          const isSelected = selectedTrack === track.id;

          return (
            <div
              key={track.id}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
              onClick={() => onSelectTrack(track.id)}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") {
                  e.preventDefault();
                  onSelectTrack(track.id);
                }
              }}
              className={`group relative flex flex-col justify-between rounded-xl border p-5 text-left cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
                isSelected
                  ? "border-cyan-500 bg-cyan-950/20 shadow-lg shadow-cyan-500/10"
                  : "border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/80"
              }`}
            >
              <div>
                <div
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105 ${
                    isSelected
                      ? "bg-cyan-500/20 text-cyan-300"
                      : "bg-slate-800/80 text-slate-400 group-hover:text-slate-200"
                  }`}
                >
                  {getIcon(track.id)}
                </div>

                <h3
                  className={`mt-4 text-base font-semibold ${
                    isSelected ? "text-cyan-300" : "text-slate-200"
                  }`}
                >
                  {track.label}
                </h3>

                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  {track.shortDescription}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-800/60 text-xs">
                <span
                  className={`font-mono font-medium ${
                    isSelected ? "text-cyan-400" : "text-slate-500"
                  }`}
                >
                  {isSelected ? "Active Track" : "Click to select"}
                </span>
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    isSelected ? "bg-cyan-400 ring-4 ring-cyan-400/20" : "bg-slate-700"
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-500 px-6 py-2.5 text-sm font-semibold text-slate-950 transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-md shadow-cyan-500/20"
        >
          Next: Pick Goals &amp; Features
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
