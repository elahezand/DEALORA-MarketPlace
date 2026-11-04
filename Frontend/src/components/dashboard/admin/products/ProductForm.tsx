"use client";
import { Fragment, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { HiOutlineArrowLeft } from "react-icons/hi2";
import { useGet } from "@/utils/hooks/useReactQueryHooks";
import { CategoriesTypeResponse, ICategory, ICategoryFilter } from "@/types/Category";
import { ListingProps } from "@/types/Listings";
import { FormField, inputClass, textareaClass } from "../shared/AdminFormModal";
import {
  ProductInput,
  useSaveProduct,
} from "@/services/Products/useProductMutations";
import ProductImagesSection from "./ProductImagesSection";
import ProductVariantsSection from "./ProductVariantsSection";
import { AttributeRow, VariantRow, emptyVariant, findPath, sectionClass, sectionTitle } from "./productFormParts";


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

      <ProductImagesSection images={images} setImages={setImages} files={files} setFiles={setFiles} />

      {/* Variants */}
      <ProductVariantsSection variants={variants} setVariants={setVariants} />

      <div className="flex justify-end pt-2 border-t border-[var(--border)]">{actionButtons}</div>
    </form>
  );
}