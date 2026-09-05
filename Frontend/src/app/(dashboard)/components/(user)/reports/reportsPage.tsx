"use client";

import { Fragment, useState } from "react";
import { HiOutlineFlag, HiChevronDown, HiChevronRight } from "react-icons/hi2";
import { useInfiniteGet } from "@/utils/hooks/useReactQueryHooks";
import { IReport, ReportsResponse } from "@/types/Report";
import { IPagination } from "@/types/common";
import TableCard from "../../shared/table/TableCard";
import { Th, Badge } from "../../shared/table/TableParts";
import { timeAgo } from "@/utils/timeAgo";

type ToneType = "success" | "warning" | "destructive" | "neutral" | "info";

const STATUS_TONE: Record<string, ToneType> = {
  pending: "warning",
  reviewed: "info",
  resolved: "success",
  rejected: "destructive",
};

const REASON_LABELS: Record<string, string> = {
  fraud: "Fraud or scam",
  inappropriate: "Inappropriate content",
  duplicate: "Duplicate listing",
  fake: "Fake listing / counterfeit",
  prohibited_item: "Prohibited item",
  other: "Other",
};

const ACTION_LABELS: Record<string, string> = {
  none: "No action taken",
  content_removed: "Content removed",
  user_banned: "User banned",
  warning_sent: "Warning sent",
};

const filterOptions = [
  { id: "all", label: "All Reports", status: null },
  { id: "pending", label: "Pending", status: ["pending"] },
  { id: "reviewed", label: "Reviewed", status: ["reviewed"] },
  { id: "resolved", label: "Resolved", status: ["resolved"] },
  { id: "rejected", label: "Rejected", status: ["rejected"] },
];

interface ReportsPageProps {
  initialData?: IReport[];
  initialPagination?: IPagination | null;
}

const EMPTY_PAGINATION: IPagination = { limit: 20, nextCursor: null, hasMore: false };

