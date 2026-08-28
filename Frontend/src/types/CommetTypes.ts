export interface CommentType {
  id: string;
  user: {
    id: string;
    fullName: string;
    profilePicture?: string;
  };
  title?: string;
  caption: string;
  rating: string;
  created_at: string;
  parent_comment_id: string | null;
  replies: CommentType[];
}

export interface CommentItemProps {
  comment: CommentType;
  houseId: string;
  depth?: number;
}

export interface ReplyFormValues {
  title: string;
  caption: string;
  rating: number;
}

export type CreateReplyInput = {
  title: string;
  caption: string;
  parent_comment_id: string;
  rating: number;
};

export type CreateReplyResponse = {
  id: string;
  house_id: string;
  user_id: string;
  title: string;
  caption: string;
  rating: string;
  parent_comment_id: string;
  created_at: string;
};

// NewCommentModal.tsx

export interface Props {
  houseId: string;
  isOpen: boolean;
  onOpenChange: () => void;
}

export interface CommentFormValues {
  title: string;
  caption: string;
  rating: number;
  parent_comment_id: string | null;
}



export interface CommentAuthor {
  _id: string;
  name?: string;
  username?: string;
  profilePicture?: string;
}

export interface CommentItemType {
  _id: string;
  user: CommentAuthor;
  productId: string;
  parentId: string | null;
  rating: number | null;
  title?: string;
  body: string;
  pros?: string[];
  cons?: string[];
  recommendation?: "recommended" | "not_recommended" | "no_idea";
  createdAt: string;
  replies: CommentItemType[];
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
  createdAt: string;
  user?: { _id: string; username?: string; phone?: string } | string;
  productId?: { _id: string; title?: string } | string;
}



