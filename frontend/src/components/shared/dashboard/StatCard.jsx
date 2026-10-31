import { Link } from "react-router-dom"

import { cn } from "@/lib/utils"
import { focusRing } from "./styles"

const base =
  "flex flex-col gap-2 rounded-xl border bg-background px-5 py-4 shadow-sm"

// KPI card. Display-only by default (client dashboard). Pass `to` to make the
// whole card a link (firm dashboards: every card opens its filtered page).
export function StatCard({ label, value, hint, alert = false, to }) {
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
