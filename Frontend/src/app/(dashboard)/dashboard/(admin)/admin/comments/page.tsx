import { useAuthServerData } from "@/utils/hooks/useServerData";
import CommentsClient from "@/app/(dashboard)/components/(admin)/comments/CommentsPage";
export default async function AdminCommentsPage() {
  const initialComments = await useAuthServerData<any>(
    "/comments/admin?limit=20&status=pending",
    "admin-comments-pending",
    60 * 5
  );

  return <CommentsClient initialData={initialComments ?
    { pages: [initialComments], pageParams: [null] }
    : undefined} />;
}