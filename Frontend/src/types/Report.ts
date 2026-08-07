export type ReportTargetType = "listing" | "store" | "comment" | "user";

export type ReportReason =
  | "fraud"
  | "inappropriate"
  | "duplicate"
  | "fake"
  | "prohibited_item"
  | "other";

export type ReportStatus = "pending" | "reviewed" | "resolved" | "rejected";

export type ReportActionTaken =
  | "none"
  | "content_removed"
  | "user_banned"
  | "warning_sent";

export interface IReportResolution {
  resolvedBy?: string | null;
  resolvedAt?: string | null;
  note?: string | null;
  actionTaken?: ReportActionTaken;
}

export interface IReport {
  _id: string;
  reporter: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  description?: string;
  status: ReportStatus;
  resolution?: IReportResolution;
  createdAt: string;
  updatedAt: string;
}

export interface IPagination {
  limit: number;
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ReportsResponse {
  success: boolean;
  data: IReport[];
  pagination: IPagination;
}
