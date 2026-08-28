"use client";

import { Star } from "lucide-react";
import { timeAgo } from "@/utils/timeAgo";
import { CommentItemType } from "@/types/CommetTypes";
function StarRow({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= value ? "fill-amber-400 text-amber-400" : "text-[var(--border-strong)]"}
        />
      ))}
    </div>
  );
}

export default function CommentCard({ comment }: { comment: CommentItemType }) {    
  const getUserName = (user: any) => {
    if (!user) return "User";
    if (typeof user === "string") return "User";
    return user.username || "User";
  };

  const displayName = getUserName(comment.user);
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-[var(--background-soft)] border border-[var(--border)] flex items-center justify-center text-xs font-bold text-[var(--foreground-muted)] flex-shrink-0">
            {avatarLetter}
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--foreground)] leading-tight">
              {displayName}
            </p>
            <p className="text-[11px] text-[var(--foreground-subtle)]">
              {timeAgo(comment.createdAt)}
            </p>
          </div>
        </div>
        {!!comment.rating && <StarRow value={comment.rating} />}
      </div>

      {comment.title && (
        <p className="text-sm font-bold text-[var(--foreground)]">{comment.title}</p>
      )}
      
      <p className="text-sm text-[var(--foreground-muted)] leading-relaxed whitespace-pre-line">
        {comment.body}
      </p>

      {/* REPLIES SECTION */}
      {Array.isArray(comment.replies) && comment.replies.length > 0 && (
        <div className="pl-4 border-l-2 border-[var(--border)] space-y-3 mt-2">
          {comment.replies.map((reply: any) => {
            const replyUserName = getUserName(reply.user);
            return (
              <div key={reply._id}>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[var(--foreground)]">
                    {replyUserName}
                  </span>
                  <span className="text-[10px] text-[var(--foreground-subtle)]">
                    {timeAgo(reply.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-[var(--foreground-muted)] mt-1">{reply.body}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}