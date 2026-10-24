import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"

export const PAGE_SIZE = 8

export function PaginationFooter({ page, totalPages, onPageChange }) {
  const [activeButton, setActiveButton] = useState(null)
  const visiblePage = Math.min(page, totalPages)

  return (
    <div className="flex items-center justify-end gap-3 border-t border-border px-4 py-2.5">
      <span className="text-sm text-muted-foreground" aria-live="polite">
        Page {visiblePage} of {totalPages}
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        className="rounded-xl hover:border-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-300"
        aria-label="Previous page"
        disabled={visiblePage === 1}
        onMouseEnter={() => setActiveButton("Previous")}
        onMouseLeave={() => setActiveButton(null)}
        onFocus={() => setActiveButton("Previous")}
        onBlur={() => setActiveButton(null)}
        onClick={() => onPageChange?.(Math.max(1, visiblePage - 1))}
      >
        <ChevronLeft />
      </Button>
      <span className="w-14 text-center text-sm font-medium text-emerald-700 dark:text-emerald-300" aria-hidden="true">
        {activeButton}
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        className="rounded-xl hover:border-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-300"
        aria-label="Next page"
        disabled={visiblePage === totalPages}
        onMouseEnter={() => setActiveButton("Next")}
        onMouseLeave={() => setActiveButton(null)}
        onFocus={() => setActiveButton("Next")}
        onBlur={() => setActiveButton(null)}
        onClick={() => onPageChange?.(Math.min(totalPages, visiblePage + 1))}
      >
        <ChevronRight />
      </Button>
    </div>
  )
}
