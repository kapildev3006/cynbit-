"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import {
  TrackId,
  isValidTrack,
  TRACK_FEATURES,
  TIMELINE_OPTIONS,
  BUDGET_OPTIONS,
} from "@/lib/blueprint-constants";
import {
  WizardFormData,
  BlueprintOutput,
  wizardFormSchema,
  ApiBlueprintResponse,
} from "@/lib/schemas/blueprint";
import { WizardProgress } from "./WizardProgress";
import { Step1Track } from "./Step1Track";
import { Step2Features } from "./Step2Features";
import { Step3Contact } from "./Step3Contact";
import { Step4Result } from "./Step4Result";
import { AlertCircle } from "lucide-react";

const STEP_LABELS = [
  "Select Track",
  "Pick Capabilities",
  "Timeline & Details",
  "Blueprint Result",
];

export function BlueprintWizard() {
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // Step state: 1..4
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [liveAnnouncement, setLiveAnnouncement] = useState<string>("");

  // Form data state
  const [formData, setFormData] = useState<WizardFormData>({
    track: "ai-automation",
    features: [],
    timeline: TIMELINE_OPTIONS[1],
    budget: BUDGET_OPTIONS[1],
    name: "",
    email: "",
    company: "",
    note: "",
    _hp_company_url: "",
  });

  // Validation errors
  const [errors, setErrors] = useState<Partial<Record<keyof WizardFormData, string>>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  // Submission & Result state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [blueprintResult, setBlueprintResult] = useState<{
    blueprint: BlueprintOutput;
    generatedBy: "llm" | "fallback" | "honeypot-mock";
    leadId?: string;
  } | null>(null);

  // Pre-select service track from ?service= query param if valid
  useEffect(() => {
    const serviceParam = searchParams.get("service");
    if (serviceParam && isValidTrack(serviceParam)) {
      setFormData((prev) => ({
        ...prev,
        track: serviceParam,
        // Reset features when track changes via URL
        features: [],
      }));
    }
  }, [searchParams]);

  // Accessible live announcements on step change
  const announce = (msg: string) => {
    setLiveAnnouncement(msg);
  };

  const handleSelectTrack = (track: TrackId) => {
    setFormData((prev) => ({
      ...prev,
      track,
      features: [], // reset features when switching tracks
    }));
  };

  const handleToggleFeature = (feature: string) => {
    setFormData((prev) => {
      const exists = prev.features.includes(feature);
      const updated = exists
        ? prev.features.filter((f) => f !== feature)
        : [...prev.features, feature];

      if (updated.length > 0 && errors.features) {
        setErrors((errs) => ({ ...errs, features: undefined }));
      }
      return { ...prev, features: updated };
    });
  };

  const handleChangeField = <K extends keyof WizardFormData>(
    field: K,
    value: WizardFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((errs) => ({ ...errs, [field]: undefined }));
    }
  };

  // Step navigation
  const goToNextStep = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
      announce("Navigated to Step 2: Choose project goals and capabilities.");
    } else if (currentStep === 2) {
      if (formData.features.length === 0) {
        setErrors((errs) => ({
          ...errs,
          features: "Please select at least one capability chip before proceeding.",
        }));
        announce("Error: Please select at least one capability chip.");
        return;
      }
      setErrors((errs) => ({ ...errs, features: undefined }));
      setCurrentStep(3);
      announce("Navigated to Step 3: Timeline, budget and contact details.");
    }
  };

  const goToPrevStep = () => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      announce(`Navigated back to Step ${prevStep}: ${STEP_LABELS[prevStep - 1]}`);
    }
  };

  // Form Submission
  const handleSubmit = async () => {
    setApiError(null);

    // Validate entire form with Zod
    const validationResult = wizardFormSchema.safeParse(formData);
    if (!validationResult.success) {
      const fieldErrors: Partial<Record<keyof WizardFormData, string>> = {};
      for (const issue of validationResult.error.issues) {
        const key = issue.path[0] as keyof WizardFormData;
        if (key && !fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      }
      setErrors(fieldErrors);
      announce("Please correct the validation errors in the form.");
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    announce("Generating your project blueprint. Please wait...");

    try {
      const res = await fetch("/api/blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${res.status}`);
      }

      const data: ApiBlueprintResponse = await res.json();
      startTransition(() => {
        setBlueprintResult({
          blueprint: data.blueprint,
          generatedBy: data.generatedBy,
          leadId: data.leadId,
        });
        setCurrentStep(4);
        announce("Blueprint generated successfully. Displaying architectural overview.");
      });
    } catch (err) {
      console.error("Blueprint generation error:", err);
      setApiError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while generating the blueprint. Please try again."
      );
      announce("Error generating blueprint. Please review and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      track: "ai-automation",
      features: [],
      timeline: TIMELINE_OPTIONS[1],
      budget: BUDGET_OPTIONS[1],
      name: "",
      email: "",
      company: "",
      note: "",
      _hp_company_url: "",
    });
    setBlueprintResult(null);
    setErrors({});
    setApiError(null);
    setCurrentStep(1);
    announce("Wizard reset. Starting at Step 1.");
  };

  return (
    <div className="w-full">
      {/* Live region for accessibility screen readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {liveAnnouncement}
      </div>

      <WizardProgress
        currentStep={currentStep}
        totalSteps={4}
        stepLabels={STEP_LABELS}
      />

      {apiError && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-950/30 p-4 text-xs sm:text-sm text-rose-300 backdrop-blur-sm"
        >
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-rose-200">Unable to generate blueprint</p>
            <p className="mt-1 text-rose-300">{apiError}</p>
          </div>
        </div>
      )}

      {/* Step Panels */}
      {currentStep === 1 && (
        <Step1Track
          selectedTrack={formData.track}
          onSelectTrack={handleSelectTrack}
          onNext={goToNextStep}
        />
      )}

      {currentStep === 2 && (
        <Step2Features
          track={formData.track}
          selectedFeatures={formData.features}
          onToggleFeature={handleToggleFeature}
          onBack={goToPrevStep}
          onNext={goToNextStep}
          error={errors.features}
        />
      )}

      {currentStep === 3 && (
        <Step3Contact
          formData={formData}
          onChangeField={handleChangeField}
          onBack={goToPrevStep}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          errors={errors}
        />
      )}

      {currentStep === 4 && blueprintResult && (
        <Step4Result
          blueprint={blueprintResult.blueprint}
          formData={formData}
          generatedBy={blueprintResult.generatedBy}
          leadId={blueprintResult.leadId}
          onReset={handleReset}
        />
      )}
    </div>
  );
}
