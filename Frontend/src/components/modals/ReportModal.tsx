"use client";

import { useState } from "react";
import { Flag, X, Send } from "lucide-react";
import { toast } from "sonner";
import { usePost } from "@/utils/hooks/useReactQueryHooks";

const REASONS: { value: string; label: string }[] = [
  { value: "fraud", label: "Fraud or scam" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "duplicate", label: "Duplicate listing" },
  { value: "fake", label: "Fake listing / counterfeit" },
  { value: "prohibited_item", label: "Prohibited item" },
  { value: "other", label: "Other" },
];

interface ReportModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  targetType: "listing" | "store" | "comment" | "user";
  targetId: string;
}

export default function ReportModal({ isOpen, setIsOpen, targetType, targetId }: ReportModalProps) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");

  const { mutate, isPending } = usePost<any>("/reports", {
    onSuccess: () => {
      toast.success("Report submitted. Our team will review it shortly.");
      setReason("");
      setDescription("");
      setIsOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Could not submit report, please try again.");
    },
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;
    mutate({ targetType, targetId, reason, description });
  };

  const handleClose = () => {
    setReason("");
    setDescription("");
    setIsOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 antialiased">
      {/* BACKDROP */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200"
        onClick={handleClose}
      />

      {/* MODAL CONTAINER */}
      <div
        className="card relative z-10 w-full max-w-[600px] p-6 max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ACCENT TOP BORDER */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
        {/* HEADER */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--border)] gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <Flag size={18} className="text-red-500 dark:text-red-400" />
            <h3 className="text-base font-bold tracking-tight text-[var(--foreground)] m-0 capitalize">
              Report {targetType}
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleSubmit}
              disabled={!reason || isPending}
              className="btn-primary h-8 px-4 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 disabled:opacity-50 bg-red-600 hover:bg-red-700 text-white border-none"
            >
              <Send size={13} />
              {isPending ? "Submitting..." : "Submit Report"}
            </button>
            <button
              onClick={handleClose}
              type="button"
              className="p-1.5 rounded-xl text-[var(--foreground-subtle)] hover:text-[var(--foreground)] hover:bg-[var(--background-soft)] transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* FORM CONTENT */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1 space-y-4 min-h-0">
          {/* REASONS LIST */}
          <div>
            <label className="block text-xs font-bold text-[var(--foreground-muted)] mb-2">
              Select Reason:
            </label>
            <div className="space-y-2">
              {REASONS.map((r) => {
                const isSelected = reason === r.value;
                return (
                  <label
                    key={r.value}
                    onClick={() => setReason(r.value)}
                    className={`p-3.5 rounded-xl border transition-all duration-200 flex items-center justify-between cursor-pointer ${isSelected
                        ? "border-red-500 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 shadow-sm"
                        : "border-[var(--border)] bg-[var(--background-soft)] hover:bg-[var(--border)] text-[var(--foreground)]"
                      }`}
                  >
                    <span className="text-xs font-semibold">{r.label}</span>
                    <input
                      type="radio"
                      name="reason"
                      value={r.value}
                      checked={isSelected}
                      onChange={(e) => setReason(e.target.value)}
                      className="sr-only"
                    />
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${isSelected
                          ? "border-red-500 bg-red-500"
                          : "border-[var(--border)] bg-[var(--card)]"
                        }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* DESCRIPTION TEXTAREA */}
          <div>
            <label className="block text-xs font-bold text-[var(--foreground-muted)] mb-1.5">
              Additional Details (Optional):
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Tell us more about the issue..."
              className="w-full p-3 rounded-xl bg-[var(--background-soft)] border border-[var(--border)] text-xs text-[var(--foreground)] placeholder-[var(--foreground-subtle)] focus:outline-none focus:border-red-500 transition-colors resize-none"
            />
          </div>
        </form>
      </div>
    </div>
  );
}