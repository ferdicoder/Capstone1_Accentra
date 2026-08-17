import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

/** Presentational table-shaped loading placeholder (header row + body rows). */
export function TableSkeleton({ rows = 5, columns = 4, showAvatar = true, className, ...props }) {
  return (
    <div
      data-slot="table-skeleton"
      className={cn("overflow-hidden rounded-xl border border-border bg-card shadow-sm", className)}
      {...props}
    >
      <div className="flex items-center gap-6 border-b border-border bg-muted/40 px-4 py-3">
        {Array.from({ length: columns }, (_, index) => (
          <Skeleton key={index} className="h-3 w-16" />
        ))}
      </div>

      <div className="divide-y divide-border/60">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="flex items-center gap-4 px-4 py-4">
            {showAvatar && <Skeleton className="size-8 shrink-0 rounded-full" />}
            <div className="flex flex-1 items-center gap-6">
              {Array.from({ length: columns }, (_, colIndex) => (
                <Skeleton
                  key={colIndex}
                  className={cn(
                    "h-3",
                    colIndex === 0 ? "w-1/4 min-w-16" : "h-3 flex-1",
                    colIndex === columns - 1 && "w-16 max-w-16 flex-none"
                  )}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
