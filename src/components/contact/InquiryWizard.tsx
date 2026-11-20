"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Send,
  AlertCircle,
  Copy,
  Check,
  Building,
  Mail,
  Phone,
  HelpCircle,
  Clock,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

interface FormQuestion {
  id: string;
  key: string;
  label: string;
  step: 2 | 3;
  helpText?: string;
  placeholder?: string;
  type: string;
  required: boolean;
  order: number;
  serviceSlugs: string[];
  options?: { label: string; value: string }[];
  validation?: { min?: number; max?: number; maxLength?: number };
  visibleIf?: { questionId: string; equals: any };
}

const SERVICE_OPTIONS = [
  { slug: "autonomous-agents", label: "Autonomous Agents", category: "AI Automation" },
  { slug: "llm-automation", label: "LLM Automation", category: "AI Automation" },
  { slug: "ai-voice-agents", label: "AI Voice Agents", category: "AI Automation" },
  { slug: "ai-stack-integration", label: "AI Stack Integration", category: "AI Automation" },
  { slug: "fullstack-development", label: "Full-Stack Web Development", category: "Custom IT" },
  { slug: "backend-systems", label: "Backend Systems & APIs", category: "Custom IT" },
  { slug: "cloud-infrastructure", label: "Cloud Infrastructure & DevOps", category: "Custom IT" },
  { slug: "legacy-migration", label: "Legacy Modernization", category: "Custom IT" },
  { slug: "performance-ads", label: "Performance Advertising", category: "Digital Marketing" },
  { slug: "technical-seo", label: "Technical SEO & Speed", category: "Digital Marketing" },
  { slug: "crm-automation", label: "CRM & Funnel Automation", category: "Digital Marketing" },
  { slug: "funnel-optimization", label: "Conversion Optimization", category: "Digital Marketing" },
];

