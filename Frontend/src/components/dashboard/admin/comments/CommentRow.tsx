"use client";

import Link from "next/link";
import { HiOutlineArrowUturnLeft, HiOutlineEye, HiOutlineCheck, HiOutlineXMark, HiOutlineTrash } from "react-icons/hi2";
import { EntityAvatar, Badge } from "../../shared/table/TableParts";
import { AdminComment, CommentStatus } from "@/types/CommentTypes";
import { STATUS_TONE, Stars, iconBtn, nameOf } from "./commentParts";

interface CommentRowProps {
  comment: AdminComment;
  kind: "review" | "reply";
  busy: boolean;
  onView: (c: AdminComment) => void;
  onApprove: (c: AdminComment) => void;
  onReject: (c: AdminComment) => void;
  onReply: (c: AdminComment) => void;
  onDelete: (c: AdminComment) => void;
}

/* one row of the admin comments table */
export default function CommentRow({ comment: c, kind, busy, onView, onApprove, onReject, onReply, onDelete }: CommentRowProps) {
  const author = typeof c.user === "object" ? c.user : null;
  const product = typeof c.listing === "object" ? c.listing : null;
  const parent = typeof c.parentId === "object" ? c.parentId : null;

  return (
    <tr className="border-b border-[var(--border)] hover:bg-[var(--background-soft)] transition-colors align-top">
      <td className="px-6 py-4 min-w-[260px] max-w-md">
        <button type="button" onClick={() => onView(c)} className="text-left w-full group">
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
          <button type="button" title="View" onClick={() => onView(c)} className={`${iconBtn} hover:bg-[var(--background-soft)]`}>
            <HiOutlineEye className="w-4 h-4" />
          </button>
          {c.status !== "approved" && (
            <button type="button" title="Approve" disabled={busy} onClick={() => onApprove(c)} className={`${iconBtn} text-[var(--success-500)] hover:bg-[var(--success-bg)]`}>
              <HiOutlineCheck className="w-4 h-4" />
            </button>
          )}
          {c.status !== "rejected" && (
            <button type="button" title="Reject" disabled={busy} onClick={() => onReject(c)} className={`${iconBtn} text-[var(--warning-500)] hover:bg-[var(--warning-bg)]`}>
              <HiOutlineXMark className="w-4 h-4" />
            </button>
          )}
          {kind === "review" && (
            <button type="button" title="Reply" disabled={busy} onClick={() => onReply(c)} className={`${iconBtn} text-[var(--primary-500)] hover:bg-[var(--primary-500)]/10`}>
              <HiOutlineArrowUturnLeft className="w-4 h-4" />
            </button>
          )}
          <button type="button" title="Delete" disabled={busy} onClick={() => onDelete(c)} className={`${iconBtn} text-[var(--destructive)] hover:bg-[var(--destructive-bg)]`}>
            <HiOutlineTrash className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
