import { api } from "@/services/interceptor";
import type { AxiosRequestConfig, AxiosError } from "axios";
import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  UseQueryOptions,
  UseMutationOptions,
  UseInfiniteQueryOptions,
  InfiniteData,
  QueryKey,
} from "@tanstack/react-query";
import { ApiError, ApiErrorResponse, QueryParams } from "@/types/api/ErrorTypes";
import { toast } from "sonner";

type ExtraAxiosConfig = AxiosRequestConfig & {
  skipAuthError?: boolean;
  silentAuth?: boolean;
};

type WithErrorFallback = {
  errorFallback?: string;
};

type UseGetOptions<T> = Omit<
  UseQueryOptions<T, ApiError>,
  "queryKey" | "queryFn"
> & {
  axiosConfig?: ExtraAxiosConfig;
  queryKey?: UseQueryOptions<T, ApiError>["queryKey"];
  silentError?: boolean;
} & WithErrorFallback;

type UrlPath<D> = string | ((data: D) => string);

const resolveUrl = <D>(url: UrlPath<D>, data: D): string => {
  return typeof url === "function" ? url(data) : url;
};

type UseMutationOptionsWithFallback<T, D> =
  UseMutationOptions<T, ApiError, D> & WithErrorFallback;

/* 
   ERROR HANDLER
    */

const showErrorToast = (error: unknown, fallback: string) => {
  const err = error as AxiosError<ApiErrorResponse> & {
    _authToastShown?: boolean;
  };

  if (err?._authToastShown) return;

  const responseData = err?.response?.data;
  let message = fallback;
  if (Array.isArray(responseData?.errors) && responseData.errors.length > 0) {
    message = responseData.errors
      .map((item) => item?.message)
      .filter(Boolean)
      .join(" | ");
  } else if (responseData?.message) {
    message = responseData.message;
  }

  toast.error(message);
};

/* 
   GET
    */

export const useGet = <T>(
  url: string,
  params?: QueryParams,
  options?: UseGetOptions<T>
) => {
  const {
    axiosConfig,
    silentError,
    errorFallback,
    ...queryOptions
  } = options || {};

  const queryKey = options?.queryKey ?? [url, params];

  return useQuery<T, ApiError>({
    queryKey,

    queryFn: async () => {
      try {
        const { data } = await api.get<T>(url, {
          ...axiosConfig,
          params,
          paramsSerializer: {
            indexes: null,
          },
        });

        return data;
      } catch (error) {
        if (!silentError) {
          showErrorToast(
            error,
            errorFallback || "Failed to load data"
          );
        }

        throw error;
      }
    },

    staleTime: 5 * 60 * 1000,

    ...queryOptions,
  });
};

/* 
   INFINITE GET
    */

type UseInfiniteGetOptions<T> = Omit<
  UseInfiniteQueryOptions<T, ApiError, InfiniteData<T, unknown>, QueryKey, unknown>,
  "queryKey" | "queryFn" | "initialPageParam" | "getNextPageParam"
> & {
  silentError?: boolean;
} & WithErrorFallback;

type PaginationInfo = { hasMore: boolean; nextCursor: string | null } | null | undefined;

const extractPagination = (page: unknown): PaginationInfo => {
  if (!page || typeof page !== "object") return undefined;
  const direct = (page as { pagination?: PaginationInfo }).pagination;
  if (direct) return direct;
  const nestedData = (page as { data?: { pagination?: PaginationInfo } }).data;
  if (nestedData && typeof nestedData === "object" && !Array.isArray(nestedData)) {
    return nestedData.pagination;
  }
  return undefined;
};

export const useInfiniteGet = <T extends { data: unknown }>(
  url: string,
  params?: QueryParams,
  options?: UseInfiniteGetOptions<T> & { queryKey?: QueryKey }
) => {
  const {
    silentError,
    errorFallback,
    queryKey,
    ...restOptions
  } = options || {};

  return useInfiniteQuery<T, ApiError, InfiniteData<T, unknown>, QueryKey, unknown>({
    queryKey: queryKey ?? [url, params],

    queryFn: async ({ pageParam = null }) => {
      try {
        const { data } = await api.get<T>(url, {
          params: {
            ...params,
            ...(pageParam
              ? {
                cursor: pageParam,
              }
              : {}),
          },

          paramsSerializer: {
            indexes: null,
          },
        });

        return data;
      } catch (error) {
        if (!silentError) {
          showErrorToast(
            error,
            errorFallback || "Failed to load data"
          );
        }

        throw error;
      }
    },

    initialPageParam: null,

    getNextPageParam: (lastPage) => {
      const pagination = extractPagination(lastPage);
      return pagination?.hasMore ? pagination.nextCursor : undefined;
    },

    staleTime: 5 * 60 * 1000,

    ...restOptions,
  });
};
/* 
   POST
    */

export const usePost = <T, D = unknown>(
  url: UrlPath<D>,
  options?: UseMutationOptionsWithFallback<T, D>
) => {
  const {
    errorFallback,
    ...restOptions
  } = options || {};

  return useMutation<T, ApiError, D>({
    mutationFn: async (data: D) => {
      const targetUrl = resolveUrl(url, data);

      const { data: res } = await api.post<T>(
        targetUrl,
        data
      );

      return res;
    },

    onError: (error) => {

      showErrorToast(
        error,
        errorFallback || "Something went wrong"
      );
    },

    ...restOptions,
  });
};

/* 
   PATCH
    */

export const usePatch = <T, D = unknown>(
  url: UrlPath<D>,
  options?: UseMutationOptionsWithFallback<T, D>
) => {
  const {
    errorFallback,
    ...restOptions
  } = options || {};

  return useMutation<T, ApiError, D>({
    mutationFn: async (data: D) => {
      const targetUrl = resolveUrl(url, data);

      const { data: res } = await api.patch<T>(
        targetUrl,
        data
      );

      return res;
    },

    onError: (error) => {
      showErrorToast(
        error,
        errorFallback || "Something went wrong"
      );
    },

    ...restOptions,
  });
};

/* 
   PUT
    */

export const usePut = <T, D = unknown>(
  url: UrlPath<D>,
  options?: UseMutationOptionsWithFallback<T, D>
) => {
  const {
    errorFallback,
    ...restOptions
  } = options || {};

  return useMutation<T, ApiError, D>({
    mutationFn: async (data: D) => {
      const targetUrl = resolveUrl(url, data);

      const { data: res } = await api.put<T>(
        targetUrl,
        data
      );

      return res;
    },

    onError: (error) => {
      showErrorToast(
        error,
        errorFallback || "Something went wrong"
      );
    },

    ...restOptions,
  });
};

/*DELETE */

export const useDelete = <T, D = unknown>(
  url: UrlPath<D>,
  options?: UseMutationOptionsWithFallback<T, D>
) => {
  const {
    errorFallback,
    ...restOptions
  } = options || {};

  return useMutation<T, ApiError, D>({
    mutationFn: async (data: D) => {
      const targetUrl = resolveUrl(url, data);

      const { data: res } = await api.delete<T>(
        targetUrl
      );

      return res;
    },

    onError: (error) => {
      showErrorToast(
        error,
        errorFallback || "Something went wrong"
      );
    },

    ...restOptions,
  });
};