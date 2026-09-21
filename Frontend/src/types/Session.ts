export interface ActiveSession {
  _id: string;
  userAgent: string;
  ip: string;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
  /** true for the device making the request */
  isCurrent: boolean;
}

export interface ActiveSessionsResponse {
  success: boolean;
  data: ActiveSession[];
}
