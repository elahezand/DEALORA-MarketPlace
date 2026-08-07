import { notFound } from "next/navigation";
import ListingDetailsClient from "@/components/posts/listingDetail/listingDetailsClient";
import Comments from "@/components/posts/listingDetail/Comments";
import SimilarListing from "@/components/posts/listingDetail/SimilarListing";
import { useServerData } from "@/utils/hooks/useServerData"; 

export const revalidate = 60;

export default async function PostsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const listingRes = await useServerData<any>(`/listings/${id}`, `listing-${id}`, revalidate);
    const listingData = listingRes?.data || null;

    if (!listingData) {
        notFound();
    }

    const tags = listingData?.tags?.length ? listingData.tags.join(",") : "";
    const isStoreProduct = listingData?.listingType === "store_product";

    const [commentsRes, similarRes] = await Promise.all([
        isStoreProduct 
            ? useServerData<any>(`/comments/product/${id}?page=1`, `comments-${id}`, revalidate)
            : Promise.resolve(null),
        tags 
            ? useServerData<any>(`/listings?tags=${tags}&limit=5`, `similar-${id}`, revalidate) 
            : Promise.resolve(null)
    ]);

    const initialComments = commentsRes?.data?.data ?? commentsRes?.data ?? commentsRes ?? [];
    const initialPagination = commentsRes?.pagination ?? commentsRes?.data?.pagination ?? null;

    const rawSimilar = similarRes?.data?.data ?? similarRes?.data ?? similarRes ?? [];
    const similarListings = Array.isArray(rawSimilar) 
        ? rawSimilar.filter((item: any) => (item._id || item.id) !== id).slice(0, 4)
        : [];

    return (
        <main className="max-w-7xl w-full p-4 md:p-6 antialiased overflow-x-hidden mx-auto space-y-6">
            <ListingDetailsClient data={listingData} />

            {isStoreProduct && (
                <Comments
                    productId={listingData._id}
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