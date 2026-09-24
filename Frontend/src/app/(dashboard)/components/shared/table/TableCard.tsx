"use client";

interface AdminTableCardProps {
  header?: React.ReactNode;
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  errorMessage?: string;
  emptyTitle?: string;
  emptyMessage?: string;
  children: React.ReactNode;
}

export default function TableCard({
  header,
  isLoading,
  isError,
  isEmpty,
  errorMessage = "Error fetching data",
  emptyTitle = "Nothing here yet",
  emptyMessage = "New items will show up here",
  children,
}: AdminTableCardProps) {
  if (isLoading) {
    return (
      <div className="card rounded-2xl border border-[var(--border)] bg-[var(--card-solid)] overflow-hidden w-full">
        {header}
        <div className="flex flex-col gap-3 p-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-12 bg-[var(--background-soft)] rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="card rounded-2xl border border-[var(--border)] bg-[var(--card-solid)] overflow-hidden w-full">
        {header}
        <div className="flex flex-col items-center text-center py-12 px-6">
          <p className="text-sm font-bold text-[var(--destructive)]">{errorMessage}</p>
          <p className="text-xs text-[var(--foreground-muted)] mt-1">Check your connection and refresh the page.</p>
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="card rounded-2xl border border-[var(--border)] bg-[var(--card-solid)] overflow-hidden w-full">
        {header}
        <div className="flex flex-col items-center text-center py-14 px-6">
          <div className="w-12 h-12 rounded-2xl bg-[var(--background-soft)] border border-[var(--border)] flex items-center justify-center mb-3">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-[var(--foreground-subtle)]" fill="none" stroke="currentColor" strokeWidth={1.6}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125h4.5M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          </div>
          <p className="text-[var(--foreground)] font-bold mb-1">{emptyTitle}</p>
          <p className="text-sm text-[var(--foreground-muted)] max-w-sm">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card rounded-2xl border border-[var(--border)] bg-[var(--card-solid)] overflow-hidden w-full">
      {header}
      <div className="dash-table-scroll">
        <table className="w-full min-w-[640px]">{children}</table>
      </div>
    </div>
  );
}