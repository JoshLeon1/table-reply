// app/(dashboard)/loading.tsx
//
// Rendered automatically by Next 14 App Router during navigation
// inside the (dashboard) segment, while the next page's data fetches.
//
// Match the home page's general shape so navigation never goes blank.

export default function DashboardLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 animate-pulse">
      <div className="h-7 w-48 rounded bg-surface mb-2" />
      <div className="h-4 w-72 rounded bg-surface mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-white p-5 h-28">
            <div className="h-3 w-20 rounded bg-surface mb-3" />
            <div className="h-7 w-16 rounded bg-surface" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-border bg-white p-6 h-64" />
    </div>
  )
}
