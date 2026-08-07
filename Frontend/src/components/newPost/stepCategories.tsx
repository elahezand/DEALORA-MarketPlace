"use client";

import { useFormikContext } from "formik";
import React, { useState } from "react";
import { FaAngleDown } from "react-icons/fa";
import { Skeleton } from "@heroui/react";
import { FormValues } from "@/types/listingFormValue";

type Props = {
  data?: any;
  isLoading: boolean;
};

export default function StepCategories({ data, isLoading }: Props) {
  const { setFieldValue, values } = useFormikContext<FormValues>();
  const [openIds, setOpenIds] = useState<string[]>([]);
  const categoryPath = values?.snapshot?.categoryPath || [];

  const toggle = (id: string) => {
    setOpenIds((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  const isOpen = (id: string) => openIds.includes(id);
  const hasError = !categoryPath || categoryPath.length === 0;

  const renderTree = (categories: any[], level = 0, parents: string[] = []) => {
    return categories.map((category: any) => {
      const id = String(category._id);
      const hasChildren = category.subCategories?.length > 0;
      const currentPath = [...parents, id];
      const isSelected = categoryPath.includes(id);

      const getButtonStyles = () => {
        if (isSelected) {
          return "bg-[color-mix(in_srgb,var(--primary-400)_15%,transparent)] text-[var(--primary-500)] dark:text-[var(--accent-400)] font-black border border-[color-mix(in_srgb,var(--primary-400)_40%,transparent)] shadow-sm";
        }

        if (level === 0) {
          return "bg-[var(--background-soft)] border border-[var(--border)] text-[var(--foreground)] font-bold text-base hover:bg-[color-mix(in_srgb,var(--border)_50%,transparent)] shadow-sm";
        }

        if (level === 1) {
          return "bg-transparent text-[var(--foreground-muted)] font-semibold text-sm hover:bg-[var(--background-soft)]";
        }
        return "bg-transparent text-[var(--foreground-subtle)] font-normal text-xs hover:bg-[var(--background-soft)]";
      };

      return (
        <div key={id} className="text-right w-full">
          <div
            style={{ paddingRight: level * 24 }}
            className={`flex items-center justify-between gap-2 ${level === 0 ? "mt-3 mb-1" : "py-1"}`}
          >
            <button
              type="button"
              onClick={() => {
                if (hasChildren) {
                  toggle(id);
                  return;
                }
                setFieldValue("snapshot.categoryPath", currentPath);
              }}
              className={`flex items-center gap-3 w-full text-right px-4 py-3 rounded-xl transition-all duration-200 outline-none select-none ${getButtonStyles()}`}
            >
              <span className={`text-xs ${isSelected ? "text-[var(--primary-500)] dark:text-[var(--accent-400)]" : "text-[var(--foreground-subtle)]"}`}>
                {level === 0 ? "📁" : level === 1 ? "└─ ●" : "└─ ○"}
              </span>

              <span>
                {category.title}
              </span>
            </button>

            {hasChildren && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggle(id);
                }}
                className={`p-2.5 text-[var(--foreground-subtle)] hover:text-[var(--foreground)] transition-colors rounded-xl ${
                  level === 0 ? "bg-[var(--background-soft)] border border-[var(--border)]" : "hover:bg-[var(--background-soft)]"
                }`}
              >
                <FaAngleDown
                  className={`transition-transform duration-300 transform text-sm ${
                    isOpen(id) ? "rotate-180" : ""
                  }`}
                />
              </button>
            )}
          </div>

          {hasChildren && isOpen(id) && (
            <div className="mr-8 border-r-2 border-[var(--border)] pr-1 my-0.5 animate-in fade-in duration-200">
              {renderTree(category.subCategories, level + 1, currentPath)}
            </div>
          )}
        </div>
      );
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-3 w-full">
        <Skeleton className="h-12 w-full rounded-xl bg-[var(--border)] opacity-40" />
        <Skeleton className="h-11 w-4/5 rounded-xl bg-[var(--border)] opacity-40" />
        <Skeleton className="h-10 w-3/4 rounded-xl bg-[var(--border)] opacity-40" />
      </div>
    );
  }

  return (
    <div className="w-full">
      {hasError && (
        <div className="flex items-center gap-3 p-4 mb-4 rounded-xl bg-[var(--destructive-bg)] border border-[color-mix(in_srgb,var(--destructive)_20%,transparent)] text-sm font-bold text-[var(--destructive)] animate-in fade-in duration-300">
          <span className="text-base">📍</span>
          <p className="m-0 text-[var(--destructive)] text-sm">Please select a category</p>
        </div>
      )}

      <div className="max-h-[450px] overflow-y-auto p-6 custom-scrollbar  rounded-[var(--radius)] bg-[var(--card)] backdrop-blur-md shadow-[var(--card-shadow-2)]">
        {renderTree(data?.data || [])}
      </div>
    </div>
  );
}