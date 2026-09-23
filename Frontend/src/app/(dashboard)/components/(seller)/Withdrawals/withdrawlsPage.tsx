"use client";

import { useState } from "react";
import {
  HiOutlineBanknotes,
  HiOutlinePlus,
  HiOutlineWallet,
} from "react-icons/hi2";
import { HiChevronRight } from "react-icons/hi";
import { InfiniteData } from "@tanstack/react-query";
import TableCard from "../../shared/table/TableCard";
import { WidgetHeader } from "../../shared/table/WidgeHeader";
import { Th, Badge } from "../../shared/table/TableParts";
import {
  AdminFormModal,
  FormField,
  inputClass,
} from "../../(admin)/shared/AdminFormModal";
import { useInfiniteGet } from "@/utils/hooks/useReactQueryHooks";
import { useGetSellerStats } from "@/services/Stats/useGetStats";
import { useCreateWithdrawal } from "@/services/Withdrawls/useCreateWithdrawal";
import {
  Withdrawal,
  WithdrawalStatus,
  WithdrawalsResponse,
} from "@/types/Withdrawal";
import { QueryParams } from "@/types/api/ErrorTypes";
import { toast } from "sonner";

const MIN_WITHDRAWAL = 1000;

const STATUS_TABS: { value: WithdrawalStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "processing", label: "Processing" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
];

const STATUS_TONE: Record<
  WithdrawalStatus,
  "success" | "warning" | "destructive" | "info"
> = {
  processing: "info",
  completed: "success",
  rejected: "destructive",
};

interface WithdrawalsPageProps {
  initialData?: InfiniteData<WithdrawalsResponse>;
}

const ENDPOINT = "/withdrawals/mine";

