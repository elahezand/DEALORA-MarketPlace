import { usePost } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";
import { storeSchema } from "@/validations/storeSchema";
import { IStore } from "@/types/User";
import z from 'zod';

type CreateStorePayload = z.infer<typeof storeSchema>;

export interface CreateStoreResponse {
  message: string;
  seller: IStore;
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
