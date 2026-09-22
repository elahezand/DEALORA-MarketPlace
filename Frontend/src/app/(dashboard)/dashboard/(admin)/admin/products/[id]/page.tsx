import { notFound } from "next/navigation";
import ProductForm from "@/app/(dashboard)/components/(admin)/products/ProductForm";
import { useAuthServerData } from "@/utils/hooks/useServerData";
import { ListingProps, ListingTypeResponse } from "@/types/Listings";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await useAuthServerData<ListingTypeResponse>(`/listings/admin/${id}/preview`).catch(() => null);
  const product: ListingProps | undefined = res?.data;

  if (!product || product.listingType !== "store_product") {
    notFound();
  }

  return <ProductForm product={product as ListingProps} />;
}
