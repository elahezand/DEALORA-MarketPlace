"use client";
import React from "react";
import { useFormikContext } from "formik";
import { Skeleton } from "@heroui/react";
import { useGet } from "@/utils/hooks/useReactQueryHooks";
import { ISingleCategoryResponse } from "@/types/Category";

export default function StepProductSpecAndVariants({
  categoryId,
}: {
  categoryId: string;
}) {
  const { values, setFieldValue } = useFormikContext<any>();
  const { data: res, isLoading } = useGet<ISingleCategoryResponse>(
    `/categories/${categoryId}`,
    undefined,
    { enabled: !!categoryId }
  );

  const category = res?.data;
  const filters = (category?.filters ?? [])
  const specs = values?.snapshot?.specs ?? {};

  const updateSpec = (key: string, value: any) => {
    setFieldValue("snapshot.specs", {
      ...specs,
      [key]: value,
    });
  };

  const isSpecEmpty = filters.length > 0 && filters.every((f: any) => !specs?.[f.slug]);

  if (isLoading)
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-10 w-4/5 rounded-xl" />
        <Skeleton className="h-10 w-3/4 rounded-xl" />
      </div>
    );

  if (!categoryId || !filters.length) return null;

  return (
    <div className="space-y-8 antialiased">
      {/* HEADER SECTION */}
      <div className="space-y-1">
        <h3 className="text-xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
          Specifications
        </h3>
        <p className="text-sm font-medium" style={{ color: "var(--foreground-muted)" }}>
          Fill the details based on your product
        </p>
      </div>

      {/* ERROR ALERT */}
      {isSpecEmpty && (
        <div
          className="flex items-center gap-2 p-4 rounded-xl text-sm font-medium border"
          style={{
            backgroundColor: "var(--destructive-bg)",
            borderColor: "var(--destructive)",
            color: "var(--destructive)"
          }}
        >
          <span>📍</span>
          <p style={{ color: "var(--destructive)" }}>Please fill at least one specification</p>
        </div>
      )}

      {/* GRID FIELDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filters.map((field: any) => {
          const value = specs?.[field.slug];
          return (
            <div
              key={field.slug}
              className="card flex flex-col gap-3 p-5"
            >
              <label className="text-xs font-bold uppercase tracking-wider">
                {field.name}
              </label>

              {/* 1. SELECT FIELD */}
              {field.type === "select" && (
                <div className="relative">
                  <select
                    value={value ?? ""}
                    onChange={(e) => updateSpec(field.slug, e.target.value)}
                    className="h-11 w-full px-4 rounded-xl text-sm font-medium outline-none transition cursor-pointer appearance-none focus:ring-2"
                    style={{
                      backgroundColor: "var(--input-bg)",
                      border: "1px solid var(--border)",
                      color: "var(--foreground)",
                      boxShadow: "var(--card-shadow-2)"
                    }}
                  >
                    <option value="" style={{ color: "var(--foreground-subtle)" }}>
                      Select {field.name}
                    </option>
                    {field.options?.map((opt: any) => (
                      <option
                        key={opt.value}
                        value={opt.value}
                        style={{ backgroundColor: "var(--card-solid)", color: "var(--foreground)" }}
                      >
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <div
                    className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: "var(--foreground-subtle)" }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              )}

              {/* 2. RADIO FIELD */}
              {field.type === "radio" && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {field.options?.map((opt: any) => {
                    const isSelected = value === opt.value;
                    return (
                      <label
                        key={opt.value}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all duration-200 flex-1 min-w-[100px] justify-center text-center"
                        style={{
                          borderColor: isSelected ? "var(--primary-500)" : "var(--border)",
                          backgroundColor: isSelected ? "var(--primary-50)" : "var(--input-bg)",
                          color: isSelected ? "var(--primary-700)" : "var(--foreground-muted)",
                          boxShadow: isSelected ? "var(--focus-ring-shadow)" : "none"
                        }}
                      >
                        <input
                          type="radio"
                          className="sr-only"
                          checked={isSelected}
                          onChange={() => updateSpec(field.slug, opt.value)}
                        />
                        {opt.label}
                      </label>
                    );
                  })}
                </div>
              )}

              {/* 3. BOOLEAN FIELD */}
              {field.type === "boolean" && (
                <label className="flex items-center justify-between px-1 mt-1 cursor-pointer select-none">
                  <span className="text-sm font-semibold" style={{ color: "var(--foreground-muted)" }}>
                    Enable {field.name}
                  </span>
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={Boolean(value)}
                      onChange={(e) => updateSpec(field.slug, e.target.checked)}
                    />
                    <div
                      className="w-11 h-6 rounded-full transition-all duration-200 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"
                      style={{
                        backgroundColor: value ? "var(--primary-500)" : "var(--border-strong)"
                      }}
                    ></div>
                  </div>
                </label>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}