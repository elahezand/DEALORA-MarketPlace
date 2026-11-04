"use client";

import { useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { HiOutlineBuildingStorefront } from "react-icons/hi2";
import { StoreFormValues } from "@/types/storeFormValues";
import { getFieldError } from "@/utils/stepResolver";
import FieldError from "./FieldError";

export default function StepLogo() {
  const { watch, setValue, formState: { errors } } = useFormContext<StoreFormValues>();
  const logo = watch("logo");
  const logoError = getFieldError(errors, "logo");

  const handleLogoUpload = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setValue("logo", ev.target?.result as string, { shouldValidate: true, shouldTouch: true });
      };
      reader.readAsDataURL(file);
    },
    [setValue]
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex flex-col items-center gap-4">
        <label
          htmlFor="storeLogo"
          className="w-32 h-32 rounded-2xl border-2 border-dashed border-[var(--border)] flex items-center justify-center cursor-pointer hover:bg-[var(--background-soft)] transition overflow-hidden"
        >
          {logo ? (
            <img loading="lazy" decoding="async"
              src={logo}
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
            handleLogoUpload(file);
            e.target.value = "";
          }}
        />
        <p className="text-xs text-[var(--foreground-muted)]">
          Click to upload your store logo
        </p>
        <FieldError message={logoError} />
      </div>
    </div>
  );
}
