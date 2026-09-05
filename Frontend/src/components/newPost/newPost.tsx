"use client";
import React, { useState, useEffect } from "react";
import { Formik, Form, FormikErrors } from "formik";
import { GiConfirmed } from "react-icons/gi";
import { HiOutlineMapPin, HiOutlineTag, HiOutlineTruck } from "react-icons/hi2";
import { useCreatePost } from "@/services/Listings/createPost";
import { FormValues } from "@/types/listingFormValue";
import { stepSchemas } from "@/validations/postSchema";
import StepCategories from "@/components/newPost/stepCategories";
import StepChooseState from "@/components/newPost/stepChooseState";
import StepMedia from "@/components/newPost/stepMedia";
import StepProductSpecAndVariants from "./stepProductSpecAndVariants";
import { useRouter } from "next/navigation";
import { MotionDiv } from "@/utils/providers/MotionWrapper";
import { CategoriesTypeResponse } from "@/types/Category";

import { ZodError } from "zod";

// The custom `validate` function below builds a flat, dotted-key error
// object (e.g. "snapshot.title") rather than Formik's usual nested shape,
// so we type it explicitly instead of indexing FormikErrors<FormValues>
// with strings it doesn't actually support.
type FlatFormErrors = Record<string, string>;
function FilePreviewImg({
    file,
    alt,
    className,
}: {
    file: File;
    alt: string;
    className?: string;
}) {
    const [url, setUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!(file instanceof File)) {
            setUrl(null);
            return;
        }
        const objectUrl = URL.createObjectURL(file);
        setUrl(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [file]);

    if (!url) return null;

    return <img src={url} alt={alt} className={className} />;
}

const initialValues: FormValues = {
    snapshot: {
        title: "",
        description: "",
        images: [],
        specs: {},
        categoryPath: [],
    },
    location: {
        state: "",
        city: "",
    },
    price: 0,
    shipping: {
        type: "standard",
        cost: 0,
    },
    condition: "new",
};

const steps = ["Category", "Details", "Specs", "Pricing", "Location", "Media", "Review"];

interface NewPostProps {
    data?: CategoriesTypeResponse;
    isLoading: boolean;
}

