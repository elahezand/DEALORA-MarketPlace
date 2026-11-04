"use client";

import { useFormContext } from "react-hook-form";
import { HiOutlineBuildingStorefront, HiOutlineExclamationTriangle } from "react-icons/hi2";
import { StoreFormValues } from "@/types/storeFormValues";

export default function StepReview({ submitError }: { submitError: string | null }) {
  const { watch } = useFormContext<StoreFormValues>();
  const values = watch();

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--background-soft)] p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-[var(--card)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
          {values.logo ? (
            <img loading="lazy" decoding="async"
              src={values.logo}
              alt="Store logo"
              className="w-full h-full object-cover"
            />
          ) : (
            <HiOutlineBuildingStorefront className="w-8 h-8 text-[var(--foreground-muted)]" />
          )}
        </div>
        <div>
          <p className="font-black text-lg text-[var(--foreground)]">
            {values.name}
          </p>
          <p className="text-sm text-[var(--foreground-muted)]">
            {values.phone}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] p-6">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--label-color)] mb-2">
          Address
        </p>
        <p className="text-sm text-[var(--foreground)]">
          {values.address.street}, {values.address.city},{" "}
          {values.address.province}
        </p>
        <p className="text-sm text-[var(--foreground-muted)]">
          {values.address.postalCode}
        </p>
        <p className="text-xs text-[var(--foreground-subtle)] mt-1">
          {(values.address.coordinates.lat || 0).toFixed(5)},{" "}
          {(values.address.coordinates.lng || 0).toFixed(5)}
        </p>
      </div>

      {submitError && (
        <div className="rounded-xl border border-[var(--destructive)]/30 bg-[var(--destructive-bg)] px-4 py-3 text-sm text-[var(--destructive)] flex items-center gap-2">
          <HiOutlineExclamationTriangle className="w-4 h-4 shrink-0" />
          {submitError}
        </div>
      )}
    </div>
  );
}
