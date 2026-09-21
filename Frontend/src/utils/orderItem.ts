import type { IOrderVariantSnapshot } from "@/types/Order";

export const getOrderItemVariantLabel = (item: { variantSnapshot: IOrderVariantSnapshot }): string => {
  const attrs = item.variantSnapshot.attributes;
  return attrs ? Object.values(attrs).filter(Boolean).join(" - ") : "";
};