"use client";

import { useCallback, useState } from "react";
import { useFormContext } from "react-hook-form";
import { HiOutlineMapPin } from "react-icons/hi2";
import { StoreFormValues } from "@/types/storeFormValues";
import { getFieldError } from "@/utils/stepResolver";
import FieldError from "./FieldError";

export default function StepAddress() {
  const { register, setValue, formState: { errors } } = useFormContext<StoreFormValues>();
  const [isLocating, setIsLocating] = useState(false);

  const provinceError = getFieldError(errors, "address.province");
  const cityError = getFieldError(errors, "address.city");
  const streetError = getFieldError(errors, "address.street");
  const postalCodeError = getFieldError(errors, "address.postalCode");

  const handleUseCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setValue("address.coordinates.lat", position.coords.latitude);
        setValue("address.coordinates.lng", position.coords.longitude);
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [setValue]);

  return (
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
            type="text"
            placeholder="Province"
            {...register("address.province")}
            className="h-12 px-4 rounded-xl transition duration-200 w-full"
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
            type="text"
            placeholder="City"
            {...register("address.city")}
            className="h-12 px-4 rounded-xl transition duration-200 w-full"
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
          type="text"
          placeholder="Street, building number, unit..."
          {...register("address.street")}
          className="h-12 px-4 rounded-xl transition duration-200 w-full"
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
          type="text"
          placeholder="Postal / ZIP code"
          {...register("address.postalCode")}
          className="h-12 px-4 rounded-xl transition duration-200 w-full"
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
            onClick={handleUseCurrentLocation}
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
              type="number"
              step="any"
              {...register("address.coordinates.lat", { valueAsNumber: true })}
              className="h-10 px-3 rounded-lg text-sm w-full"
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
              type="number"
              step="any"
              {...register("address.coordinates.lng", { valueAsNumber: true })}
              className="h-10 px-3 rounded-lg text-sm w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
