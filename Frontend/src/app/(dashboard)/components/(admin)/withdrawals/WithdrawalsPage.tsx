"use client";

import { useState } from "react";
import { HiOutlineBanknotes } from "react-icons/hi2";
import { HiChevronRight } from "react-icons/hi";
import { InfiniteData } from "@tanstack/react-query";
import { useInfiniteGet } from "@/utils/hooks/useReactQueryHooks";
import TableCard from "../../shared/table/TableCard";
import { WidgetHeader } from "../../shared/table/WidgeHeader";
import { Th, Badge } from "../../shared/table/TableParts";
import { Withdrawal, WithdrawalStatus, WithdrawalsResponse } from "@/types/Withdrawal";
import { QueryParams } from "@/types/api/ErrorTypes";
import {
  AdminFormModal,
  FormField,
  inputClass,
  textareaClass,
} from "../shared/AdminFormModal";
import { useProcessWithdrawal } from "@/services/Withdrawls/useProcessWithdrawal";

const STATUS_TABS: { value: WithdrawalStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
];

const STATUS_TONE: Record<
  WithdrawalStatus,
  "success" | "warning" | "destructive" | "info" | "neutral"
> = {
  pending: "warning",
  processing: "info",
  completed: "success",
  rejected: "destructive",
};

const ENDPOINT = "/withdrawals/admin";

interface WithdrawalsClientProps {
  initialData?: InfiniteData<WithdrawalsResponse>;
}

export default function WithdrawalsClient({
  initialData,
}: WithdrawalsClientProps) {
  const [status, setStatus] = useState<WithdrawalStatus | "all">("pending");
  const [target, setTarget] = useState<Withdrawal | null>(null);
  const [action, setAction] = useState<"processing" | "completed" | "rejected">(
    "completed"
  );
  const [trackingCode, setTrackingCode] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  const params: QueryParams = status === "all" ? { limit: 20 } : { limit: 20, status };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteGet<WithdrawalsResponse>(ENDPOINT, params, { initialData });

  const withdrawals: Withdrawal[] = (
    data?.pages?.flatMap((page: WithdrawalsResponse) => page?.data ?? []) || []
  ).filter(Boolean);

  const closeModal = () => setTarget(null);

  const { mutate: process, isPending } = useProcessWithdrawal(closeModal);

  function openProcess(w: Withdrawal) {
    setTarget(w);
    setAction("completed");
    setTrackingCode("");
    setRejectReason("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!target) return;
    if (action === "rejected" && !rejectReason.trim()) return;

    process({
      id: target._id,
      status: action,
      trackingCode: trackingCode.trim() || undefined,
      rejectReason: action === "rejected" ? rejectReason.trim() : undefined,
    });
  }

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div>
        <p className="menu-section-title mb-1">Admin</p>
        <h1 className="!text-2xl font-black text-[var(--foreground)] tracking-tight">
          Withdrawals
        </h1>
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
        header={
          <WidgetHeader
            icon={HiOutlineBanknotes}
            title="Seller Withdrawal Requests"
            href="/dashboard/admin/withdrawals"
          />
        }
        isLoading={isLoading}
        isError={isError}
        isEmpty={withdrawals.length === 0}
        errorMessage="Error fetching withdrawals"
        emptyTitle="No withdrawal requests"
        emptyMessage="Nothing to process right now"
      >
        <thead className="border-b border-[var(--border)] bg-[var(--background-soft)]">
          <tr>
            <Th>Store</Th>
            <Th>Amount</Th>
            <Th>Bank Account</Th>
            <Th>Status</Th>
            <Th>Date</Th>
            <Th align="right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {withdrawals.map((w) => {
            const store = typeof w.store === "object" ? w.store : null;
            const canProcess =
              w.status === "pending" || w.status === "processing";
            return (
              <tr
                key={w._id}
                className="border-b border-[var(--border)] hover:bg-[var(--background-soft)] transition-colors"
              >
                <td className="px-6 py-4 text-sm font-bold text-[var(--foreground)]">
                  {store?.name || "—"}
                </td>
                <td className="px-6 py-4 text-sm font-bold text-[var(--foreground)]">
                  ${w.amount.toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-[var(--foreground)]">
                    {w.bankAccount?.ownerName}
                  </p>
                  <p className="text-xs text-[var(--foreground-muted)] font-mono">
                    {w.bankAccount?.iban}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <Badge tone={STATUS_TONE[w.status]} label={w.status} />
                </td>
                <td className="px-6 py-4 text-sm text-[var(--foreground-muted)]">
                  {new Date(w.createdAt).toLocaleDateString("en-US")}
                </td>
                <td className="px-6 py-4 text-right">
                  {canProcess ? (
                    <button
                      type="button"
                      onClick={() => openProcess(w)}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--primary-500)]/10 hover:text-[var(--primary-500)] hover:border-[var(--primary-500)]/30 transition-colors"
                    >
                      Process
                    </button>
                  ) : (
                    <span className="text-xs text-[var(--foreground-subtle)]">
                      Finalized
                    </span>
                  )}
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
            <HiChevronRight
              className={`text-lg transition-transform duration-200 ${
                isFetchingNextPage ? "animate-spin" : ""
              }`}
            />
          </button>
        </div>
      )}

      <AdminFormModal
        isOpen={!!target}
        onClose={closeModal}
        title="Process Withdrawal"
        icon={HiOutlineBanknotes}
        footer={
          <>
            <button
              type="button"
              onClick={closeModal}
              className="text-xs font-bold px-4 h-9 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--background-soft)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="withdrawal-form"
              disabled={
                isPending || (action === "rejected" && !rejectReason.trim())
              }
              className="btn-primary !w-auto px-5 h-9 text-xs disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Confirm"}
            </button>
          </>
        }
      >
        {target && (
          <form
            id="withdrawal-form"
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
          >
            <div className="p-3 rounded-xl bg-[var(--background-soft)] border border-[var(--border)] text-sm text-[var(--foreground)]">
              Amount:{" "}
              <span className="font-bold">
                ${target.amount.toLocaleString()}
              </span>
              <br />
              IBAN:{" "}
              <span className="font-mono">{target.bankAccount?.iban}</span>
            </div>
            <FormField label="Action">
              <select
                className={inputClass}
                value={action}
                onChange={(e) => setAction(e.target.value as "processing" | "completed" | "rejected")}
              >
                <option value="processing">Mark as processing</option>
                <option value="completed">Mark as completed</option>
                <option value="rejected">Reject</option>
              </select>
            </FormField>
            {action !== "rejected" && (
              <FormField label="Tracking code (optional)">
                <input
                  className={inputClass}
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  placeholder="Bank transfer reference"
                />
              </FormField>
            )}
            {action === "rejected" && (
              <FormField label="Rejection reason (required)">
                <textarea
                  className={textareaClass}
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Why is this withdrawal being rejected?"
                  required
                />
              </FormField>
            )}
          </form>
        )}
      </AdminFormModal>
    </div>
  );
}