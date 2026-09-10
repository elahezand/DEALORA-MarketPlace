import { usePost } from "@/utils/hooks/useReactQueryHooks";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { IAddress } from "@/types/User";

export interface ICreateAddressResponse {
  success: boolean;
  message: string;
  data: IAddress[];
}
export type CreateAddressPayload = Omit<IAddress, "_id">;
export const useCreateAddress = () => {
  const queryClient = useQueryClient();

  const { mutate, ...rest } = usePost<ICreateAddressResponse, CreateAddressPayload>(
    "/users/me/addresses",
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/auth/me"] });
        toast.success("Address created successfully!");
      },
      errorFallback: "Failed to create address.",
    }
  );

  return { mutate, ...rest };
};