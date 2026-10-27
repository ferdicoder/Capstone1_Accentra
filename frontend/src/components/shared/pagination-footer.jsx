import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"

export const PAGE_SIZE = 8

export function PaginationFooter({ page, totalPages, onPageChange }) {
  const visiblePage = Math.max(1, Math.min(page, totalPages))
  const pageCount = Math.min(5, totalPages)
  const firstVisiblePage = Math.min(
    Math.max(visiblePage - 2, 1),
    Math.max(1, totalPages - 4)
  )
  const visiblePages = Array.from(
    { length: pageCount },
    (_, index) => firstVisiblePage + index
  )

  return (
    <nav
      aria-label="Pagination"
      className="mt-4 flex items-center justify-center gap-2"
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        disabled={visiblePage === 1}
        onClick={() => onPageChange?.(Math.max(1, visiblePage - 1))}
      >
        <ChevronLeft aria-hidden="true" />
        Previous
      </Button>

      <div className="flex items-center gap-1">
        {visiblePages.map((pageNumber) => (
          <Button
            key={pageNumber}
            type="button"
            variant={pageNumber === visiblePage ? "default" : "outline"}
            size="icon-sm"
            className={
              pageNumber === visiblePage
                ? "bg-forest-900 text-white hover:opacity-90"
                : ""
            }
            aria-label={`Page ${pageNumber}`}
            aria-current={pageNumber === visiblePage ? "page" : undefined}
            onClick={() => onPageChange?.(pageNumber)}
          >
            {pageNumber}
          </Button>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        disabled={visiblePage === totalPages}
        onClick={() => onPageChange?.(Math.min(totalPages, visiblePage + 1))}
      >
        Next
        <ChevronRight aria-hidden="true" />
      </Button>
    </nav>
  )
}
