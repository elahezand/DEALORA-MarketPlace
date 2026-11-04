"use client";

import { useEffect, useState } from "react";
import { HiOutlineRectangleGroup, HiOutlinePlus } from "react-icons/hi2";
import { AdminFormModal, FormField, inputClass, textareaClass } from "../shared/AdminFormModal";
import { AdminCategory } from "@/types/Category";
import { useCreateCategory } from "@/services/Categories/useCreateCategory";
import { useUpdateCategory } from "@/services/Categories/useUpdateCategory";
import CategoryFilterCard from "./CategoryFilterCard";
import {
  EMPTY_FORM,
  FilterFormState,
  FormState,
  OptionFormState,
  TYPES_WITH_OPTIONS,
  categoryToFormState,
  getParentId,
  makeEmptyFilter,
  makeEmptyOption,
  slugify,
} from "./categoryFormParts";


interface EditandCreateCategoryProps {
  isOpen: boolean;
  onClose: () => void;
  category: AdminCategory | null;
  categories: AdminCategory[];
}

export default function EditandCreateCategory({
  isOpen,
  onClose,
  category,
  categories,
}: EditandCreateCategoryProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  useEffect(() => {
    if (!isOpen) return;
    setForm(category ? categoryToFormState(category) : EMPTY_FORM);
  }, [isOpen, category]);

  const { mutate: createCategory, isPending: isCreating } = useCreateCategory(onClose);
  const { mutate: updateCategory, isPending: isUpdating } = useUpdateCategory(onClose);

  function addFilter() {
    setForm((f) => ({ ...f, filters: [...f.filters, makeEmptyFilter()] }));
  }

  function removeFilter(key: string) {
    setForm((f) => ({ ...f, filters: f.filters.filter((flt) => flt._key !== key) }));
  }

  function updateFilter(key: string, patch: Partial<FilterFormState>) {
    setForm((f) => ({
      ...f,
      filters: f.filters.map((flt) => (flt._key === key ? { ...flt, ...patch } : flt)),
    }));
  }

  function addOption(filterKey: string) {
    setForm((f) => ({
      ...f,
      filters: f.filters.map((flt) =>
        flt._key === filterKey ? { ...flt, options: [...flt.options, makeEmptyOption()] } : flt
      ),
    }));
  }

  function removeOption(filterKey: string, optionKey: string) {
    setForm((f) => ({
      ...f,
      filters: f.filters.map((flt) =>
        flt._key === filterKey
          ? { ...flt, options: flt.options.filter((o) => o._key !== optionKey) }
          : flt
      ),
    }));
  }

  function updateOption(filterKey: string, optionKey: string, patch: Partial<OptionFormState>) {
    setForm((f) => ({
      ...f,
      filters: f.filters.map((flt) =>
        flt._key === filterKey
          ? {
              ...flt,
              options: flt.options.map((o) => (o._key === optionKey ? { ...o, ...patch } : o)),
            }
          : flt
      ),
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.slug.trim()) return;

    const filters = form.filters
      .filter((flt) => flt.name.trim() && flt.slug.trim())
      .map((flt) => ({
        name: flt.name.trim(),
        slug: flt.slug.trim(),
        type: flt.type,
        required: flt.required,
        options: TYPES_WITH_OPTIONS.includes(flt.type)
          ? flt.options
              .filter((o) => o.value.trim() && o.label.trim())
              .map((o) => ({ value: o.value.trim(), label: o.label.trim() }))
          : [],
      }));

    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      description: form.description.trim(),
      isActive: form.isActive,
      parent: form.parent || null,
      filters,
    };

    if (form._id) {
      updateCategory({_id: form._id, ...payload });
    } else {
      createCategory(payload);
    }
  }

  const isSaving = isCreating || isUpdating;

  const getDescendantIds = (rootId: string): Set<string> => {
    const ids = new Set<string>();
    let frontier = [rootId];
    while (frontier.length > 0) {
      const next: string[] = [];
      for (const cat of categories) {
        const pid = getParentId(cat.parent);
        if (frontier.includes(pid)) {
          ids.add(cat._id);
          next.push(cat._id);
        }
      }
      frontier = next;
    }
    return ids;
  };

  const excludedIds = form._id
    ? new Set([form._id, ...getDescendantIds(form._id)])
    : new Set<string>();

  const parentOptions = categories.filter((cat) => !excludedIds.has(cat._id));

  return (
    <AdminFormModal
      isOpen={isOpen}
      onClose={onClose}
      title={form._id ? "Edit Category" : "New Category"}
      icon={HiOutlineRectangleGroup}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold px-4 h-9 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--background-soft)] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="category-form"
            disabled={isSaving || !form.title.trim() || !form.slug.trim()}
            className="btn-primary !w-auto px-5 h-9 text-xs disabled:opacity-50"
          >
            {isSaving ? "Saving..." : form._id ? "Save Changes" : "Create Category"}
          </button>
        </>
      }
    >
      <form id="category-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField label="Title">
          <input
            className={inputClass}
            value={form.title}
            onChange={(e) => {
              const title = e.target.value;
              setForm((f) => ({
                ...f,
                title,
                slug: f._id ? f.slug : slugify(title),
              }));
            }}
            placeholder="e.g. Electronics"
            required
          />
        </FormField>
        <FormField label="Slug">
          <input
            className={`${inputClass} font-mono`}
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
            placeholder="electronics"
            required
          />
        </FormField>
        <FormField label="Parent Category (optional)">
          <select
            className={inputClass}
            value={form.parent}
            onChange={(e) => setForm((f) => ({ ...f, parent: e.target.value }))}
          >
            <option value="">— Top-level (no parent) —</option>
            {parentOptions.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.title}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Description (optional)">
          <textarea
            className={textareaClass}
            rows={3}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Short description of this category"
          />
        </FormField>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            className="!w-4 !h-4 rounded border-[var(--border)]"
          />
          <span className="text-xs font-bold text-[var(--foreground-muted)]">Active</span>
        </label>

        {/* FILTERS —*/}
        <div className="flex flex-col gap-3 pt-2 border-t border-[var(--border)]">
          <div className="flex items-center justify-between pt-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)]">
              Filters ({form.filters.length})
            </span>
            <button
              type="button"
              onClick={addFilter}
              className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--background-soft)] transition-colors flex items-center gap-1"
            >
              <HiOutlinePlus className="w-3.5 h-3.5" /> Add Filter
            </button>
          </div>

          {form.filters.length === 0 && (
            <p className="text-xs text-[var(--foreground-subtle)] italic">
              No filters yet — these become the spec fields shown when someone lists a product in this category.
            </p>
          )}

          {form.filters.map((flt, idx) => (
            <CategoryFilterCard
              key={flt._key}
              filter={flt}
              index={idx}
              onRemove={removeFilter}
              onUpdate={updateFilter}
              onAddOption={addOption}
              onRemoveOption={removeOption}
              onUpdateOption={updateOption}
            />
          ))}
        </div>
      </form>
    </AdminFormModal>
  );
}
