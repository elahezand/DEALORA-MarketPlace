"use client";

import { useState } from "react";
import { toast } from "sonner";
import { HiOutlineChatBubbleLeftRight } from "react-icons/hi2";
import { HiChevronRight } from "react-icons/hi";
import { useInfiniteGet } from "@/utils/hooks/useReactQueryHooks";
import TableCard from "../../shared/table/TableCard";
import { WidgetHeader } from "../../shared/table/WidgeHeader";
import { Th, EntityAvatar, Badge } from "../../shared/table/TableParts";
import { AdminFormModal, FormField, textareaClass } from "../shared/AdminFormModal";
import { useModerateComment } from "@/services/Comments/useModerateComment";
import { useDeleteComment } from "@/services/Comments/useDeleteComment";
import { CommentStatus,AdminComment } from "@/types/CommetTypes";

const ENDPOINT = "/comments/admin";

interface CommentsClientProps {
  initialData?: any;
}
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

export default function CommentsClient({ initialData }: CommentsClientProps) {
  const [status, setStatus] = useState<CommentStatus | "all">("pending");
  const [rejectTarget, setRejectTarget] = useState<AdminComment | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actioningId, setActioningId] = useState<string | null>(null);

  const params = status === "all" ? { limit: 20 } : { limit: 20, status };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteGet<any>(ENDPOINT, params, { initialData });

  const comments: AdminComment[] = (
    data?.pages?.flatMap((page: any) => page?.data ?? []) || []
  ).filter(Boolean);

  const { mutate: moderate } = useModerateComment(() => {
    setRejectTarget(null);
    setRejectReason("");
    setActioningId(null);
  });

  const { mutate: removeComment } = useDeleteComment();

  function handleApprove(c: AdminComment) {
    setActioningId(c._id);
    moderate({ id: c._id, status: "approved" });
  }

  function openReject(c: AdminComment) {
    setRejectTarget(c);
    setRejectReason("");
  }

  function submitReject(e: React.FormEvent) {
    e.preventDefault();
    if (!rejectTarget || !rejectReason.trim()) return;
    setActioningId(rejectTarget._id);
    moderate({ id: rejectTarget._id, status: "rejected", rejectReason: rejectReason.trim() });
  }

  function handleMarkSpam(c: AdminComment) {
    setActioningId(c._id);
    moderate({ id: c._id, status: "spam" });
  }

  function handleDelete(c: AdminComment) {
    toast.warning("Delete this comment permanently from view?", {
      description: "This action cannot be undone.",
      action: {
        label: "Delete",
        onClick: () => {
          setActioningId(c._id);
          removeComment({ id: c._id }, { onSettled: () => setActioningId(null) });
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => {},
      },
    });
  }

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div>
        <p className="menu-section-title mb-1">Admin</p>
        <h1 className="!text-2xl font-black text-[var(--foreground)] tracking-tight">Comments</h1>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setStatus(tab.value)}
            className={`text-xs font-bold px-4 py-2 rounded-lg border transition-colors ${
              status === tab.value
                ? "bg-[var(--primary-500)] text-white border-[var(--primary-500)]"
                : "border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--background-soft)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <TableCard
        header={<WidgetHeader icon={HiOutlineChatBubbleLeftRight} title="Comments" href="/dashboard/admin/comments" />}
        isLoading={isLoading}
        isError={isError}
        isEmpty={comments.length === 0}
        errorMessage="Error fetching comments"
        emptyTitle="Nothing here"
        emptyMessage={`No ${status === "all" ? "" : status} comments right now`}
      >
        <thead className="border-b border-[var(--border)] bg-[var(--background-soft)]">
          <tr>
            <Th>Comment</Th>
            <Th>Author</Th>
            <Th>Product</Th>
            <Th>Status</Th>
            <Th align="right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {comments.map((c) => {
            const author = typeof c.user === "object" ? c.user : null;
            const product = typeof c.productId === "object" ? c.productId : null;
            const busy = actioningId === c._id;
            return (
              <tr key={c._id} className="border-b border-[var(--border)] hover:bg-[var(--background-soft)] transition-colors">
                <td className="px-6 py-4 max-w-sm">
                  <p className="text-sm text-[var(--foreground)] line-clamp-2">{c.body}</p>
                  {typeof c.rating === "number" && (
                    <p className="text-xs text-[var(--foreground-subtle)] mt-1">Rating: {c.rating}/5</p>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2.5">
                    <EntityAvatar
                      alt={author?.username ?? "user"}
                      fallback={(author?.username ?? author?.phone ?? "?").slice(0, 2).toUpperCase()}
                    />
                    <p className="text-sm text-[var(--foreground)]">{author?.username || author?.phone || "—"}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-[var(--foreground-muted)] truncate max-w-[160px]">
                  {product?.title || "—"}
                </td>
                <td className="px-6 py-4">
                  <Badge tone={STATUS_TONE[c.status]} label={c.status} />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-1.5 flex-wrap">
                    {c.status !== "approved" && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleApprove(c)}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--success-500)]/30 text-[var(--success-500)] hover:bg-[var(--success-bg)] transition-colors disabled:opacity-40"
                      >
                        Approve
                      </button>
                    )}
                    {c.status !== "rejected" && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => openReject(c)}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--warning-500)]/30 text-[var(--warning-500)] hover:bg-[var(--warning-bg)] transition-colors disabled:opacity-40"
                      >
                        Reject
                      </button>
                    )}
                    {c.status !== "spam" && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleMarkSpam(c)}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--background-soft)] transition-colors disabled:opacity-40"
                      >
                        Spam
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleDelete(c)}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--destructive)]/30 text-[var(--destructive)] hover:bg-[var(--destructive-bg)] transition-colors disabled:opacity-40"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </TableCard>

      {hasNextPage && (
        <div className="flex justify-center w-full">
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="flex items-center justify-center w-full sm:w-auto gap-2 px-8 h-8 rounded-[var(--radius)] bg-[var(--primary-500)] dark:bg-[var(--accent-500)] text-sm font-semibold text-white hover:bg-[var(--primary-600)] dark:hover:bg-[var(--accent-400)] active:scale-[0.98] disabled:opacity-50 transition-all duration-200"
          >
            <span>{isFetchingNextPage ? "Loading..." : "Load More"}</span>
            <HiChevronRight className={`text-lg transition-transform duration-200 ${isFetchingNextPage ? "animate-spin" : ""}`} />
          </button>
        </div>
      )}

      <AdminFormModal
        isOpen={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        title="Reject Comment"
        icon={HiOutlineChatBubbleLeftRight}
        footer={
          <>
            <button type="button" onClick={() => setRejectTarget(null)} className="text-xs font-bold px-4 h-9 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--background-soft)] transition-colors">
              Cancel
            </button>
            <button type="submit" form="reject-comment-form" disabled={!rejectReason.trim()} className="btn-primary !w-auto px-5 h-9 text-xs disabled:opacity-50">
              Reject
            </button>
          </>
        }
      >
        <form id="reject-comment-form" onSubmit={submitReject} className="flex flex-col gap-4">
          <FormField label="Reason (shown internally, required)">
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
    </div>
  );
}