export default function InquiryWizard() {
  const searchParams = useSearchParams();

  // Step indicator: 1 = Service, 2 = Requirements, 3 = Planning, 4 = Contact, 5 = Review, 6 = Success
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loadingForm, setLoadingForm] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>("");
  const [copiedRef, setCopiedRef] = useState<boolean>(false);
  const [confirmedReferenceId, setConfirmedReferenceId] = useState<string>("");

  // Idempotency key generated once on mount
  const [idempotencyKey, setIdempotencyKey] = useState<string>("");

  // Form version tracking (for 409 conflict detection)
  const [formVersionId, setFormVersionId] = useState<string>("");

  // Dynamic questions fetched from active published FormVersion
  const [questions, setQuestions] = useState<FormQuestion[]>([]);

  // Form State
  const [serviceSlug, setServiceSlug] = useState<string>("fullstack-development");
  const [projectType, setProjectType] = useState<string>("");
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [contact, setContact] = useState({
    name: "",
    company: "",
    email: "",
    whatsapp: "+91 ",
    country: "IN",
    preferredContact: "WHATSAPP",
    preferredTime: "11:00 AM - 5:00 PM IST",
    message: "",
  });
  const [consentAccepted, setConsentAccepted] = useState<boolean>(false);
  const [honeypot, setHoneypot] = useState<string>(""); // Spam trap field
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});

  // Initialize idempotency key and read service from query param
  useEffect(() => {
    setIdempotencyKey(crypto.randomUUID());

    const urlService = searchParams.get("service");
    if (urlService && SERVICE_OPTIONS.some((s) => s.slug === urlService)) {
      setServiceSlug(urlService);
    }

    // Fetch active published form questions
    async function loadFormQuestions() {
      try {
        setLoadingForm(true);
        const res = await fetch("/api/forms/active");
        if (res.ok) {
          const data = await res.json();
          setFormVersionId(data.formVersionId || "");
          setQuestions(data.questions || []);
        } else {
          console.warn("Could not load dynamic questions from API, fallback to default state.");
        }
      } catch (err) {
        console.error("Error loading active questions:", err);
      } finally {
        setLoadingForm(false);
      }
    }

    loadFormQuestions();
  }, [searchParams]);

  // Evaluates question visibility
  function isVisible(q: FormQuestion): boolean {
    if (q.serviceSlugs && q.serviceSlugs.length > 0 && !q.serviceSlugs.includes("all")) {
      if (!q.serviceSlugs.includes(serviceSlug)) {
        return false;
      }
    }

    if (q.visibleIf && q.visibleIf.questionId) {
      const parentVal = answers[q.visibleIf.questionId];
      if (parentVal === undefined || parentVal === null) {
        return false;
      }
      if (Array.isArray(parentVal)) {
        return parentVal.includes(q.visibleIf.equals);
      }
      return String(parentVal) === String(q.visibleIf.equals);
    }

    return true;
  }

  // Handle Answer Changes
  function handleAnswerChange(qId: string, val: any) {
    setAnswers((prev) => ({ ...prev, [qId]: val }));
    if (stepErrors[qId]) {
      setStepErrors((prev) => {
        const copy = { ...prev };
        delete copy[qId];
        return copy;
      });
    }
  }

  // Validate Current Step before advancing
  function validateStep(step: number): boolean {
    const errors: Record<string, string> = {};

    if (step === 1) {
      if (!serviceSlug) {
        errors.serviceSlug = "Please select a service category to proceed.";
      }
    } else if (step === 2 || step === 3) {
      // Validate dynamic questions for the step
      const stepQuestions = questions.filter((q) => q.step === step && isVisible(q));
      for (const q of stepQuestions) {
        const val = answers[q.id];
        if (q.required) {
          if (val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0)) {
            errors[q.id] = `${q.label} is required.`;
          }
        }
        if (val && q.type === "url") {
          try {
            new URL(String(val));
          } catch {
            errors[q.id] = "Please enter a valid URL (e.g. https://example.com)";
          }
        }
      }
    } else if (step === 4) {
      if (!contact.name.trim() || contact.name.trim().length < 2) {
        errors.name = "Full name must be at least 2 characters.";
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contact.email.trim())) {
        errors.email = "Please provide a valid business email address.";
      }
      const cleanPhone = contact.whatsapp.replace(/\D/g, "");
      if (cleanPhone.length < 10) {
        errors.whatsapp = "Please provide a valid WhatsApp number (at least 10 digits).";
      }
      if (!consentAccepted) {
        errors.consent = "You must accept the privacy policy to submit your project requirements.";
      }
    }

    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleNext() {
    if (validateStep(currentStep)) {
      window.scrollTo({ top: 120, behavior: "smooth" });
      setCurrentStep((prev) => Math.min(prev + 1, 5));
    }
  }

  function handleBack() {
    setStepErrors({});
    window.scrollTo({ top: 120, behavior: "smooth" });
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }

  // Final Submission
  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError("");

    try {
      // Clean answers: remove any answers for questions that are not visible
      const sanitizedAnswers: Record<string, any> = {};
      for (const q of questions) {
        if (isVisible(q) && answers[q.id] !== undefined) {
          sanitizedAnswers[q.id] = answers[q.id];
        }
      }

      const payload = {
        formVersionId: formVersionId || undefined,
        serviceSlug,
        projectType: projectType || undefined,
        idempotencyKey,
        honeypot, // Spam trap
        contact: {
          name: contact.name.trim(),
          company: contact.company.trim() || undefined,
          email: contact.email.trim(),
          whatsapp: contact.whatsapp.trim(),
          country: contact.country,
          preferredContact: contact.preferredContact,
          preferredTime: contact.preferredTime || undefined,
          message: contact.message.trim() || undefined,
        },
        consent: {
          accepted: consentAccepted,
        },
        answers: sanitizedAnswers,
      };

      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.status === 409 && data.staleForm && data.latestForm) {
        setFormVersionId(data.latestForm.formVersionId || "");
        setQuestions(data.latestForm.questions || []);
        const validIds = new Set((data.latestForm.questions || []).map((q: any) => q.id));
        setAnswers((prev) => {
          const kept: Record<string, any> = {};
          for (const [k, v] of Object.entries(prev)) {
            if (validIds.has(k)) kept[k] = v;
          }
          return kept;
        });
        setSubmitError(
          "The inquiry form was updated by our engineering team with new questions. Your existing answers have been preserved. Please review the updated questions and submit."
        );
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit inquiry. Please try again.");
      }

      setConfirmedReferenceId(data.referenceId);
      setCurrentStep(6); // Success screen
      window.scrollTo({ top: 100, behavior: "smooth" });
    } catch (err: any) {
      setSubmitError(err.message || "An unexpected error occurred. Please contact us directly.");
    } finally {
      setSubmitting(false);
    }
  }

  const stepTitles = [
    "Select Service",
    "Requirements",
    "Planning & Budget",
    "Contact Details",
    "Review & Submit",
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Honeypot Spam Trap (Visually Hidden from sighted humans) */}
      <div style={{ display: "none" }} aria-hidden="true">
        <label htmlFor="website_hp">Leave this empty</label>
        <input
          id="website_hp"
          type="text"
          name="website_hp"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {currentStep <= 5 && (
        <div className="mb-10">
          {/* Progress Tracker */}
          <div className="flex items-center justify-between mb-4">
            {stepTitles.map((title, idx) => {
              const stepNum = idx + 1;
              const isPast = currentStep > stepNum;
              const isCurrent = currentStep === stepNum;
              return (
                <div key={title} className="flex-1 text-center">
                  <div className="flex items-center justify-center">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all ${
                        isPast
                          ? "bg-primary text-background"
                          : isCurrent
                          ? "bg-cyan-500/20 text-cyan-400 border border-cyan-400"
                          : "bg-surface-elevated text-slate-500 border border-surface-border"
                      }`}
                    >
                      {isPast ? <Check className="w-4 h-4" /> : stepNum}
                    </div>
                  </div>
                  <span
                    className={`text-[11px] font-mono mt-2 hidden sm:block ${
                      isCurrent ? "text-cyan-400 font-bold" : "text-slate-400"
                    }`}
                  >
                    {title}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="w-full bg-surface-card h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-300"
              style={{ width: `${((currentStep - 1) / 4) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Form Container */}
      <div className="bg-surface-card rounded-2xl border border-surface-border p-6 sm:p-10 shadow-xl">
        {/* STEP 1: SERVICE SELECTION */}
        {currentStep === 1 && (
          <div className="space-y-6" role="region" aria-label="Step 1: Service Selection">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-primary mb-1">
                Step 1 of 4
              </p>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                What solution are you looking to architect?
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                Select your engineering domain so we can tailor the technical questions accordingly.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
              {SERVICE_OPTIONS.map((srv) => {
                const selected = serviceSlug === srv.slug;
                return (
                  <button
                    key={srv.slug}
                    type="button"
                    onClick={() => setServiceSlug(srv.slug)}
                    className={`text-left p-4 rounded-xl border transition-all ${
                      selected
                        ? "bg-cyan-500/10 border-primary text-white shadow-sm ring-1 ring-primary/40"
                        : "bg-surface-elevated/70 border-surface-border text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1">
                      {srv.category}
                    </span>
                    <span className="text-sm font-semibold block">{srv.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-4 border-t border-surface-border">
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2">
                Project or Product Working Title (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Next-Gen Warehouse Dispatch Automation"
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                className="w-full bg-surface-elevated border border-surface-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>
        )}

        {/* STEP 2: TECHNICAL REQUIREMENTS (Dynamic from FormVersion) */}
        {currentStep === 2 && (
          <div className="space-y-6" role="region" aria-label="Step 2: Technical Requirements">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-primary mb-1">
                Step 2 of 4
              </p>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Technical Scope & Requirements
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                Tailored for:{" "}
                <span className="text-cyan-400 font-mono font-medium">
                  {SERVICE_OPTIONS.find((s) => s.slug === serviceSlug)?.label}
                </span>
              </p>
            </div>

            {loadingForm ? (
              <div className="py-12 text-center text-slate-400 font-mono text-xs">
                Loading active requirements schema...
              </div>
            ) : (
              <div className="space-y-6 pt-2">
                {questions
                  .filter((q) => q.step === 2 && isVisible(q))
                  .map((q) => (
                    <div key={q.id} className="space-y-2">
                      <label className="block text-xs font-mono uppercase tracking-wider text-slate-300">
                        {q.label} {q.required && <span className="text-cyan-400">*</span>}
                      </label>
                      {q.helpText && (
                        <p className="text-[11px] text-slate-400">{q.helpText}</p>
                      )}

                      {q.type === "textarea" && (
                        <textarea
                          rows={4}
                          placeholder={q.placeholder}
                          value={answers[q.id] || ""}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                          className="w-full bg-surface-elevated border border-surface-border rounded-xl p-4 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                        />
                      )}

                      {q.type === "text" && (
                        <input
                          type="text"
                          placeholder={q.placeholder}
                          value={answers[q.id] || ""}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                          className="w-full bg-surface-elevated border border-surface-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                        />
                      )}

                      {q.type === "url" && (
                        <input
                          type="url"
                          placeholder={q.placeholder || "https://"}
                          value={answers[q.id] || ""}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                          className="w-full bg-surface-elevated border border-surface-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                        />
                      )}

                      {q.type === "select" && (
                        <select
                          value={answers[q.id] || ""}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                          className="w-full bg-surface-elevated border border-surface-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                        >
                          <option value="">-- Please select an option --</option>
                          {q.options?.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      )}

                      {q.type === "radio" && (
                        <div className="space-y-2 pt-1">
                          {q.options?.map((opt) => (
                            <label
                              key={opt.value}
                              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                                answers[q.id] === opt.value
                                  ? "bg-cyan-500/10 border-primary text-white"
                                  : "bg-surface-elevated/50 border-surface-border text-slate-300 hover:border-slate-700"
                              }`}
                            >
                              <input
                                type="radio"
                                name={q.id}
                                value={opt.value}
                                checked={answers[q.id] === opt.value}
                                onChange={() => handleAnswerChange(q.id, opt.value)}
                                className="text-primary focus:ring-0"
                              />
                              <span className="text-xs font-medium">{opt.label}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {stepErrors[q.id] && (
                        <p className="text-xs text-rose-400 flex items-center gap-1 mt-1 font-mono">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {stepErrors[q.id]}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 3: PLANNING & TIMELINE (Dynamic from FormVersion) */}
        {currentStep === 3 && (
          <div className="space-y-6" role="region" aria-label="Step 3: Planning and Timeline">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-primary mb-1">
                Step 3 of 4
              </p>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Budget Scope & Project Timeline
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                Transparent parameters allow our engineers to recommend the most optimal technical roadmap.
              </p>
            </div>

            <div className="space-y-6 pt-2">
              {questions
                .filter((q) => q.step === 3 && isVisible(q))
                .map((q) => (
                  <div key={q.id} className="space-y-2">
                    <label className="block text-xs font-mono uppercase tracking-wider text-slate-300">
                      {q.label} {q.required && <span className="text-cyan-400">*</span>}
                    </label>
                    {q.helpText && <p className="text-[11px] text-slate-400">{q.helpText}</p>}

                    {q.type === "select" && (
                      <select
                        value={answers[q.id] || ""}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        className="w-full bg-surface-elevated border border-surface-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                      >
                        <option value="">-- Select option --</option>
                        {q.options?.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    )}

                    {q.type === "radio" && (
                      <div className="space-y-2 pt-1">
                        {q.options?.map((opt) => (
                          <label
                            key={opt.value}
                            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                              answers[q.id] === opt.value
                                ? "bg-cyan-500/10 border-primary text-white"
                                : "bg-surface-elevated/50 border-surface-border text-slate-300 hover:border-slate-700"
                            }`}
                          >
                            <input
                              type="radio"
                              name={q.id}
                              value={opt.value}
                              checked={answers[q.id] === opt.value}
                              onChange={() => handleAnswerChange(q.id, opt.value)}
                              className="text-primary focus:ring-0"
                            />
                            <span className="text-xs font-medium">{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {stepErrors[q.id] && (
                      <p className="text-xs text-rose-400 flex items-center gap-1 mt-1 font-mono">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {stepErrors[q.id]}
                      </p>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* STEP 4: CLIENT DETAILS (Fixed core fields) */}
        {currentStep === 4 && (
          <div className="space-y-6" role="region" aria-label="Step 4: Contact Details">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-primary mb-1">
                Step 4 of 4
              </p>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Client Contact Information
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                We respect your time. Direct communication via WhatsApp or business email with no spam.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                  Full Name <span className="text-cyan-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Vikram Sharma"
                  value={contact.name}
                  onChange={(e) => setContact({ ...contact, name: e.target.value })}
                  className="w-full bg-surface-elevated border border-surface-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                />
                {stepErrors.name && (
                  <p className="text-xs text-rose-400 font-mono mt-1">{stepErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                  Company / Organization (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Acme Tech Solutions"
                  value={contact.company}
                  onChange={(e) => setContact({ ...contact, company: e.target.value })}
                  className="w-full bg-surface-elevated border border-surface-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                  Business Email <span className="text-cyan-400">*</span>
                </label>
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={contact.email}
                  onChange={(e) => setContact({ ...contact, email: e.target.value })}
                  className="w-full bg-surface-elevated border border-surface-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                />
                {stepErrors.email && (
                  <p className="text-xs text-rose-400 font-mono mt-1">{stepErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                  WhatsApp / Phone Number <span className="text-cyan-400">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={contact.whatsapp}
                  onChange={(e) => setContact({ ...contact, whatsapp: e.target.value })}
                  className="w-full bg-surface-elevated border border-surface-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors font-mono"
                />
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                  Default format: +91 [10 digits] for India, or include country prefix.
                </p>
                {stepErrors.whatsapp && (
                  <p className="text-xs text-rose-400 font-mono mt-1">{stepErrors.whatsapp}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                  Preferred Channel
                </label>
                <select
                  value={contact.preferredContact}
                  onChange={(e) =>
                    setContact({ ...contact, preferredContact: e.target.value as any })
                  }
                  className="w-full bg-surface-elevated border border-surface-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="WHATSAPP">WhatsApp Message</option>
                  <option value="EMAIL">Email Follow-Up</option>
                  <option value="PHONE">Direct Phone Call</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                  Preferred Contact Time Window
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2:00 PM – 5:00 PM IST"
                  value={contact.preferredTime}
                  onChange={(e) => setContact({ ...contact, preferredTime: e.target.value })}
                  className="w-full bg-surface-elevated border border-surface-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                Additional Notes or Specific Architecture Constraints (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Any further details or external links..."
                value={contact.message}
                onChange={(e) => setContact({ ...contact, message: e.target.value })}
                className="w-full bg-surface-elevated border border-surface-border rounded-xl p-4 text-sm text-white focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Privacy Consent Checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentAccepted}
                  onChange={(e) => setConsentAccepted(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-surface-border text-primary focus:ring-0"
                />
                <span className="text-xs text-slate-300 leading-relaxed">
                  I agree to allow Cynbit Technologies to contact me regarding this project inquiry.
                  We never share your information with external parties or third-party marketing brokers.
                </span>
              </label>
              {stepErrors.consent && (
                <p className="text-xs text-rose-400 font-mono mt-1">{stepErrors.consent}</p>
              )}
            </div>
          </div>
        )}

        {/* STEP 5: REVIEW SCREEN */}
        {currentStep === 5 && (
          <div className="space-y-6" role="region" aria-label="Step 5: Review Requirements">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-primary mb-1">
                Final Step
              </p>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Review Your Project Submission
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                Please verify your requirements and contact information before submitting.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              {/* Service Box */}
              <div className="p-4 rounded-xl bg-surface-elevated border border-surface-border">
                <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1">
                  Selected Discipline
                </span>
                <p className="text-sm font-semibold text-white">
                  {SERVICE_OPTIONS.find((s) => s.slug === serviceSlug)?.label}
                </p>
                {projectType && (
                  <p className="text-xs text-slate-400 mt-1">Project Title: {projectType}</p>
                )}
              </div>

              {/* Contact Box */}
              <div className="p-4 rounded-xl bg-surface-elevated border border-surface-border">
                <span className="text-[10px] font-mono uppercase text-slate-500 block mb-2">
                  Contact Information
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400">Name:</span>{" "}
                    <span className="text-white font-medium">{contact.name}</span>
                  </div>
                  {contact.company && (
                    <div>
                      <span className="text-slate-400">Company:</span>{" "}
                      <span className="text-white font-medium">{contact.company}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-400">Email:</span>{" "}
                    <span className="text-white font-mono">{contact.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">WhatsApp/Phone:</span>{" "}
                    <span className="text-white font-mono">{contact.whatsapp}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Preferred Method:</span>{" "}
                    <span className="text-cyan-400 font-medium">{contact.preferredContact}</span>
                  </div>
                </div>
              </div>

              {/* Answers Summary */}
              <div className="p-4 rounded-xl bg-surface-elevated border border-surface-border space-y-3">
                <span className="text-[10px] font-mono uppercase text-slate-500 block">
                  Captured Requirements Snapshot
                </span>
                {questions
                  .filter((q) => isVisible(q) && answers[q.id] !== undefined)
                  .map((q) => (
                    <div key={q.id} className="text-xs border-b border-surface-border/40 pb-2 last:border-0 last:pb-0">
                      <p className="text-slate-400 font-mono text-[11px]">{q.label}</p>
                      <p className="text-white font-medium mt-0.5 whitespace-pre-wrap">
                        {String(answers[q.id])}
                      </p>
                    </div>
                  ))}
              </div>

              {submitError && (
                <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 6: CONFIRMATION & REFERENCE ID */}
        {currentStep === 6 && (
          <div className="py-8 text-center space-y-6" role="status" aria-live="polite">
            <div className="h-16 w-16 bg-cyan-500/20 text-cyan-400 border border-cyan-400/40 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-primary mb-1">
                Inquiry Successfully Logged
              </p>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Requirements Received by Engineering
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm max-w-md mx-auto mt-2">
                Your structured inquiry has been registered in our database. Our technical team will review your specifications and reach out via your preferred channel.
              </p>
            </div>

            {/* Reference ID Card */}
            <div className="max-w-md mx-auto p-5 rounded-2xl bg-surface-elevated border border-surface-borderHighlight shadow-lg">
              <span className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                Your Tracking Reference ID
              </span>
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl font-mono font-black tracking-wider text-cyan-400">
                  {confirmedReferenceId}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(confirmedReferenceId);
                    setCopiedRef(true);
                    setTimeout(() => setCopiedRef(false), 2500);
                  }}
                  className="p-1.5 rounded-lg bg-surface-card hover:bg-surface-border text-slate-300 transition-colors"
                  title="Copy Reference ID"
                >
                  {copiedRef ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-3">
                Keep this reference number for all future communications and proposal tracking.
              </p>
            </div>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              <a
                href="/"
                className="px-6 py-2.5 rounded-xl font-mono text-xs font-medium text-slate-300 bg-surface-elevated hover:bg-surface-card border border-surface-border transition-colors"
              >
                Return to Homepage
              </a>
              <a
                href="/services"
                className="px-6 py-2.5 rounded-xl font-mono text-xs font-semibold uppercase tracking-wider bg-primary hover:bg-primary-hover text-background transition-all"
              >
                Explore Other Services
              </a>
            </div>
          </div>
        )}

        {/* Wizard Navigation Footer */}
        {currentStep <= 5 && (
          <div className="flex items-center justify-between pt-8 border-t border-surface-border/60 mt-8">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-mono text-xs font-medium text-slate-300 hover:text-white bg-surface-elevated border border-surface-border hover:border-slate-700 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous Step
              </button>
            ) : (
              <div />
            )}

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl font-mono text-xs font-semibold uppercase tracking-wider bg-primary hover:bg-primary-hover text-background transition-all shadow-md active:scale-95"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-xl font-mono text-xs font-semibold uppercase tracking-wider bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 transition-all shadow-lg shadow-cyan-500/20 active:scale-95 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <span className="animate-spin mr-1">◌</span> Submitting...
                  </>
                ) : (
                  <>
                    Submit Project Requirements
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
