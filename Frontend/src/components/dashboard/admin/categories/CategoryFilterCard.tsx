"use client";

import { HiOutlinePlus, HiOutlineTrash } from "react-icons/hi2";
import { CategoryFilterType } from "@/types/Category";
import { inputClass } from "../shared/AdminFormModal";
import { FILTER_TYPES, TYPES_WITH_OPTIONS, FilterFormState, OptionFormState, slugify } from "./categoryFormParts";

interface CategoryFilterCardProps {
  filter: FilterFormState;
  index: number;
  onRemove: (key: string) => void;
  onUpdate: (key: string, patch: Partial<FilterFormState>) => void;
  onAddOption: (filterKey: string) => void;
  onRemoveOption: (filterKey: string, optionKey: string) => void;
  onUpdateOption: (filterKey: string, optionKey: string, patch: Partial<OptionFormState>) => void;
}

/* one spec filter of a category (name, slug, type, required, options) */
export default function CategoryFilterCard({
  filter: flt,
  index: idx,
  onRemove,
  onUpdate,
  onAddOption,
  onRemoveOption,
  onUpdateOption,
}: CategoryFilterCardProps) {
  return (
    <div
            className="flex flex-col gap-3 p-4 rounded-xl border border-[var(--border)] bg-[var(--background-soft)]"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-[var(--foreground-muted)]">Filter #{idx + 1}</span>
        <button
          type="button"
          onClick={() => onRemove(flt._key)}
          className="text-[var(--destructive)] hover:opacity-70 transition-opacity"
          aria-label="Remove filter"
        >
          <HiOutlineTrash className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground-subtle)]">
            Name
          </label>
          <input
            className={inputClass}
            value={flt.name}
            onChange={(e) => {
              const name = e.target.value;
              onUpdate(flt._key, {
                name,
                slug: flt.slug || slugify(name),
              });
            }}
            placeholder="e.g. Brand"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground-subtle)]">
            Slug
          </label>
          <input
            className={`${inputClass} font-mono`}
            value={flt.slug}
            onChange={(e) => onUpdate(flt._key, { slug: slugify(e.target.value) })}
            placeholder="brand"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground-subtle)]">
            Type
          </label>
          <select
            className={inputClass}
            value={flt.type}
            onChange={(e) => onUpdate(flt._key, { type: e.target.value as CategoryFilterType })}
          >
            {FILTER_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 cursor-pointer self-end pb-2">
          <input
            type="checkbox"
            checked={flt.required}
            onChange={(e) => onUpdate(flt._key, { required: e.target.checked })}
            className="!w-4 !h-4 rounded border-[var(--border)]"
          />
          <span className="text-xs font-bold text-[var(--foreground-muted)]">Required</span>
        </label>
      </div>

      {TYPES_WITH_OPTIONS.includes(flt.type) && (
        <div className="flex flex-col gap-2 pt-2 border-t border-[var(--border)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground-subtle)]">
              Options
            </span>
            <button
              type="button"
              onClick={() => onAddOption(flt._key)}
              className="text-[10px] font-bold text-[var(--primary-500)] hover:opacity-70 transition-opacity flex items-center gap-1"
            >
              <HiOutlinePlus className="w-3 h-3" /> Add Option
            </button>
          </div>

          {flt.options.length === 0 && (
            <p className="text-[11px] text-[var(--foreground-subtle)] italic">
              No options yet — add at least one for this field to be usable.
            </p>
          )}

          {flt.options.map((opt) => (
            <div key={opt._key} className="flex items-center gap-2">
              <input
                className={`${inputClass} !h-8 text-xs`}
                value={opt.label}
                onChange={(e) =>
                  onUpdateOption(flt._key, opt._key, {
                    label: e.target.value,
                    value: opt.value || slugify(e.target.value),
                  })
                }
                placeholder="Label (e.g. Samsung)"
              />
              <input
                className={`${inputClass} !h-8 text-xs font-mono`}
                value={opt.value}
                onChange={(e) => onUpdateOption(flt._key, opt._key, { value: slugify(e.target.value) })}
                placeholder="value (samsung)"
              />
              <button
                type="button"
                onClick={() => onRemoveOption(flt._key, opt._key)}
                className="text-[var(--destructive)] hover:opacity-70 transition-opacity shrink-0"
                aria-label="Remove option"
              >
                <HiOutlineTrash className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
