"use client";
import React, { useState, useCallback } from "react";
import { Formik, Form, FormikErrors, FormikTouched, getIn } from "formik";
import { GiConfirmed } from "react-icons/gi";
import {
  HiOutlineBuildingStorefront,
  HiOutlineMapPin,
  HiOutlineExclamationTriangle,
} from "react-icons/hi2";
import { useCreateStore } from "@/services/Store/useCreateStore";
import { useGetProfile } from "@/services/Profile/getProfile";
import { StoreFormValues } from "@/types/storeFormValues";
import { storeStepSchemas } from "@/validations/storeSchema";
import { MotionDiv } from "@/utils/providers/MotionWrapper";
import { useRouter } from "next/navigation";
import { ZodError } from "zod";

const initialValues: StoreFormValues = {
  name: "",
  phone: "",
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
const stepFields: (keyof StoreFormValues | string)[][] = [
  ["name", "phone"],
  [
    "address.province",
    "address.city",
    "address.street",
    "address.postalCode",
    "address.coordinates.lat",
    "address.coordinates.lng",
  ],
  ["logo"],
  [],
];

function useFieldError(
  errors: FormikErrors<StoreFormValues>,
  touched: FormikTouched<StoreFormValues>,
  path: string
): string | undefined {
  const isTouched = getIn(touched, path);
  const error = getIn(errors, path);
  return isTouched && typeof error === "string" ? error : undefined;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-xs font-medium text-[var(--destructive)] mt-0.5 flex items-center gap-1 ml-1 animate-in fade-in slide-in-from-top-1">
      <HiOutlineExclamationTriangle className="w-3.5 h-3.5 shrink-0" />
      {message}
    </p>
  );
}

