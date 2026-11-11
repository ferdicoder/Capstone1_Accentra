import { ChevronRight, Inbox } from "lucide-react"

import { cn } from "@/lib/utils"
import { PaginationFooter, PAGE_SIZE } from "@/components/shared/pagination-footer"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { EngagementStatusBadge } from "./engagement-status-badge"
import { formatDate, getClientFullName } from "./engagement-variants"

const getInitials = (name) => {
  if (!name) return "AC"
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("")
}

const defaultEngagementColumns = [
  {
    key: "engagementNumber",
    label: "Engagement Number",
    render: (engagement) => (
      <span className="text-sm font-medium tabular-nums text-foreground">
        {engagement?.engagementNumber}
      </span>
    ),
  },
 {
  key: "client",
  label: "Client",
  render: (engagement) => {
    const clientName = engagement?.client ? getClientFullName(engagement.client) : null
    const businessName = engagement?.business?.businessName
    const primaryName = clientName || businessName // fallback if client record is missing

    return (
      <div className="flex items-center gap-3">
        <Avatar className="size-8 shrink-0">
          <AvatarFallback className="text-xs">{getInitials(primaryName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {primaryName}
          </p>
          {clientName && businessName && (
            <p className="truncate text-xs text-muted-foreground">
              {businessName}
            </p>
          )}
        </div>
      </div>
    )
  },
},
  {
    key: "serviceName",
    label: "Service",
    render: (engagement) => (
      <span className="line-clamp-1 max-w-48 text-sm text-foreground">{engagement?.serviceName}</span>
    ),
  },
  {
    key: "targetEndDate",
    label: "Due Date",
    render: (engagement) => (
      <span className="text-sm text-muted-foreground">
        {formatDate(engagement?.targetEndDate)}
      </span>
    ),
  },
  {
    key: "status",
    label: "Status",
    render: (engagement) => <EngagementStatusBadge status={engagement?.status} />,
  },
]

/** Same click / keyboard behaviour as a desktop row, for the phone card. */
function getCardProps(engagement, onRowClick) {
  if (typeof onRowClick !== "function") return {}

  return {
    onClick: () => onRowClick(engagement),
    onKeyDown: (event) => {
      // Ignore keys that come from an action button inside the card.
      if (event.target !== event.currentTarget) return
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault()
        onRowClick(engagement)
      }
    },
    tabIndex: 0,
  }
}

/** Stacked phone presentation of one engagement. Mirrors the desktop columns. */
function EngagementCard({ engagement, onRowClick, actions }) {
  const clientName = engagement?.client ? getClientFullName(engagement.client) : null
  const businessName = engagement?.business?.businessName
  const primaryName = clientName || businessName

  return (
    <li
      {...getCardProps(engagement, onRowClick)}
      className={cn(
        "flex flex-col gap-2 p-4 transition-colors",
        onRowClick && "cursor-pointer hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 truncate text-sm font-semibold tabular-nums">
          {engagement?.engagementNumber}
        </p>
        <EngagementStatusBadge status={engagement?.status} />
      </div>

      {primaryName && (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{primaryName}</p>
          {clientName && businessName && (
            <p className="truncate text-xs text-muted-foreground">{businessName}</p>
          )}
        </div>
      )}

      {engagement?.serviceName && (
        <p className="line-clamp-2 text-sm text-muted-foreground">{engagement.serviceName}</p>
      )}

      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="text-muted-foreground">
          Due {formatDate(engagement?.targetEndDate)}
        </span>
        {onRowClick && (
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        )}
      </div>

      {/* Row actions stay reachable on phones instead of living off-screen in the table. */}
      {actions && (
        <div className="flex items-center gap-2 pt-1" onClick={(event) => event.stopPropagation()}>
          {actions(engagement)}
        </div>
      )}
    </li>
  )
}

export function EngagementList({
  engagements = [],
  columns = defaultEngagementColumns,
  getRowKey = (engagement, index) => engagement?.id ?? index,
  loading = false,
  skeletonRows = 5,
  emptyMessage = "No engagements found.",
  emptyDescription,
  actions,
  showActions = typeof actions === "function", // Show the actions column if actions is a function
  onRowClick,
  page = 1,
  onPageChange,
  className,
  ...props
}) {
  const isEmpty = !loading && engagements.length === 0
  const columnCount = columns.length + (showActions ? 1 : 0)
  const totalPages = Math.max(1, Math.ceil(engagements.length / PAGE_SIZE))
  const visiblePage = Math.min(page, totalPages)
  const paginatedEngagements = engagements.slice(
    (visiblePage - 1) * PAGE_SIZE,
    visiblePage * PAGE_SIZE
  )

  return (
    <>
      <div
        data-slot="engagement-list"
        className={cn("overflow-hidden rounded-xl border border-border bg-card shadow-sm", className)}
        {...props}
      >
        {/* Phones: stacked cards, so five columns never have to share 360px. */}
        <div className="md:hidden">
          {loading && (
            <ul className="divide-y divide-border/60" aria-hidden="true">
              {Array.from({ length: 3 }, (_, index) => (
                <li key={`engagement-card-skeleton-${index}`} className="flex flex-col gap-2.5 p-4">
                  <Skeleton className="h-3.5 w-1/3" />
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </li>
              ))}
            </ul>
          )}

          {!loading && paginatedEngagements.length > 0 && (
            <ul className="divide-y divide-border/60">
              {paginatedEngagements.map((engagement) => (
                <EngagementCard
                  key={engagement.id}
                  engagement={engagement}
                  onRowClick={onRowClick}
                  actions={showActions ? actions : undefined}
                />
              ))}
            </ul>
          )}

          {isEmpty && (
            <div className="flex flex-col items-center justify-center gap-2 px-4 py-14 text-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                <Inbox className="size-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">{emptyMessage}</p>
              {emptyDescription && (
                <p className="text-xs text-muted-foreground">{emptyDescription}</p>
              )}
            </div>
          )}
        </div>

        {/* Tablet and up: the existing table, with a floor so columns stay readable. */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[800px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-xs tracking-wide text-foreground uppercase">
              {columns.map((column) => (
                <th
                  key={column.key ?? column.label}
                  scope="col"
                  className={cn("px-4 py-3 font-semibold", column.headerClassName)}
                >
                  {column.label}
                </th>
              ))}
              {showActions && (
                <th scope="col" className="w-45 px-4 py-3 text-left font-semibold">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: skeletonRows }, (_, index) => (
                  <tr
                    key={`engagement-skeleton-${index}`}
                    className="border-b border-border/60 last:border-b-0"
                  >
                    <td colSpan={columnCount} className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="size-8 rounded-full" />
                        <div className="flex flex-1 flex-col gap-1.5">
                          <Skeleton className="h-3.5 w-1/3" />
                          <Skeleton className="h-3 w-1/4" />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              : isEmpty
                ? (
                    <tr>
                      <td colSpan={columnCount} className="px-6 py-12">
                        <div className="flex flex-col items-center justify-center gap-2 text-center">
                          <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                            <Inbox className="size-5 text-muted-foreground" />
                          </div>
                          <p className="text-sm font-medium text-foreground">{emptyMessage}</p>
                          {emptyDescription && (
                            <p className="text-sm text-muted-foreground">{emptyDescription}</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                : paginatedEngagements.map((engagement, index) => (
                    <tr
                      key={getRowKey(engagement, (visiblePage - 1) * PAGE_SIZE + index)}
                      className={cn(
                        "border-b border-border/60 transition-colors last:border-b-0",
                        onRowClick && "cursor-pointer hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
                      )}
                      tabIndex={onRowClick ? 0 : undefined}
                      onClick={onRowClick ? () => onRowClick(engagement) : undefined}
                    >
                      {columns.map((column) => (
                        <td
                          key={column.key ?? column.label}
                          className={cn("px-4 py-3 align-middle", column.cellClassName)}
                        >
                          {column.render ? column.render(engagement) : engagement?.[column.key]}
                        </td>
                      ))}
                      {showActions && (
                        <td
                          className="w-45 px-4 py-3 align-middle"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <div className="flex items-center justify-start gap-2">
                            {actions(engagement)}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
          </tbody>
          </table>
        </div>
      </div>
      <PaginationFooter
        page={visiblePage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </>
  )
}
