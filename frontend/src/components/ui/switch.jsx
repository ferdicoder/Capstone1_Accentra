import { cn } from "@/lib/utils"

/**
 * Accessible switch styled with the project's design tokens. Fully controlled:
 * `checked` and `onChange` come from the parent.
 *
 * @param {boolean} checked - Whether the switch is on.
 * @param {Function} onChange - (nextValue: boolean) => void.
 * @param {boolean} disabled - Disables the switch.
 * @param {string} label - Accessible label and visible text next to the switch.
 * @param {string} className - Extra classes merged onto the label wrapper.
 */
export function Switch({ checked, onChange, disabled, label, className }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
          checked ? "bg-forest-900 dark:bg-emerald-500" : "bg-muted ring-1 ring-inset ring-border"
        )}
      >
        <span
          className={cn(
            "inline-block size-4 transform rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-[18px]" : "translate-x-0.5"
          )}
        />
      </button>
      <span className="text-sm font-medium text-foreground">{label}</span>
    </div>
  )
}