export default function WithdrawalsPage({ initialData }: WithdrawalsPageProps) {
  const [status, setStatus] = useState<WithdrawalStatus | "all">("processing");
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [amountInput, setAmountInput] = useState("");
  const [ibanInput, setIbanInput] = useState("");
  const [ownerNameInput, setOwnerNameInput] = useState("");

  const { stats, isLoading: isStatsLoading } = useGetSellerStats();
  const balance = stats?.walletBalance ?? 0;
  const pending = stats?.walletPending ?? 0;

  const params: QueryParams =
    status === "all" ? { limit: 20 } : { limit: 20, status };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteGet<WithdrawalsResponse>(ENDPOINT, params, {
    queryKey: ["/withdrawals/mine", status],
    initialData: status === "processing" ? initialData : undefined,
  });

  const withdrawals: Withdrawal[] = (
    data?.pages?.flatMap((page: WithdrawalsResponse) => page?.data ?? []) || []
  ).filter(Boolean);

  function closeRequest() {
    setIsRequestOpen(false);
    setAmountInput("");
    setIbanInput("");
    setOwnerNameInput("");
  }

  const { mutate: createWithdrawal, isPending: isSubmitting } =
    useCreateWithdrawal(closeRequest);

  function submitRequest(e: React.FormEvent) {
    e.preventDefault();

    const amount = Number(amountInput);
    const iban = ibanInput.trim();
    const ownerName = ownerNameInput.trim();

    if (!amount || amount < MIN_WITHDRAWAL) {
      toast.error(`Minimum withdrawal amount is $${MIN_WITHDRAWAL.toLocaleString()}`);
      return;
    }
    if (amount > balance) {
      toast.error("Amount exceeds your available wallet balance");
      return;
    }
    if (!iban || !ownerName) {
      toast.error("Bank account details are required");
      return;
    }

    createWithdrawal({ amount, bankAccount: { iban, ownerName } });
  }

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="menu-section-title mb-1">Seller</p>
          <h1 className="!text-2xl font-black text-[var(--foreground)] tracking-tight">
            Withdrawals
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setIsRequestOpen(true)}
          disabled={isStatsLoading || balance < MIN_WITHDRAWAL}
          className="btn-primary !w-auto px-5 h-10 text-sm gap-2 flex items-center disabled:opacity-40"
        >
          <HiOutlinePlus className="w-4 h-4" />
          <span>Request Withdrawal</span>
        </button>
      </div>

      {/* Balance card */}
      <div className="card rounded-2xl border border-[var(--border)] bg-[var(--card-solid)] p-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-[var(--success-bg)] flex items-center justify-center flex-shrink-0">
          <HiOutlineWallet className="w-6 h-6 text-[var(--success-500)]" />
        </div>
        <div>
          <p className="text-2xl font-black text-[var(--foreground)]">
            {isStatsLoading ? "—" : `$${balance.toLocaleString()}`}
          </p>
          <p className="text-xs font-bold text-[var(--foreground-muted)] uppercase tracking-wider">
            Available Wallet Balance
          </p>
          {pending > 0 && (
            <p className="text-xs text-[var(--foreground-muted)] mt-1">
              ${pending.toLocaleString()} pending — released when buyers receive their orders
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setStatus(tab.value)}
            className={`text-xs font-bold px-4 py-2 rounded-lg border transition-colors ${status === tab.value
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
            title="Withdrawal Requests"
            href="/dashboard/seller/withdrawals"
          />
        }
        isLoading={isLoading}
        isError={isError}
        isEmpty={withdrawals.length === 0}
        errorMessage="Error fetching your withdrawals"
        emptyTitle="No withdrawal requests yet"
        emptyMessage="Requests you submit will show up here"
      >
        <thead className="border-b border-[var(--border)] bg-[var(--background-soft)]">
          <tr>
            <Th>Amount</Th>
            <Th>Bank Account</Th>
            <Th>Status</Th>
            <Th>Date</Th>
            <Th align="right">Note</Th>
          </tr>
        </thead>
        <tbody>
          {withdrawals.map((w) => (
            <tr
              key={w._id}
              className="border-b border-[var(--border)] hover:bg-[var(--background-soft)] transition-colors"
            >
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
              <td className="px-6 py-4 text-xs text-right text-[var(--foreground-subtle)] truncate max-w-[200px]">
                {w.status === "rejected"
                  ? w.rejectReason || "No reason given"
                  : w.status === "completed"
                    ? w.trackingCode || "—"
                    : "—"}
              </td>
            </tr>
          ))}
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
              className={`text-lg transition-transform duration-200 ${isFetchingNextPage ? "animate-spin" : ""
                }`}
            />
          </button>
        </div>
      )}

      {/* REQUEST MODAL */}
      <AdminFormModal
        isOpen={isRequestOpen}
        onClose={closeRequest}
        title="Request Withdrawal"
        icon={HiOutlineBanknotes}
        footer={
          <>
            <button
              type="button"
              onClick={closeRequest}
              className="text-xs font-bold px-4 h-9 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--background-soft)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="withdrawal-request-form"
              disabled={isSubmitting}
              className="btn-primary !w-auto px-5 h-9 text-xs disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </button>
          </>
        }
      >
        <form
          id="withdrawal-request-form"
          onSubmit={submitRequest}
          className="flex flex-col gap-4"
        >
          <p className="text-xs text-[var(--foreground-muted)]">
            Available balance:{" "}
            <span className="font-bold text-[var(--foreground)]">
              ${balance.toLocaleString()}
            </span>
          </p>
          <FormField label={`Amount (min $${MIN_WITHDRAWAL.toLocaleString()})`}>
            <input
              type="number"
              min={MIN_WITHDRAWAL}
              max={balance}
              className={inputClass}
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              placeholder="e.g. 5000"
            />
          </FormField>
          <FormField label="IBAN">
            <input
              type="text"
              className={inputClass}
              value={ibanInput}
              onChange={(e) => setIbanInput(e.target.value)}
              placeholder="Your bank account IBAN"
            />
          </FormField>
          <FormField label="Account Owner Name">
            <input
              type="text"
              className={inputClass}
              value={ownerNameInput}
              onChange={(e) => setOwnerNameInput(e.target.value)}
              placeholder="Name on the bank account"
            />
          </FormField>
        </form>
      </AdminFormModal>
    </div>
  );
}