export default function NewPost({ data, isLoading }: NewPostProps) {
    const { mutate, isPending } = useCreatePost();
    const [step, setStep] = useState(0);
    const router = useRouter()

    const validateStep = (values: FormValues): FlatFormErrors => {
        try {
            stepSchemas[step].parse(values)
            return {};
        } catch (err) {
            const formatted: FlatFormErrors = {};
            if (err instanceof ZodError) {
                err.issues.forEach((issue) => {
                    const path = issue.path.join(".");
                    formatted[path] = issue.message;
                });
            }
            return formatted;
        }
    };

    const next = (validateForm: () => Promise<FormikErrors<FormValues>>) => {
        validateForm().then((errors) => {
            if (Object.keys(errors).length === 0) {
                setStep((s) => Math.min(s + 1, steps.length - 1));
            }
        });
    };

    const back = () => setStep((s) => Math.max(s - 1, 0));

    return (
        <div className="min-w-[60%] bg-[var(--card)] backdrop-blur-xl rounded-[24px] border border-[var(--border)] shadow-[var(--card-shadow-1)] p-8 md:p-12 relative overflow-hidden transition-all duration-300">
            <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-transparent via-[var(--primary-400)] to-transparent" />
            <MotionDiv
                initial={{ scale: 0.70, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 2, type: "spring" }}
                className="mb-12 text-center"
            >
                <h2 className="text-2xl md:text-3xl font-black tracking-wider  dark:text-slate-100 flex items-center justify-center gap-2">
                    Create New
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-600 bg-red-50/60 dark:bg-rose-950/40 px-4 py-1 rounded-2xl border border-red-100/50 dark:border-rose-900/40 text-2xl font-black shadow-sm inline-block">
                        Post
                    </span>
                </h2>
                <p className="text-sm font-semibold text-[var(--foreground-muted)] uppercase tracking-wide max-w-md mx-auto mt-3">
                    Complete the steps below to publish your listing
                </p>
            </MotionDiv>

            {/* STEP PROGRESS  */}
            <div className="flex items-center gap-2.5 mb-12 relative z-10 px-1">
                {steps.map((_, i) => (
                    <div
                        key={i}
                        className={`h-2 flex-1 rounded-full transition-all duration-500 ease-out relative overflow-hidden ${i <= step
                            ? "opacity-100"
                            : "bg-[var(--border)] opacity-40"
                            }`}
                        style={i <= step ? { background: "var(--gradient)" } : {}}
                    />
                ))}
            </div>

            {/* FORMIK LAYER */}
            <Formik<FormValues>
                initialValues={initialValues}
                validate={validateStep}
                onSubmit={(values) => {
                    const payload = {
                        listingType: "user_ad",
                        title: values.snapshot.title,
                        description: values.snapshot.description,
                        images: values.snapshot.images ?? [],
                        categoryPath: values.snapshot.categoryPath ?? [],
                        specs: values.snapshot.specs ?? {},
                        price: values.price,
                        condition: values.condition,
                        location: {
                            state: values.location.state,
                            city: values.location.city,
                        },
                        shipping: {
                            type: values.shipping.type,
                            cost: Number(values.shipping.cost) || 0,
                        },
                    }
                    mutate(payload);
                    router.push("/posts")
                }}
            >
                {({ values, setFieldValue, validateForm, submitForm, errors }) => {
                  const flatErrors = errors as FlatFormErrors;
                  return (
                    <Form className="flex flex-col gap-8 relative z-10 text-left">

                        {/* STEP 0: CATEGORIES */}
                        {step === 0 && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <StepCategories data={data} isLoading={isLoading} />
                            </div>
                        )}

                        {/* STEP 1: GENERAL INFO */}
                        {step === 1 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold uppercase tracking-wider ml-1 text-[var(--label-color)]">Title</label>
                                    <input
                                        type="text"
                                        placeholder="Enter a catchy title..."
                                        value={values.snapshot.title}
                                        className="h-12 px-4 rounded-xl transition duration-200 w-full"
                                        onChange={(e) => setFieldValue("snapshot.title", e.target.value)}
                                    />
                                    {flatErrors["snapshot.title"] && (
                                        <p className="text-xs font-medium text-[var(--destructive)] mt-0.5 flex items-center gap-1 ml-1 animate-in fade-in slide-in-from-top-1">
                                            ⚠️ {flatErrors["snapshot.title"]}
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
                                        onChange={(e) => setFieldValue("snapshot.description", e.target.value)}
                                    />
                                    {flatErrors["snapshot.description"] && (
                                        <p className="text-xs font-medium text-[var(--destructive)] mt-0.5 flex items-center gap-1 ml-1 animate-in fade-in slide-in-from-top-1">
                                            ⚠️ {flatErrors["snapshot.description"]}
                                        </p>
                                    )}
                                </div>

                                <div className="flex gap-4 pt-2">
                                    {["new", "used"].map((c) => {
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
                                                    onChange={() => setFieldValue("condition", c)}
                                                />
                                                {c}
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* STEP 2: SPECS */}
                        {step === 2 && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <StepProductSpecAndVariants
                                    categoryId={values.snapshot.categoryPath?.at(-1) ?? ""}
                                />
                            </div>
                        )}

                        {/* STEP 3: PRICE & SHIPPING */}
                        {step === 3 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold uppercase tracking-wider ml-1 text-[var(--label-color)]">Price</label>
                                    <div className="relative w-full">
                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            value={values.price || ""}
                                            className="h-12 w-full pl-4 pr-14 rounded-xl transition duration-200"
                                            onChange={(e) => setFieldValue("price", Number(e.target.value))}
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
                                            onChange={(e) => setFieldValue("shipping.cost", Number(e.target.value))}
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--foreground-subtle)] tracking-wider">USD</span>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-2">
                                    {["standard", "express"].map((t) => {
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
                                                    onChange={() => setFieldValue("shipping.type", t)}
                                                />
                                                {t} Shipping
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* STEP 4: LOCATION */}
                        {step === 4 && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <StepChooseState />
                            </div>
                        )}

                        {/* STEP 5: MEDIA */}
                        {step === 5 && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <StepMedia />
                            </div>
                        )}

                        {/* STEP 6: REVIEW */}
                        {step === 6 && (
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
                        )}

                        {/* NAVIGATION BUTTONS */}
                        <div className="flex justify-between items-center w-full pt-6 mt-4 border-t border-[var(--border)]">
                            <button
                                type="button"
                                onClick={back}
                                disabled={step === 0}
                                className="px-6 h-12 text-sm font-bold rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground-muted)] hover:bg-[var(--background-soft)] disabled:opacity-40 transition duration-200 shadow-sm active:scale-95"
                            >
                                Back
                            </button>

                            {step < steps.length - 1 ? (
                                <button
                                    type="button"
                                    onClick={() => next(validateForm)}
                                    className="px-8 h-12 text-sm font-bold text-white rounded-xl shadow-md transition duration-200 hover:opacity-95 hover:shadow-lg active:scale-[0.97]"
                                    style={{ background: "var(--gradient)" }}
                                >
                                    Next Step
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => submitForm()}
                                    disabled={isPending}
                                    className="px-8 h-12 text-sm font-bold text-white flex items-center gap-2 rounded-xl shadow-md transition duration-200 hover:opacity-95 hover:shadow-lg active:scale-[0.97] disabled:opacity-50"
                                    style={{ background: "var(--gradient)" }}
                                >
                                    {isPending ? "Creating..." : "Publish Post"}
                                    <GiConfirmed size={16} />
                                </button>
                            )}
                        </div>
                    </Form>
                  );
                }}
            </Formik>
        </div>
    );
}