import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

/**
 * Pagination footer for the firm user list.
 *
 * The arrow reveals its label ("Next" / "Previous") right beside it and turns
 * green on hover, matching the app's green hover palette. The label sits in a
 * reserved slot so the arrows never move under the pointer.
 */
export function FirmUserPagination({
  page = 1,
  totalPages = 1,
  onPageChange,
  className,
  ...props
}) {
  const [hovered, setHovered] = useState(null)

  const canGoPrev = page > 1
  const canGoNext = page < totalPages

  return (
    <div
      data-slot="firm-user-pagination"
      onMouseLeave={() => setHovered(null)}
      className={cn("flex items-center justify-end gap-2 px-4 py-3", className)}
      {...props}
    >
      <span className="mr-1 text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </span>

      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        disabled={!canGoPrev}
        onMouseEnter={() => setHovered("prev")}
        onClick={() => canGoPrev && onPageChange?.(page - 1)}
        aria-label="Previous page"
        className="rounded-lg text-muted-foreground hover:text-emerald-700 disabled:hover:text-muted-foreground"
      >
        <ChevronLeft className="size-4" />
      </Button>

      <span className="flex w-16 items-center justify-center" aria-live="polite">
        {hovered === "prev" && (
          <span className="whitespace-nowrap text-xs font-medium text-emerald-700">
            Previous
          </span>
        )}
        {hovered === "next" && (
          <span className="whitespace-nowrap text-xs font-medium text-emerald-700">
            Next
          </span>
        )}
      </span>

      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        disabled={!canGoNext}
        onMouseEnter={() => setHovered("next")}
        onClick={() => canGoNext && onPageChange?.(page + 1)}
        aria-label="Next page"
        className="rounded-lg text-muted-foreground hover:text-emerald-700 disabled:hover:text-muted-foreground"
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  )
}
