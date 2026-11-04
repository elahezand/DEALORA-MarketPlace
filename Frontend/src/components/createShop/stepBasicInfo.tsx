"use client";

import { useFormContext } from "react-hook-form";
import { ICategory } from "@/types/Category";
import { StoreFormValues } from "@/types/storeFormValues";
import { getFieldError } from "@/utils/stepResolver";
import FieldError from "./FieldError";

export default function StepBasicInfo({ categories: mainCategories }: { categories: ICategory[] }) {
  const { register, formState: { errors } } = useFormContext<StoreFormValues>();

  const nameError = getFieldError(errors, "name");
  const phoneError = getFieldError(errors, "phone");
  const categoryError = getFieldError(errors, "category");

  return (
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
          type="text"
          placeholder="Enter your store name..."
          {...register("name")}
          className="h-12 px-4 rounded-xl transition duration-200 w-full"
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
          type="tel"
          placeholder="e.g. +1 555 123 4567"
          {...register("phone")}
          className="h-12 px-4 rounded-xl transition duration-200 w-full"
        />
        <FieldError message={phoneError} />
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="storeCategory"
          className="text-xs font-bold uppercase tracking-wider ml-1 text-[var(--label-color)]"
        >
          What does your store sell?
        </label>
        <select
          id="storeCategory"
          {...register("category")}
          className="h-12 px-4 rounded-xl transition duration-200 w-full"
        >
          <option value="">Choose a category...</option>
          {mainCategories.map((c) => (
            <option key={c._id} value={c._id}>
              {c.title}
            </option>
          ))}
        </select>
        <p className="text-xs text-[var(--foreground-muted)] ml-1">
          You can only make offers on products in this category.
        </p>
        <FieldError message={categoryError} />
      </div>
    </div>
  );
}
