import { useEffect, useRef, useState } from "react"
import { Check, Loader2, Save } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

/** Presentational card for firm-internal notes on a service request. No API — the page decides what saving means. */
export function RequestInternalNotes({
  value = "",
  onChange,
  onSave,
  saving = false,
  maxLength = 500,
  placeholder = "Add internal notes for your team...",
  className,
  ...props
}) {
  const [saved, setSaved] = useState(false)
  const savedTimerRef = useRef(null)

  // Clear any pending timer on unmount so we never set state after unmount.
  useEffect(() => () => window.clearTimeout(savedTimerRef.current), [])

  // Typing again means the notes changed — hide the stale "saved" notice.
  const handleChange = (event) => {
    setSaved(false)
    onChange?.(event)
  }

  const handleSave = () => {
    onSave?.()
    setSaved(true)
    window.clearTimeout(savedTimerRef.current)
    savedTimerRef.current = window.setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div
      data-slot="request-internal-notes"
      className={cn("rounded-xl border border-border bg-card p-6 shadow-sm", className)}
      {...props}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Internal Notes</h2>
        {saved && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-500/20 ring-inset">
            <Check className="size-3" />
            Notes saved
          </span>
        )}
      </div>

      <textarea
        value={value}
        onChange={handleChange}
        maxLength={maxLength}
        placeholder={placeholder}
        rows={5}
        aria-label="Internal notes"
        className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-emerald-500/40"
      />

      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground tabular-nums">
          {value.length}/{maxLength} characters
        </p>
        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          disabled={saving}
          className="h-9 gap-1.5 rounded-lg bg-forest-900 text-white hover:opacity-90"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {saving ? "Saving..." : "Save Notes"}
        </Button>
      </div>
    </div>
  )
}
