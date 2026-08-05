import { cn } from "@/lib/utils"

/**
 * Presentational row used by <FirmUserTable />. Renders one <tr> from a
 * generic `columns` config. Any extra cells can be appended as `children`
 * (e.g. an Actions column with a <td>).
 *
 * @param {Object} user - The user record to render for this row.
 * @param {Array} columns - Column definitions: { key, label, render(user), cellClassName }.
 * @param {Function} onRowClick - Optional (user, event) => void. Adds hover, cursor,
 *   focus and Enter/Space keyboard support. Note: consumers should call
 *   `event.stopPropagation()` on interactive cells (buttons, links) inside the
 *   row so their clicks don't also trigger the row click.
 * @param {ReactNode} children - Optional extra <td> cells appended after the column cells.
 * @param {string} className - Extra classes merged onto the <tr>.
 */
export function FirmUserRow({ user, columns = [], onRowClick, children, className, ...props }) {
  const clickable = typeof onRowClick === "function"

  const handleKeyDown = (event) => {
    if (!clickable) return
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      onRowClick(user, event)
    }
  }

  return (
    <tr
      data-slot="firm-user-row"
      className={cn(
        "border-b border-border/60 transition-colors last:border-b-0",
        clickable && "cursor-pointer hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none",
        className
      )}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? (event) => onRowClick(user, event) : undefined}
      onKeyDown={clickable ? handleKeyDown : undefined}
      {...props}
    >
      {columns.map((column) => {
        const content = column.render ? column.render(user) : user?.[column.key]
        return (
          <td
            key={column.key ?? column.label}
            className={cn("px-4 py-3 align-middle", column.cellClassName)}
          >
            {content}
          </td>
        )
      })}
      {children}
    </tr>
  )
}
