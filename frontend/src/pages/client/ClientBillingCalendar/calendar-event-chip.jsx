import { cn } from "@/lib/utils"

/**
 * Status marker so color is never the only signal.
 * Uses config.icon (a lucide icon) when provided, otherwise a small dot.
 */
export function StatusIcon({ config, className }) {
  const Icon = config?.icon
  if (Icon) {
    return (
      <Icon aria-hidden="true" className={cn("size-3 shrink-0", className)} />
    )
  }
  return (
    <span
      aria-hidden="true"
      className={cn("size-1.5 shrink-0 rounded-full", config?.dot)}
    />
  )
}

/**
 * Clickable event label used inside calendar cells.
 * The status label is read by screen readers ("Overdue: Service Fee").
 */
export function EventChip({ event, config, onClick, className }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick?.(event)
      }}
      title={`${config?.label ?? ""} — ${event.title}`}
      className={cn(
        "flex w-full min-w-0 items-center gap-1 rounded border px-1.5 py-0.5 text-left text-[11px] font-medium transition-colors hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1",
        config?.chip,
        className
      )}
    >
      <StatusIcon config={config} />
      <span className="sr-only">{config?.label}: </span>
      <span className="truncate">{event.title}</span>
    </button>
  )
}