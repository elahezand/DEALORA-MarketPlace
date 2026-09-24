"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  HiOutlineChatBubbleLeftRight,
  HiOutlineArrowUturnLeft,
  HiOutlineEye,
  HiOutlineCheck,
  HiOutlineXMark,
  HiOutlineTrash,
  HiOutlineStar,
  HiStar,
} from "react-icons/hi2";
import { HiChevronRight } from "react-icons/hi";
import { InfiniteData } from "@tanstack/react-query";
import { useInfiniteGet } from "@/utils/hooks/useReactQueryHooks";
import TableCard from "../../shared/table/TableCard";
import { WidgetHeader } from "../../shared/table/WidgeHeader";
import { Th, EntityAvatar, Badge } from "../../shared/table/TableParts";
import { AdminFormModal, FormField, textareaClass } from "../shared/AdminFormModal";
import { useModerateComment } from "@/services/Comments/useModerateComment";
import { useDeleteComment } from "@/services/Comments/useDeleteComment";
import { useAnswerComment } from "@/services/Comments/useAnswerComment";
import { CommentStatus, AdminComment, AdminCommentsResponse } from "@/types/CommetTypes";
import TableFilters, { TableFilterValue, emptyFilters, filtersKey, filtersToParams } from "../../shared/table/TableFilters";

const ENDPOINT = "/comments/admin";

type Kind = "review" | "reply";
type Answered = "all" | "false" | "true";

export const STATUS_TABS: { value: CommentStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "spam", label: "Spam" },
];

export const STATUS_TONE: Record<CommentStatus, "success" | "warning" | "destructive" | "info" | "neutral"> = {
  pending: "warning",
  approved: "success",
  rejected: "destructive",
  spam: "destructive",
  deleted: "neutral",
};

const RECOMMENDATION_LABEL = {
  recommended: "Recommends it",
  not_recommended: "Doesn't recommend it",
  no_idea: "No opinion",
} as const;

const nameOf = (user?: AdminComment["user"] | { username?: string; name?: string; phone?: string } | string | null) =>
  typeof user === "object" && user ? user.username || ("name" in user ? user.name : "") || ("phone" in user ? user.phone : "") || "user" : "user";

const fmtDate = (value?: string | null) =>
  value ? new Date(value).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

const chip = (active: boolean) =>
  `text-xs font-bold px-4 py-2 rounded-xl border transition-all ${active
    ? "bg-[var(--primary-500)] text-white border-[var(--primary-500)] shadow-sm"
    : "border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--background-soft)]"
  }`;

const selectClass =
  "h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] text-sm text-[var(--foreground)]";

const iconBtn =
  "inline-flex items-center justify-center w-8 h-8 rounded-lg border border-[var(--border)] transition-colors disabled:opacity-40";

function Stars({ value }: { value?: number | null }) {
  if (typeof value !== "number") return null;
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) =>
        i <= value ? <HiStar key={i} className="w-3.5 h-3.5" /> : <HiOutlineStar key={i} className="w-3.5 h-3.5 opacity-40" />
      )}
    </span>
  );
}

interface CommentsClientProps {
  initialData?: InfiniteData<AdminCommentsResponse>;
}

