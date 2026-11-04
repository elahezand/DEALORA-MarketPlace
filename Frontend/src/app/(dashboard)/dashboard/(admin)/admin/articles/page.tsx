import { getAuthServerData } from "@/utils/serverData";
import ArticlesClient from "@/components/dashboard/admin/articles/ArticlesPage";
import { ArticlesResponse } from "@/types/Article";

export default async function AdminArticlesPage() {
  const initialArticles = await getAuthServerData<ArticlesResponse>(
    "/articles/admin",
  );

  return (
    <ArticlesClient
      initialData={
        initialArticles ? { pages: [initialArticles], pageParams: [null] } : undefined
      }
    />
  );
}
