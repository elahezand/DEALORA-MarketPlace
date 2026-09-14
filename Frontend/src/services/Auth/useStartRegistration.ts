import { usePost } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";

export interface StartRegistrationResponse {
  message: string;
  data: {
    remainingTime: string;
  };
}

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
    onSuccess: (response) => {
      toast.success("Code Sent Succcessfully:)");
      onSuccess(response.data.remainingTime);
    },
    errorFallback: "Failed to send code",
  });

  return { mutate, isPending };
};