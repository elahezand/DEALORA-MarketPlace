import { useQueryClient } from "@tanstack/react-query";
import { usePost } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";
import { ICategory } from "@/types/Category";
const ENDPOINT = "/categories";

export interface ISingleCategoryResponse {
  success: boolean;
  message: string;
  data: ICategory;
}


export type CreateCategoryPayload = Omit<ICategory, "_id">;


export const useCreateCategory = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();

  return usePost<ISingleCategoryResponse, CreateCategoryPayload>(
    ENDPOINT,
    {
      onSuccess: (res) => {
        toast.success(res.message || "Category created");
        queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
        onSuccessCallback?.();
      },
      errorFallback: "Failed to create category",
    }
  );
};