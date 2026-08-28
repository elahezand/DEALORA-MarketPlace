import { useServerData } from "@/utils/hooks/useServerData";
import qs from "qs";
import { Suspense } from "react";
import ClientWrapper from "@/components/posts/clientSection/clientWrapper";
import SmartSearchWrapper from "@/components/posts/smartSearch/smartSearchWrapper";
import ListingsTypeResponse  from "@/types/Listings";
import InfiniteItemsSection from "@/components/posts/infiniteItemsSection";
import ListingTypeTabs from "@/components/posts/listingTabs";

export const revalidate = 60;

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = (await searchParams) || {};

  const currentType = (resolved.listingType as string) || "store_product";
  const updatedQuery = { ...resolved, listingType: currentType };

  const queryString = qs.stringify(updatedQuery, {
    arrayFormat: "brackets",
    encode: false,
  });

  const endpoint = queryString ? `/listings?${queryString}` : "/listings";
  const cacheKey = `listings-${queryString}`;

  const response = await useServerData<ListingsTypeResponse>(
    endpoint,
    cacheKey,
    revalidate
  );
  const rawData: any = response?.data;
  const initialItems = Array.isArray(rawData?.data)
    ? rawData.data
    : Array.isArray(rawData)
      ? rawData
      : [];

  const initialPagination = rawData?.pagination || response?.data?.pagination || null;

  return (
    <div className="w-full mx-auto pr-6 relative">
      <div className="flex w-full items-start justify-center mx-auto relative gap-6 lg:gap-8 h-full [overflow:visible]">
        <aside className="sticky top-25 z-20 w-[350px] shrink-0 hidden md:block h-fit self-start">
          <ClientWrapper />
        </aside>

        <div className="w-full flex flex-col gap-6">
          <Suspense fallback={<div className="h-16 w-full animate-pulse bg-gray-100 dark:bg-neutral-800 rounded-2xl" />}>
            <ListingTypeTabs currentType={currentType} />
          </Suspense>

          <div className="w-full flex flex-col gap-4">
            <InfiniteItemsSection
              key={`${currentType}-${queryString}`}
              initialData={initialItems}
              initialPagination={initialPagination}
              queryString={queryString}
            />
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 right-6 z-50 w-full max-w-[360px] md:max-w-[400px] shadow-2xl animate-fade-in-up">
        <SmartSearchWrapper />
      </div>
    </div>
  );
}