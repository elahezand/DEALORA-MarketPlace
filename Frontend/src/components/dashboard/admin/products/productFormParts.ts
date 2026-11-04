import { ICategory } from "@/types/Category";

/* types and helpers shared by the admin product form and its sections */

export type AttributeRow = { key: string; value: string };

export type VariantRow = {
  _id?: string;
  attributes: AttributeRow[];
  sku: string;
  price: string;
  discount: string;
  stock: string;
};

export const emptyVariant = (): VariantRow => ({
  attributes: [{ key: "color", value: "" }],
  sku: "",
  price: "",
  discount: "0",
  stock: "0",
});

export const finalPriceOf = (price: string, discount: string) => {
  const p = Number(price) || 0;
  const d = Math.min(Math.max(Number(discount) || 0, 0), 100);
  return Math.round((p - (p * d) / 100) * 100) / 100;
};

export const sectionClass = "card rounded-2xl border border-[var(--border)] bg-[var(--card-solid)] p-6 flex flex-col gap-4";
export const sectionTitle = "text-sm font-black text-[var(--foreground)]";

export function findPath(categories: ICategory[], ids: string[]): ICategory[] {
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
