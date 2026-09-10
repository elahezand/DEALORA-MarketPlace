import { usePost } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";
import { IStore } from "@/types/Store";

export type CreateStorePayload = Omit<IStore, "_id">;

export interface CreateStoreResponse {
  success: boolean;
  message: string;
  data: IStore;
}

export const useCreateStore = () => {
  const { mutate, isPending } = usePost<CreateStoreResponse, CreateStorePayload>(`/stores`, {
    onSuccess: () => {
      toast.success("Store Created Successfully :)");
    },
    errorFallback: "Unknown Error",
  });

  return {
    mutate,
    isPending,
  };
};