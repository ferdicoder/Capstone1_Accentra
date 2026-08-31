import { Inbox } from "lucide-react"

import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { EngagementStatusBadge } from "./engagement-status-badge"
import { formatRevenue, formatDate, getClientFullName, firmStaffMap } from "./engagement-variants"

const getInitials = (name) => {
  if (!name) return "AC"
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("")
}

const defaultEngagementColumns = [
  {
    key: "client",
    label: "Client",
    render: (engagement) => (
      <div className="flex items-center gap-3">
        <Avatar className="size-8 shrink-0">
          <AvatarFallback className="text-xs">{getInitials(engagement?.business?.businessName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {engagement?.business?.businessName}
          </p>
          {engagement?.client && (
            <p className="truncate text-xs text-muted-foreground">
              {getClientFullName(engagement.client)}
            </p>
          )}
        </div>
      </div>
    ),
  },
  {
    key: "engagementNumber",
    label: "Engagement No.",
    render: (engagement) => (
      <span className="text-sm font-medium tabular-nums text-foreground">
        {engagement?.engagementNumber}
      </span>
    ),
  },
  {
    key: "serviceName",
    label: "Service",
    render: (engagement) => (
      <span className="line-clamp-1 max-w-48 text-sm text-foreground">{engagement?.serviceName}</span>
    ),
  },
  {
    key: "assignedStaff",
    label: "Assigned To",
    render: (engagement) => (
      <span className="text-sm text-foreground">
        {firmStaffMap[engagement?.assignedStaff] ?? "—"}
      </span>
    ),
  },
  {
    key: "serviceFee",
    label: "Fee",
    render: (engagement) => (
      <span className="text-sm font-medium tabular-nums text-foreground">
        {formatRevenue(engagement?.serviceFee)}
      </span>
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

export function EngagementList({
  engagements = [],
  columns = defaultEngagementColumns,
  getRowKey = (engagement, index) => engagement?.id ?? index,
  loading = false,
  skeletonRows = 5,
  emptyMessage = "No engagements found.",
  emptyDescription,
  actions,
  onRowClick,
  className,
  ...props
}) {
  const showActions = typeof actions === "function"
  const isEmpty = !loading && engagements.length === 0
  const columnCount = columns.length + (showActions ? 1 : 0)

  return (
    <div
      data-slot="engagement-list"
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
                : engagements.map((engagement, index) => (
                    <tr
                      key={getRowKey(engagement, index)}
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
                          className="px-4 py-3 text-right align-middle"
                          onClick={(event) => event.stopPropagation()}
                        >
                          {actions(engagement)}
                        </td>
                      )}
                    </tr>
                  ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
