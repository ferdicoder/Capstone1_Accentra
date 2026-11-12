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
function ServiceRequestCard({ request, onRowClick, actions }) {
  const clientName = request?.client ? getClientFullName(request.client) : null
  const businessName = request?.business?.businessName
  const primaryName = clientName || businessName

  const handleKeyDown = (event) => {
    if (!onRowClick || (event.key !== "Enter" && event.key !== " ")) return
    event.preventDefault()
    onRowClick(request, event)
  }

  return (
    <li className="border-b border-border/60 last:border-b-0">
      <div className="p-3 sm:p-4">
        <div
          role={onRowClick ? "button" : undefined}
          aria-label={onRowClick ? `Review request ${request?.requestNumber ?? ""}` : undefined}
          tabIndex={onRowClick ? 0 : undefined}
          className={cn(
            "rounded-lg",
            onRowClick &&
              "cursor-pointer transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40"
          )}
          onClick={onRowClick ? (event) => onRowClick(request, event) : undefined}
          onKeyDown={handleKeyDown}
        >
          <div className="flex items-start justify-between gap-3">
            <p className="min-w-0 break-words text-sm font-semibold tabular-nums">
              {request?.requestNumber}
            </p>
            <ServiceRequestStatusBadge status={request?.status} />
          </div>

          {primaryName && (
            <div className="mt-2 flex min-w-0 items-center gap-3">
              <ServiceRequestAvatar name={primaryName} />
              <div className="min-w-0">
                <p className="break-words text-sm font-medium text-foreground">{primaryName}</p>
                {clientName && businessName && (
                  <p className="break-words text-xs text-muted-foreground">{businessName}</p>
                )}
              </div>
            </div>
          )}

          <div className="mt-2">
            <p className="text-sm text-foreground">{getCategoryLabel(request?.category)}</p>
            {request?.serviceName && (
              <p className="line-clamp-2 text-xs text-muted-foreground">{request.serviceName}</p>
            )}
          </div>

          <p className="mt-2 text-xs text-muted-foreground">
            Submitted {formatSubmittedDate(request?.submittedDate)}
          </p>
        </div>
        {actions && <div className="mt-3 flex justify-end">{actions(request)}</div>}
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
        <div className="md:hidden">
          {loading ? (
            <ul className="divide-y divide-border/60" aria-hidden="true">
              {Array.from({ length: Math.min(skeletonRows, 4) }, (_, index) => (
                <li key={`service-request-card-skeleton-${index}`} className="space-y-3 p-4">
                  <Skeleton className="h-3.5 w-1/2" />
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-8 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-2/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-1/3" />
                </li>
              ))}
            </ul>
          ) : isEmpty ? (
            <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                <Inbox className="size-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">{emptyMessage}</p>
              {emptyDescription && (
                <p className="text-sm text-muted-foreground">{emptyDescription}</p>
              )}
            </div>
          ) : (
            <ul>
              {paginatedRequests.map((request, index) => (
                <ServiceRequestCard
                  key={getRowKey(request, (visiblePage - 1) * PAGE_SIZE + index)}
                  request={request}
                  onRowClick={onRowClick}
                  actions={showActions ? actions : null}
                />
              ))}
            </ul>
          )}
        </div>

        <div className="hidden overflow-x-auto [contain:inline-size] md:block">
          <table className="w-full min-w-[760px] border-collapse text-sm">
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
                {showActions && <th scope="col" className="px-4 py-3 text-right font-semibold">Actions</th>}
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
                      >
                        {showActions && (
                          <td
                            className="px-4 py-3 text-right align-middle"
                            onClick={(event) => event.stopPropagation()}
                          >
                            {actions(request)}
                          </td>
                        )}
                      </ServiceRequestRow>
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