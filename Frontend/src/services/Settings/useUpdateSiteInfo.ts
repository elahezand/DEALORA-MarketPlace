import { useQueryClient } from "@tanstack/react-query";
import { usePatch } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";

const ENDPOINT = "/infos";

export interface SiteInfo {
  phone: string;
  email: string;
  logo: string;
  address?: string;
  socials?: {
    instagram?: string;
    telegram?: string;
    linkedin?: string;
  };
}

export const useUpdateSiteInfo = () => {
  const queryClient = useQueryClient();

  return usePatch<any, SiteInfo>(ENDPOINT, {
    onSuccess: () => {
      toast.success("Site info updated");
      queryClient.invalidateQueries({ queryKey: [ENDPOINT] });
    },
    errorFallback: "Failed to update",
  });
};