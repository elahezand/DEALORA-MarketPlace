"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Star, MessageCircle } from "lucide-react";
import { HiChevronRight } from "react-icons/hi"; 
import SectionHeading from "./SectionHeading";
import CommentCard from "./CommentCard";
import SkeletonComments from "@/components/skeleton/SkeletonComments";
import { usePostComment } from "@/services/Comments/usePostComment";
import { useInfiniteGet } from "@/utils/hooks/useReactQueryHooks";
import { useGetProfile } from "@/services/Profile/getProfile";
import { CommentItem } from "@/services/Comments/useGetComments";

const AuthModal = dynamic(() => import("../../modals/AuthModal"), { ssr: false });

interface CommentsProps {
  productId: string;
  initialComments?: any; 
  initialPagination?: any;
}

export default function Comments({ productId, initialComments, initialPagination }: CommentsProps) {
  const endpoint = `/comments/product/${productId}`;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useInfiniteGet<any>(endpoint, { page: 1 }, {
    initialData: initialComments ? {
      pages: [{ data: initialComments, pagination: initialPagination }],
      pageParams: [1],
    } : undefined
  });

  const { user } = useGetProfile();
  const { postComment, isPosting } = usePostComment(productId);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [body, setBody] = useState("");
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const rawList = data?.pages 
    ? data.pages.flatMap((page: any) => page?.data?.data ?? page?.data ?? page)
    : [];

  const comments: CommentItem[] = Array.isArray(rawList) ? rawList : [];

const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  if (!user) {
    setIsAuthOpen(true);
    return;
  }
  if (!productId || !rating || !body.trim()) return;

  postComment(
    { productId, rating, body: body.trim() },
    {
      onSuccess: () => {
        setBody("");
        setRating(0);
      },
    } as any
  );
};

  return (
    <div className="card p-6 space-y-6 w-full">
      <SectionHeading
        icon={<MessageCircle size={16} className="text-[var(--primary-500)] dark:text-[var(--accent-400)]" />}
        title={`Reviews${comments.length ? ` (${comments.length})` : ""}`}
      />

      {/* WRITE A REVIEW */}
      <form onSubmit={handleSubmit} className="space-y-3 pb-6 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-[var(--foreground-muted)]">Your rating:</span>
          <div className="flex items-center gap-1" onMouseLeave={() => setHoverRating(0)}>
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                type="button"
                key={i}
                onClick={() => setRating(i)}
                onMouseEnter={() => setHoverRating(i)}
                aria-label={`Rate ${i} star`}
              >
                <Star
                  size={20}
                  className={
                    i <= (hoverRating || rating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-[var(--border-strong)]"
                  }
                />
              </button>
            ))}
          </div>
        </div>

        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={user ? "Share your experience with this product..." : "Sign in to write a review"}
          rows={3}
          className="w-full p-3 rounded-xl resize-none text-sm bg-[var(--background-soft)] border border-[var(--border)] focus:outline-none"
        />

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPosting || (!!user && (!rating || !body.trim()))}
            className="btn-primary !w-auto px-5 h-10 text-sm disabled:opacity-60"
          >
            {!user ? "Sign in to review" : isPosting ? "Submitting..." : "Submit review"}
          </button>
        </div>
      </form>

      {/* REVIEWS LIST */}
      {isLoading ? (
        <SkeletonComments />
      ) : comments.length === 0 ? (
        <p className="text-sm text-[var(--foreground-muted)] text-center py-6">
          No reviews yet. Be the first to share your experience.
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((c: any, index: number) => (
            <CommentCard
              key={c._id || c.id || `comment-${index}`}
              comment={c}
            />
          ))}
        </div>
      )}

      {/* PAGINATION / LOAD MORE */}
      {hasNextPage && (
        <div className="mt-8 flex justify-center w-full">
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="group flex w-full sm:w-auto items-center justify-center gap-2 px-8 h-8 rounded-[var(--radius)] bg-[var(--primary-500)] dark:bg-[var(--accent-500)] text-sm font-semibold text-white hover:bg-[var(--primary-600)] dark:hover:bg-[var(--accent-400)] active:scale-[0.98] disabled:bg-[var(--neutral-200)] dark:disabled:bg-[var(--neutral-800)] disabled:text-[var(--neutral-400)] dark:disabled:text-[var(--neutral-600)] disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-[var(--primary-500)]/10 dark:shadow-none transition-all duration-200"
          >
            <span>{isFetchingNextPage ? "Loading..." : "Load More"}</span>
            <HiChevronRight
              className={`text-lg transition-transform duration-200 ${
                isFetchingNextPage
                  ? "animate-spin"
                  : "group-hover:translate-x-0.5"
              }`}
            />
          </button>
        </div>
      )}

      <AuthModal isOpen={isAuthOpen} setIsOpen={setIsAuthOpen} />
    </div>
  );
}