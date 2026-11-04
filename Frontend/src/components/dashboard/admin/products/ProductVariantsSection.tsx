"use client";

import { Dispatch, SetStateAction } from "react";
import { HiOutlinePlus, HiOutlineTrash, HiOutlineXMark } from "react-icons/hi2";
import { FormField, inputClass } from "../shared/AdminFormModal";
import { AttributeRow, VariantRow, emptyVariant, finalPriceOf, sectionClass, sectionTitle } from "./productFormParts";

interface ProductVariantsSectionProps {
  variants: VariantRow[];
  setVariants: Dispatch<SetStateAction<VariantRow[]>>;
}

/* every variant of the product (sku, price, discount, stock, attributes) */
export default function ProductVariantsSection({ variants, setVariants }: ProductVariantsSectionProps) {
  const updateVariant = (index: number, patch: Partial<VariantRow>) =>
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)));

  const updateAttribute = (vIndex: number, aIndex: number, patch: Partial<AttributeRow>) =>
    updateVariant(vIndex, {
      attributes: variants[vIndex].attributes.map((a, i) => (i === aIndex ? { ...a, ...patch } : a)),
    });

  return (
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
  );
}
