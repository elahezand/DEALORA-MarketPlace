import { usePost } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";
import { postSchema } from "@/validations/postSchema";
import z from 'zod';

type validateNewPost = z.infer<typeof postSchema>
export const useCreatePost = () => {  
  const { mutate, isPending } = usePost<validateNewPost>(`/listings`, {
    onSuccess: () => {
      toast.success("Post Created Successfully :)");
    },
    onError: (error: any) => {
            toast.error(error.response?.data?.message || "Unknown Error");
    },
  });

  return {
     mutate,
    isPending,
  };
};
