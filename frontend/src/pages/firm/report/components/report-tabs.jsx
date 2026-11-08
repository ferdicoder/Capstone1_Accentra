import { cn } from "@/lib/utils"
import { CATEGORIES } from "../lib/constants"

export function ReportTabs({ view, onChange }) {
  return (
    <div
      role="tablist"
      aria-label="Report views"
      className="flex gap-8 overflow-x-auto overflow-y-hidden border-b [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {CATEGORIES.flatMap((category) =>
        category.views.map((item) => {
          const active = view === item.key
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={active}
              title={category.label}
              onClick={() => onChange(item.key)}
              className={cn(
                "-mb-px shrink-0 whitespace-nowrap border-b-2 px-0.5 pb-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-600/40",
                active
                  ? "border-emerald-700 font-semibold text-emerald-700"
                  : "border-transparent font-medium text-muted-foreground hover:text-emerald-700"
              )}
            >
              {item.label}
            </button>
          )
        })
      )}
    </div>
  )
}