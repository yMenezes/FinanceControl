export function RecurringListSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="h-10 w-44 rounded-lg bg-muted animate-pulse" />
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-20 rounded-xl border border-border bg-muted/40 animate-pulse" />
      ))}
    </div>
  )
}