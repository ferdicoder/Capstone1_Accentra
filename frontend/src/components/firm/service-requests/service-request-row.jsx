import { cn } from "@/lib/utils"

/** Presentational row used by <ServiceRequestList />. Renders one <tr> from a generic columns config. */
export function ServiceRequestRow({ request, columns = [], onRowClick, children, className, ...props }) {
  const clickable = typeof onRowClick === "function"

  const handleKeyDown = (event) => {
    if (!clickable) return
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      onRowClick(request, event)
    }
  }

  return (
    <tr
      data-slot="service-request-row"
      className={cn(
        "border-b border-border/60 transition-colors last:border-b-0",
        clickable && "cursor-pointer hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none",
        className
      )}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? (event) => onRowClick(request, event) : undefined}
      onKeyDown={clickable ? handleKeyDown : undefined}
      {...props}
    >
      {columns.map((column) => {
        const content = column.render ? column.render(request) : request?.[column.key]
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
