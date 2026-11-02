import { AxiosError } from "axios";
import { IPagination } from "../common";

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
  success: boolean;
  message?: string;
  data: T;
};


export type PaginatedResponse<T> = {
  success: boolean;
  message?: string;
  data: T[];
  pagination?: IPagination;
};
