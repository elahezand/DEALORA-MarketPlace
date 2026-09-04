import { usePost } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";

export interface CreateReportPayload {
  targetType: "listing" | "store" | "comment" | "user";
  targetId: string;
  reason: string;
  description?: string;
}

export const useCreateReport = () => {
  return usePost<any, CreateReportPayload>("/reports", {
    onSuccess: () => {
      toast.success("Report submitted. Our team will review it shortly.");
    },
    errorFallback: "Could not submit report, please try again.",
  });
};
