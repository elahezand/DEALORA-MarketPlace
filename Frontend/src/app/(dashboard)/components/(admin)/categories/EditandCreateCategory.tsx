"use client";

import { useEffect, useState } from "react";
import { HiOutlineRectangleGroup, HiOutlinePlus, HiOutlineTrash } from "react-icons/hi2";
import { AdminFormModal, FormField, inputClass, textareaClass } from "../shared/AdminFormModal";
import { AdminCategory, CategoryFilterType } from "@/types/Category";
import { useCreateCategory } from "@/services/Categories/useCreateCategory";
import { useUpdateCategory } from "@/services/Categories/useUpdateCategory";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

const genKey = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `k_${Date.now()}_${Math.random().toString(36).slice(2)}`;

const getParentId = (parent: AdminCategory["parent"]): string => {
  if (!parent) return "";
  return typeof parent === "string" ? parent : parent._id ?? "";
};

const FILTER_TYPES: { value: CategoryFilterType; label: string }[] = [
  { value: "select", label: "Select (dropdown)" },
  { value: "radio", label: "Radio (choice pills)" },
  { value: "boolean", label: "Boolean (yes/no toggle)" },
  { value: "text", label: "Text (free input)" },
];

const TYPES_WITH_OPTIONS: CategoryFilterType[] = ["select", "radio"];

interface OptionFormState {
  _key: string;
  value: string;
  label: string;
}

interface FilterFormState {
  _key: string;
  name: string;
  slug: string;
  type: CategoryFilterType;
  required: boolean;
  options: OptionFormState[];
}

interface FormState {
  _id?: string;
  title: string;
  slug: string;
  description: string;
  isActive: boolean;
  parent: string; 
  filters: FilterFormState[];
}

const EMPTY_FORM: FormState = {
  title: "",
  slug: "",
  description: "",
  isActive: true,
  parent: "",
  filters: [],
};

const makeEmptyFilter = (): FilterFormState => ({
  _key: genKey(),
  name: "",
  slug: "",
  type: "select",
  required: false,
  options: [],
});

const makeEmptyOption = (): OptionFormState => ({
  _key: genKey(),
  value: "",
  label: "",
});

const categoryToFormState = (cat: AdminCategory): FormState => ({
  _id: cat._id,
  title: cat.title,
  slug: cat.slug,
  description: cat.description ?? "",
  isActive: cat.isActive,
  parent: getParentId(cat.parent),
  filters: (cat.filters ?? []).map((f) => ({
    _key: genKey(),
    name: f.name ?? "",
    slug: f.slug ?? "",
    type: f.type ?? "select",
    required: Boolean(f.required),
    options: (f.options ?? []).map((o) => ({
      _key: genKey(),
      value: o.value ?? "",
      label: o.label ?? "",
    })),
  })),
});

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
            <div
              key={flt._key}
              className="flex flex-col gap-3 p-4 rounded-xl border border-[var(--border)] bg-[var(--background-soft)]"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--foreground-muted)]">Filter #{idx + 1}</span>
                <button
                  type="button"
                  onClick={() => removeFilter(flt._key)}
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
                      updateFilter(flt._key, {
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
                    onChange={(e) => updateFilter(flt._key, { slug: slugify(e.target.value) })}
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
                    onChange={(e) => updateFilter(flt._key, { type: e.target.value as CategoryFilterType })}
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
                    onChange={(e) => updateFilter(flt._key, { required: e.target.checked })}
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
                      onClick={() => addOption(flt._key)}
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
                          updateOption(flt._key, opt._key, {
                            label: e.target.value,
                            value: opt.value || slugify(e.target.value),
                          })
                        }
                        placeholder="Label (e.g. Samsung)"
                      />
                      <input
                        className={`${inputClass} !h-8 text-xs font-mono`}
                        value={opt.value}
                        onChange={(e) => updateOption(flt._key, opt._key, { value: slugify(e.target.value) })}
                        placeholder="value (samsung)"
                      />
                      <button
                        type="button"
                        onClick={() => removeOption(flt._key, opt._key)}
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
          ))}
        </div>
      </form>
    </AdminFormModal>
  );
}