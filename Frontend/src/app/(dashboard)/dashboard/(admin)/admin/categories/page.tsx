import CategoriesClient from "@/components/dashboard/admin/categories/CategoriesPage";
import { CategoriesTypeResponse } from "@/types/Category";
import { getAuthServerData } from "@/utils/serverData";

export default async function CategoriesPage() {
  const initialCategories = await getAuthServerData<CategoriesTypeResponse>(
    "/categories",
  );
  return <CategoriesClient initialData={initialCategories ? initialCategories : undefined} />;
}
