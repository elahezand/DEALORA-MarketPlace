import { useAuthServerData } from "@/utils/hooks/useServerData";
import CommentsClient from "@/app/(dashboard)/components/(admin)/comments/CommentsPage";
import { AdminCommentsResponse } from "@/types/CommetTypes";

export default async function AdminCommentsPage() {
  const initialComments = await useAuthServerData<AdminCommentsResponse>(
    "/comments/admin?limit=20&status=pending",
    "admin-comments-pending",
    60 * 5
  );

  return <CommentsClient initialData={initialComments ?
    { pages: [initialComments], pageParams: [null] }
    : undefined} />;
}