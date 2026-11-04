"use client";
import React, { useState } from "react";
import { FormProvider } from "react-hook-form";
import { GiConfirmed } from "react-icons/gi";
import { HiOutlineExclamationTriangle } from "react-icons/hi2";
import { useCreateStore } from "@/services/Store/useCreateStore";
import { useGetProfile } from "@/services/Profile/useGetProfile";
import { StoreFormValues } from "@/types/storeFormValues";
import { storeStepSchemas } from "@/validations/storeSchema";
import { MotionDiv } from "@/utils/providers/MotionWrapper";
import { useRouter } from "next/navigation";
import { useGet } from "@/utils/hooks/useReactQueryHooks";
import { CategoriesTypeResponse } from "@/types/Category";
import { useStepForm } from "@/utils/stepResolver";
import StepBasicInfo from "./stepBasicInfo";
import StepAddress from "./stepAddress";
import StepLogo from "./stepLogo";
import StepReview from "./stepReview";

const initialValues: StoreFormValues = {
  name: "",
  phone: "",
  category: "",
  logo: "",
  address: {
    province: "",
    city: "",
    street: "",
    postalCode: "",
    coordinates: {
      lat: 0,
      lng: 0,
    },
  },
  owner: "",
};

const steps = ["Basic Info", "Address", "Logo", "Review"];

export default function CreateShopForm() {
  const router = useRouter();
  const { mutate, isPending } = useCreateStore();
  const [step, setStep] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { user, isLoading: isProfileLoading } = useGetProfile();

  // the store sells in one main category (a category without a parent)
  const { data: categoriesRes } = useGet<CategoriesTypeResponse>("/categories");
  const mainCategories = categoriesRes?.data ?? [];

  // validates only the schema of the current step (utils/stepResolver)
  const methods = useStepForm<StoreFormValues>(storeStepSchemas, step, {
    defaultValues: initialValues,
    mode: "onTouched",
  });
  const { trigger, handleSubmit } = methods;

  const next = async () => {
    const isValid = await trigger();
    if (isValid) {
      setStep((s) => Math.min(s + 1, steps.length - 1));
    }
  };

  const back = () => {
    setSubmitError(null);
    setStep((s) => Math.max(s - 1, 0));
  };

  const onSubmit = (values: StoreFormValues) => {
    // Enter in a single-input step (e.g. Title) submits the form natively; before the last step it only means "next"
    if (step < steps.length - 1) {
      next();
      return;
    }

    if (!user?._id) {
      setSubmitError("You must be signed in to open a store.");
      return;
    }

    setSubmitError(null);

    const payload = {
      name: values.name,
      phone: values.phone,
      category: values.category,
      logo: values.logo,
      address: {
        province: values.address.province,
        city: values.address.city,
        street: values.address.street,
        postalCode: values.address.postalCode,
        coordinates: {
          lat: values.address.coordinates.lat,
          lng: values.address.coordinates.lng,
        },
      },
      owner: user._id,
    };

    mutate(payload, {
      onSuccess: () => {
        router.push("/dashboard/seller/my-store");
      },
      onError: (error) => {
        setSubmitError(
          error?.response?.data?.message ||
            "Something went wrong while creating your store. Please try again."
        );
      },
    });
  };

  return (
    <div className="min-w-[60%] bg-[var(--card)] backdrop-blur-xl rounded-[24px] border border-[var(--border)] shadow-[var(--card-shadow-1)] p-8 md:p-12 relative overflow-hidden transition-all duration-300">
      <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-transparent via-[var(--primary-400)] to-transparent" />
      <MotionDiv
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 2, type: "spring" }}
        className="mb-12 text-center"
      >
        <h2 className="text-2xl md:text-3xl font-black tracking-wider dark:text-slate-100 flex items-center justify-center gap-2">
          Create New
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-600 bg-red-50/60 dark:bg-rose-950/40 px-4 py-1 rounded-2xl border border-red-100/50 dark:border-rose-900/40 text-2xl font-black shadow-sm inline-block">
            Shop
          </span>
        </h2>
        <p className="text-sm font-semibold text-[var(--foreground-muted)] uppercase tracking-wide max-w-md mx-auto mt-3">
          Complete the steps below to open your store
        </p>
      </MotionDiv>

      {/* STEP PROGRESS */}
      <div className="flex items-center gap-2.5 mb-12 relative z-10 px-1">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-full transition-all duration-500 ease-out relative overflow-hidden ${
              i <= step ? "opacity-100" : "bg-[var(--border)] opacity-40"
            }`}
            style={i <= step ? { background: "var(--gradient)" } : {}}
          />
        ))}
      </div>

      {!isProfileLoading && !user?._id && (
        <div className="mb-8 rounded-xl border border-[var(--warning-500)]/30 bg-[var(--warning-bg)] px-4 py-3 text-sm text-[var(--warning-500)] flex items-center gap-2">
          <HiOutlineExclamationTriangle className="w-4 h-4 shrink-0" />
          You need to be signed in to open a store.
        </div>
      )}

      {/* FORM LAYER */}
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8 relative z-10 text-left">
          {/* STEP 0: BASIC INFO */}
          {step === 0 && <StepBasicInfo categories={mainCategories} />}

          {/* STEP 1: ADDRESS */}
          {step === 1 && <StepAddress />}

          {/* STEP 2: LOGO */}
          {step === 2 && <StepLogo />}

          {/* STEP 3: REVIEW */}
          {step === 3 && <StepReview submitError={submitError} />}

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
                disabled={isPending || isProfileLoading || !user?._id}
                className="px-8 h-12 text-sm font-bold text-white flex items-center gap-2 rounded-xl shadow-md transition duration-200 hover:opacity-95 hover:shadow-lg active:scale-[0.97] disabled:opacity-50"
                style={{ background: "var(--gradient)" }}
              >
                {isPending ? "Creating..." : "Open Shop"}
                <GiConfirmed size={16} />
              </button>
            )}
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