export default function ReportsPage({
  initialData = [],
  initialPagination = null,
}: ReportsPageProps) {
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteGet<ReportsResponse>(
    "/reports/mine",
    {},
    {
      initialData: {
        pages: [{ success: true, data: initialData, pagination: initialPagination ?? EMPTY_PAGINATION }],
        pageParams: [null],
      },
    }
  );

  const allReports = (
    data?.pages.flatMap((page: ReportsResponse) => page?.data ?? []) || []
  ).filter(Boolean);

  const selectedFilterConfig = filterOptions.find((f) => f.id === selectedFilter);

  const reports =
    selectedFilterConfig?.status === null
      ? allReports
      : allReports.filter((r) => selectedFilterConfig?.status?.includes(r.status));

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="menu-section-title mb-1">Reports</p>
          <h1 className="!text-2xl font-black text-[var(--foreground)] tracking-tight">
            My Reports
          </h1>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {filterOptions.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setSelectedFilter(filter.id)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium text-sm transition-all ${
              selectedFilter === filter.id
                ? "bg-[var(--primary-500)] text-white shadow-lg"
                : "bg-[var(--background-soft)] text-[var(--foreground-muted)] border border-[var(--border)] hover:bg-[var(--card-solid)]"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <TableCard
        isLoading={isLoading}
        isError={isError}
        isEmpty={reports.length === 0}
        errorMessage="Error fetching your reports"
        emptyTitle={allReports.length === 0 ? "No reports yet" : "No reports found"}
        emptyMessage={
          allReports.length === 0
            ? "Reports you submit about listings, stores, comments or users will show up here"
            : `No reports match the "${selectedFilterConfig?.label}" filter`
        }
      >
        <thead className="border-b border-[var(--border)] bg-[var(--background-soft)]">
          <tr>
            <Th>Target</Th>
            <Th>Reason</Th>
            <Th>Status</Th>
            <Th>Submitted</Th>
            <Th align="right">Details</Th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => {
            if (!report) return null;
            const tone = STATUS_TONE[report.status] || "neutral";
            const isExpanded = expandedId === report._id;

            return (
              <Fragment key={report._id}>
                <tr
                  onClick={() =>
                    setExpandedId(isExpanded ? null : report._id)
                  }
                  className="border-b border-[var(--border)] hover:bg-[var(--background-soft)] transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <HiOutlineFlag className="w-4 h-4 text-[var(--foreground-subtle)] flex-shrink-0" />
                      <div>
                        <p className="font-bold text-sm text-[var(--foreground)] capitalize">
                          {report.targetType}
                        </p>
                        <p className="text-xs text-[var(--foreground-muted)] font-mono">
                          {report.targetId.slice(-8).toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-sm text-[var(--foreground)]">
                    {REASON_LABELS[report.reason] || report.reason}
                  </td>

                  <td className="px-6 py-4">
                    <Badge tone={tone} label={report.status} />
                  </td>

                  <td className="px-6 py-4 text-sm text-[var(--foreground-muted)]">
                    {report.createdAt ? formatDate(report.createdAt) : "N/A"}
                  </td>

                  <td className="px-6 py-4 text-right">
                    {isExpanded ? (
                      <HiChevronDown className="w-4 h-4 text-[var(--foreground-muted)] inline-block" />
                    ) : (
                      <HiChevronRight className="w-4 h-4 text-[var(--foreground-muted)] inline-block" />
                    )}
                  </td>
                </tr>

                {isExpanded && (
                  <tr key={`${report._id}-details`} className="border-b border-[var(--border)] bg-[var(--background-soft)]">
                    <td colSpan={5} className="px-6 py-4">
                      <div className="flex flex-col gap-2 text-sm">
                        <div>
                          <span className="font-bold text-[var(--foreground)]">
                            Your description:{" "}
                          </span>
                          <span className="text-[var(--foreground-muted)]">
                            {report.description?.trim() || "No additional details provided."}
                          </span>
                        </div>

                        {report.status === "resolved" || report.status === "rejected" || report.status === "reviewed" ? (
                          <div className="flex flex-col gap-1 pt-2 border-t border-[var(--border)]">
                            <span className="font-bold text-[var(--foreground)]">
                              Moderator response
                            </span>
                            {report.resolution?.actionTaken && (
                              <span className="text-[var(--foreground-muted)]">
                                Action:{" "}
                                {ACTION_LABELS[report.resolution.actionTaken] ||
                                  report.resolution.actionTaken}
                              </span>
                            )}
                            {report.resolution?.note && (
                              <span className="text-[var(--foreground-muted)]">
                                Note: {report.resolution.note}
                              </span>
                            )}
                            {report.resolution?.resolvedAt && (
                              <span className="text-xs text-[var(--foreground-subtle)]">
                                {timeAgo(report.resolution.resolvedAt)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-[var(--foreground-subtle)] pt-2 border-t border-[var(--border)]">
                            Our team hasn't reviewed this report yet.
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </TableCard>

      {/* Load more */}
      {hasNextPage && (
        <div className="p-4 flex justify-center w-full">
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="flex items-center justify-center w-full sm:w-auto gap-2 px-8 h-8 rounded-[var(--radius)] bg-[var(--primary-500)] dark:bg-[var(--accent-500)] text-sm font-semibold text-white hover:bg-[var(--primary-600)] dark:hover:bg-[var(--accent-400)] active:scale-[0.98] disabled:bg-[var(--neutral-200)] dark:disabled:bg-[var(--neutral-800)] disabled:text-[var(--neutral-400)] dark:disabled:text-[var(--neutral-600)] disabled:cursor-not-allowed transition-all duration-200"
          >
            <span>{isFetchingNextPage ? "Loading..." : "Load More"}</span>
            <HiChevronRight
              className={`text-lg transition-transform duration-200 ${
                isFetchingNextPage ? "animate-spin" : "group-hover:translate-x-0.5"
              }`}
            />
          </button>
        </div>
      )}
    </div>
  );
}
