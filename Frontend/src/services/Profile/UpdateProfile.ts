import { usePut } from "@/utils/hooks/useReactQueryHooks";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface IUpdateProfilePayload {
  username?: string;
  email?: string;
  avatar?: File | null;
}

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  const { mutate, ...rest } = usePut<void, FormData | IUpdateProfilePayload>(
    "/users/me/profile",
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/me/profile"] });
        toast.success("Profile updated successfully!");
      },
      errorFallback: "Failed to update profile.",
    }
  );

  return { mutate, ...rest };
};