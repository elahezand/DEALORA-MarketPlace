"use client";

import Link from "next/link";
import { Badge, EntityAvatar } from "../../shared/table/TableParts";
import { AdminComment, CommentStatus } from "@/types/CommentTypes";
import { RECOMMENDATION_LABEL, STATUS_TONE, Stars, fmtDate, nameOf } from "./commentParts";

/* body of the "view comment" modal: the review/reply with everything around it */
export default function CommentDetails({ comment: view }: { comment: AdminComment }) {
  const viewParent = typeof view.parentId === "object" ? view.parentId : null;
  const viewProduct = typeof view.listing === "object" ? view.listing : null;
  const viewStore = typeof view.store === "object" ? view.store : null;

  return (
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
  );
}
