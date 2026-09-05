import { AxiosError } from "axios";

export interface ApiValidationError {
  field: string;
  message: string;
  expected?: string;
  received?: unknown;
}

export interface ApiErrorResponse {
  message: string;
  errors?: ApiValidationError[];
  statusCode?: number;
}

export type ApiError = AxiosError<ApiErrorResponse>;

export type QueryParams = Record<
  string,
  string | number | boolean | undefined | null
>;

export type ApiResponse<T> = {
  data: T;
  message?: string;
  statusCode?: number;
};
