import { AdminCategory, CategoryFilterType } from "@/types/Category";

/* form state + helpers of the category create/edit modal */

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

export const genKey = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `k_${Date.now()}_${Math.random().toString(36).slice(2)}`;

export const getParentId = (parent: AdminCategory["parent"]): string => {
  if (!parent) return "";
  return typeof parent === "string" ? parent : parent._id ?? "";
};

export const FILTER_TYPES: { value: CategoryFilterType; label: string }[] = [
  { value: "select", label: "Select (dropdown)" },
  { value: "radio", label: "Radio (choice pills)" },
  { value: "boolean", label: "Boolean (yes/no toggle)" },
  { value: "text", label: "Text (free input)" },
];

export const TYPES_WITH_OPTIONS: CategoryFilterType[] = ["select", "radio"];

export interface OptionFormState {
  _key: string;
  value: string;
  label: string;
}

export interface FilterFormState {
  _key: string;
  name: string;
  slug: string;
  type: CategoryFilterType;
  required: boolean;
  options: OptionFormState[];
}

export interface FormState {
  _id?: string;
  title: string;
  slug: string;
  description: string;
  isActive: boolean;
  parent: string; 
  filters: FilterFormState[];
}

export const EMPTY_FORM: FormState = {
  title: "",
  slug: "",
  description: "",
  isActive: true,
  parent: "",
  filters: [],
};

export const makeEmptyFilter = (): FilterFormState => ({
  _key: genKey(),
  name: "",
  slug: "",
  type: "select",
  required: false,
  options: [],
});

export const makeEmptyOption = (): OptionFormState => ({
  _key: genKey(),
  value: "",
  label: "",
});

export const categoryToFormState = (cat: AdminCategory): FormState => ({
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
