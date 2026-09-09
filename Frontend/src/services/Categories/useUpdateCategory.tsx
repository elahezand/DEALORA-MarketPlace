import { useQueryClient } from "@tanstack/react-query";
import { usePut } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";
import { ICategory } from "@/types/Category";

export interface IUpdateCategoryResponse {
  success: boolean;
  message: string;
  category: ICategory;
}
export type UpdateCategoryPayload = Partial<ICategory> & {
  _id: string;
};

const ENDPOINT = "/categories";

export const useUpdateCategory = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();

  return usePut<IUpdateCategoryResponse, UpdateCategoryPayload>(
    (d) => `${ENDPOINT}/${d._id}`,
    {
      onSuccess: (res) => {
        toast.success(res.message || "Category updated");
        queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
        onSuccessCallback?.();
      },
      errorFallback: "Unknown Error",
    }
  );
};