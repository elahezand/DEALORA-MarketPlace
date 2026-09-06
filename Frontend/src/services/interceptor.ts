import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { toast } from "sonner";

declare module "axios" {
  export interface AxiosRequestConfig {
    skipRefresh?: boolean;
    silentAuth?: boolean;
    _retry?: boolean;
  }
  export interface AxiosError {
    _authToastShown?: boolean;
  }
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

// Shared in-flight refresh promise. When several requests fail with 401 at
// the same time, they all await this single promise instead of each firing
// its own POST /auth/refresh — the backend rotates the refresh token on every
// call, so parallel refresh calls could race and invalidate one another,
// logging the user out even though their session was actually still valid.
let refreshPromise: Promise<unknown> | null = null;

const refreshAccessToken = () => {
  if (!refreshPromise) {
    refreshPromise = api
      .post("/auth/refresh", {}, { skipRefresh: true })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig | undefined;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    if (originalRequest.skipRefresh) {
      return Promise.reject(error);
    }

    const status = error.response?.status;

    if (
      status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        await refreshAccessToken();

        return api.request(originalRequest);
      } catch (refreshError) {
        if (!originalRequest.silentAuth) {
          toast.error("Please LogIn");
        }

        if (refreshError instanceof Error) {
          (refreshError as AxiosError)._authToastShown = true;
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export { api };