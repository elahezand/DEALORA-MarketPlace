import { ApiMessageResponse } from "@/types/common";
import { useQueryClient } from "@tanstack/react-query";
import { useDelete } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";

export const useDeleteListing = () => {
  const queryClient = useQueryClient();
  return useDelete<ApiMessageResponse, { id: string }>(
    (data) => `/listings/${data.id}`,
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["my-listings"] });
        toast.success("Listing deleted successfully!");
      },
      errorFallback: "Failed to delete listing.",
    }
  );
};
