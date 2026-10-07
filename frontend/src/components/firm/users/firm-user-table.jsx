import { Users } from "lucide-react"

import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { defaultUserColumns } from "./firm-user-columns"
import { FirmUserRow } from "./firm-user-row"

/**
 * Presentational, data-driven user table. Receives everything through props.
 *
 * @param {Array} users - The list of user records to display.
 * @param {Array} columns - Column definitions: { key, label, render(user), headerClassName, cellClassName }.
 *   Defaults to `defaultUserColumns` from "./firm-user-columns".
 * @param {Function} getRowKey - (user, index) => React key. Defaults to user.id or index.
 * @param {boolean} loading - Shows skeleton rows instead of data when true.
 * @param {number} skeletonRows - Number of skeleton rows while loading. Default 5.
 * @param {string} emptyMessage - Message shown when the list is empty.
 * @param {string} emptyDescription - Optional secondary line under the empty message.
 * @param {Function} actions - Optional (user) => ReactNode rendered in a trailing Actions column.
 * @param {boolean} equalColumns - Gives every column the same width (fixed table layout) so
 *   short, centered columns are evenly spaced. Default false (auto layout).
 * @param {"right"|"center"} actionsAlign - Alignment of the Actions column. Default "right".
 * @param {Function} onRowClick - Optional (user, event) => void applied to every row.
 * @param {string} className - Extra classes merged onto the wrapper card.
 */
export function FirmUserTable({
  users = [],
  columns = defaultUserColumns,
  getRowKey = (user, index) => user?.id ?? index,
  loading = false,
  skeletonRows = 5,
  emptyMessage = "No users found.",
  emptyDescription,
  actions,
  actionsAlign = "right",
  equalColumns = false,
  onRowClick,
  className,
  ...props
}) {
  const showActions = typeof actions === "function"
  const isEmpty = !loading && users.length === 0
  const columnCount = columns.length + (showActions ? 1 : 0)

  return (
    <div
      data-slot="firm-user-table"
      className={cn("overflow-hidden rounded-xl border border-border bg-card shadow-sm", className)}
      {...props}
    >
      <div className="overflow-x-auto">
        <table className={cn("w-full border-collapse text-sm", equalColumns && "table-fixed")}>
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
                <th
                  scope="col"
                  className={cn("px-4 py-3 font-semibold", actionsAlign === "center" ? "text-center" : "text-right")}
                >
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: skeletonRows }, (_, index) => (
                  <tr
                    key={`firm-user-skeleton-${index}`}
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
                            <Users className="size-5 text-muted-foreground" />
                          </div>
                          <p className="text-sm font-medium text-foreground">{emptyMessage}</p>
                          {emptyDescription && (
                            <p className="text-sm text-muted-foreground">{emptyDescription}</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                : users.map((user, index) => (
                    <FirmUserRow
                      key={getRowKey(user, index)}
                      user={user}
                      columns={columns}
                      onRowClick={onRowClick}
                    >
                      {showActions && (
                        <td
                          className={cn("px-4 py-3 align-middle", actionsAlign === "center" ? "text-center" : "text-right")}
                          onClick={(event) => event.stopPropagation()}
                        >
                          {actions(user)}
                        </td>
                      )}
                    </FirmUserRow>
                  ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
