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
        <p className="text-sm text-[var(--destructive)] text-center py-8">
          {errorMessage}
        </p>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="card rounded-2xl border border-[var(--border)] bg-[var(--card-solid)] overflow-hidden w-full">
        {header}
        <div className="text-center py-12">
          <p className="text-[var(--foreground)] font-bold mb-2">{emptyTitle}</p>
          <p className="text-sm text-[var(--foreground-muted)]">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card rounded-2xl border border-[var(--border)] bg-[var(--card-solid)] overflow-hidden w-full">
      {header}
      <div className="overflow-x-auto">
        <table className="w-full">{children}</table>
      </div>
    </div>
  );
}