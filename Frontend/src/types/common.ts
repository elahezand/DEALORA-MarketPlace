export interface IPagination {
  limit: number;
  nextCursor: string | null;
  hasMore: boolean;
}

/* plain API answer for mutations that only report success (delete, mark seen, ...) */
export interface ApiMessageResponse {
  success?: boolean;
  message?: string;
}
