import { getAuthServerData } from "@/utils/serverData";
import CommentsClient from "@/components/dashboard/admin/comments/CommentsPage";
import { AdminCommentsResponse } from "@/types/CommentTypes";

export default async function AdminCommentsPage() {
  // must match the page's first view: pending reviews
  const initialComments = await getAuthServerData<AdminCommentsResponse>(
    "/comments/admin?type=review&status=pending",
  );

  return (
    <CommentsClient
      initialData={initialComments ? { pages: [initialComments], pageParams: [null] } : undefined}
    />
  );
}
