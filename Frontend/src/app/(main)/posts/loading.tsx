// shown while the listings page streams in (filters + first page of results)
export default function PostsLoading() {
  return (
    <div className="max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6" aria-busy="true" aria-label="Loading listings">
      <div className="h-12 w-full rounded-2xl bg-[var(--background-soft)] animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="card rounded-2xl border border-[var(--border)] overflow-hidden">
            <div className="aspect-[4/3] bg-[var(--background-soft)] animate-pulse" />
            <div className="p-4 space-y-2">
              <div className="h-4 w-3/4 rounded bg-[var(--background-soft)] animate-pulse" />
              <div className="h-4 w-1/3 rounded bg-[var(--background-soft)] animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
