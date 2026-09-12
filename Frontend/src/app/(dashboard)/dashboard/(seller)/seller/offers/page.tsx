import { useAuthServerData } from "@/utils/hooks/useServerData";
import { OffersResponse } from "@/types/Offer";
import OffersPage from "@/app/(dashboard)/components/(seller)/offers/OffersPage";

export default async function AdminArticlesPage() {
  const initialArticles = await useAuthServerData<OffersResponse>(
    "/offers/me",
  );

  return (
    <OffersPage
      initialData={
        initialArticles ? { pages: [initialArticles], pageParams: [null] } : undefined
      }
    />
  );
}