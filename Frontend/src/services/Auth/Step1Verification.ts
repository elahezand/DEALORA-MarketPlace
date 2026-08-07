import { usePost } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";
interface VerifyPhoneValues {
  phone: string,
  code: string
}

interface ResendCodeValues {
  phone: string;
}
export const useVerify = (onSuccess: (token: string) => void
) => {
  const { mutate, isPending } = usePost<VerifyPhoneValues>(
    "/auth/verify",
    {
      onSuccess: (data: any) => {        
        toast.success("LogIn Successfully:)");
        onSuccess(data.token)
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || "Code Not Valid");
      },
    }
  );

  return { mutate, isPending };
};
export const useResendCode = () => {
  const { mutate, isPending } = usePost<void, ResendCodeValues>(
    "/auth/send",
    {
      onSuccess: () => toast.success("CODE Sent Successfully:)"),
      onError: () => toast.error("UnKNOWN error"),
    }
  );

  return { mutate, isPending };
};
