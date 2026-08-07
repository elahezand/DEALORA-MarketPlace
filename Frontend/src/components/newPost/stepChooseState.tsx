"use client";

import React, { useMemo, useEffect } from "react";
import { Field, useFormikContext } from "formik";
import { useLocation } from "@/services/Location/getLocations";
import Location from "./Location";
import { getCoords } from "@/utils/getCoords";

export default function StepChooseState() {
  const { setFieldValue, values } = useFormikContext<any>();
  const { data } = useLocation();
  let active = true;

  const states = data?.cities ?? [];
  const selectedState = values?.location?.state;

  const citiesForState = useMemo(() => {
    if (!selectedState) return [];

    const stateData = states.find(
      (s: any) => s.state === selectedState
    );
    return stateData?.cities ?? [];
  }, [states, selectedState]);

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newState = e.target.value;

    setFieldValue("location.state", newState);
    setFieldValue("location.city", "");
    setFieldValue("location.lat", null);
    setFieldValue("location.lng", null);
  };

  const hasErrorState = !selectedState;
  const hasErrorCity = selectedState && !values.location?.city;

  const handleCityChange = async (e: any) => {
    const cityName = e.target.value;
    setFieldValue("location.city", cityName);

    const coords = await getCoords(cityName, selectedState);    
    if (!active) return;

    if (coords) {
      setFieldValue("location.lat", coords.lat);
      setFieldValue("location.lng", coords.lng);
    }
  };

  useEffect(() => {
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-8 antialiased">
      {/* MAP WRAPPER */}
      <div className="rounded-2xl overflow-hidden border border-[var(--border)] shadow-[var(--card-shadow-1)] bg-[var(--card-solid)] p-1">
        <div className="rounded-xl overflow-hidden">
          <Location />
        </div>
      </div>

      {/* FORM GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* STATE SELECTOR */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-[var(--label-color)] flex items-center gap-1">
            State / Province
          </label>

          <div className="relative">
            <Field
              as="select"
              name="location.state"
              value={values.location?.state || ""}
              onChange={handleStateChange}
              className="h-11 w-full pl-4 pr-10 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-sm font-medium text-[var(--foreground)] outline-none transition appearance-none cursor-pointer focus:border-[var(--ring)] focus:bg-[var(--background)] focus:ring-4 focus:ring-[var(--focus-ring-shadow)]"
            >
              <option value="" className="text-[var(--foreground-subtle)] bg-[var(--background)]">Select State</option>
              {states.map((s: any) => (
                <option key={s.state} value={s.state} className="text-[var(--foreground)] bg-[var(--background)]">
                  {s.state}
                </option>
              ))}
            </Field>
            {/* Custom Chevron Arrow */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--foreground-subtle)]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {hasErrorState && (
            <p className="text-xs font-medium text-[var(--destructive)] mt-1 flex items-center gap-1">
              ⚠️ Please select a state
            </p>
          )}
        </div>

        {/* CITY SELECTOR */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-[var(--label-color)] flex items-center gap-1">
            City
          </label>

          <div className="relative">
            <Field
              as="select"
              name="location.city"
              value={values.location?.city || ""}
              disabled={!selectedState}
              onChange={handleCityChange}
              className="h-11 w-full pl-4 pr-10 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] text-sm font-medium text-[var(--foreground)] outline-none transition appearance-none cursor-pointer focus:border-[var(--ring)] focus:bg-[var(--background)] focus:ring-4 focus:ring-[var(--focus-ring-shadow)] disabled:opacity-50 disabled:bg-[var(--background-soft)] disabled:cursor-not-allowed"
            >
              <option value="" className="text-[var(--foreground-subtle)] bg-[var(--background)]">
                {selectedState ? "Select City" : "Select state first..."}
              </option>
              {citiesForState.map((c: any, index: number) => (
                <option key={index} value={c} className="text-[var(--foreground)] bg-[var(--background)]">
                  {c}
                </option>
              ))}
            </Field>
            {/* Custom Chevron Arrow */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--foreground-subtle)]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {hasErrorCity && (
            <p className="text-xs font-medium text-[var(--destructive)] mt-1 flex items-center gap-1">
              ⚠️ Please select a city
            </p>
          )}
        </div>
      </div>
    </div>
  );
}