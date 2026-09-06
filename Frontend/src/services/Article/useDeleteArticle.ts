import { useQueryClient } from "@tanstack/react-query";
import { useDelete } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";

const ENDPOINT = "/articles";

export const useDeleteArticle = () => {
  const queryClient = useQueryClient();

  return useDelete<{ success: boolean; message: string }, { id: string }>(
    (d) => `${ENDPOINT}/${d.id}`,
    {
      onSuccess: () => {
        toast.success("Article deleted");
        queryClient.invalidateQueries({ queryKey: ["/articles/admin"] });
        queryClient.invalidateQueries({ queryKey: [ENDPOINT] });
      },
      errorFallback: "Failed to delete article",
    }
  );
};
