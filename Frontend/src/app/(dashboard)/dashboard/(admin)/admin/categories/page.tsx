import CategoriesClient from "@/app/(dashboard)/components/(admin)/categories/CategoriesPage";
import { CategoriesTypeResponse } from "@/types/Category";
import { useAuthServerData } from "@/utils/hooks/useServerData";

export default async function CategoriesPage() {
  const initialCategories = await useAuthServerData<CategoriesTypeResponse>(
    "/categories",
  );
  return <CategoriesClient initialData={initialCategories ? initialCategories : undefined} />;
}
