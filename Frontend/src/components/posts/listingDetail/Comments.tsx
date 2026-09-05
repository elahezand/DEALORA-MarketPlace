"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Star, MessageCircle, Plus, X } from "lucide-react";
import { HiChevronRight } from "react-icons/hi";
import SectionHeading from "./SectionHeading";
import CommentCard from "./CommentCard";
import SkeletonComments from "@/components/skeleton/SkeletonComments";
import { usePostComment } from "@/services/Comments/usePostComment";
import { useInfiniteGet } from "@/utils/hooks/useReactQueryHooks";
import { useGetProfile } from "@/services/Profile/getProfile";
import { CommentItemType, CommentsResponse } from "@/types/CommetTypes";
const AuthModal = dynamic(() => import("../../modals/AuthModal"), { ssr: false });

type Recommendation = "recommended" | "not_recommended" | "no_idea";

interface CommentsProps {
  listingId: string;
  initialComments?: CommentItemType[];
  initialPagination?: CommentsResponse["pagination"];
}

// Small reusable "tag list" input for pros/cons -- type a value, hit
// Enter or the + button to add it as a chip, click the x to remove it.
function TagListInput({
  label,
  placeholder,
  values,
  onChange,
  max = 10,
}: {
  label: string;
  placeholder: string;
  values: string[];
  onChange: (next: string[]) => void;
  max?: number;
}) {
  const [draft, setDraft] = useState("");

  const addValue = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (values.includes(trimmed)) {
      setDraft("");
      return;
    }
    if (values.length >= max) return;
    onChange([...values, trimmed]);
    setDraft("");
  };

  const removeValue = (val: string) => {
    onChange(values.filter((v) => v !== val));
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-bold text-[var(--foreground-muted)]">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addValue();
            }
          }}
          placeholder={placeholder}
          disabled={values.length >= max}
          className="flex-1 h-9 px-3 rounded-lg text-sm bg-[var(--background-soft)] border border-[var(--border)] focus:outline-none disabled:opacity-50"
        />
        <button
          type="button"
          onClick={addValue}
          disabled={!draft.trim() || values.length >= max}
          className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center border border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--background-soft)] disabled:opacity-40"
          aria-label={`Add ${label.toLowerCase()}`}
        >
          <Plus size={16} />
        </button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {values.map((val) => (
            <span
              key={val}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-[var(--background-soft)] border border-[var(--border)] text-[var(--foreground)]"
            >
              {val}
              <button
                type="button"
                onClick={() => removeValue(val)}
                className="text-[var(--foreground-subtle)] hover:text-[var(--destructive)]"
                aria-label={`Remove ${val}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

const RECOMMENDATION_OPTIONS: { value: Recommendation; label: string }[] = [
  { value: "recommended", label: "👍 Recommended" },
  { value: "no_idea", label: "🤷 Not sure" },
  { value: "not_recommended", label: "👎 Not recommended" },
];

export default function Comments({ listingId, initialComments, initialPagination }: CommentsProps) {
  // Fixed: was /comments/product/:id, backend route is now /comments/listing/:id
  const endpoint = `/comments/listing/${listingId}`;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useInfiniteGet<CommentsResponse>(endpoint, { page: 1 }, {
    initialData: initialComments ? {
      pages: [{ data: initialComments, pagination: initialPagination }],
      pageParams: [null],
    } : undefined
  });

  const { user } = useGetProfile();
  const { postComment, isPosting } = usePostComment(listingId);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pros, setPros] = useState<string[]>([]);
  const [cons, setCons] = useState<string[]>([]);
  const [recommendation, setRecommendation] = useState<Recommendation>("no_idea");
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const comments: CommentItemType[] = data?.pages.flatMap((page: CommentsResponse) => page.data) ?? [];

  const resetForm = () => {
    setBody("");
    setTitle("");
    setRating(0);
    setPros([]);
    setCons([]);
    setRecommendation("no_idea");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setIsAuthOpen(true);
      return;
    }
    if (!listingId || !rating || !body.trim()) return;

    postComment(
      {
        listing: listingId,
        rating,
        title: title.trim() || undefined,
        body: body.trim(),
        pros,
        cons,
        recommendation,
      },
      {
        onSuccess: () => {
          resetForm();
        },
      }
    );
  };

  return (
    <div className="card p-6 space-y-6 w-full">
      <SectionHeading
        icon={<MessageCircle size={16} className="text-[var(--primary-500)] dark:text-[var(--accent-400)]" />}
        title={`Reviews${comments.length ? ` (${comments.length})` : ""}`}
      />

      {/* WRITE A REVIEW */}
      <form onSubmit={handleSubmit} className="space-y-4 pb-6 border-b border-[var(--border)]">
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

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Give your review a title (optional)"
          maxLength={120}
          className="w-full h-10 px-3 rounded-xl text-sm bg-[var(--background-soft)] border border-[var(--border)] focus:outline-none"
        />

        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={user ? "Share your experience with this product..." : "Sign in to write a review"}
          rows={3}
          className="w-full p-3 rounded-xl resize-none text-sm bg-[var(--background-soft)] border border-[var(--border)] focus:outline-none"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TagListInput
            label="Pros (optional)"
            placeholder="e.g. Great battery life"
            values={pros}
            onChange={setPros}
          />
          <TagListInput
            label="Cons (optional)"
            placeholder="e.g. A bit heavy"
            values={cons}
            onChange={setCons}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-bold text-[var(--foreground-muted)]">Would you recommend this?</span>
          <div className="flex flex-wrap gap-2">
            {RECOMMENDATION_OPTIONS.map((opt) => {
              const isSelected = recommendation === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRecommendation(opt.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    isSelected
                      ? "border-[var(--primary-500)] bg-[var(--primary-50)] text-[var(--primary-700)]"
                      : "border-[var(--border)] bg-[var(--background-soft)] text-[var(--foreground-muted)]"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

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
          {comments.map((c: CommentItemType, index: number) => (
            <CommentCard
              key={c._id || `comment-${index}`}
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