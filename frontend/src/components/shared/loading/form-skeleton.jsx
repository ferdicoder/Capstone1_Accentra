import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

/** Presentational form-shaped loading placeholder (label + input bars per field). */
export function FormSkeleton({ fields = 4, columns = 1, showActions = true, className, ...props }) {
  return (
    <div
      data-slot="form-skeleton"
      className={cn("rounded-xl border border-border bg-card p-6 shadow-sm", className)}
      {...props}
    >
      <Skeleton className="mb-5 h-4 w-32" />

      <div className="flex flex-col gap-5">
        {Array.from({ length: fields }, (_, fieldIndex) => (
          <div key={fieldIndex} className="flex flex-col gap-2">
            <Skeleton className="h-3 w-24" />
            <div
              className="grid gap-4"
              style={columns > 1 ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` } : undefined}
            >
              {Array.from({ length: columns }, (_, colIndex) => (
                <Skeleton key={colIndex} className="h-9 w-full rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>

      {showActions && (
        <div className="mt-6 flex justify-end gap-2">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      )}
    </div>
  )
}
