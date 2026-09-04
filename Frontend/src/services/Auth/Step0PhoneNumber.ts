import { usePost } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";
import { StartRegistrationResponse } from "@/types/Auth/AuthTypes";

interface StartRegistrationValues {
  phone: string;
}
export const useStartRegistration = (
  onSuccess: (remainingTime: string) => void
) => {
  const { mutate, isPending } = usePost<
    StartRegistrationResponse,
    StartRegistrationValues
  >("/auth/send", {
    onSuccess: (data) => {
      toast.success("Code Sent Succcessfully:)");

      onSuccess(data.remainingTime);
    },
    errorFallback: "Failed to send code",
  });

  return { mutate, isPending };
};