import { usePost } from "@/utils/hooks/useReactQueryHooks";
import { IAddress } from "@/types/User";
import { toast } from "sonner";

export type CreateAddressPayload = Omit<IAddress, "_id" | "id">;

interface ICreateAddressResponse {
  message: string;
  addresses: IAddress[];
}

export const useCreateAddress = () => {
  const { mutate, ...rest } = usePost<ICreateAddressResponse, CreateAddressPayload>(
    "/users/me/addresses", 
    {
      onSuccess: () => {
        toast.success("Address created successfully!");
      },
    }
  );

  return { mutate, ...rest };
};