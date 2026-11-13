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
import { useFetchServiceTasks } from "@/hooks/useServiceTasks"
import { getCategoryLabel } from "@/lib/service-categories"

const formatDate = (value) =>
  value
    ? new Date(`${value}T00:00:00`).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—"

const formatPeso = (value) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(Number(value) || 0)

function SummaryRow({ label, children }) {
  return (
    <div className="grid min-w-0 grid-cols-[140px_minmax(0,1fr)] gap-4 py-2.5 text-sm">
      <dt className="font-medium text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-foreground">{children}</dd>
    </div>
  )
}

export function RequiredDocumentsDialog({
  open = false,
  onOpenChange,
  request,
  draft,
  submitting = false,
  error,
  onBack,
  onConfirm,
  className,
}) {
  const {
    data: tasks = [],
    isLoading: tasksLoading,
    error: tasksError,
  } = useFetchServiceTasks(open ? draft?.serviceId : null)

  const client = draft?.client ?? request?.client
  const business = draft?.business ?? request?.business
  const clientName = [client?.firstName, client?.lastName].filter(Boolean).join(" ") || "—"
  const categoryOverride =
    !!draft?.requestedCategory && draft.requestedCategory !== draft.serviceCategory

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-slot="confirm-engagement-dialog"
        className={cn("max-w-2xl", className)}
      >
        <DialogHeader>
          <DialogTitle>Confirm Engagement</DialogTitle>
          <DialogDescription>
            Review the details and required documents. The engagement is only created when you
            confirm.
          </DialogDescription>
        </DialogHeader>

        <div className="flex max-h-[65vh] flex-col gap-5 overflow-y-auto p-1">
          <div className="rounded-xl border border-border bg-muted/30 px-6">
            <dl className="divide-y divide-border/60">
              <SummaryRow label="Client">{clientName}</SummaryRow>
              <SummaryRow label="Business">{business?.businessName ?? "—"}</SummaryRow>
              {draft?.requestedCategory && (
                <SummaryRow label="Requested">
                  {getCategoryLabel(draft.requestedCategory)}
                </SummaryRow>
              )}
              <SummaryRow label="Service Template">
                {draft?.serviceName ?? "—"}
                {draft?.serviceCategory && (
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {getCategoryLabel(draft.serviceCategory)}
                  </span>
                )}
                {categoryOverride && (
                  <span className="mt-0.5 block text-xs text-amber-700 dark:text-amber-300">
                    Outside the requested category. This will be recorded in the audit log.
                  </span>
                )}
              </SummaryRow>
              <SummaryRow label="Assigned Lead">{draft?.assignedStaffName || "—"}</SummaryRow>
              <SummaryRow label="Start Date">{formatDate(draft?.startDate)}</SummaryRow>
              <SummaryRow label="Target Completion">{formatDate(draft?.targetEndDate)}</SummaryRow>
              <SummaryRow label="Service Fee">{formatPeso(draft?.serviceFee)}</SummaryRow>
            </dl>
          </div>

          <div className="space-y-2">
            <h3 className="font-heading text-sm font-medium text-foreground">
              Required Documents
            </h3>
            <p className="text-xs text-muted-foreground">
              Tasks are copied from the template, and attached reference documents are listed here.
            </p>

            {tasksLoading && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Loading template tasks…
              </p>
            )}
            {!tasksLoading && tasksError && (
              <p role="alert" className="text-sm text-destructive">
                Unable to load the template's tasks. You can still confirm; the tasks are copied
                by the server.
              </p>
            )}
            {!tasksLoading && !tasksError && tasks.length === 0 && (
              <p className="text-sm text-muted-foreground">This template has no tasks.</p>
            )}
            {!tasksLoading && !tasksError && tasks.length > 0 && (
              <ul className="divide-y divide-border/60 rounded-xl border border-border">
                {tasks.map((task) => {
                  const required = task.required ?? task.isRequired ?? task.is_required ?? true
                  return (
                    <li key={task.id} className="flex items-start gap-3 px-4 py-2.5 text-sm">
                      <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground">{task.title ?? task.name}</p>
                        {task.description && (
                          <p className="text-xs text-muted-foreground">{task.description}</p>
                        )}
                        {task.referenceDocument ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Template reference:{" "}
                            <span className="font-medium text-foreground">
                              {task.referenceDocument.name}
                            </span>
                          </p>
                        ) : task.hasReferenceDocument && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            No reference document is attached.
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {required ? "Required" : "Optional"}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-500">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="flex-row justify-end gap-2">
          <Button type="button" variant="outline" disabled={submitting} onClick={onBack}>
            Back
          </Button>
          <Button
            type="button"
            disabled={submitting}
            onClick={onConfirm}
            className="bg-[#02353C] text-white hover:opacity-90"
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {submitting ? "Creating…" : "Confirm & Create Engagement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}