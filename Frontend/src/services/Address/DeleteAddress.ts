import { useQueryClient } from "@tanstack/react-query";
import { useDelete } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";

export const useDeleteAddress = () => {
  const queryClient = useQueryClient();

  const { mutate, ...rest } = useDelete<void, { id: string }>(
    ({ id }) => `/users/me/addresses/${id}`,
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/auth/me"] });
        toast.success("Address deleted successfully!");
      },
      errorFallback: "Failed to delete address.",
    }
  );

  return { mutate, ...rest };
};