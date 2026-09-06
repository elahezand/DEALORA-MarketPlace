import { useAuthServerData } from "@/utils/hooks/useServerData";
import ArticlesClient from "@/app/(dashboard)/components/(admin)/articles/ArticlesPage";
import { ArticlesResponse } from "@/types/Article";

export default async function AdminArticlesPage() {
  const initialArticles = await useAuthServerData<ArticlesResponse>(
    "/articles/admin?limit=20",
    "admin-articles",
    60 * 5
  );

  return (
    <ArticlesClient
      initialData={
        initialArticles ? { pages: [initialArticles], pageParams: [null] } : undefined
      }
    />
  );
}
