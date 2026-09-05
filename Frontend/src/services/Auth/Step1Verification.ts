import { usePost } from "@/utils/hooks/useReactQueryHooks";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface VerifyPhoneValues {
  phone: string,
  code: string
}

interface ResendCodeValues {
  phone: string;
}

interface VerifyResponse {
  message: string;
}

export interface ResendCodeResponse {
  message: string;
  remainingTime: string;
}

export const useVerify = (onSuccess: () => void) => {
  const queryClient = useQueryClient();

  const { mutate, isPending } = usePost<VerifyResponse, VerifyPhoneValues>(
    "/auth/verify",
    {
      onSuccess: () => {
        toast.success("LogIn Successfully:)");
        queryClient.invalidateQueries({ queryKey: ["/auth/me", undefined] });

        onSuccess();
      },
      errorFallback: "Code Not Valid",
    }
  );

  return { mutate, isPending };
};

export const useResendCode = () => {
  const { mutate, isPending } = usePost<ResendCodeResponse, ResendCodeValues>(
    "/auth/send",
    {
      onSuccess: () => toast.success("CODE Sent Successfully:)"),
    }
  );

  return { mutate, isPending };
};