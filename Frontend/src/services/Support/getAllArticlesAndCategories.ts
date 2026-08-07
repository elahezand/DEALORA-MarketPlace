import { useGet } from "@/utils/hooks/useReactQueryHooks";
export const useSupport = () => {
  const {
    data,
    isLoading,
    error,
  } = useGet(
      "/support/category-articles" ,
    undefined,
    {
      queryKey: ["categories-articles"],
    }
  );
  return { data, isLoading, error };
};
