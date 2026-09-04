import { notFound } from "next/navigation";
import { useServerData } from "@/utils/hooks/useServerData";
import StoreProductsSection from "@/components/stores/[slug]/storesProductsSection";

interface StoreDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function StoreDetailPage({
  params,
}: StoreDetailPageProps) {
  const { slug } = await params;

  const result = await useServerData<any>(
    `/stores/slug/${slug}?limit=20`,
    `store-${slug}`,
    60
  );

  const store = result?.store;

  if (!store) {
    notFound();
  }

  const initialData = result?.data || [];
  const initialPagination = result?.pagination || null;

  return (
    <div className="w-full min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* STORE HEADER */}
        <div className="flex flex-col items-center text-center gap-4 mb-12">
          <div className="relative w-24 h-24 rounded-full overflow-hidden bg-[var(--background-soft)] border border-[var(--border)] flex items-center justify-center">
            {store.logo ? (
              <img
                src={store.logo}
                alt={store.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                {store.name.charAt(0)}
              </span>
            )}

            {store.isVerified && (
              <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary-600 dark:bg-primary-500 border-2 border-[var(--background)] flex items-center justify-center text-xs text-white">
                ✓
              </span>
            )}
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
              {store.name}
            </h1>

            {store.address?.city && (
              <p className="text-sm text-[var(--foreground-muted)] mt-1">
                {[store.address.city, store.address.province]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            )}

            {store.meta?.ratings ? (
              <p className="text-sm text-[var(--foreground-muted)] mt-1">
                ★ {store.meta.ratings.toFixed(1)} (
                {store.meta.reviewsCount || 0} reviews)
              </p>
            ) : null}
          </div>
        </div>

        {/* STORE'S PRODUCTS */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-[var(--foreground)]">
            Products from this store
          </h2>
        </div>

        <StoreProductsSection
          slug={slug}
          initialData={initialData}
          initialPagination={initialPagination}
        />
      </div>
    </div>
  );
}