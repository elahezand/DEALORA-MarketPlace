import { notFound } from "next/navigation";
import ListingDetailsClient from "@/components/posts/listingDetail/listingDetailsClient";
import Comments from "@/components/posts/listingDetail/Comments";
import SimilarListing from "@/components/posts/listingDetail/SimilarListing";
import { useAuthServerData, useServerData } from "@/utils/hooks/useServerData";
import { ListingTypeResponse, PublicListingsResponse } from "@/types/Listings";
import { CommentsResponse } from "@/types/CommetTypes";

export const revalidate = 60;

type PageProps = {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ preview?: string }>;
};

const PREVIEW_ENDPOINT: Record<string, (id: string) => string> = {
    owner: (id) => `/listings/${id}/preview`,
    admin: (id) => `/listings/admin/${id}/preview`,
};

export default async function PostsPage({ params, searchParams }: PageProps) {
    const { id } = await params;
    const { preview } = await searchParams;
    const previewEndpoint = preview ? PREVIEW_ENDPOINT[preview] : undefined;

    const listingRes = previewEndpoint
        ? await useAuthServerData<ListingTypeResponse>(previewEndpoint(id)).catch(() => null)
        : await useServerData<ListingTypeResponse>(`/listings/${id}`, `listing-${id}`, revalidate).catch(() => null);
    const listingData = listingRes?.data || null;

    if (!listingData) {
        notFound();
    }
        

    const tags = listingData?.tags?.length ? listingData.tags.join(",") : "";
    const isStoreProduct = listingData?.listingType === "store_product";

    const [commentsRes, similarRes] = await Promise.all([
        isStoreProduct
            ? useServerData<CommentsResponse>(`/comments/listing/${id}?page=1`, `comments-${id}`, revalidate).catch(() => null)
            : Promise.resolve(null),
        tags && !previewEndpoint
            ? useServerData<PublicListingsResponse>(`/listings?tags=${tags}&limit=5`, `similar-${id}`, revalidate).catch(() => null)
            : Promise.resolve(null),
    ]);

    const similarListings = (similarRes?.data ?? [])
        .filter((item) => item._id !== id)
        .slice(0, 4);

    return (
        <div className="max-w-7xl w-full p-4 md:p-6 antialiased overflow-x-hidden mx-auto space-y-6">
            {previewEndpoint && (
                <div className="rounded-xl border border-amber-300/50 bg-amber-50 dark:bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
                    Preview — status: <span className="font-bold">{listingData?.status}</span>
                </div>
            )}

            <ListingDetailsClient data={listingData} />

            {isStoreProduct && (
                <Comments
                    listingId={listingData._id}
                    initialData={
                        commentsRes ? { pages: [commentsRes], pageParams: [null] } : undefined
                    }
                />
            )}

            {similarListings.length > 0 && (
                <SimilarListing listings={similarListings} />
            )}
        </div>
    );
}
