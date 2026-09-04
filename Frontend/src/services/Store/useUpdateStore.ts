import { useQueryClient } from "@tanstack/react-query";
import { usePatch } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";
import { IStore } from "@/types/User";

export type UpdateStorePayload = Partial<
  Pick<IStore, "name" | "phone" | "logo" | "address">
> & { id: string };

export const useUpdateStore = (onSuccessCallback?: () => void) => {
  const queryClient = useQueryClient();

  const { mutate, isPending, ...rest } = usePatch<
    { ok: boolean },
    UpdateStorePayload
  >((data) => `/stores/${data.id}`, {
    onSuccess: () => {
      toast.success("Store updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["/auth/me"] });
      onSuccessCallback?.();
    },
    errorFallback: "Failed to update store",
  });

  return { mutate, isPending, ...rest };
};
