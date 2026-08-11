import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

/** Presentational card-shaped loading placeholder (title bar + label/value rows). */
export function CardSkeleton({ title = true, rows = 3, className, ...props }) {
  return (
    <div
      data-slot="card-skeleton"
      className={cn("rounded-xl border border-border bg-card p-6 shadow-sm", className)}
      {...props}
    >
      {title && (
        <Skeleton
          className={cn(
            "mb-5 h-4",
            title === "lg" ? "w-40" : title === "sm" ? "w-20" : "w-28"
          )}
        />
      )}
      <div className="flex flex-col gap-4">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="grid grid-cols-[130px_1fr] gap-4 sm:grid-cols-[150px_1fr]">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className={cn("h-3.5", index % 2 === 0 ? "w-3/4" : "w-1/2")} />
          </div>
        ))}
      </div>
    </div>
  )
}
