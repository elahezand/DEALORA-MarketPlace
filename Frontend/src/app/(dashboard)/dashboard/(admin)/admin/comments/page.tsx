import { useAuthServerData } from "@/utils/hooks/useServerData";
import CommentsClient from "@/app/(dashboard)/components/(admin)/comments/CommentsPage";
import { AdminCommentsResponse } from "@/types/CommetTypes";

export const revalidate = 60;

export default async function AdminCommentsPage() {
  const initialComments = await useAuthServerData<AdminCommentsResponse>(
    "/comments/admin?status=pending",
  );

  return <CommentsClient initialData={initialComments ?
    { pages: [initialComments], pageParams: [null] }
    : undefined} />;
}