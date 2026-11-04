"use client";

import { useFormContext } from "react-hook-form";
import { FormValues } from "@/types/listingFormValue";

export default function StepPricing() {
    const { watch, setValue } = useFormContext<FormValues>();
    const values = watch();

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider ml-1 text-[var(--label-color)]">Price</label>
                <div className="relative w-full">
                    <input
                        type="number"
                        placeholder="0.00"
                        value={values.price || ""}
                        className="h-12 w-full pl-4 pr-14 rounded-xl transition duration-200"
                        onChange={(e) => setValue("price", Number(e.target.value), { shouldValidate: true })}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--foreground-subtle)] tracking-wider">USD</span>
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider ml-1 text-[var(--label-color)]">Shipping Cost</label>
                <div className="relative w-full">
                    <input
                        type="number"
                        placeholder="0.00"
                        value={values.shipping.cost || ""}
                        className="h-12 w-full pl-4 pr-14 rounded-xl transition duration-200"
                        onChange={(e) => setValue("shipping.cost", Number(e.target.value), { shouldValidate: true })}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--foreground-subtle)] tracking-wider">USD</span>
                </div>
            </div>

            <div className="flex gap-4 pt-2">
                {(["standard", "express"] as const).map((t) => {
                    const isSelected = values.shipping.type === t;
                    return (
                        <label
                            key={t}
                            className={`flex items-center gap-3 px-5 py-3 rounded-xl border transition duration-200 cursor-pointer select-none capitalize font-bold text-sm flex-1 justify-center shadow-sm ${isSelected
                                ? "border-[var(--ring)] bg-[var(--background-soft)] text-[var(--foreground)] ring-2 ring-[var(--ring)]"
                                : "border-[var(--border)] bg-[var(--input-bg)] text-[var(--foreground-muted)] hover:bg-[var(--background-soft)]"
                                }`}
                        >
                            <input
                                type="radio"
                                className="w-4 h-4"
                                style={{ accentColor: "var(--ring)" }}
                                checked={isSelected}
                                onChange={() => setValue("shipping.type", t, { shouldValidate: true })}
                            />
                            {t} Shipping
                        </label>
                    );
                })}
            </div>
        </div>
    );
}
