import { getAuthServerData } from "@/utils/serverData";
import EditListing from "@/components/dashboard/user/listings/editListing";
import {  ListingTypeResponse } from "@/types/Listings";

export default async function EditListingPageWrapper({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
    const res = await getAuthServerData<ListingTypeResponse>(`/listings/${id}/preview`);
    const listing = res?.data ?? null;
  

  return <EditListing listing={listing} listingId={id} />;
}
