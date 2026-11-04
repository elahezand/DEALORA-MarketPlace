import { notFound } from "next/navigation";
import ProductForm from "@/components/dashboard/admin/products/ProductForm";
import { getAuthServerData } from "@/utils/serverData";
import { ListingProps, ListingTypeResponse } from "@/types/Listings";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await getAuthServerData<ListingTypeResponse>(`/listings/admin/${id}/preview`).catch(() => null);
  const product: ListingProps | undefined = res?.data;

  if (!product || product.listingType !== "store_product") {
    notFound();
  }

  return <ProductForm product={product as ListingProps} />;
}
