"use client";

import { useFormContext } from "react-hook-form";
import { HiOutlineMapPin, HiOutlineTag, HiOutlineTruck } from "react-icons/hi2";
import { FormValues } from "@/types/listingFormValue";
import FilePreviewImg from "@/components/shared/FilePreviewImg";

export default function StepReview() {
    const { watch } = useFormContext<FormValues>();
    const values = watch();

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Title + main photo */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--background-soft)] p-6 flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-[var(--card)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
                    {values.snapshot.images?.[0] ? (
                        <FilePreviewImg
                            file={values.snapshot.images[0]}
                            alt="Main product"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <HiOutlineTag className="w-7 h-7 text-[var(--foreground-muted)]" />
                    )}
                </div>
                <div>
                    <p className="font-black text-lg text-[var(--foreground)]">
                        {values.snapshot.title || "Untitled listing"}
                    </p>
                    <p className="text-sm text-[var(--foreground-muted)] capitalize">
                        {values.condition} · {values.snapshot.images?.length ?? 0} photo
                        {values.snapshot.images?.length === 1 ? "" : "s"}
                    </p>
                </div>
            </div>

            {/* Description */}
            {values.snapshot.description && (
                <div className="rounded-xl border border-[var(--border)] p-6">
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--label-color)] mb-2">
                        Description
                    </p>
                    <p className="text-sm text-[var(--foreground)] whitespace-pre-line">
                        {values.snapshot.description}
                    </p>
                </div>
            )}

            {/* Price + Shipping */}
            <div className="rounded-xl border border-[var(--border)] p-6 flex items-start gap-3">
                <HiOutlineTag className="w-5 h-5 text-[var(--primary-500)] mt-0.5 shrink-0" />
                <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--label-color)] mb-1">
                        Price & Shipping
                    </p>
                    <p className="text-sm text-[var(--foreground)] font-bold">
                        ${values.price.toLocaleString()}
                    </p>
                    <p className="text-sm text-[var(--foreground-muted)] capitalize flex items-center gap-1 mt-0.5">
                        <HiOutlineTruck className="w-4 h-4" />
                        {values.shipping.type} shipping — ${values.shipping.cost.toLocaleString()}
                    </p>
                </div>
            </div>

            {/* Location */}
            <div className="rounded-xl border border-[var(--border)] p-6 flex items-start gap-3">
                <HiOutlineMapPin className="w-5 h-5 text-[var(--primary-500)] mt-0.5 shrink-0" />
                <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--label-color)] mb-1">
                        Location
                    </p>
                    <p className="text-sm text-[var(--foreground)]">
                        {[values.location.city, values.location.state].filter(Boolean).join(", ") || "Not set"}
                    </p>
                </div>
            </div>

            {/* All photos */}
            {values.snapshot.images && values.snapshot.images.length > 0 && (
                <div className="rounded-xl border border-[var(--border)] p-6">
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--label-color)] mb-3">
                        Photos
                    </p>
                    <div className="grid grid-cols-4 gap-3">
                        {values.snapshot.images.map((file: File, idx: number) => (
                            <FilePreviewImg
                                key={idx}
                                file={file}
                                alt={`Preview ${idx + 1}`}
                                className="aspect-square rounded-lg object-cover border border-[var(--border)]"
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
