import { Inbox } from "lucide-react"

import { cn } from "@/lib/utils"
import { PaginationFooter, PAGE_SIZE } from "@/components/shared/pagination-footer"
import { Skeleton } from "@/components/ui/skeleton"
import { getCategoryLabel } from "@/lib/service-categories"
import { ServiceRequestAvatar } from "./service-request-avatar"
import { ServiceRequestRow } from "./service-request-row"
import { ServiceRequestStatusBadge } from "./service-request-status-badge"
import { formatSubmittedDate, getClientFullName } from "./service-request-variants"

const defaultServiceRequestColumns = [
  {
    key: "client",
    label: "Client",
    render: (request) => {
      const clientName = request?.client ? getClientFullName(request.client) : null
      const businessName = request?.business?.businessName
      const primaryName = clientName || businessName // fallback if client record is missing

      return (
        <div className="flex items-center gap-3">
          <ServiceRequestAvatar name={primaryName} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{primaryName}</p>
            {clientName && businessName && (
              <p className="truncate text-xs text-muted-foreground">{businessName}</p>
            )}
          </div>
        </div>
      )
    },
  },
  {
    key: "requestNumber",
    label: "Request No.",
    render: (request) => (
      <span className="text-sm font-medium tabular-nums text-foreground">
        {request?.requestNumber}
      </span>
    ),
  },
  {
    key: "category",
    label: "Category",
    render: (request) => (
      <div className="min-w-0 max-w-56">
        <p className="line-clamp-1 text-sm text-foreground">
          {getCategoryLabel(request?.category)}
        </p>
        {/* Only filled in after the admin assigns a template at approval. */}
        {request?.serviceName && (
          <p className="line-clamp-1 text-xs text-muted-foreground">{request.serviceName}</p>
        )}
      </div>
    ),
  },
  {
    key: "submittedDate",
    label: "Date Submitted",
    render: (request) => (
      <span className="text-sm text-muted-foreground">
        {formatSubmittedDate(request?.submittedDate)}
      </span>
    ),
  },
  {
    key: "status",
    label: "Status",
    render: (request) => <ServiceRequestStatusBadge status={request?.status} />,
  },
]

/** Stacked phone presentation of one service request. Mirrors the table columns. */
function ServiceRequestCard({ request, showPrice, onRowClick }) {
  const clientName = request?.client ? getClientFullName(request.client) : null
  const businessName = request?.business?.businessName
  const primaryName = clientName || businessName

  const cardProps =
    typeof onRowClick === "function"
      ? {
          onClick: () => onRowClick(request),
          onKeyDown: (event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault()
              onRowClick(request)
            }
          },
          tabIndex: 0,
        }
      : {}

  return (
    <li
      {...cardProps}
      className={cn(
        "flex flex-col gap-2 p-4 transition-colors",
        onRowClick && "cursor-pointer hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 truncate text-sm font-semibold tabular-nums">
          {request?.requestNumber}
        </p>
        <ServiceRequestStatusBadge status={request?.status} />
      </div>

      {primaryName && (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{primaryName}</p>
          {clientName && businessName && (
            <p className="truncate text-xs text-muted-foreground">{businessName}</p>
          )}
        </div>
      )}

      {request?.serviceName && (
        <p className="line-clamp-2 text-sm text-muted-foreground">{request.serviceName}</p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>Submitted {formatSubmittedDate(request?.submittedDate)}</span>
        {showPrice && (
          <span className="text-sm font-medium tabular-nums text-foreground">
            {formatRevenue(request?.revenue)}
          </span>
        )}
      </div>
    </li>
  )
}

/**
 * Presentational, data-driven service request table. Receives everything through props.
 * The client requests a category only; the template is shown under it once assigned.
 */
export function ServiceRequestList({
  requests = [],
  columns = defaultServiceRequestColumns,
  getRowKey = (request, index) => request?.id ?? index,
  loading = false,
  skeletonRows = 5,
  emptyMessage = "No service requests found.",
  emptyDescription,
  actions,
  onRowClick,
  page = 1,
  onPageChange,
  className,
  ...props
}) {
  const showActions = typeof actions === "function"
  const isEmpty = !loading && requests.length === 0

  const columnCount = columns.length + (showActions ? 1 : 0)
  const totalPages = Math.max(1, Math.ceil(requests.length / PAGE_SIZE))
  const visiblePage = Math.min(page, totalPages)
  const paginatedRequests = requests.slice(
    (visiblePage - 1) * PAGE_SIZE,
    visiblePage * PAGE_SIZE
  )

  return (
    <>
      <div
        data-slot="service-request-list"
        className={cn("overflow-hidden rounded-xl border border-border bg-card shadow-sm", className)}
        {...props}
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
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
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: skeletonRows }, (_, index) => (
                    <tr
                      key={`service-request-skeleton-${index}`}
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
                  : paginatedRequests.map((request, index) => (
                      <ServiceRequestRow
                        key={getRowKey(request, (visiblePage - 1) * PAGE_SIZE + index)}
                        request={request}
                        columns={columns}
                        onRowClick={onRowClick}
                      />
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