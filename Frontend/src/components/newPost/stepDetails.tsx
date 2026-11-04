"use client";

import { useFormContext } from "react-hook-form";
import { FormValues } from "@/types/listingFormValue";
import { getFieldError } from "@/utils/stepResolver";

export default function StepDetails() {
    const { watch, setValue, formState: { errors } } = useFormContext<FormValues>();
    const values = watch();

    const titleError = getFieldError(errors, "snapshot.title");
    const descriptionError = getFieldError(errors, "snapshot.description");

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider ml-1 text-[var(--label-color)]">Title</label>
                <input
                    type="text"
                    placeholder="Enter a catchy title..."
                    value={values.snapshot.title}
                    className="h-12 px-4 rounded-xl transition duration-200 w-full"
                    onChange={(e) => setValue("snapshot.title", e.target.value, { shouldValidate: true })}
                />
                {titleError && (
                    <p className="text-xs font-medium text-[var(--destructive)] mt-0.5 flex items-center gap-1 ml-1 animate-in fade-in slide-in-from-top-1">
                        ⚠️ {titleError}
                    </p>
                )}
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider ml-1 text-[var(--label-color)]">Description</label>
                <textarea
                    rows={4}
                    placeholder="Describe your item details, features, and condition..."
                    value={values.snapshot.description}
                    className="p-4 rounded-xl transition duration-200 resize-none w-full"
                    onChange={(e) => setValue("snapshot.description", e.target.value, { shouldValidate: true })}
                />
                {descriptionError && (
                    <p className="text-xs font-medium text-[var(--destructive)] mt-0.5 flex items-center gap-1 ml-1 animate-in fade-in slide-in-from-top-1">
                        ⚠️ {descriptionError}
                    </p>
                )}
            </div>

            <div className="flex gap-4 pt-2">
                {(["new", "used"] as const).map((c) => {
                    const isSelected = values.condition === c;
                    return (
                        <label
                            key={c}
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
                                onChange={() => setValue("condition", c, { shouldValidate: true })}
                            />
                            {c}
                        </label>
                    );
                })}
            </div>
        </div>
    );
}
