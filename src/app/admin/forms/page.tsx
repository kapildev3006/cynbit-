"use client";

import { useEffect, useState, useCallback } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import {
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Edit,
  Eye,
  CheckCircle,
  AlertCircle,
  Save,
  Send,
  Layers,
  HelpCircle,
  Settings,
} from "lucide-react";

interface QuestionOption {
  label: string;
  value: string;
}

interface QuestionItem {
  id: string;
  key: string;
  label: string;
  step: 2 | 3;
  helpText?: string;
  placeholder?: string;
  type: string;
  required: boolean;
  active: boolean;
  order: number;
  serviceSlugs: string[];
  options?: QuestionOption[];
  visibleIf?: { questionId: string; equals: any };
}

export default function FormBuilderPage() {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [publishedVersion, setPublishedVersion] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [publishing, setPublishing] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Edit/Create Modal State
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionItem>({
    id: "",
    key: "",
    label: "",
    step: 2,
    helpText: "",
    placeholder: "",
    type: "text",
    required: false,
    active: true,
    order: 1,
    serviceSlugs: ["all"],
    options: [],
  });

  // Options editor state for select/radio/checkbox
  const [newOptionLabel, setNewOptionLabel] = useState("");
  const [newOptionValue, setNewOptionValue] = useState("");

  // Preview Modal State
  const [previewOpen, setPreviewOpen] = useState<boolean>(false);

  const fetchDraft = useCallback(async () => {
    try {
      setLoading(true);
      setMessage(null);
      const res = await fetch("/api/admin/forms/draft");
      if (!res.ok) {
        throw new Error("Failed to load working draft.");
      }
      const data = await res.json();
      setQuestions(data.draft?.questions || []);
      setPublishedVersion(data.publishedVersion);
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to load draft", type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDraft();
  }, [fetchDraft]);

  // Reorder questions
  function moveQuestion(index: number, direction: "UP" | "DOWN") {
    const targetIdx = direction === "UP" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= questions.length) return;

    const copy = [...questions];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;

    // Re-assign order sequence
    const reordered = copy.map((q, idx) => ({ ...q, order: idx + 1 }));
    setQuestions(reordered);
  }

  // Delete question
  function deleteQuestion(index: number) {
    if (!confirm("Remove this question from the draft?")) return;
    const copy = questions.filter((_, idx) => idx !== index);
    const reordered = copy.map((q, idx) => ({ ...q, order: idx + 1 }));
    setQuestions(reordered);
  }

  // Open modal for new question
  function openNewModal() {
    setEditingIndex(null);
    setCurrentQuestion({
      id: `q_${Date.now().toString(36)}`,
      key: `field_${questions.length + 1}`,
      label: "",
      step: 2,
      helpText: "",
      placeholder: "",
      type: "text",
      required: false,
      active: true,
      order: questions.length + 1,
      serviceSlugs: ["all"],
      options: [],
    });
    setModalOpen(true);
  }

  // Open modal for editing
  function openEditModal(index: number) {
    setEditingIndex(index);
    setCurrentQuestion({ ...questions[index] });
    setModalOpen(true);
  }

  // Save question from modal
  function saveQuestionFromModal(e: React.FormEvent) {
    e.preventDefault();
    if (!currentQuestion.label.trim()) return;

    const copy = [...questions];
    if (editingIndex !== null) {
      copy[editingIndex] = currentQuestion;
    } else {
      copy.push(currentQuestion);
    }

    const reordered = copy.map((q, idx) => ({ ...q, order: idx + 1 }));
    setQuestions(reordered);
    setModalOpen(false);
  }

  // Save draft to server
  async function handleSaveDraft() {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/forms/draft", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save draft.");
      }

      setQuestions(data.draft?.questions || []);
      setMessage({ text: "Draft saved successfully.", type: "success" });
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to save draft.", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  // Publish draft
  async function handlePublish() {
    if (
      !confirm(
        "Publish this draft? It will immediately become the active form schema used by the public website."
      )
    ) {
      return;
    }

    setPublishing(true);
    setMessage(null);

    try {
      // First save current state
      await fetch("/api/admin/forms/draft", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions }),
      });

      const res = await fetch("/api/admin/forms/publish", {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to publish form.");
      }

      setPublishedVersion(data.publishedVersion?.versionNumber);
      setMessage({
        text: `Form version ${data.publishedVersion?.versionNumber} is now live!`,
        type: "success",
      });
      fetchDraft();
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to publish form.", type: "error" });
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />

      <main className="flex-1 p-6 lg:p-10 max-w-6xl">
        {/* Header & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-primary mb-1">
              Dynamic Question Engine
            </p>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Inquiry Form Builder
            </h1>
            <p className="text-[11px] font-mono text-slate-500 mt-1">
              Active Published Version:{" "}
              <span className="text-cyan-400 font-bold">
                {publishedVersion ? `v${publishedVersion}` : "v1"}
              </span>{" "}
              • Edits are made in draft mode before publishing.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setPreviewOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono text-slate-300 hover:text-white bg-surface-card border border-surface-border transition-all active:scale-95"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
            <button
              onClick={handleSaveDraft}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono text-slate-300 hover:text-white bg-surface-elevated border border-surface-border transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? "Saving..." : "Save Draft"}</span>
            </button>
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-primary hover:bg-primary-hover text-background transition-all shadow-md shadow-cyan-500/20 active:scale-95 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{publishing ? "Publishing..." : "Publish Live"}</span>
            </button>
          </div>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-xl text-xs font-mono flex items-center gap-2 ${
              message.type === "success"
                ? "bg-emerald-950/40 border border-emerald-800 text-emerald-300"
                : "bg-rose-950/40 border border-rose-800 text-rose-300"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Locked Fields Notice (Change #4) */}
        <div className="mb-6 p-4 rounded-xl bg-surface-card border border-surface-border text-xs font-mono text-slate-400">
          <p className="font-bold text-slate-200 mb-1 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-primary" />
            <span>Architecture Note: Locked Core Fields</span>
          </p>
          <p>
            Step 1 (Service Selection) and Step 4 (Client details: Name, Email, WhatsApp, Country, Preferred Channel, Consent) are fixed core fields enforced in code and stored in contact. Below are the dynamic Step 2 (Requirements) and Step 3 (Planning) questions.
          </p>
        </div>

        {/* Questions List */}
        <div className="bg-surface-card rounded-2xl border border-surface-border overflow-hidden mb-6">
          <div className="p-4 border-b border-surface-border flex items-center justify-between">
            <h2 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Working Draft Questions ({questions.length} / 40 max)
            </h2>
            <button
              onClick={openNewModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-primary hover:bg-primary-hover text-background transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Question</span>
            </button>
          </div>

          <div className="divide-y divide-surface-border/60">
            {questions.map((q, idx) => (
              <div
                key={q.id || idx}
                className="p-4 flex items-center justify-between gap-4 hover:bg-surface-elevated/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {/* Reorder Buttons (Required up/down) */}
                  <div className="flex flex-col gap-1">
                    <button
                      disabled={idx === 0}
                      onClick={() => moveQuestion(idx, "UP")}
                      className="p-1 rounded bg-surface-elevated hover:bg-surface-border text-slate-400 hover:text-white disabled:opacity-30"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      disabled={idx === questions.length - 1}
                      onClick={() => moveQuestion(idx, "DOWN")}
                      className="p-1 rounded bg-surface-elevated hover:bg-surface-border text-slate-400 hover:text-white disabled:opacity-30"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-elevated text-slate-400 border border-surface-border">
                        Step {q.step}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                        {q.type}
                      </span>
                      {q.required && (
                        <span className="text-[10px] font-mono text-amber-400 font-bold">
                          *Required
                        </span>
                      )}
                      {!q.active && (
                        <span className="text-[10px] font-mono text-rose-400 font-bold">
                          [Inactive]
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-white">{q.label}</p>
                    <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                      Key: <code className="text-slate-400">{q.key}</code> • Services:{" "}
                      {q.serviceSlugs.join(", ")}
                      {q.visibleIf && ` • Depends on question: ${q.visibleIf.questionId}`}
                    </p>
                  </div>
                </div>

                {/* Edit / Delete actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(idx)}
                    className="p-2 rounded-lg bg-surface-elevated hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    title="Edit question"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteQuestion(idx)}
                    className="p-2 rounded-lg bg-surface-elevated hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 transition-colors"
                    title="Delete question"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Edit / Add Question Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-surface-card border border-surface-border rounded-2xl max-w-xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
                {editingIndex !== null ? "Edit Question" : "New Dynamic Question"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white font-mono text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={saveQuestionFromModal} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-300 uppercase mb-1">
                  Question Label (Displayed to Client) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Do you have existing API documentation?"
                  value={currentQuestion.label}
                  onChange={(e) => setCurrentQuestion({ ...currentQuestion, label: e.target.value })}
                  className="w-full bg-surface-elevated border border-surface-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 uppercase mb-1">Field Key (Identifier) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. api_docs"
                    value={currentQuestion.key}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, key: e.target.value })}
                    className="w-full bg-surface-elevated border border-surface-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 uppercase mb-1">Form Step</label>
                  <select
                    value={currentQuestion.step}
                    onChange={(e) =>
                      setCurrentQuestion({
                        ...currentQuestion,
                        step: parseInt(e.target.value, 10) as 2 | 3,
                      })
                    }
                    className="w-full bg-surface-elevated border border-surface-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-primary"
                  >
                    <option value={2}>Step 2: Technical Requirements</option>
                    <option value={3}>Step 3: Planning & Budget</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 uppercase mb-1">Field Type</label>
                  <select
                    value={currentQuestion.type}
                    onChange={(e) =>
                      setCurrentQuestion({ ...currentQuestion, type: e.target.value })
                    }
                    className="w-full bg-surface-elevated border border-surface-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-primary"
                  >
                    <option value="text">Short Text</option>
                    <option value="textarea">Long Text / Paragraph</option>
                    <option value="select">Dropdown Select</option>
                    <option value="radio">Radio Buttons</option>
                    <option value="checkbox">Multi-Select Checkboxes</option>
                    <option value="number">Number</option>
                    <option value="url">URL Address</option>
                    <option value="email">Email</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 uppercase mb-1">Service Scope</label>
                  <input
                    type="text"
                    placeholder="all, or slug (e.g. fullstack-development)"
                    value={currentQuestion.serviceSlugs.join(", ")}
                    onChange={(e) =>
                      setCurrentQuestion({
                        ...currentQuestion,
                        serviceSlugs: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    className="w-full bg-surface-elevated border border-surface-border rounded-xl px-3 py-2 text-white focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Options for Select, Radio, Checkbox */}
              {["select", "radio", "checkbox"].includes(currentQuestion.type) && (
                <div className="p-3 bg-surface-elevated rounded-xl border border-surface-border space-y-3">
                  <label className="block text-slate-300 uppercase">Choice Options</label>
                  <div className="space-y-1.5">
                    {currentQuestion.options?.map((opt, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 rounded bg-surface-card border border-surface-border"
                      >
                        <span>
                          {opt.label} (<code className="text-cyan-400">{opt.value}</code>)
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const newOpts = currentQuestion.options?.filter((_, idx) => idx !== i);
                            setCurrentQuestion({ ...currentQuestion, options: newOpts });
                          }}
                          className="text-rose-400 hover:text-rose-300"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Option Label"
                      value={newOptionLabel}
                      onChange={(e) => setNewOptionLabel(e.target.value)}
                      className="flex-1 bg-surface-card border border-surface-border rounded-lg px-2 py-1 text-white"
                    />
                    <input
                      type="text"
                      placeholder="Option Value"
                      value={newOptionValue}
                      onChange={(e) => setNewOptionValue(e.target.value)}
                      className="w-28 bg-surface-card border border-surface-border rounded-lg px-2 py-1 text-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newOptionLabel || !newOptionValue) return;
                        const updated = [
                          ...(currentQuestion.options || []),
                          { label: newOptionLabel, value: newOptionValue },
                        ];
                        setCurrentQuestion({ ...currentQuestion, options: updated });
                        setNewOptionLabel("");
                        setNewOptionValue("");
                      }}
                      className="px-3 py-1 bg-primary text-background rounded-lg font-bold"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}

              {/* Conditional Visibility (Rule 5: Depends ONLY on an earlier question) */}
              <div className="p-3 bg-surface-elevated rounded-xl border border-surface-border space-y-2">
                <label className="block text-slate-300 uppercase">
                  Conditional Rule: Show only if earlier question equals value
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={currentQuestion.visibleIf?.questionId || ""}
                    onChange={(e) => {
                      if (!e.target.value) {
                        setCurrentQuestion({ ...currentQuestion, visibleIf: undefined });
                      } else {
                        setCurrentQuestion({
                          ...currentQuestion,
                          visibleIf: {
                            questionId: e.target.value,
                            equals: currentQuestion.visibleIf?.equals || "",
                          },
                        });
                      }
                    }}
                    className="w-full bg-surface-card border border-surface-border rounded-lg px-2 py-1.5 text-white"
                  >
                    <option value="">No Condition (Always Visible)</option>
                    {/* Only earlier questions in order! */}
                    {questions
                      .filter((_, idx) => editingIndex === null || idx < editingIndex)
                      .map((priorQ) => (
                        <option key={priorQ.id} value={priorQ.id}>
                          {priorQ.label} (ID: {priorQ.id})
                        </option>
                      ))}
                  </select>

                  <input
                    type="text"
                    placeholder="Equals value (e.g. yes)"
                    disabled={!currentQuestion.visibleIf?.questionId}
                    value={currentQuestion.visibleIf?.equals || ""}
                    onChange={(e) =>
                      setCurrentQuestion({
                        ...currentQuestion,
                        visibleIf: {
                          questionId: currentQuestion.visibleIf!.questionId,
                          equals: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-surface-card border border-surface-border rounded-lg px-2 py-1.5 text-white disabled:opacity-40"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentQuestion.required}
                    onChange={(e) =>
                      setCurrentQuestion({ ...currentQuestion, required: e.target.checked })
                    }
                    className="rounded border-surface-border text-primary focus:ring-0"
                  />
                  <span>Required field</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentQuestion.active}
                    onChange={(e) =>
                      setCurrentQuestion({ ...currentQuestion, active: e.target.checked })
                    }
                    className="rounded border-surface-border text-primary focus:ring-0"
                  />
                  <span>Active</span>
                </label>
              </div>

              <div className="pt-4 border-t border-surface-border flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl font-bold uppercase bg-primary hover:bg-primary-hover text-background"
                >
                  Apply to Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-surface-card border border-surface-border rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
                Interactive Form Preview (Working Draft)
              </h3>
              <button
                onClick={() => setPreviewOpen(false)}
                className="text-slate-400 hover:text-white font-mono text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 py-2">
              <p className="text-xs text-slate-400 font-mono">
                This preview renders your active working draft exactly as clients will interact with it once published.
              </p>
              {questions
                .filter((q) => q.active)
                .map((q) => (
                  <div key={q.id} className="p-4 rounded-xl bg-surface-elevated border border-surface-border space-y-1.5">
                    <label className="block text-xs font-mono uppercase text-slate-300">
                      {q.label} {q.required && <span className="text-primary">*</span>}
                    </label>
                    {q.type === "textarea" ? (
                      <textarea
                        rows={3}
                        disabled
                        placeholder={q.placeholder || "Client input"}
                        className="w-full bg-surface-card border border-surface-border rounded-lg p-2 text-xs text-slate-400"
                      />
                    ) : q.type === "select" ? (
                      <select disabled className="w-full bg-surface-card border border-surface-border rounded-lg p-2 text-xs text-slate-400">
                        <option>-- Select an option --</option>
                        {q.options?.map((o) => (
                          <option key={o.value}>{o.label}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        disabled
                        placeholder={q.placeholder || "Client input"}
                        className="w-full bg-surface-card border border-surface-border rounded-lg p-2 text-xs text-slate-400"
                      />
                    )}
                  </div>
                ))}
            </div>

            <div className="pt-3 border-t border-surface-border flex justify-end">
              <button
                onClick={() => setPreviewOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-mono bg-surface-elevated text-white"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
