import { useAuthServerData } from "@/utils/hooks/useServerData";
import InfiniteFavoritesSection from "@/app/(dashboard)/components/(user)/favorites/favoritesPage";
import FavoritesTypeResponse from "@/types/favorites";

export default async function FavoritesPageWrapper() {
  const response = await useAuthServerData<FavoritesTypeResponse>("/wishList/my");    
  const favoritesList = response?.data ?? [];
  const pagination = response?.pagination ?? null;

  return (
    <InfiniteFavoritesSection
      initialData={favoritesList}
      initialPagination={pagination}
    />
  );
}