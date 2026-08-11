import { Inbox } from "lucide-react"

import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { ServiceRequestAvatar } from "./service-request-avatar"
import { ServiceRequestRow } from "./service-request-row"
import { ServiceRequestStatusBadge } from "./service-request-status-badge"
import { formatRevenue, formatSubmittedDate } from "./service-request-variants"

const defaultServiceRequestColumns = [
  {
    key: "client",
    label: "Client",
    render: (request) => (
      <div className="flex items-center gap-3">
        <ServiceRequestAvatar name={request?.companyName} avatarUrl={request?.avatarUrl} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{request?.companyName}</p>
          {request?.contactPerson && (
            <p className="truncate text-xs text-muted-foreground">{request.contactPerson}</p>
          )}
        </div>
      </div>
    ),
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
    key: "serviceName",
    label: "Service",
    render: (request) => (
      <span className="line-clamp-1 max-w-48 text-sm text-foreground">{request?.serviceName}</span>
    ),
  },
  {
    key: "revenue",
    label: "Price",
    render: (request) => (
      <span className="text-sm font-medium tabular-nums text-foreground">
        {formatRevenue(request?.revenue)}
      </span>
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

/** Presentational, data-driven service request table. Receives everything through props. */
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
  className,
  ...props
}) {
  const showActions = typeof actions === "function"
  const isEmpty = !loading && requests.length === 0
  const columnCount = columns.length + (showActions ? 1 : 0)

  return (
    <div
      data-slot="service-request-list"
      className={cn("overflow-hidden rounded-xl border border-border bg-card shadow-sm", className)}
      {...props}
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-xs tracking-wide text-muted-foreground uppercase">
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
                <th scope="col" className="px-4 py-3 text-right font-semibold">
                  Actions
                </th>
              )}
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
                : requests.map((request, index) => (
                    <ServiceRequestRow
                      key={getRowKey(request, index)}
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
  )
}
