"use client";

import React from "react";
import {
  TIMELINE_OPTIONS,
  BUDGET_OPTIONS,
} from "@/lib/blueprint-constants";
import { WizardFormData } from "@/lib/schemas/blueprint";
import { ArrowLeft, Sparkles, Loader2, AlertCircle } from "lucide-react";

interface Step3ContactProps {
  formData: WizardFormData;
  onChangeField: <K extends keyof WizardFormData>(
    field: K,
    value: WizardFormData[K]
  ) => void;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  errors: Partial<Record<keyof WizardFormData, string>>;
}

export function Step3Contact({
  formData,
  onChangeField,
  onBack,
  onSubmit,
  isSubmitting,
  errors,
}: Step3ContactProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-100">
          Step 3: Timeline, budget &amp; contact details
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Help us calibrate the engineering scope, phased delivery, and team allocation.
        </p>
      </div>

      {/* Timeline Selection */}
      <div className="space-y-2">
        <label
          htmlFor="timeline-select"
          className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
        >
          Target Timeline <span className="text-cyan-400">*</span>
        </label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {TIMELINE_OPTIONS.map((t) => {
            const isSelected = formData.timeline === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => onChangeField("timeline", t)}
                className={`rounded-lg border px-3 py-2.5 text-left text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
                  isSelected
                    ? "border-cyan-500 bg-cyan-950/40 text-cyan-200"
                    : "border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700"
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>
        {errors.timeline && (
          <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
            <AlertCircle className="h-3 w-3" /> {errors.timeline}
          </p>
        )}
      </div>

      {/* Budget Range Selection */}
      <div className="space-y-2 pt-2">
        <label
          htmlFor="budget-select"
          className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
        >
          Estimated Budget Range <span className="text-cyan-400">*</span>
        </label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {BUDGET_OPTIONS.map((b) => {
            const isSelected = formData.budget === b;
            return (
              <button
                key={b}
                type="button"
                onClick={() => onChangeField("budget", b)}
                className={`rounded-lg border px-3 py-2.5 text-left text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
                  isSelected
                    ? "border-emerald-500 bg-emerald-950/40 text-emerald-200"
                    : "border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700"
                }`}
              >
                {b}
              </button>
            );
          })}
        </div>
        {errors.budget && (
          <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
            <AlertCircle className="h-3 w-3" /> {errors.budget}
          </p>
        )}
      </div>

      {/* Contact Fields */}
      <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
        <div className="space-y-1">
          <label
            htmlFor="full-name"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
          >
            Your Name <span className="text-cyan-400">*</span>
          </label>
          <input
            id="full-name"
            type="text"
            required
            autoComplete="name"
            value={formData.name}
            onChange={(e) => onChangeField("name", e.target.value)}
            placeholder="e.g. Kapil Dev"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "name-error" : undefined}
            className={`w-full rounded-lg border bg-slate-900/80 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
              errors.name ? "border-rose-500" : "border-slate-800"
            }`}
          />
          {errors.name && (
            <p id="name-error" className="text-xs text-rose-400 flex items-center gap-1 mt-1">
              <AlertCircle className="h-3 w-3" /> {errors.name}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label
            htmlFor="email-address"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
          >
            Work Email <span className="text-cyan-400">*</span>
          </label>
          <input
            id="email-address"
            type="email"
            required
            autoComplete="email"
            value={formData.email}
            onChange={(e) => onChangeField("email", e.target.value)}
            placeholder="e.g. dev@company.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            className={`w-full rounded-lg border bg-slate-900/80 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
              errors.email ? "border-rose-500" : "border-slate-800"
            }`}
          />
          {errors.email && (
            <p id="email-error" className="text-xs text-rose-400 flex items-center gap-1 mt-1">
              <AlertCircle className="h-3 w-3" /> {errors.email}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <label
          htmlFor="company-name"
          className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
        >
          Company / Organization <span className="text-slate-500 font-normal">(Optional)</span>
        </label>
        <input
          id="company-name"
          type="text"
          autoComplete="organization"
          value={formData.company || ""}
          onChange={(e) => onChangeField("company", e.target.value)}
          placeholder="e.g. Cynbit Technologies"
          className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
        />
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label
            htmlFor="project-note"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
          >
            Specific Requirements / Notes <span className="text-slate-500 font-normal">(Optional)</span>
          </label>
          <span className="text-[11px] font-mono text-slate-500">
            {(formData.note || "").length}/1000
          </span>
        </div>
        <textarea
          id="project-note"
          rows={3}
          value={formData.note || ""}
          onChange={(e) => onChangeField("note", e.target.value)}
          placeholder="Describe your current bottleneck, existing architecture, or specific tools already in place..."
          className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
        />
      </div>

      {/* Honeypot field (hidden from genuine users and screen readers) */}
      <div aria-hidden="true" className="sr-only pointer-events-none absolute -left-[9999px]">
        <label htmlFor="_hp_company_url">Do not fill this field</label>
        <input
          id="_hp_company_url"
          name="_hp_company_url"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={formData._hp_company_url || ""}
          onChange={(e) => onChangeField("_hp_company_url", e.target.value)}
        />
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/60 px-5 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition focus:outline-none focus:ring-2 focus:ring-slate-500 disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 px-6 py-2.5 text-sm font-semibold text-slate-950 transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-md shadow-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
              <span>Generating Blueprint...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 text-slate-950" />
              <span>Generate Project Blueprint</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
