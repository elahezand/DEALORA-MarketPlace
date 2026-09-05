import { useServerData } from "@/utils/hooks/useServerData";
import InfiniteStoresSection from "@/components/stores/storesClient";
import { IStore } from "@/types/User";
import { IPagination } from "@/types/common";

interface VerifiedStoresServerResponse {
  data: IStore[];
  pagination?: IPagination;
}

export default async function StoresPage() {
  const result = await useServerData<VerifiedStoresServerResponse>(
    "/stores/verified?limit=24",
    "verified-stores",
    60
  );

  const initialData = result?.data || [];
  const initialPagination = result?.pagination || null;

  return (
    <div className="w-full min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col items-center text-center gap-3 mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-800 text-primary-600 dark:text-primary-400 text-[10px] font-bold uppercase tracking-widest">
            ✅ Verified
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--foreground)]">
            Stores we trust
          </h1>
          <p className="text-sm text-[var(--foreground-muted)] max-w-md">
            Every store here has been checked by our team — official warranty, real address.
          </p>
        </div>

        <InfiniteStoresSection
          initialData={initialData}
          initialPagination={initialPagination}
        />
      </div>
    </div>
  );
}