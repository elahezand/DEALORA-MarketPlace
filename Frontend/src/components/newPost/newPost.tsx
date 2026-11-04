"use client";
import React, { useState } from "react";
import { FormProvider } from "react-hook-form";
import { GiConfirmed } from "react-icons/gi";
import { useCreatePost } from "@/services/Listings/useCreatePost";
import { FormValues } from "@/types/listingFormValue";
import { stepSchemas } from "@/validations/postSchema";
import StepCategories from "@/components/newPost/stepCategories";
import StepChooseState from "@/components/newPost/stepChooseState";
import StepMedia from "@/components/newPost/stepMedia";
import StepProductSpecAndVariants from "./stepProductSpecAndVariants";
import StepDetails from "./stepDetails";
import StepPricing from "./stepPricing";
import StepReview from "./stepReview";
import { useRouter } from "next/navigation";
import { MotionDiv } from "@/utils/providers/MotionWrapper";
import { CategoriesTypeResponse } from "@/types/Category";
import { useStepForm } from "@/utils/stepResolver";

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
    const router = useRouter()
    const { mutate, isPending } = useCreatePost(() => {
        router.push("/posts");
    });
    const [step, setStep] = useState(0);

    // validates only the schema of the current step (utils/stepResolver)
    const methods = useStepForm<FormValues>(stepSchemas, step, { defaultValues: initialValues });
    const { trigger, handleSubmit, watch } = methods;
    const categoryId = watch("snapshot.categoryPath")?.at(-1) ?? "";

    const next = async () => {
        const isValid = await trigger();
        if (isValid) {
            setStep((s) => Math.min(s + 1, steps.length - 1));
        }
    };

    const onSubmit = (values: FormValues) => {
        // Enter in a single-input step (e.g. Title) submits the form natively; before the last step it only means "next"
        if (step < steps.length - 1) {
            next();
            return;
        }

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
        };
        mutate(payload);
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

            {/* FORM LAYER */}
            <FormProvider {...methods}>
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8 relative z-10 text-left">

                    {/* STEP 0: CATEGORIES */}
                    {step === 0 && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <StepCategories data={data} isLoading={isLoading} />
                        </div>
                    )}

                    {/* STEP 1: GENERAL INFO */}
                    {step === 1 && <StepDetails />}

                    {/* STEP 2: SPECS */}
                    {step === 2 && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <StepProductSpecAndVariants
                                categoryId={categoryId}
                            />
                        </div>
                    )}

                    {/* STEP 3: PRICE & SHIPPING */}
                    {step === 3 && <StepPricing />}

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
                    {step === 6 && <StepReview />}

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
                                onClick={next}
                                className="px-8 h-12 text-sm font-bold text-white rounded-xl shadow-md transition duration-200 hover:opacity-95 hover:shadow-lg active:scale-[0.97]"
                                style={{ background: "var(--gradient)" }}
                            >
                                Next Step
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={isPending}
                                className="px-8 h-12 text-sm font-bold text-white flex items-center gap-2 rounded-xl shadow-md transition duration-200 hover:opacity-95 hover:shadow-lg active:scale-[0.97] disabled:opacity-50"
                                style={{ background: "var(--gradient)" }}
                            >
                                {isPending ? "Creating..." : "Publish Post"}
                                <GiConfirmed size={16} />
                            </button>
                        )}
                    </div>
                </form>
            </FormProvider>
        </div>
    );
}
