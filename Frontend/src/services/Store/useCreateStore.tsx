import { usePost } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";
import { storeSchema } from "@/validations/storeSchema";
import z from 'zod';

type validateNewPost = z.infer<typeof storeSchema>
export const useCreateStore = () => {  
  const { mutate, isPending } = usePost<validateNewPost>(`/stores`, {
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
