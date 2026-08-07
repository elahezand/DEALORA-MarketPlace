"use client";

import { HiOutlineEnvelope } from "react-icons/hi2";
import { HiChevronRight } from "react-icons/hi";
import { useInfiniteGet } from "@/utils/hooks/useReactQueryHooks";
import TableCard from "../../shared/table/TableCard";
import { WidgetHeader } from "../../shared/table/WidgeHeader";
import { Th } from "../../shared/table/TableParts";

interface Subscriber {
  _id: string;
  email: string;
  createdAt: string;
}

const ENDPOINT = "/newsletters";

interface NewsletterClientProps {
  initialData?: any;
}

export default function NewsletterClient({ initialData }: NewsletterClientProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteGet<any>(ENDPOINT, { limit: 30 }, { initialData });

  const subscribers: Subscriber[] = (
    data?.pages?.flatMap((page: any) => page?.data ?? []) || []
  ).filter(Boolean);

  const total = subscribers.length;

  function exportCsv() {
    const rows = [
      "email,subscribed_at",
      ...subscribers.map((s) => `${s.email},${s.createdAt}`),
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "newsletter-subscribers.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="menu-section-title mb-1">Admin</p>
          <h1 className="!text-2xl font-black text-[var(--foreground)] tracking-tight">
            Newsletter
          </h1>
        </div>
        {total > 0 && (
          <button
            type="button"
            onClick={exportCsv}
            className="text-xs font-bold px-4 h-10 rounded-lg border border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--background-soft)] transition-colors"
          >
            Export loaded ({total}) as CSV
          </button>
        )}
      </div>

      <TableCard
        header={
          <WidgetHeader
            icon={HiOutlineEnvelope}
            title="Subscribers"
            href="/dashboard/admin/newsletter"
          />
        }
        isLoading={isLoading}
        isError={isError}
        isEmpty={subscribers.length === 0}
        errorMessage="Error fetching subscribers"
        emptyTitle="No subscribers yet"
        emptyMessage="New signups will show up here"
      >
        <thead className="border-b border-[var(--border)] bg-[var(--background-soft)]">
          <tr>
            <Th>Email</Th>
            <Th>Subscribed</Th>
          </tr>
        </thead>
        <tbody>
          {subscribers.map((s) => (
            <tr
              key={s._id}
              className="border-b border-[var(--border)] hover:bg-[var(--background-soft)] transition-colors"
            >
              <td className="px-6 py-4 text-sm font-bold text-[var(--foreground)]">
                {s.email}
              </td>
              <td className="px-6 py-4 text-sm text-[var(--foreground-muted)]">
                {s.createdAt ? new Date(s.createdAt).toLocaleDateString("en-US") : "—"}
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
              className={`text-lg transition-transform duration-200 ${
                isFetchingNextPage ? "animate-spin" : ""
              }`}
            />
          </button>
        </div>
      )}
    </div>
  );
}