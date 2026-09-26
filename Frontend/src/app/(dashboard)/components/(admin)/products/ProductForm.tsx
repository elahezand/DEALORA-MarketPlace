"use client";
import { Fragment, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { HiOutlineArrowLeft, HiOutlinePlus, HiOutlineTrash, HiOutlineXMark } from "react-icons/hi2";
import { useGet } from "@/utils/hooks/useReactQueryHooks";
import { CategoriesTypeResponse, ICategory, ICategoryFilter } from "@/types/Category";
import { ListingProps } from "@/types/Listings";
import { getUrl } from "@/utils/helper";
import { FormField, inputClass, textareaClass } from "../shared/AdminFormModal";
import {
  ProductInput,
  useSaveProduct,
} from "@/services/Products/useProductMutations";

type AttributeRow = { key: string; value: string };

type VariantRow = {
  _id?: string;
  attributes: AttributeRow[];
  sku: string;
  price: string;
  discount: string;
  stock: string;
};

const emptyVariant = (): VariantRow => ({
  attributes: [{ key: "color", value: "" }],
  sku: "",
  price: "",
  discount: "0",
  stock: "0",
});

const finalPriceOf = (price: string, discount: string) => {
  const p = Number(price) || 0;
  const d = Math.min(Math.max(Number(discount) || 0, 0), 100);
  return Math.round((p - (p * d) / 100) * 100) / 100;
};

const sectionClass = "card rounded-2xl border border-[var(--border)] bg-[var(--card-solid)] p-6 flex flex-col gap-4";
const sectionTitle = "text-sm font-black text-[var(--foreground)]";

function findPath(categories: ICategory[], ids: string[]): ICategory[] {
  const path: ICategory[] = [];
  let level = categories;
  for (const id of ids) {
    const found = level.find((c) => String(c._id) === id);
    if (!found) break;
    path.push(found);
    level = found.subCategories ?? [];
  }
  return path;
}

interface ProductFormProps {
  product?: ListingProps;
}

export default function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const isEdit = !!product;

  const { data: categoriesRes, isLoading: categoriesLoading } = useGet<CategoriesTypeResponse>("/categories");
  const categories = categoriesRes?.data ?? [];

  const [title, setTitle] = useState(product?.title ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [status] = useState<ProductInput["status"]>(
    (product?.status as ProductInput["status"]) ?? "draft"
  );
  const [condition, setCondition] = useState<ProductInput["condition"]>(product?.condition ?? "new");
  const [shippingType, setShippingType] = useState<ProductInput["shipping"]["type"]>(
    product?.shipping?.type ?? "standard"
  );
  const [shippingCost, setShippingCost] = useState(String(product?.shipping?.cost ?? 0));
  const [tags, setTags] = useState((product?.tags ?? []).join(", "));
  const [categoryIds, setCategoryIds] = useState<string[]>(
    (product?.categoryPath ?? []).map((c) => String(typeof c === "object" ? c._id : c))
  );
  const [specs, setSpecs] = useState<Record<string, string>>(product?.specs ?? {});
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [files, setFiles] = useState<File[]>([]);
  const [variants, setVariants] = useState<VariantRow[]>(
    product?.variants?.length
      ? product.variants.map((v) => ({
          _id: v._id,
          attributes: Object.entries(v.attributes ?? {}).map(([key, value]) => ({ key, value })),
          sku: v.sku,
          price: String(v.price),
          discount: String(v.discount ?? 0),
          stock: String(v.stock ?? 0),
        }))
      : [emptyVariant()]
  );

  const categoryPath = useMemo(() => findPath(categories, categoryIds), [categories, categoryIds]);

  // filters of every category on the path (a deeper category overrides the same slug)
  const filters = useMemo(() => {
    const bySlug = new Map<string, ICategoryFilter>();
    categoryPath.forEach((c) => (c.filters ?? []).forEach((f) => bySlug.set(f.slug, f)));
    return Array.from(bySlug.values());
  }, [categoryPath]);

  const { mutate: save, isPending } = useSaveProduct(product?._id, () => {
    router.push("/dashboard/admin/products");
  });

  /* ---------- category ---------- */
  const selectCategory = (level: number, id: string) => {
    setCategoryIds((prev) => (id ? [...prev.slice(0, level), id] : prev.slice(0, level)));
  };

  const categoryLevels: ICategory[][] = [categories];
  categoryPath.forEach((c) => {
    if (c.subCategories?.length) categoryLevels.push(c.subCategories);
  });

  /* ---------- variants ---------- */
  const updateVariant = (index: number, patch: Partial<VariantRow>) =>
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)));

  const updateAttribute = (vIndex: number, aIndex: number, patch: Partial<AttributeRow>) =>
    updateVariant(vIndex, {
      attributes: variants[vIndex].attributes.map((a, i) => (i === aIndex ? { ...a, ...patch } : a)),
    });

  /* ---------- submit ---------- */
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    submitWith(isEdit ? status : "draft");
  };

  const submitWith = (targetStatus: ProductInput["status"]) => {

    if (!title.trim() || !description.trim()) return toast.error("Title and description are required");
    if (!categoryIds.length) return toast.error("Choose a category");
    if (!variants.length) return toast.error("Add at least one variant");

    const skus = variants.map((v) => v.sku.trim().toLowerCase());
    if (skus.some((s) => !s)) return toast.error("Every variant needs a SKU");
    if (new Set(skus).size !== skus.length) return toast.error("SKUs must be unique");
    if (variants.some((v) => v.price === "" || Number(v.price) < 0)) {
      return toast.error("Every variant needs a valid price");
    }

    const payload: ProductInput = {
      title: title.trim(),
      description: description.trim(),
      categoryPath: categoryIds,
      condition,
      status: targetStatus,
      shipping: { type: shippingType, cost: Number(shippingCost) || 0 },
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      specs: Object.fromEntries(
        Object.entries(specs).filter(([slug, value]) => value !== "" && filters.some((f) => f.slug === slug))
      ) as Record<string, string>,
      images,
      variants: variants.map((v) => ({
        ...(v._id ? { _id: v._id } : {}),
        attributes: Object.fromEntries(
          v.attributes
            .filter((a: AttributeRow) => a.key.trim() && a.value.trim())
            .map((a: AttributeRow) => [a.key.trim(), a.value.trim()])
        ) as Record<string, string>,
        sku: v.sku.trim(),
        price: Number(v.price),
        discount: Number(v.discount) || 0,
        stock: Number(v.stock) || 0,
      })),
    };

    save({ payload, files });
  };

  const secondaryButton =
    "h-11 px-5 rounded-xl border border-[var(--border)] text-sm font-bold text-[var(--foreground)] hover:bg-[var(--background-soft)] disabled:opacity-50";
  const primaryButton =
    "h-11 px-6 rounded-xl bg-[var(--primary-500)] text-white text-sm font-bold hover:bg-[var(--primary-600)] disabled:opacity-50";

  const actionButtons = (
    <div className="flex items-center gap-2 flex-wrap">
      <button type="button" disabled={isPending} onClick={() => submitWith("draft")} className={secondaryButton}>
        {isEdit && status === "draft" ? "Save draft" : "Save as draft"}
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => submitWith(!isEdit || status === "draft" ? "active" : status)}
        className={primaryButton}
      >
        {isPending ? "Saving..." : !isEdit ? "Publish" : status === "draft" ? "Save & publish" : "Save changes"}
      </button>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 pb-10">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <Link
            href="/dashboard/admin/products"
            className="inline-flex items-center gap-1 text-xs font-bold text-[var(--foreground-muted)] hover:text-[var(--primary-500)] mb-2"
          >
            <HiOutlineArrowLeft /> Products
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="!text-2xl font-black text-[var(--foreground)] tracking-tight">
              {isEdit ? "Edit Product" : "Add Product"}
            </h1>
            {isEdit && (
              <span className="text-[11px] font-bold uppercase px-2 py-1 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)]">
                {status}
              </span>
            )}
          </div>
        </div>
        {actionButtons}
      </div>

      {/* Basic info */}
      <section className={sectionClass}>
        <h2 className={sectionTitle}>Basic info</h2>
        <FormField label="Title">
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} />
        </FormField>
        <FormField label="Description">
          <textarea
            className={textareaClass}
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={3000}
          />
        </FormField>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormField label="Condition">
            <select className={inputClass} value={condition} onChange={(e) => setCondition(e.target.value as ProductInput["condition"])}>
              <option value="new">New</option>
              <option value="used">Used</option>
            </select>
          </FormField>
          <FormField label="Shipping">
            <select
              className={inputClass}
              value={shippingType}
              onChange={(e) => setShippingType(e.target.value as ProductInput["shipping"]["type"])}
            >
              <option value="standard">Standard</option>
              <option value="express">Express</option>
              <option value="free">Free</option>
            </select>
          </FormField>
          <FormField label="Shipping cost">
            <input
              type="number"
              min={0}
              className={inputClass}
              value={shippingCost}
              onChange={(e) => setShippingCost(e.target.value)}
              disabled={shippingType === "free"}
            />
          </FormField>
        </div>
        <FormField label="Tags (comma separated)">
          <input className={inputClass} value={tags} onChange={(e) => setTags(e.target.value)} placeholder="apple, laptop, m3" />
        </FormField>
      </section>

      {/* Category + specs */}
      <section className={sectionClass}>
        <h2 className={sectionTitle}>Category</h2>
        {categoriesLoading ? (
          <div className="h-11 rounded-xl bg-[var(--background-soft)] animate-pulse" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categoryLevels.map((options, level) => (
              <select
                key={level}
                className={inputClass}
                value={categoryIds[level] ?? ""}
                onChange={(e) => selectCategory(level, e.target.value)}
              >
                <option value="">{level === 0 ? "Choose category" : "Choose sub-category"}</option>
                {options.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title}
                  </option>
                ))}
              </select>
            ))}
          </div>
        )}

        {filters.length > 0 && (
          <>
            <h3 className="text-xs font-bold text-[var(--foreground-muted)] mt-2">Specifications</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filters.map((filter) => {
                const value = specs[filter.slug] ?? "";
                const setValue = (v: string) => setSpecs((prev) => ({ ...prev, [filter.slug]: v }));

                if (filter.type === "boolean") {
                  return (
                    <Fragment key={filter.slug}><FormField label={filter.name}>
                      <select className={inputClass} value={value} onChange={(e) => setValue(e.target.value)}>
                        <option value="">—</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    </FormField></Fragment>
                  );
                }
                if (filter.type === "select" || filter.type === "radio") {
                  return (
                    <Fragment key={filter.slug}><FormField label={filter.name}>
                      <select className={inputClass} value={value} onChange={(e) => setValue(e.target.value)}>
                        <option value="">—</option>
                        {(filter.options ?? []).map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </FormField></Fragment>
                  );
                }
                return (
                  <Fragment key={filter.slug}><FormField label={filter.name}>
                    <input className={inputClass} value={value} onChange={(e) => setValue(e.target.value)} />
                  </FormField></Fragment>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* Images */}
      <section className={sectionClass}>
        <h2 className={sectionTitle}>Images</h2>
        <div className="flex flex-wrap gap-3">
          {images.map((src) => (
            <div key={src} className="relative w-24 h-24 rounded-xl overflow-hidden border border-[var(--border)]">
              <img src={getUrl(src) ?? ""} alt="" className="w-full h-full object-cover" />
              <button aria-label="Remove image"
                type="button"
                onClick={() => setImages((prev) => prev.filter((s) => s !== src))}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center"
              >
                <HiOutlineXMark />
              </button>
            </div>
          ))}
          {files.map((file, i) => (
            <div key={`${file.name}-${i}`} className="relative w-24 h-24 rounded-xl overflow-hidden border border-dashed border-[var(--primary-500)]">
              <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
              <button aria-label="Remove new image"
                type="button"
                onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center"
              >
                <HiOutlineXMark />
              </button>
            </div>
          ))}
          {images.length + files.length < 10 && (
            <label className="w-24 h-24 rounded-xl border border-dashed border-[var(--border)] flex flex-col items-center justify-center text-xs text-[var(--foreground-muted)] cursor-pointer hover:bg-[var(--background-soft)]">
              <HiOutlinePlus className="text-lg" />
              Add
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                className="hidden"
                onChange={(e) => {
                  const picked = Array.from(e.target.files ?? []);
                  setFiles((prev) => [...prev, ...picked].slice(0, 10 - images.length));
                  e.target.value = "";
                }}
              />
            </label>
          )}
        </div>
      </section>

      {/* Variants */}
      <section className={sectionClass}>
        <div className="flex items-center justify-between">
          <h2 className={sectionTitle}>Variants</h2>
          <button
            type="button"
            onClick={() => setVariants((prev) => [...prev, emptyVariant()])}
            className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--background-soft)]"
          >
            <HiOutlinePlus /> Add variant
          </button>
        </div>

        {variants.map((variant, vIndex) => (
          <div key={variant._id ?? `new-${vIndex}`} className="rounded-xl border border-[var(--border)] p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--foreground-muted)]">
                Variant {vIndex + 1}
                {variant._id && <span className="ml-2 opacity-60">(saved)</span>}
              </span>
              {variants.length > 1 && (
                <button
                  type="button"
                  onClick={() => setVariants((prev) => prev.filter((_, i) => i !== vIndex))}
                  className="text-[var(--destructive)] text-sm"
                  aria-label="Remove variant"
                >
                  <HiOutlineTrash />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <FormField label="SKU">
                <input className={inputClass} value={variant.sku} onChange={(e) => updateVariant(vIndex, { sku: e.target.value })} />
              </FormField>
              <FormField label="Price">
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className={inputClass}
                  value={variant.price}
                  onChange={(e) => updateVariant(vIndex, { price: e.target.value })}
                />
              </FormField>
              <FormField label="Discount %">
                <input
                  type="number"
                  min={0}
                  max={100}
                  className={inputClass}
                  value={variant.discount}
                  onChange={(e) => updateVariant(vIndex, { discount: e.target.value })}
                />
              </FormField>
              <FormField label="Stock">
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  value={variant.stock}
                  onChange={(e) => updateVariant(vIndex, { stock: e.target.value })}
                />
              </FormField>
              <FormField label="Final price">
                <div className="h-11 px-4 rounded-xl border border-[var(--border)] bg-[var(--background-soft)] text-sm font-bold flex items-center">
                  ${finalPriceOf(variant.price, variant.discount).toLocaleString()}
                </div>
              </FormField>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-[var(--foreground-muted)]">Attributes (e.g. color, storage, size)</span>
              {variant.attributes.map((attr, aIndex) => (
                <div key={aIndex} className="flex gap-2">
                  <input
                    className={inputClass}
                    placeholder="name"
                    value={attr.key}
                    onChange={(e) => updateAttribute(vIndex, aIndex, { key: e.target.value })}
                  />
                  <input
                    className={inputClass}
                    placeholder="value"
                    value={attr.value}
                    onChange={(e) => updateAttribute(vIndex, aIndex, { value: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      updateVariant(vIndex, { attributes: variant.attributes.filter((_, i) => i !== aIndex) })
                    }
                    className="px-3 text-[var(--foreground-muted)] hover:text-[var(--destructive)]"
                    aria-label="Remove attribute"
                  >
                    <HiOutlineXMark />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => updateVariant(vIndex, { attributes: [...variant.attributes, { key: "", value: "" }] })}
                className="self-start text-xs font-bold text-[var(--primary-500)]"
              >
                + Add attribute
              </button>
            </div>
          </div>
        ))}
      </section>

      <div className="flex justify-end pt-2 border-t border-[var(--border)]">{actionButtons}</div>
    </form>
  );
}