import { usePost } from "@/utils/hooks/useReactQueryHooks";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
export interface ResendCodeResponse {
    success: boolean;
    message: string;
    data: {
        remainingTime: string;
    };
}
interface ResendCodeValues {
    phone: string;
}

export const useResendCode = () => {
    const queryClient = useQueryClient();

    const { mutate, isPending } = usePost<ResendCodeResponse, ResendCodeValues>(
        "/auth/send", {
        onSuccess: () => {            
            toast.success("CODE Sent Successfully:)")
            queryClient.invalidateQueries({ queryKey: ["/auth/me", undefined] });
        },
        errorFallback: "Failed to send code",
    }
    );

    return { mutate, isPending };
};

