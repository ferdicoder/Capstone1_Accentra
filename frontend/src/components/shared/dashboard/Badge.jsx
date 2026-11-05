import { cn } from "@/lib/utils"

export function Badge({ tone, children }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        tone
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {children}
    </span>
  )
}

// Small colored square holding a row's icon.
export function IconChip({ icon: Icon, tone }) {
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-lg",
        tone
      )}
    >
      <Icon className="size-4" aria-hidden="true" />
    </span>
  )
}