export default function CreateShop() {
  const router = useRouter();
  const { mutate, isPending } = useCreateStore();
  const [step, setStep] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const { user, isLoading: isProfileLoading } = useGetProfile();

  const validateStep = (values: StoreFormValues) => {
    try {
      storeStepSchemas[step].parse(values);
      return {};
    } catch (err) {
      const formatted: FormikErrors<StoreFormValues> = {};
      if (err instanceof ZodError) {
        err.issues.forEach((issue) => {
          const path = issue.path.join(".");
          (formatted as any)[path] = issue.message;
        });
      }
      return formatted;
    }
  };

  const next = async (
    validateForm: () => Promise<FormikErrors<StoreFormValues>>,
    setTouched: (touched: FormikTouched<StoreFormValues>) => void,
    currentTouched: FormikTouched<StoreFormValues>
  ) => {
    const fieldsToTouch = stepFields[step];
    const updatedTouched = { ...currentTouched };

    fieldsToTouch.forEach((path) => {
      const keys = path.split(".");
      let current: any = updatedTouched;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = true;
    });

    setTouched(updatedTouched);

    const errors = await validateForm();
    if (Object.keys(errors).length === 0) {
      setStep((s) => Math.min(s + 1, steps.length - 1));
    }
  };

  const back = () => {
    setSubmitError(null);
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleLogoUpload = useCallback(
    (file: File, setFieldValue: (field: string, value: any) => void, setFieldTouched: (field: string, touched?: boolean) => void) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setFieldValue("logo", ev.target?.result as string);
        setFieldTouched("logo", true);
      };
      reader.readAsDataURL(file);
    },
    []
  );

  const handleUseCurrentLocation = useCallback(
    (setFieldValue: (field: string, value: any) => void) => {
      if (!navigator.geolocation) return;
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFieldValue("address.coordinates.lat", position.coords.latitude);
          setFieldValue("address.coordinates.lng", position.coords.longitude);
          setIsLocating(false);
        },
        () => {
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    },
    []
  );

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

      {/* FORMIK LAYER */}
      <Formik<StoreFormValues>
        initialValues={initialValues}
        validate={validateStep}
        onSubmit={(values, { setSubmitting }) => {
          if (!user?._id) {
            setSubmitError("You must be signed in to open a store.");
            return;
          }

          setSubmitError(null);

          const payload = {
            name: values.name,
            phone: values.phone,
            logo: values.logo || null,
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
            onSuccess: (createdStore: any) => {
              setSubmitting(false);
              const slug =
                createdStore?.data?.data?.slug ?? createdStore?.slug;
              router.push(slug ? `/dashboard/store/${slug}` : "/dashboard");
            },
            onError: (error: any) => {
              setSubmitting(false);
              setSubmitError(
                error?.response?.data?.message ||
                  "Something went wrong while creating your store. Please try again."
              );
            },
          });
        }}
      >
        {({
          values,
          handleChange,
          handleBlur,
          setFieldValue,
          setFieldTouched,
          setTouched,
          validateForm,
          errors,
          touched,
        }) => {
          const nameError = useFieldError(errors, touched, "name");
          const phoneError = useFieldError(errors, touched, "phone");
          const provinceError = useFieldError(errors, touched, "address.province");
          const cityError = useFieldError(errors, touched, "address.city");
          const streetError = useFieldError(errors, touched, "address.street");
          const postalCodeError = useFieldError(errors, touched, "address.postalCode");
          const logoError = useFieldError(errors, touched, "logo");

          return (
            <Form className="flex flex-col gap-8 relative z-10 text-left">
              {/* STEP 0: BASIC INFO */}
              {step === 0 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="storeName"
                      className="text-xs font-bold uppercase tracking-wider ml-1 text-[var(--label-color)]"
                    >
                      Store Name
                    </label>
                    <input
                      id="storeName"
                      name="name"
                      type="text"
                      placeholder="Enter your store name..."
                      value={values.name}
                      className="h-12 px-4 rounded-xl transition duration-200 w-full"
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                    <FieldError message={nameError} />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="storePhone"
                      className="text-xs font-bold uppercase tracking-wider ml-1 text-[var(--label-color)]"
                    >
                      Phone Number
                    </label>
                    <input
                      id="storePhone"
                      name="phone"
                      type="tel"
                      placeholder="e.g. +1 555 123 4567"
                      value={values.phone}
                      className="h-12 px-4 rounded-xl transition duration-200 w-full"
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                    <FieldError message={phoneError} />
                  </div>
                </div>
              )}

              {/* STEP 1: ADDRESS */}
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label
                        htmlFor="province"
                        className="text-xs font-bold uppercase tracking-wider ml-1 text-[var(--label-color)]"
                      >
                        Province
                      </label>
                      <input
                        id="province"
                        name="address.province"
                        type="text"
                        placeholder="Province"
                        value={values.address.province}
                        className="h-12 px-4 rounded-xl transition duration-200 w-full"
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                      <FieldError message={provinceError} />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label
                        htmlFor="city"
                        className="text-xs font-bold uppercase tracking-wider ml-1 text-[var(--label-color)]"
                      >
                        City
                      </label>
                      <input
                        id="city"
                        name="address.city"
                        type="text"
                        placeholder="City"
                        value={values.address.city}
                        className="h-12 px-4 rounded-xl transition duration-200 w-full"
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                      <FieldError message={cityError} />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="street"
                      className="text-xs font-bold uppercase tracking-wider ml-1 text-[var(--label-color)]"
                    >
                      Street Address
                    </label>
                    <input
                      id="street"
                      name="address.street"
                      type="text"
                      placeholder="Street, building number, unit..."
                      value={values.address.street}
                      className="h-12 px-4 rounded-xl transition duration-200 w-full"
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                    <FieldError message={streetError} />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="postalCode"
                      className="text-xs font-bold uppercase tracking-wider ml-1 text-[var(--label-color)]"
                    >
                      Postal Code
                    </label>
                    <input
                      id="postalCode"
                      name="address.postalCode"
                      type="text"
                      placeholder="Postal / ZIP code"
                      value={values.address.postalCode}
                      className="h-12 px-4 rounded-xl transition duration-200 w-full"
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                    <FieldError message={postalCodeError} />
                  </div>

                  <div className="rounded-xl border border-[var(--border)] p-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-[var(--label-color)]">
                        Store Coordinates
                      </p>
                      <button
                        type="button"
                        onClick={() => handleUseCurrentLocation(setFieldValue)}
                        disabled={isLocating}
                        className="flex items-center gap-1.5 px-4 h-9 text-xs font-bold rounded-lg border border-[var(--border)] hover:bg-[var(--background-soft)] transition disabled:opacity-50"
                      >
                        <HiOutlineMapPin className="w-4 h-4" />
                        {isLocating ? "Locating..." : "Use My Location"}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label
                          htmlFor="lat"
                          className="text-xs text-[var(--foreground-muted)]"
                        >
                          Latitude
                        </label>
                        <input
                          id="lat"
                          name="address.coordinates.lat"
                          type="number"
                          step="any"
                          value={values.address.coordinates.lat}
                          className="h-10 px-3 rounded-lg text-sm w-full"
                          onChange={handleChange}
                          onBlur={handleBlur}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label
                          htmlFor="lng"
                          className="text-xs text-[var(--foreground-muted)]"
                        >
                          Longitude
                        </label>
                        <input
                          id="lng"
                          name="address.coordinates.lng"
                          type="number"
                          step="any"
                          value={values.address.coordinates.lng}
                          className="h-10 px-3 rounded-lg text-sm w-full"
                          onChange={handleChange}
                          onBlur={handleBlur}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: LOGO */}
              {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="flex flex-col items-center gap-4">
                    <label
                      htmlFor="storeLogo"
                      className="w-32 h-32 rounded-2xl border-2 border-dashed border-[var(--border)] flex items-center justify-center cursor-pointer hover:bg-[var(--background-soft)] transition overflow-hidden"
                    >
                      {values.logo ? (
                        <img
                          src={values.logo}
                          alt="Store logo"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <HiOutlineBuildingStorefront className="w-10 h-10 text-[var(--foreground-muted)]" />
                      )}
                    </label>
                    <input
                      id="storeLogo"
                      name="logo"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        handleLogoUpload(file, setFieldValue, setFieldTouched);
                        e.target.value = "";
                      }}
                    />
                    <p className="text-xs text-[var(--foreground-muted)]">
                      Click to upload your store logo
                    </p>
                    <FieldError message={logoError} />
                  </div>
                </div>
              )}

              {/* STEP 3: REVIEW */}
              {step === 3 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--background-soft)] p-6 flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-[var(--card)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
                      {values.logo ? (
                        <img
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
                      {values.address.coordinates.lat.toFixed(5)},{" "}
                      {values.address.coordinates.lng.toFixed(5)}
                    </p>
                  </div>

                  {submitError && (
                    <div className="rounded-xl border border-[var(--destructive)]/30 bg-[var(--destructive-bg)] px-4 py-3 text-sm text-[var(--destructive)] flex items-center gap-2">
                      <HiOutlineExclamationTriangle className="w-4 h-4 shrink-0" />
                      {submitError}
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
                    onClick={() => next(validateForm, setTouched, touched)}
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
            </Form>
          );
        }}
      </Formik>
    </div>
  );
}