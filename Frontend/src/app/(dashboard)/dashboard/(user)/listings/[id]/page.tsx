import { useAuthServerData } from "@/utils/hooks/useServerData";
import EditListing from "@/app/(dashboard)/components/(user)/listings/editListing";
import {  ListingTypeResponse } from "@/types/Listings";

export default async function EditListingPageWrapper({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
    const res = await useAuthServerData<ListingTypeResponse>(`/listings/${id}`);
    const listing = res?.data ?? null;
  

  return <EditListing listing={listing} listingId={id} />;
}
