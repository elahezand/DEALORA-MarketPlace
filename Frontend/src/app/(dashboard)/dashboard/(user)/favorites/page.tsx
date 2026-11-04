import { getAuthServerData } from "@/utils/serverData";
import InfiniteFavoritesSection from "@/components/dashboard/user/favorites/favoritesPage";
import FavoritesTypeResponse from "@/types/favorites";

export const revalidate = 60;

export default async function FavoritesPageWrapper() {
  const initialFavorites = await getAuthServerData<FavoritesTypeResponse>("/wishList/my");    


  return (
    <InfiniteFavoritesSection
      initialData={
        initialFavorites ? { pages: [initialFavorites], pageParams: [null] } : undefined
      }
    />
  );
}