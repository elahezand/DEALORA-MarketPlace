import { useAuthServerData } from "@/utils/hooks/useServerData";
import InfiniteFavoritesSection from "@/app/(dashboard)/components/(user)/favorites/favoritesPage";
import FavoritesTypeResponse from "@/types/favorites";

export const revalidate = 60;

export default async function FavoritesPageWrapper() {
  const initialFavorites = await useAuthServerData<FavoritesTypeResponse>("/wishList/my");    


  return (
    <InfiniteFavoritesSection
      initialData={
        initialFavorites ? { pages: [initialFavorites], pageParams: [null] } : undefined
      }
    />
  );
}