import { Link } from "react-router-dom"

import { cn } from "@/lib/utils"
import { focusRing } from "./styles"

const base =
  "flex flex-col gap-2 rounded-xl border bg-background px-5 py-4 shadow-sm"

// KPI card. Display-only by default (client dashboard). Pass `to` to make the
// whole card a link (firm dashboards: every card opens its page).
// Optional `breakdown`: [{ label, value, alert }] shown as a small stat row
// under the number, so one card can carry related counts.
export function StatCard({ label, value, hint, alert = false, to, breakdown }) {
  const content = (
    <>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="truncate text-2xl font-semibold leading-none tabular-nums tracking-tight">
        {value}
      </p>
      <p
        className={cn(
          "text-xs",
          alert ? "font-medium text-red-700" : "text-muted-foreground"
        )}
      >
        {hint}
      </p>
      {breakdown && breakdown.length > 0 && (
        <dl
          className="mt-1 grid gap-2 border-t pt-3"
          style={{
            gridTemplateColumns: `repeat(${breakdown.length}, minmax(0, 1fr))`,
          }}
        >
          {breakdown.map((item) => (
            <div key={item.label} className="min-w-0">
              <dt className="truncate text-[11px] text-muted-foreground">
                {item.label}
              </dt>
              <dd
                className={cn(
                  "text-sm font-semibold tabular-nums",
                  item.alert && item.value > 0 && "text-red-700"
                )}
              >
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </>
  )

  if (!to) return <div className={base}>{content}</div>

  return (
    <Link
      to={to}
      className={cn(
        base,
        "transition-all hover:border-emerald-200 hover:bg-muted/40 hover:shadow-md",
        focusRing
      )}
    >
      {content}
    </Link>
  )
}
