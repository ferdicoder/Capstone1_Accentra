import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { ALL } from "../lib/constants"

export const controlClass =
  "h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm font-normal text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40"

export function Field({ label, children }) {
  return (
    <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-muted-foreground">
      {label}
      {children}
    </label>
  )
}

// Native <select> with the browser's own arrows hidden and a single chevron
// drawn on top, so dropdowns match the rest of the app.
export function NativeSelect({ className, wrapperClassName = "relative block min-w-0", iconClassName = "right-2.5 size-4", children, ...props }) {
  return (
    <span className={wrapperClassName}>
      <select {...props} className={cn("appearance-none", className)}>
        {children}
      </select>
      <ChevronDown
        className={cn("pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground", iconClassName)}
        aria-hidden="true"
      />
    </span>
  )
}

export function SelectField({ label, value, onChange, options, allLabel }) {
  return (
    <Field label={label}>
      <NativeSelect value={value} onChange={(e) => onChange(e.target.value)} className={cn(controlClass, "pr-8")}>
        <option value={ALL}>{allLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </NativeSelect>
    </Field>
  )
}

export function SearchField({ label, value, onChange, placeholder }) {
  return (
    <Field label={label}>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={controlClass}
      />
    </Field>
  )
}