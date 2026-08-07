import { useQueryClient } from "@tanstack/react-query";
import { usePatch } from "@/utils/hooks/useReactQueryHooks";
import { IAddress } from "@/types/User";
import { toast } from "sonner";

export type UpdateAddressPayload = Partial<IAddress> & {
  id: string;
};

interface IUpdateAddressResponse {
  message: string;
  address: IAddress;
}

export const useUpdateAddress = () => {
  const queryClient = useQueryClient();

  const { mutate, ...rest } = usePatch<IUpdateAddressResponse, UpdateAddressPayload>(
    (data) => `/users/me/addresses/${data.id}`,
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/auth/me"] });
        toast.success("Address updated successfully!");
      },
      onError: () => {
        toast.error("Failed to update address.");
      },
    }
  );

  return { mutate, ...rest };
};