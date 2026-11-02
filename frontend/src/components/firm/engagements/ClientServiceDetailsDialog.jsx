import { useState } from "react"
import { ChevronDown, Loader2, Pencil } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EngagementDetailsContent } from "@/components/shared/EngagementDetailsContent"
import { useFetchUsers } from "@/hooks/useUsers"
import {
  getClientFullName,
  formatDate,
  formatRevenue,
  firmStaffMap,
} from "./engagement-variants"

// date inputs need a plain YYYY-MM-DD value.
const toDateInputValue = (value) => (value ? String(value).split("T")[0] : "")

export function ClientServiceDetailsDialog({
  open,
  onOpenChange,
  engagement,
  canEdit = false,
  onSave,
  saving = false,
  saveError,
}) {
  const { data: users = [] } = useFetchUsers()
  // null = view mode; otherwise the draft edits being made: assigned staff
  // plus start/due dates. Seeded when Edit is clicked, so no open/reset
  // effect is needed.
  const [draft, setDraft] = useState(null)

  if (!engagement) return null

  // Real engagements carry the assigned user's name from the users join;
  // firmStaffMap only covers the legacy mock ids.
  const staffLabel =
    engagement.assignedStaff || firmStaffMap[engagement.assignedStaff] || "—"
  const currentAssignedUser = users.find(
    (user) => user.id === engagement.assignedStaffId
  )
  const staffOptions = users
    .filter((user) => user.role === "staff")
    .map((user) => ({ value: user.id, label: user.name }))
  // The current assignee may not have the "staff" role (e.g. an admin who
  // took the engagement) — keep them selectable so the dropdown matches the
  // label already on screen.
  if (
    engagement.assignedStaffId &&
    !staffOptions.some((option) => option.value === engagement.assignedStaffId)
  ) {
    staffOptions.unshift({
      value: engagement.assignedStaffId,
      label: currentAssignedUser?.name ?? staffLabel,
    })
  }

  const editing = draft !== null
  const draftStaff = draft
    ? staffOptions.find((option) => option.value === draft.assignedStaffId)
    : null

  const startDateError = editing && !draft.startDate ? "Start date is required." : null
  const dueDateError = editing
    ? !draft.dueDate
      ? "Due date is required."
      : draft.startDate && draft.dueDate < draft.startDate
        ? "Due date cannot be before the start date."
        : null
    : null
  const hasDateErrors = Boolean(startDateError || dueDateError)

  const staffChanged = editing
    ? (draft.assignedStaffId || null) !== (engagement.assignedStaffId ?? null)
    : false
  const scheduleChanged = editing
    ? draft.startDate !== toDateInputValue(engagement.startDate) ||
      draft.dueDate !== toDateInputValue(engagement.targetEndDate)
    : false
  const hasChanges = staffChanged || scheduleChanged

  const clientDescription =
    engagement.clientDescription ??
    engagement.client?.description ??
    engagement.request?.notes ??
    engagement.notes?.[0]?.content ??
    "—"

  const clientInfo = {
    fields: [
      { label: "Full Name", value: getClientFullName(engagement.client), fullWidth: true },
      { label: "Email", value: engagement.client?.email ?? "—" },
      { label: "Contact Number", value: engagement.client?.contactNo ?? "—" },
      { label: "Client Description", value: clientDescription, fullWidth: true, valueClassName: "leading-6 text-foreground/90" },
      { label: "Business Name", value: engagement.business?.businessName ?? "—" },
      { label: "Business Type", value: engagement.business?.businessType ?? "—" },
      { label: "TIN", value: engagement.business?.tinNo ?? "—" },
      { label: "Industry", value: engagement.business?.industry ?? "—" },
      { label: "Business Address", value: engagement.business?.address ?? "—", fullWidth: true },
    ],
  }

  const updateDraft = (patch) =>
    setDraft((previous) => ({ ...previous, ...patch }))

  const assignedStaffValue = editing ? (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            className="h-8 w-full justify-between rounded-lg px-2.5 font-normal"
          />
        }
      >
        {draftStaff?.label ?? "Select staff"}
        <ChevronDown className="size-4 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-56">
        {staffOptions.length === 0 && (
          <DropdownMenuItem disabled>No staff available</DropdownMenuItem>
        )}
        {staffOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => updateDraft({ assignedStaffId: option.value })}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  ) : (
    staffLabel
  )

  const startDateValue = editing ? (
    <div className="flex flex-col gap-1.5">
      <Input
        type="date"
        value={draft.startDate}
        disabled={saving}
        onChange={(event) => updateDraft({ startDate: event.target.value })}
        aria-label="Start date"
        aria-invalid={startDateError || undefined}
      />
      {startDateError && <p className="text-xs text-red-500">{startDateError}</p>}
    </div>
  ) : (
    formatDate(engagement.startDate)
  )

  const dueDateValue = editing ? (
    <div className="flex flex-col gap-1.5">
      <Input
        type="date"
        value={draft.dueDate}
        min={draft.startDate || undefined}
        disabled={saving}
        onChange={(event) => updateDraft({ dueDate: event.target.value })}
        aria-label="Due date"
        aria-invalid={dueDateError || undefined}
      />
      {dueDateError && <p className="text-xs text-red-500">{dueDateError}</p>}
    </div>
  ) : (
    formatDate(engagement.targetEndDate)
  )

  const serviceInfo = {
    description: "Details about the selected service",
    fields: [
      { label: "Engagement Number", value: engagement.engagementNumber },
      { label: "Service", value: engagement.serviceName },
      { label: "Assigned Staff", value: assignedStaffValue, fullWidth: editing },
      { label: "Service Fee", value: formatRevenue(engagement.serviceFee ?? engagement.fee) },
      { label: "Start Date", value: startDateValue, fullWidth: editing },
      { label: "Due Date", value: dueDateValue, fullWidth: editing },
    ],
  }

  const startEdit = () => {
    setDraft({
      assignedStaffId: engagement.assignedStaffId ?? "",
      startDate: toDateInputValue(engagement.startDate),
      dueDate: toDateInputValue(engagement.targetEndDate),
    })
  }

  const handleOpenChange = (next) => {
    // Closing always returns to view mode, so a stale draft never survives
    // into the next open.
    if (!next) setDraft(null)
    onOpenChange?.(next)
  }

  const handleSave = async () => {
    if (saving || !hasChanges || hasDateErrors) return
    const saved = await onSave?.({
      assignedStaffId: draft.assignedStaffId,
      assignedStaffName: draftStaff?.label,
      startDate: draft.startDate,
      dueDate: draft.dueDate,
    })
    if (saved !== false) setDraft(null)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent data-slot="client-service-details-dialog" className="max-w-6xl">
        <DialogHeader className="border-b border-border pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <DialogTitle>Client & Service Details</DialogTitle>
              <DialogDescription>
                Full information for engagement {engagement.engagementNumber}
              </DialogDescription>
            </div>
            {canEdit && !editing && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 gap-1.5"
                onClick={startEdit}
              >
                <Pencil className="size-3.5" />
                Edit
              </Button>
            )}
          </div>
          {editing && (
            <p className="text-xs text-muted-foreground">
              Editing engagement details — change the assigned staff, start
              date, or due date, then save.
            </p>
          )}
        </DialogHeader>

        <EngagementDetailsContent
          engagement={engagement}
          clientInfo={clientInfo}
          serviceInfo={serviceInfo}
        />

        {editing && (
          <DialogFooter className="border-t border-border pt-4">
            {saveError && (
              <p className="mr-auto self-center text-sm text-red-500">{saveError}</p>
            )}
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => setDraft(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={saving || !hasChanges || hasDateErrors}
              className="bg-[#02353C] text-white hover:opacity-90"
              onClick={handleSave}
            >
              {saving && <Loader2 className="size-4 animate-spin" />}
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
