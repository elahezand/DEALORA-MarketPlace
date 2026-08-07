import { CommentsResponse } from "@/types/CommetTypes";
import { useServerData } from "@/utils/hooks/useServerData";
export default async function useGetComments(productId: string) {
  const {data:comments} = await useServerData<CommentsResponse>(
    `/comments/product/${productId}`,
    "comments",
    60 * 60 * 24
  );

  return comments
}
