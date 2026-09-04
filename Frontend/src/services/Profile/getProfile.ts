import { useGet } from "@/utils/hooks/useReactQueryHooks";
import { UserType, IStore, IUser } from "@/types/User";
import { AxiosError } from "axios";

export const useGetProfile = () => {
  const { data, error, isError, isLoading } = useGet<UserType>(
    "/auth/me",
    undefined,
    { axiosConfig: { silentAuth: true }, silentError: true }
  );

  return {
    user: data?.user ?? null,       
    store: (data?.user?.store ?? null) as IStore | null,
    hasStore: !!data?.user?.store,
    isLoading,
    isError,
    error: isError ? (error as AxiosError<any>) : null,
  };
};