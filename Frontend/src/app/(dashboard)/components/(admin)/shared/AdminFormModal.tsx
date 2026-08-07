"use client";

import { HiXMark } from "react-icons/hi2";

interface AdminFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

export function AdminFormModal({
  isOpen,
  onClose,
  title,
  icon: Icon,
  children,
  footer,
  maxWidth = "max-w-[560px]",
}: AdminFormModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 antialiased">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
      />

      <div
        className={`card relative z-10 w-full ${maxWidth} p-6 max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--primary-500)] to-transparent" />

        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--border)] gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="w-4.5 h-4.5 text-[var(--foreground-muted)]" />}
            <h3 className="text-base font-bold tracking-tight text-[var(--foreground)] m-0">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-xl text-[var(--foreground-subtle)] hover:text-[var(--foreground)] hover:bg-[var(--background-soft)] transition-colors"
          >
            <HiXMark className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 space-y-4 min-h-0">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-[var(--border)] shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold text-[var(--foreground-muted)]">{label}</label>
      {children}
    </div>
  );
}

export const inputClass =
  "h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)] w-full";

export const textareaClass =
  "px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)] w-full resize-none";
