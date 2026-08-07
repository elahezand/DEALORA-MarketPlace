import { usePost } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";
import { ApiError } from "@/types/api/ErrorTypes";

interface StartRegistrationValues {
  phone: string;
}
export const useStartRegistration = (onSuccess: () => void
) => {
  const { mutate, isPending } = usePost<StartRegistrationValues>
    ("/auth/send", {
      onSuccess: (data) => {
        console.log(data);
                
        toast.success("Code Sent Succcessfully:)");
        onSuccess();        
      },
      onError: (error: ApiError) => {
        const errorMessage =
          error.response?.data?.message || "UNKOWN ERROR";
        toast.error(errorMessage);
      },
    });

  return { mutate, isPending };
};
