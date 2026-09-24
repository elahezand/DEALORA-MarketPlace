import { useAuthServerData } from "@/utils/hooks/useServerData";
import CommentsClient from "@/app/(dashboard)/components/(admin)/comments/CommentsPage";
import { AdminCommentsResponse } from "@/types/CommetTypes";

export default async function AdminCommentsPage() {
  // must match the page's first view: pending reviews
  const initialComments = await useAuthServerData<AdminCommentsResponse>(
    "/comments/admin?type=review&status=pending",
  );

  return (
    <CommentsClient
      initialData={initialComments ? { pages: [initialComments], pageParams: [null] } : undefined}
    />
  );
}
