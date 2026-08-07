import { useGet } from "@/utils/hooks/useReactQueryHooks";

export const useGetPosts = (
  pageIndex: number,
  pageSize: number,
  enabled: boolean = true
) =>
  useGet(
    `/post`,
    { limit: pageSize, page: pageIndex + 1 },
    {
      queryKey: ["post", pageSize, pageIndex],
      enabled,
    }
  );
