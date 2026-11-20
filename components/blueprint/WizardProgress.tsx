"use client";

import React from "react";
import { Check } from "lucide-react";

interface WizardProgressProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}

export function WizardProgress({
  currentStep,
  totalSteps,
  stepLabels,
}: WizardProgressProps) {
  const progressPercentage = Math.round(((currentStep - 1) / (totalSteps - 1)) * 100);

  return (
    <div className="w-full no-print mb-8">
      {/* Accessible live progress announcement */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Step {currentStep} of {totalSteps}: {stepLabels[currentStep - 1]}
      </div>

      {/* Progress percentage bar */}
      <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 transition-all duration-300 ease-out"
          style={{ width: `${progressPercentage}%` }}
          role="progressbar"
          aria-valuenow={progressPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      {/* Step Numbers & Labels */}
      <ol className="flex items-center justify-between text-xs sm:text-sm font-medium">
        {stepLabels.map((label, idx) => {
          const stepNum = idx + 1;
          const isCompleted = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;

          return (
            <li
              key={label}
              className={`flex items-center gap-2 ${
                isCurrent
                  ? "text-cyan-400 font-semibold"
                  : isCompleted
                  ? "text-emerald-400"
                  : "text-slate-500"
              }`}
            >
              <span
                className={`flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full text-xs font-mono font-bold transition-all ${
                  isCurrent
                    ? "border-2 border-cyan-400 bg-cyan-950/80 text-cyan-300 shadow-sm shadow-cyan-400/40"
                    : isCompleted
                    ? "bg-emerald-500 text-slate-950"
                    : "border border-slate-700 bg-slate-900 text-slate-500"
                }`}
                aria-hidden="true"
              >
                {isCompleted ? <Check className="h-3.5 w-3.5" /> : stepNum}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
