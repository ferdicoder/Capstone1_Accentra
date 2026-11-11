import { Users } from "lucide-react"

import { cn } from "@/lib/utils"
import { PaginationFooter, PAGE_SIZE } from "@/components/shared/pagination-footer"
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
 *   short, centered columns are evenly spaced. The table keeps a minimum width and scrolls
 *   horizontally on small screens instead of squeezing columns. Default false (auto layout).
 * @param {"right"|"center"} actionsAlign - Alignment of the Actions column. Default "right".
 * @param {Function} onRowClick - Optional (user, event) => void applied to every row.
 * @param {Function} renderMobileCard - Optional (user) => ReactNode. When provided, the table
 *   is replaced by stacked cards below `md` (used by pages whose columns don't fit a phone).
 * @param {number} page - Current page number. Defaults to 1.
 * @param {Function} onPageChange - Optional (page: number) => void callback.
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
  renderMobileCard,
  page = 1,
  onPageChange,
  className,
  ...props
}) {
  const showActions = typeof actions === "function"
  const isEmpty = !loading && users.length === 0
  const showMobileCards = typeof renderMobileCard === "function"
  const columnCount = columns.length + (showActions ? 1 : 0)
  const totalPages = Math.max(1, Math.ceil(users.length / PAGE_SIZE))
  const visiblePage = Math.min(page, totalPages)
  const paginatedUsers = users.slice((visiblePage - 1) * PAGE_SIZE, visiblePage * PAGE_SIZE)

  const getCardProps = (user) =>
    onRowClick
      ? {
          onClick: (event) => onRowClick(user, event),
          onKeyDown: (event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault()
              onRowClick(user, event)
            }
          },
          tabIndex: 0,
        }
      : {}

  return (
    <>
      <div
        data-slot="firm-user-table"
        className={cn(
          "max-w-full overflow-hidden rounded-xl border border-border bg-card shadow-sm",
          className
        )}
        {...props}
      >
        {/* Phones: stacked cards, when the page opts in with renderMobileCard. */}
        {showMobileCards && (
          <div className="md:hidden">
            {loading && (
              <ul className="divide-y divide-border/60" aria-hidden="true">
                {Array.from({ length: 3 }, (_, index) => (
                  <li key={`firm-user-card-skeleton-${index}`} className="flex flex-col gap-2.5 p-4">
                    <Skeleton className="h-3.5 w-1/3" />
                    <Skeleton className="h-3 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </li>
                ))}
              </ul>
            )}

            {!loading && paginatedUsers.length > 0 && (
              <ul className="divide-y divide-border/60">
                {paginatedUsers.map((user, index) => (
                  <li
                    key={getRowKey(user, (visiblePage - 1) * PAGE_SIZE + index)}
                    {...getCardProps(user)}
                    className={cn(
                      "flex flex-col gap-2 p-4 transition-colors",
                      onRowClick &&
                        "cursor-pointer hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
                    )}
                  >
                    {renderMobileCard(user)}
                  </li>
                ))}
              </ul>
            )}

            {isEmpty && (
              <div className="flex flex-col items-center justify-center gap-2 px-4 py-14 text-center">
                <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                  <Users className="size-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">{emptyMessage}</p>
                {emptyDescription && (
                  <p className="text-xs text-muted-foreground">{emptyDescription}</p>
                )}
              </div>
            )}
          </div>
        )}

        <div className={cn("overflow-x-auto", showMobileCards && "hidden md:block")}>
          <table
            className={cn(
              "w-full border-collapse text-sm",
              // Fixed layout divides width equally, so give it a floor and let
              // the wrapper scroll instead of crushing the columns on tablets.
              equalColumns && "min-w-[720px] table-fixed",
              showMobileCards && !equalColumns && "min-w-[640px]"
            )}
          >
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs tracking-wide text-foreground uppercase">
                {columns.map((column) => (
                  <th
                    key={column.key ?? column.label}
                    scope="col"
                    className={cn("px-3 py-3 font-semibold sm:px-4", column.headerClassName)}
                  >
                    {column.label}
                  </th>
                ))}
                {showActions && (
                  <th
                    scope="col"
                    className={cn(
                      "px-3 py-3 font-semibold sm:px-4",
                      actionsAlign === "center" ? "text-center" : "text-right"
                    )}
                  >
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: skeletonRows }, (_, index) => (
                  <tr
                    key={`firm-user-skeleton-${index}`}
                    className="border-b border-border/60 last:border-b-0"
                  >
                    <td colSpan={columnCount} className="px-3 py-3 sm:px-4">
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
              ) : isEmpty ? (
                <tr>
                  <td colSpan={columnCount} className="px-4 py-10 sm:px-6 sm:py-12">
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
              ) : (
                paginatedUsers.map((user, index) => (
                  <FirmUserRow
                    key={getRowKey(user, (visiblePage - 1) * PAGE_SIZE + index)}
                    user={user}
                    columns={columns}
                    onRowClick={onRowClick}
                  >
                    {showActions && (
                      <td
                        className={cn(
                          "px-3 py-3 align-middle sm:px-4",
                          actionsAlign === "center" ? "text-center" : "text-right"
                        )}
                        onClick={(event) => event.stopPropagation()}
                      >
                        {actions(user)}
                      </td>
                    )}
                  </FirmUserRow>
                ))
              )}
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