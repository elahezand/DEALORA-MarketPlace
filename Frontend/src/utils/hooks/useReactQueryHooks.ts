
import { api } from "@/services/interceptor";
import type { AxiosRequestConfig } from "axios";
import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  UseQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query";
import { ApiError } from "@/types/api/ErrorTypes";

type ExtraAxiosConfig = AxiosRequestConfig & {
  skipAuthError?: boolean;
  silentAuth?: boolean;
};

type UseGetOptions<T> = Omit<
  UseQueryOptions<T, ApiError>,
  "queryKey" | "queryFn"
> & {
  axiosConfig?: ExtraAxiosConfig;
  queryKey?: UseQueryOptions<T, ApiError>["queryKey"];
};

type UrlPath<D> = string | ((data: D) => string);

const resolveUrl = <D>(url: UrlPath<D>, data: D): string => {
  return typeof url === "function" ? url(data) : url;
};

/* GET */
export const useGet = <T>(
  url: string,
  params?: any,
  options?: UseGetOptions<T>
) => {
  const { axiosConfig, ...queryOptions } = options || {};
  const queryKey = options?.queryKey ?? [url, params];

  return useQuery<T, ApiError>({
    queryKey,
    queryFn: async () => {
      const { data } = await api.get<T>(url, {
        ...axiosConfig,
        params,
        paramsSerializer: { indexes: null },
      });
      return data;
    },
    staleTime: 5 * 60 * 1000,
    ...queryOptions,
  });
};

/* INFINITE GET */
export const useInfiniteGet = <T extends { data: any[]; pagination: any }>(
  url: string,
  params?: any,
  options?: any
) => {
  return useInfiniteQuery<T, any>({
    queryKey: [url, params],
    queryFn: async ({ pageParam = null }) => {
      const { data } = await api.get<T>(url, {
        params: {
          ...params,
          ...(pageParam ? { cursor: pageParam } : {}),
        },
        paramsSerializer: { indexes: null },
      });
      return data;
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination?.hasMore ? lastPage.pagination.nextCursor : undefined;
    },
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

/* POST */
export const usePost = <T, D = unknown>(
  url: UrlPath<D>,
  options?: UseMutationOptions<T, ApiError, D>
) => {
  return useMutation<T, ApiError, D>({
    mutationFn: async (data: D) => {
      const targetUrl = resolveUrl(url, data);
      const { data: res } = await api.post<T>(targetUrl, data);
      return res;
    },
    ...options,
  });
};

/* PATCH */
export const usePatch = <T, D = unknown>(
  url: UrlPath<D>,
  options?: UseMutationOptions<T, ApiError, D>
) => {
  return useMutation<T, ApiError, D>({
    mutationFn: async (data: D) => {
      const targetUrl = resolveUrl(url, data);
      const { data: res } = await api.patch<T>(targetUrl, data);
      return res;
    },
    ...options,
  });
};

/* PUT */
export const usePut = <T, D = unknown>(
  url: UrlPath<D>,
  options?: UseMutationOptions<T, ApiError, D>
) => {
  return useMutation<T, ApiError, D>({
    mutationFn: async (data: D) => {
      const targetUrl = resolveUrl(url, data);
      const { data: res } = await api.put<T>(targetUrl, data);
      return res;
    },
    ...options,
  });
};

/* DELETE */
export const useDelete = <T, D = unknown>(
  url: UrlPath<D>,
  options?: UseMutationOptions<T, ApiError, D>
) => {
  return useMutation<T, ApiError, D>({
    mutationFn: async (data: D) => {
      const targetUrl = resolveUrl(url, data);
      const { data: res } = await api.delete<T>(targetUrl);
      return res;
    },
    ...options,
  });
};