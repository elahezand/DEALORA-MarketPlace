export interface CommentAuthor {
  _id: string;
  name?: string;
  username?: string;
  profilePicture?: string;
}

export interface CommentItemType {
  _id: string;
  user: CommentAuthor | string;
  listing: string;
  parentId: string | null;
  rating: number | null;
  title?: string;
  body: string;
  pros?: string[];
  cons?: string[];
  recommendation?: "recommended" | "not_recommended" | "no_idea";
  verifiedPurchase?: boolean;
  createdAt: string;
  replies?: CommentItemType[];
}

export interface CommentsResponse {
  data: CommentItemType[];
  pagination?: {
    hasMore: boolean;
    limit: number;
    nextCursor: string | null;
  };
}

export type CommentStatus = "pending" | "approved" | "rejected" | "spam" | "deleted";

export interface AdminComment {
  _id: string;
  body: string;
  rating?: number | null;
  status: CommentStatus;
  parentId: string | null;
  createdAt: string;
  user?: { _id: string; username?: string; phone?: string } | string;
  listing?: { _id: string; title?: string } | string;
}

export interface AdminCommentsResponse {
  data: AdminComment[];
  pagination?: {
    hasMore: boolean;
    limit: number;
    nextCursor: string | null;
  };
}