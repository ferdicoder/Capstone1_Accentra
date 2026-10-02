import { cn } from "@/lib/utils"

/** \n * Compact summary cards for the billing pages. All values derive from the\n * current billing records — nothing fabricated.\n *\n * @param {Array} items - [{ label, value, hint?, toneClass?, toneColor? }]\n * @param {string} className\n */
export function BillingSummaryCards({ items = [], className, ...props }) {
  return (
    <div
      data-slot="billing-summary-cards"
      className={cn("grid grid-cols-2 gap-4 lg:grid-cols-4", className)}
      {...props}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-border bg-card p-5 shadow-sm"
        >
          <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
          <p
            className={cn("mt-2.5 text-xl font-semibold", item.toneClass ?? "text-foreground")}
            style={item.toneColor ? { color: item.toneColor } : undefined}
          >
            {item.value}
          </p>
          {item.hint && <p className="mt-1 text-xs text-muted-foreground">{item.hint}</p>}
        </div>
      ))}
    </div>
  )
}
