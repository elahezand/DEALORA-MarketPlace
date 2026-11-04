"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  HiOutlineChatBubbleLeftRight,
  HiOutlineArrowUturnLeft,
  HiOutlineEye,
  HiOutlineXMark,
} from "react-icons/hi2";
import { HiChevronRight } from "react-icons/hi";
import { InfiniteData } from "@tanstack/react-query";
import { useInfiniteGet } from "@/utils/hooks/useReactQueryHooks";
import TableCard from "../../shared/table/TableCard";
import { WidgetHeader } from "../../shared/table/WidgeHeader";
import { Th } from "../../shared/table/TableParts";
import { AdminFormModal, FormField, textareaClass } from "../shared/AdminFormModal";
import { useModerateComment } from "@/services/Comments/useModerateComment";
import { useDeleteComment } from "@/services/Comments/useDeleteComment";
import { useAnswerComment } from "@/services/Comments/useAnswerComment";
import { CommentStatus, AdminComment, AdminCommentsResponse } from "@/types/CommentTypes";
import CommentRow from "./CommentRow";
import CommentDetails from "./CommentDetails";
import { chip, selectClass, Stars } from "./commentParts";
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
          {comments.map((c) => (
            <CommentRow
              key={c._id}
              comment={c}
              kind={kind}
              busy={actioningId === c._id}
              onView={setViewTarget}
              onApprove={approve}
              onReject={openReject}
              onReply={openReply}
              onDelete={confirmDelete}
            />
          ))}
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
        {view && <CommentDetails comment={view} />}
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
