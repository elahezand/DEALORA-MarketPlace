import { notFound } from "next/navigation";
import ListingDetailsClient from "@/components/posts/listingDetail/listingDetailsClient";
import Comments from "@/components/posts/listingDetail/Comments";
import SimilarListing from "@/components/posts/listingDetail/SimilarListing";
import { useServerData } from "@/utils/hooks/useServerData"; 
import { ListingTypeResponse, PublicListingsResponse } from "@/types/Listings";
import { CommentsResponse } from "@/types/CommetTypes";

export const revalidate = 60;

export default async function PostsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const listingRes = await useServerData<ListingTypeResponse>(`/listings/${id}`, `listing-${id}`, revalidate);
    const listingData = listingRes?.data || null;    

    if (!listingData) {
        notFound();
    }

    const tags = listingData?.tags?.length ? listingData.tags.join(",") : "";
    const isStoreProduct = listingData?.listingType === "store_product";

    const [commentsRes, similarRes] = await Promise.all([
        isStoreProduct 
            ? useServerData<CommentsResponse>(`/comments/listing/${id}?page=1`, `comments-${id}`, revalidate)
            : Promise.resolve(null),
        tags 
            ? useServerData<PublicListingsResponse>(`/listings?tags=${tags}&limit=5`, `similar-${id}`, revalidate) 
            : Promise.resolve(null)
    ]);

    const initialComments = commentsRes?.data ?? [];
    const initialPagination = commentsRes?.pagination ?? undefined;

    const similarListings = (similarRes?.data ?? [])
        .filter((item) => item._id !== id)
        .slice(0, 4);

    return (
        <main className="max-w-7xl w-full p-4 md:p-6 antialiased overflow-x-hidden mx-auto space-y-6">
            <ListingDetailsClient data={listingData} />
            {isStoreProduct && (
                <Comments
                    listingId={listingData._id}
                    initialComments={initialComments}
                    initialPagination={initialPagination}
                />
            )}

            {similarListings.length > 0 && (
                <SimilarListing listings={similarListings} />
            )}
        </main>
    );
}