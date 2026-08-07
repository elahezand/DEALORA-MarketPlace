import CategoriesClient from "@/app/(dashboard)/components/(admin)/categories/CategoriesPage";
import { CategoriesTypeResponse } from "@/types/Category";
import { useServerData } from "@/utils/hooks/useServerData";

export default async function CategoriesPage() {
  const { data: initialCategories } = await useServerData<CategoriesTypeResponse>(
    "/categories",
    "categories",
    60 * 60 * 24
  );
  return <CategoriesClient initialData={{ data: initialCategories }} />;
}