import { usePost } from "@/utils/hooks/useReactQueryHooks";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface IUpdateProfilePayload {
  username?: string;
  email?: string;
  avatar?: File | null;
}

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  const { mutate, ...rest } = usePost<void, FormData | IUpdateProfilePayload>(
    "/users/me/profile",
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/auth/me"] });
        toast.success("Profile updated successfully!");
      },
      onError: () => {
        toast.error("Failed to update profile.");
      },
    }
  );

  return { mutate, ...rest };
};