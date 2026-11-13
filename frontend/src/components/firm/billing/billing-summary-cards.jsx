import { cn } from "@/lib/utils"

/** \n * Compact summary cards for the billing pages. All values derive from the\n * current billing records — nothing fabricated.\n *\n * @param {Array} items - [{ label, value, hint?, toneClass?, toneColor? }]\n * @param {string} className\n */
export function BillingSummaryCards({
  items = [],
  monthValue = "",
  onMonthChange,
  className,
  ...props
}) {
  const monthLabel = monthValue
    ? new Date(
        Number(monthValue.slice(0, 4)),
        Number(monthValue.slice(5, 7)) - 1,
        1
      ).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "All billing periods"

  return (
    <div
      data-slot="billing-summary-cards"
      className={cn("space-y-3", className)}
      {...props}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-foreground" aria-live="polite">
          {monthValue ? `For the Month of ${monthLabel}` : monthLabel}
        </p>
        <div className="flex items-center gap-2">
          <label htmlFor="billing-summary-month" className="text-sm text-muted-foreground">
            Filter by month
          </label>
          <input
            id="billing-summary-month"
            type="month"
            value={monthValue}
            onChange={(event) => onMonthChange?.(event.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
          {monthValue && (
            <button
              type="button"
              onClick={() => onMonthChange?.("")}
              className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5"
          >
            <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
            <p
              className={cn("mt-2.5 text-lg font-semibold break-words sm:text-xl", item.toneClass ?? "text-foreground")}
              style={item.toneColor ? { color: item.toneColor } : undefined}
            >
              {item.value}
            </p>
            {item.hint && <p className="mt-1 text-xs text-muted-foreground">{item.hint}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