export default function CommentsClient({ initialData }: CommentsClientProps) {
  // one clear axis at a time: reviews (with the "answered" filter) or replies
  const [kind, setKind] = useState<Kind>("review");
  const [status, setStatus] = useState<CommentStatus | "all">("pending");
  const [answered, setAnswered] = useState<Answered>("all");
  const [filters, setFilters] = useState<TableFilterValue>(emptyFilters);

  const [viewTarget, setViewTarget] = useState<AdminComment | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AdminComment | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [replyTarget, setReplyTarget] = useState<AdminComment | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [actioningId, setActioningId] = useState<string | null>(null);

  const switchKind = (next: Kind) => {
    setKind(next);
    setAnswered("all"); // "answered" has no meaning for replies — never carry it over
  };

  const params = {
    limit: 20,
    type: kind,
    ...(status !== "all" && { status }),
    ...(kind === "review" && answered !== "all" && { answered }),
    ...filtersToParams(filters),
  };

  const isFirstView = kind === "review" && status === "pending" && answered === "all" && filtersKey(filters) === "{}";

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteGet<AdminCommentsResponse>(ENDPOINT, params, {
      queryKey: [ENDPOINT, kind, status, answered, filtersKey(filters)],
      initialData: isFirstView ? initialData : undefined,
    });

  const comments: AdminComment[] = (
    data?.pages?.flatMap((page: AdminCommentsResponse) => page?.data ?? []) || []
  ).filter(Boolean);

  const { mutate: moderate } = useModerateComment(() => {
    setRejectTarget(null);
    setRejectReason("");
    setActioningId(null);
    setViewTarget(null);
  });
  const { mutate: removeComment } = useDeleteComment();
  const { mutate: sendAnswer, isPending: isReplying } = useAnswerComment(() => {
    setReplyTarget(null);
    setReplyBody("");
    setViewTarget(null);
  });

  const approve = (c: AdminComment) => {
    setActioningId(c._id);
    moderate({ id: c._id, status: "approved" });
  };
  const markSpam = (c: AdminComment) => {
    setActioningId(c._id);
    moderate({ id: c._id, status: "spam" });
  };
  const openReject = (c: AdminComment) => {
    setRejectTarget(c);
    setRejectReason("");
  };
  const openReply = (c: AdminComment) => {
    setReplyTarget(c);
    setReplyBody("");
  };
  const submitReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectTarget || !rejectReason.trim()) return;
    setActioningId(rejectTarget._id);
    moderate({ id: rejectTarget._id, status: "rejected", rejectReason: rejectReason.trim() });
  };
  const submitReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyTarget || !replyBody.trim()) return;
    sendAnswer({ parentId: replyTarget._id, body: replyBody.trim() });
  };
  const confirmDelete = (c: AdminComment) => {
    toast.warning("Delete this comment?", {
      description: "It will be hidden from the product page.",
      action: {
        label: "Delete",
        onClick: () => {
          setActioningId(c._id);
          removeComment({ id: c._id }, { onSettled: () => setActioningId(null) });
          setViewTarget(null);
        },
      },
      cancel: { label: "Cancel", onClick: () => { } },
    });
  };

  const view = viewTarget;
  const viewParent = view && typeof view.parentId === "object" ? view.parentId : null;
  const viewProduct = view && typeof view.listing === "object" ? view.listing : null;
  const viewStore = view && typeof view.store === "object" ? view.store : null;

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="menu-section-title mb-1">Admin</p>
          <h1 className="!text-2xl font-black text-[var(--foreground)] tracking-tight">Comments</h1>
          <p className="text-sm text-[var(--foreground-muted)] mt-1">
            Moderate product reviews and the answers given to them.
          </p>
        </div>

        {/* primary axis: what are we looking at */}
        <div className="inline-flex p-1 rounded-xl bg-[var(--background-soft)] border border-[var(--border)]">
          {(["review", "reply"] as Kind[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => switchKind(k)}
              className={`text-sm font-bold px-4 py-1.5 rounded-lg transition-all ${kind === k
                ? "bg-[var(--card-solid)] text-[var(--foreground)] shadow-sm"
                : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                }`}
            >
              {k === "review" ? "Reviews" : "Replies"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <button key={tab.value} type="button" onClick={() => setStatus(tab.value)} className={chip(status === tab.value)}>
            {tab.label}
          </button>
        ))}
      </div>

      <TableFilters value={filters} onChange={setFilters} searchPlaceholder="Search in comment text...">
        {kind === "review" && (
          <select value={answered} onChange={(e) => setAnswered(e.target.value as Answered)} className={selectClass}>
            <option value="all">Answered or not</option>
            <option value="false">Waiting for an answer</option>
            <option value="true">Already answered</option>
          </select>
        )}
      </TableFilters>

      <TableCard
        header={
          <WidgetHeader
            icon={HiOutlineChatBubbleLeftRight}
            title={kind === "review" ? "Reviews" : "Replies"}
            href="/dashboard/admin/comments"
          />
        }
        isLoading={isLoading}
        isError={isError}
        isEmpty={comments.length === 0}
        errorMessage="Error fetching comments"
        emptyTitle={kind === "review" ? "No reviews here" : "No replies here"}
        emptyMessage="Try another status or date range"
      >
        <thead className="border-b border-[var(--border)] bg-[var(--background-soft)]">
          <tr>
            <Th>{kind === "review" ? "Review" : "Reply"}</Th>
            <Th>Author</Th>
            <Th>Product</Th>
            <Th>Date</Th>
            <Th>Status</Th>
            <Th align="right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {comments.map((c) => {
            const author = typeof c.user === "object" ? c.user : null;
            const product = typeof c.listing === "object" ? c.listing : null;
            const parent = typeof c.parentId === "object" ? c.parentId : null;
            const busy = actioningId === c._id;

            return (
              <tr key={c._id} className="border-b border-[var(--border)] hover:bg-[var(--background-soft)] transition-colors align-top">
                <td className="px-6 py-4 min-w-[260px] max-w-md">
                  <button type="button" onClick={() => setViewTarget(c)} className="text-left w-full group">
                    {kind === "review" && <Stars value={c.rating} />}
                    <p className="text-sm text-[var(--foreground)] line-clamp-2 group-hover:text-[var(--primary-500)] transition-colors">
                      {c.body}
                    </p>
                    {parent && (
                      <p className="text-xs text-[var(--foreground-subtle)] mt-1.5 line-clamp-1">
                        <HiOutlineArrowUturnLeft className="inline w-3 h-3 mr-1" />
                        on {nameOf(parent.user)}&apos;s review: “{parent.body}”
                      </p>
                    )}
                    {kind === "review" && c.answered && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--success-500)] mt-1.5">
                        <HiOutlineCheck className="w-3 h-3" /> Answered ({c.replies?.length})
                      </span>
                    )}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2.5">
                    <EntityAvatar alt={nameOf(author)} fallback={nameOf(author).slice(0, 2).toUpperCase()} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--foreground)] truncate">{nameOf(author)}</p>
                      {c.verifiedPurchase && (
                        <p className="text-[10px] font-bold text-[var(--success-500)]">Verified buyer</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-[var(--foreground-muted)] max-w-[180px]">
                  {product ? (
                    <Link href={`/posts/${product._id}`} target="_blank" className="hover:text-[var(--primary-500)] line-clamp-2">
                      {product.title}
                    </Link>
                  ) : "—"}
                </td>
                <td className="px-6 py-4 text-xs text-[var(--foreground-muted)] whitespace-nowrap">
                  {new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </td>
                <td className="px-6 py-4">
                  <Badge tone={STATUS_TONE[c.status as CommentStatus]} label={c.status} />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-1.5">
                    <button type="button" title="View" onClick={() => setViewTarget(c)} className={`${iconBtn} hover:bg-[var(--background-soft)]`}>
                      <HiOutlineEye className="w-4 h-4" />
                    </button>
                    {c.status !== "approved" && (
                      <button type="button" title="Approve" disabled={busy} onClick={() => approve(c)} className={`${iconBtn} text-[var(--success-500)] hover:bg-[var(--success-bg)]`}>
                        <HiOutlineCheck className="w-4 h-4" />
                      </button>
                    )}
                    {c.status !== "rejected" && (
                      <button type="button" title="Reject" disabled={busy} onClick={() => openReject(c)} className={`${iconBtn} text-[var(--warning-500)] hover:bg-[var(--warning-bg)]`}>
                        <HiOutlineXMark className="w-4 h-4" />
                      </button>
                    )}
                    {kind === "review" && (
                      <button type="button" title="Reply" disabled={busy} onClick={() => openReply(c)} className={`${iconBtn} text-[var(--primary-500)] hover:bg-[var(--primary-500)]/10`}>
                        <HiOutlineArrowUturnLeft className="w-4 h-4" />
                      </button>
                    )}
                    <button type="button" title="Delete" disabled={busy} onClick={() => confirmDelete(c)} className={`${iconBtn} text-[var(--destructive)] hover:bg-[var(--destructive-bg)]`}>
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </TableCard>

      {hasNextPage && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="flex items-center gap-2 px-8 h-9 rounded-xl bg-[var(--primary-500)] text-sm font-semibold text-white hover:bg-[var(--primary-600)] disabled:opacity-50"
          >
            {isFetchingNextPage ? "Loading..." : "Load more"}
            <HiChevronRight />
          </button>
        </div>
      )}

      {/* ─── view the whole comment ─── */}
      <AdminFormModal
        isOpen={!!view}
        onClose={() => setViewTarget(null)}
        title={view?.parentId ? "Reply details" : "Review details"}
        icon={HiOutlineEye}
        maxWidth="max-w-[680px]"
        footer={
          view && (
            <>
              {view.status !== "approved" && (
                <button type="button" onClick={() => approve(view)} className="text-xs font-bold px-4 h-9 rounded-lg bg-[var(--success-500)] text-white hover:opacity-90">
                  Approve
                </button>
              )}
              {view.status !== "rejected" && (
                <button type="button" onClick={() => openReject(view)} className="text-xs font-bold px-4 h-9 rounded-lg border border-[var(--warning-500)]/40 text-[var(--warning-500)] hover:bg-[var(--warning-bg)]">
                  Reject
                </button>
              )}
              {view.status !== "spam" && (
                <button type="button" onClick={() => markSpam(view)} className="text-xs font-bold px-4 h-9 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--background-soft)]">
                  Spam
                </button>
              )}
              {!view.parentId && (
                <button type="button" onClick={() => openReply(view)} className="text-xs font-bold px-4 h-9 rounded-lg bg-[var(--primary-500)] text-white hover:bg-[var(--primary-600)]">
                  Reply
                </button>
              )}
            </>
          )
        }
      >
        {view && (
          <div className="flex flex-col gap-5">
            {/* the review this reply answers */}
            {viewParent && (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--background-soft)] p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--foreground-muted)] mb-1.5">
                  Original review by {nameOf(viewParent.user)} · {fmtDate(viewParent.createdAt)}
                </p>
                <p className="text-sm text-[var(--foreground)] whitespace-pre-line">{viewParent.body || "—"}</p>
              </div>
            )}

            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <EntityAvatar alt={nameOf(view.user)} fallback={nameOf(view.user).slice(0, 2).toUpperCase()} />
                <div>
                  <p className="font-bold text-sm text-[var(--foreground)]">
                    {nameOf(view.user)}
                    {view.verifiedPurchase && (
                      <span className="ml-2 text-[10px] font-bold text-[var(--success-500)]">Verified buyer</span>
                    )}
                  </p>
                  <p className="text-xs text-[var(--foreground-muted)]">{fmtDate(view.createdAt)}</p>
                </div>
              </div>
              <Badge tone={STATUS_TONE[view.status as CommentStatus]} label={view.status} />
            </div>

            <div className="flex flex-col gap-2">
              <Stars value={view.rating} />
              <p className="text-[15px] leading-relaxed text-[var(--foreground)] whitespace-pre-line">{view.body}</p>
            </div>

            {(view.pros?.length || view.cons?.length) ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {!!view.pros?.length && (
                  <div className="rounded-xl border border-[var(--success-500)]/25 bg-[var(--success-bg)] p-3">
                    <p className="text-xs font-bold text-[var(--success-500)] mb-1">Pros</p>
                    <ul className="text-sm text-[var(--foreground)] list-disc pl-4 space-y-0.5">
                      {view.pros.map((p) => <li key={p}>{p}</li>)}
                    </ul>
                  </div>
                )}
                {!!view.cons?.length && (
                  <div className="rounded-xl border border-[var(--destructive)]/25 bg-[var(--destructive-bg)] p-3">
                    <p className="text-xs font-bold text-[var(--destructive)] mb-1">Cons</p>
                    <ul className="text-sm text-[var(--foreground)] list-disc pl-4 space-y-0.5">
                      {view.cons.map((p) => <li key={p}>{p}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            ) : null}

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div className="flex justify-between gap-3 border-b border-[var(--border)] py-1.5">
                <dt className="text-[var(--foreground-muted)]">Product</dt>
                <dd className="text-right truncate">
                  {viewProduct ? (
                    <Link href={`/posts/${viewProduct._id}`} target="_blank" className="text-[var(--primary-500)] hover:underline">
                      {viewProduct.title}
                    </Link>
                  ) : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-3 border-b border-[var(--border)] py-1.5">
                <dt className="text-[var(--foreground-muted)]">Bought from</dt>
                <dd className="text-right">{viewStore?.name || "—"}</dd>
              </div>
              {view.recommendation && !view.parentId && (
                <div className="flex justify-between gap-3 border-b border-[var(--border)] py-1.5">
                  <dt className="text-[var(--foreground-muted)]">Recommendation</dt>
                  <dd className="text-right">{RECOMMENDATION_LABEL[view.recommendation as keyof typeof RECOMMENDATION_LABEL]}</dd>
                </div>
              )}
              {view.moderation?.moderatedAt && (
                <div className="flex justify-between gap-3 border-b border-[var(--border)] py-1.5">
                  <dt className="text-[var(--foreground-muted)]">Moderated</dt>
                  <dd className="text-right">
                    {fmtDate(view.moderation.moderatedAt)}
                    {typeof view.moderation.moderatedBy === "object" && view.moderation.moderatedBy
                      ? ` by ${nameOf(view.moderation.moderatedBy)}`
                      : ""}
                  </dd>
                </div>
              )}
            </dl>

            {view.moderation?.rejectReason && (
              <div className="rounded-xl border border-[var(--warning-500)]/30 bg-[var(--warning-bg)] p-3 text-sm">
                <span className="font-bold">Reject reason: </span>{view.moderation.rejectReason}
              </div>
            )}

            {/* answers already given to this review */}
            {!view.parentId && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)]">
                  Replies ({view.replies?.length ?? 0})
                </p>
                {view.replies?.length ? (
                  view.replies.map((r) => (
                    <div key={r._id} className="rounded-xl border border-[var(--border)] p-3">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-xs font-bold text-[var(--foreground)]">{nameOf(r.user)}</p>
                        <p className="text-[11px] text-[var(--foreground-muted)]">{fmtDate(r.createdAt)}</p>
                      </div>
                      <p className="text-sm text-[var(--foreground)] whitespace-pre-line">{r.body}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[var(--foreground-subtle)]">No reply yet.</p>
                )}
              </div>
            )}
          </div>
        )}
      </AdminFormModal>

      {/* ─── reject ─── */}
      <AdminFormModal
        isOpen={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        title="Reject comment"
        icon={HiOutlineXMark}
        footer={
          <>
            <button type="button" onClick={() => setRejectTarget(null)} className="text-xs font-bold px-4 h-9 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--background-soft)]">
              Cancel
            </button>
            <button type="submit" form="reject-comment-form" disabled={!rejectReason.trim()} className="btn-primary !w-auto px-5 h-9 text-xs disabled:opacity-50">
              Reject
            </button>
          </>
        }
      >
        <form id="reject-comment-form" onSubmit={submitReject} className="flex flex-col gap-4">
          {rejectTarget && (
            <p className="text-sm text-[var(--foreground-muted)] rounded-lg bg-[var(--background-soft)] p-3 line-clamp-4">
              “{rejectTarget.body}”
            </p>
          )}
          <FormField label="Reason (internal, required)">
            <textarea
              className={textareaClass}
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Why is this comment being rejected?"
              required
            />
          </FormField>
        </form>
      </AdminFormModal>

      {/* ─── reply ─── */}
      <AdminFormModal
        isOpen={!!replyTarget}
        onClose={() => setReplyTarget(null)}
        title="Reply to review"
        icon={HiOutlineArrowUturnLeft}
        footer={
          <>
            <button type="button" onClick={() => setReplyTarget(null)} className="text-xs font-bold px-4 h-9 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--background-soft)]">
              Cancel
            </button>
            <button type="submit" form="reply-comment-form" disabled={!replyBody.trim() || isReplying} className="btn-primary !w-auto px-5 h-9 text-xs disabled:opacity-50">
              {isReplying ? "Sending..." : "Send reply"}
            </button>
          </>
        }
      >
        <form id="reply-comment-form" onSubmit={submitReply} className="flex flex-col gap-4">
          {replyTarget && (
            <div className="rounded-lg bg-[var(--background-soft)] p-3">
              <Stars value={replyTarget.rating} />
              <p className="text-sm text-[var(--foreground)] mt-1 whitespace-pre-line">{replyTarget.body}</p>
            </div>
          )}
          <FormField label="Your answer">
            <textarea
              className={textareaClass}
              rows={4}
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder="Write a helpful answer..."
              required
            />
          </FormField>
        </form>
      </AdminFormModal>
    </div>
  );
}
