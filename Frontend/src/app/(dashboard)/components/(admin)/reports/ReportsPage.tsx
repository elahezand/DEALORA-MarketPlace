"use client";

import { useState } from "react";
import { HiOutlineFlag } from "react-icons/hi2";
import { HiChevronRight } from "react-icons/hi";
import { useInfiniteGet } from "@/utils/hooks/useReactQueryHooks";
import { IReport, ReportStatus, ReportActionTaken } from "@/types/Report";
import TableCard from "../../shared/table/TableCard";
import { WidgetHeader } from "../../shared/table/WidgeHeader";
import { Th, Badge } from "../../shared/table/TableParts";
import { AdminFormModal, FormField, inputClass, textareaClass } from "../shared/AdminFormModal";
import { useResolveReport } from "@/services/Report/useResolveReport";

const STATUS_TABS: { value: ReportStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "reviewed", label: "Reviewed" },
  { value: "resolved", label: "Resolved" },
  { value: "rejected", label: "Rejected" },
];

const STATUS_TONE: Record<ReportStatus, "success" | "warning" | "destructive" | "info" | "neutral"> = {
  pending: "warning",
  reviewed: "info",
  resolved: "success",
  rejected: "destructive",
};

const ACTION_OPTIONS: { value: ReportActionTaken; label: string }[] = [
  { value: "none", label: "No action" },
  { value: "content_removed", label: "Content removed" },
  { value: "user_banned", label: "User banned" },
  { value: "warning_sent", label: "Warning sent" },
];

const ENDPOINT = "/reports/admin";

interface ReportRow extends Omit<IReport, "reporter"> {
  reporter: { _id: string; username?: string; phone?: string } | string;
}

interface ReportsClientProps {
  initialData?: any;
}

export default function ReportsClient({ initialData }: ReportsClientProps) {
  const [status, setStatus] = useState<ReportStatus | "all">("all");
  const [target, setTarget] = useState<ReportRow | null>(null);
  const [resolveStatus, setResolveStatus] = useState<"reviewed" | "resolved" | "rejected">("resolved");
  const [actionTaken, setActionTaken] = useState<ReportActionTaken>("none");
  const [note, setNote] = useState("");

  const params = status === "all" ? { limit: 20 } : { limit: 20, status };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteGet<any>(ENDPOINT, params, { initialData });

  const reports: ReportRow[] = (
    data?.pages?.flatMap((page: any) => page?.data ?? []) || []
  ).filter(Boolean);

  const closeModal = () => setTarget(null);

  const { mutate: resolve, isPending } = useResolveReport(closeModal);

  function openResolve(report: ReportRow) {
    setTarget(report);
    setResolveStatus("resolved");
    setActionTaken("none");
    setNote("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!target) return;
    resolve({
      id: target._id,
      status: resolveStatus,
      note: note.trim() || undefined,
      actionTaken,
    });
  }

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div>
        <p className="menu-section-title mb-1">Admin</p>
        <h1 className="!text-2xl font-black text-[var(--foreground)] tracking-tight">
          Reports
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
            icon={HiOutlineFlag}
            title="Reported Content"
            href="/dashboard/admin/reports"
          />
        }
        isLoading={isLoading}
        isError={isError}
        isEmpty={reports.length === 0}
        errorMessage="Error fetching reports"
        emptyTitle="No reports"
        emptyMessage="Nothing to review right now"
      >
        <thead className="border-b border-[var(--border)] bg-[var(--background-soft)]">
          <tr>
            <Th>Target</Th>
            <Th>Reason</Th>
            <Th>Reporter</Th>
            <Th>Status</Th>
            <Th>Date</Th>
            <Th align="right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => {
            const reporter =
              typeof report.reporter === "object" ? report.reporter : null;
            return (
              <tr
                key={report._id}
                className="border-b border-[var(--border)] hover:bg-[var(--background-soft)] transition-colors"
              >
                <td className="px-6 py-4">
                  <p className="font-bold text-sm text-[var(--foreground)] capitalize">
                    {report.targetType}
                  </p>
                  <p className="text-xs text-[var(--foreground-muted)] font-mono">
                    {report.targetId}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-[var(--foreground)] capitalize">
                    {report.reason.replace(/_/g, " ")}
                  </p>
                  {report.description && (
                    <p className="text-xs text-[var(--foreground-muted)] truncate max-w-xs">
                      {report.description}
                    </p>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-[var(--foreground-muted)]">
                  {reporter?.username || reporter?.phone || "—"}
                </td>
                <td className="px-6 py-4">
                  <Badge
                    tone={STATUS_TONE[report.status] ?? "neutral"}
                    label={report.status}
                  />
                </td>
                <td className="px-6 py-4 text-sm text-[var(--foreground-muted)]">
                  {report.createdAt
                    ? new Date(report.createdAt).toLocaleDateString("en-US")
                    : "—"}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    type="button"
                    onClick={() => openResolve(report)}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--primary-500)]/10 hover:text-[var(--primary-500)] hover:border-[var(--primary-500)]/30 transition-colors"
                  >
                    Review
                  </button>
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
        title="Resolve Report"
        icon={HiOutlineFlag}
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
              form="resolve-form"
              disabled={isPending}
              className="btn-primary !w-auto px-5 h-9 text-xs disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Save"}
            </button>
          </>
        }
      >
        <form
          id="resolve-form"
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
        >
          <FormField label="Outcome">
            <select
              className={inputClass}
              value={resolveStatus}
              onChange={(e) => setResolveStatus(e.target.value as any)}
            >
              <option value="reviewed">Reviewed (no verdict yet)</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected (not valid)</option>
            </select>
          </FormField>
          <FormField label="Action Taken">
            <select
              className={inputClass}
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value as ReportActionTaken)}
            >
              {ACTION_OPTIONS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Note (optional)">
            <textarea
              className={textareaClass}
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Internal note about this decision"
            />
          </FormField>
        </form>
      </AdminFormModal>
    </div>
  );
}