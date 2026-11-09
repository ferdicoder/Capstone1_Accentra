import { AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { billingTypeLabel } from "@/lib/vocab"
import { billingDisplayId } from "@/components/firm/billing/billing-variants"
import { describeDueDate, formatCurrency, parseDate, useToday } from "@/lib/date-utils"

// Shown when a firm user creates an engagement for a client who has unpaid
// bills. It warns and asks; it never blocks, because some clients have payment
// terms arranged outside Accentra. (Client service requests ARE blocked.)
//
// bills: minimal bill records { id, invoice_type, amount, due_date, status }.
export function UnpaidBillsConfirmDialog({
  open,
  clientName,
  bills = [],
  submitting = false,
  onCancel,
  onConfirm,
}) {
  const today = useToday()

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel?.()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-amber-600" aria-hidden="true" />
            Unpaid bills on record
          </DialogTitle>
          <DialogDescription>
            {clientName || "This client"} has {bills.length} unpaid{" "}
            {bills.length === 1 ? "bill" : "bills"}. You can still create this
            engagement, for example when payment terms are arranged outside the
            system.
          </DialogDescription>
        </DialogHeader>

        <ul className="flex flex-col gap-2">
          {bills.map((bill) => {
            const due = parseDate(bill.dueDate ?? bill.due_date)
            return (
              <li
                key={bill.id}
                className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {billingTypeLabel(bill.invoice_type ?? bill.billing_type)}{" "}
                    <span className="text-muted-foreground">· {billingDisplayId(bill)}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {due ? describeDueDate(due, today) : "No due date set"}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums">
                  {formatCurrency(bill.amount)}
                </span>
              </li>
            )
          })}
        </ul>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
          <Button type="button" onClick={onConfirm} disabled={submitting}>
            Create anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
