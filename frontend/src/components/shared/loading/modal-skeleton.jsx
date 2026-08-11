import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

/** Presentational modal-shaped loading placeholder (dark blurred backdrop + popup). */
export function ModalSkeleton({ size = "md", rows = 4, className, ...props }) {
  return (
    <div
      data-slot="modal-skeleton"
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
      {...props}
    >
      <div
        className={cn(
          "flex w-full flex-col gap-5 rounded-xl border border-border bg-card p-6 shadow-lg",
          size === "sm" && "max-w-sm",
          size === "md" && "max-w-lg",
          size === "lg" && "max-w-3xl",
          className
        )}
      >
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-64 max-w-full" />
        </div>

        <div className="flex flex-col gap-3">
          {Array.from({ length: rows }, (_, index) => (
            <Skeleton key={index} className={cn("h-3.5", index % 2 === 0 ? "w-full" : "w-3/4")} />
          ))}
        </div>

        <div className="mt-1 flex justify-end gap-2">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      </div>
    </div>
  )
}
