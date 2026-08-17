import { useState } from "react"
import { FileText, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatRevenue } from "./service-request-variants"

const textareaClass =
  "min-h-20 w-full resize-none rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 dark:bg-input/30 dark:disabled:bg-input/80"

function SummaryRow({ label, children, className }) {
  return (
    <div className={cn("grid min-w-0 grid-cols-[160px_minmax(0,1fr)] gap-4 py-2.5 text-sm", className)}>
      <dt className="min-w-0 font-medium text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-foreground">{children}</dd>
    </div>
  )
}

export function RequiredDocumentsDialog({
  open = false,
  onOpenChange,
  engagement,
  onBack,
  onSubmit,
  submitting = false,
  error,
  className,
}) {
  const [note, setNote] = useState("")

  const clientFullName = engagement?.client
    ? [engagement.client.firstName, engagement.client.lastName].filter(Boolean).join(" ")
    : "—"

  const businessName = engagement?.business?.businessName ?? "—"

  const staffLabel = (() => {
    const map = {
      "staff-001": "Maria Clara Santos",
      "staff-002": "Juan Dela Cruz",
      "staff-003": "Ana Reyes",
      "staff-004": "Carlos Mendoza",
    }
    return map[engagement?.assignedStaff] ?? "—"
  })()

  const handleSubmit = (event) => {
    event.preventDefault()
    onSubmit?.({
      engagement,
      note: note.trim(),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-slot="required-documents-dialog"
        className={cn("max-w-2xl", className)}
      >
        <DialogHeader>
          <DialogTitle>Engagement Summary</DialogTitle>
          <DialogDescription>
            Review the engagement details before sending to the client.
          </DialogDescription>
          {engagement && (
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <span className="font-medium text-foreground">{engagement.requestNumber ?? "—"}</span>
              </span>
              <span>{engagement.serviceName}</span>
              <span>{businessName}</span>
              <span>Assigned to {staffLabel}</span>
            </div>
          )}
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col gap-5 overflow-y-auto max-h-[70vh] p-1"
        >
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-[#02353C]/10 text-[#02353C]">
              <FileText className="size-3.5" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Engagement Summary</h3>
          </div>

          <div className="rounded-xl border border-[#02353C]/15 bg-[#02353C]/[0.03] px-6">
            <dl className="divide-y divide-[#02353C]/10">
              <SummaryRow label="Client">{businessName}</SummaryRow>
              <SummaryRow label="Service">{engagement?.serviceName ?? "—"}</SummaryRow>
              <SummaryRow label="Assigned Firm User">{staffLabel}</SummaryRow>
              <SummaryRow label="Due Date">
                {engagement?.targetEndDate
                  ? new Date(`${engagement.targetEndDate}T00:00:00`).toLocaleDateString("en-US", {
                      month: "short",
                      day: "2-digit",
                      year: "numeric",
                    })
                  : "—"}
              </SummaryRow>
              <SummaryRow label="Service Fee">
                {formatRevenue(engagement?.serviceFee)}
              </SummaryRow>
              <SummaryRow label="Status">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-500/25">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Active
                </span>
              </SummaryRow>
            </dl>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-[#02353C]/10 text-[#02353C]">
                <FileText className="size-3.5" />
              </div>
              <div className="flex flex-col gap-0.5">
                <h3 className="text-sm font-semibold text-foreground">Internal Notes</h3>
                <p className="text-xs text-muted-foreground">
                  Visible only to firm users. Not visible to the client.
                </p>
              </div>
            </div>

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add any internal notes about this engagement…"
              disabled={submitting}
              rows={3}
              className={textareaClass}
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-500">
              {error}
            </p>
          )}

          <DialogFooter className="flex-row justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={onBack}
              className="rounded-lg"
            >
              Back
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-[#02353C] text-white hover:opacity-90"
            >
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {submitting ? "Sending…" : "Send to Client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
