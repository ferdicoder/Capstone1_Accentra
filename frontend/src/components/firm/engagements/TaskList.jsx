import { useEffect, useMemo, useRef, useState } from "react"
import { Clock, Inbox, Check, FileText, MessageSquareWarning, Eye, Download, Pencil, ChevronRight, Paperclip } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatDate } from "./engagement-variants"
import { canViewEngagementDocuments } from "@/lib/workflow-stages"
import { ReferenceDocumentUpload } from "@/components/firm/service-management/workflow-tasks"
import { FilePreviewDialog } from "@/components/shared/file-preview-dialog"
import { normalizePreviewFile } from "@/lib/file-utils"
import { getZodFieldErrors, scrollToFirstInvalidField } from "@/lib/form-validation"
import { engagementTaskSchema, revisionRemarkSchema } from "@/schemas/engagementSchema"

/**
 * A task deadline may not fall after its parent engagement's deadline.
 * Reuses the same date handling as `formatDate` (date-only values parsed as
 * local midnight) so comparisons stay consistent with how deadlines render.
 */
const isTaskDeadlineAfterEngagement = (taskDeadline, engagementDeadline) => {
  if (!taskDeadline || !engagementDeadline) return false

  const taskDate = new Date(`${taskDeadline}T00:00:00`)
  const engagementDate = new Date(
    `${String(engagementDeadline).slice(0, 10)}T00:00:00`
  )

  if (Number.isNaN(taskDate.getTime()) || Number.isNaN(engagementDate.getTime())) {
    return false
  }

  return taskDate > engagementDate
}

const getLocalDateInputValue = () => {
  const today = new Date()
  const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60_000)
  return localDate.toISOString().slice(0, 10)
}

const isTaskDeadlineInPast = (taskDeadline) =>
  Boolean(taskDeadline) && taskDeadline < getLocalDateInputValue()

// ── Status Helpers ────────────────────────────────────────────────────────────

const statusConfig = {
  approved: { label: "Approved", dotColor: "bg-emerald-500", className: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/25" },
  for_review: { label: "For Review", dotColor: "bg-amber-500", className: "bg-amber-500/10 text-amber-700 ring-amber-500/25" },
  for_revision: { label: "For Revision", dotColor: "bg-orange-500", className: "bg-orange-500/10 text-orange-700 ring-orange-500/25" },
  missing: { label: "Missing", dotColor: "bg-red-500", className: "bg-red-500/10 text-red-600 ring-red-500/25" },
}

function TaskStatusBadge({ status }) {
  const config = statusConfig[status] ?? statusConfig.missing
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset", config.className)}>
      <span className={cn("size-1.5 shrink-0 rounded-full", config.dotColor)} />
      {config.label}
    </span>
  )
}

// `referenceFile` holds the stored file's metadata ({ id, name, size, type,
// downloadUrl } from the task) or a freshly picked file ({ name, size, type,
// file }). Only a pick carries `.file`, so uploads can tell them apart.
// `removeReference` + `storedReferenceId` delete the stored row on save.
function createEmptyTaskForm() {
  return {
    name: "",
    required: false,
    hasReferenceDocument: false,
    referenceFile: null,
    storedReferenceId: null,
    removeReference: false,
    deadline: "",
  }
}

function taskToFormData(task) {
  return {
    name: task.name,
    required: task.required,
    hasReferenceDocument: task.hasReferenceDocument,
    referenceFile: task.referenceDocument ?? null,
    storedReferenceId: task.referenceDocument?.id ?? null,
    removeReference: false,
    deadline: task.deadline ?? "",
  }
}

// ── Add / Edit Task Form ──────────────────────────────────────────────────────

function TaskForm({ mode, formData, setFormData, errors, submitError, onSubmit, onCancel, submitting, engagement }) {
  const formRef = useRef(null)
  const updateField = (field, value) => setFormData((current) => ({ ...current, [field]: value }))

  useEffect(() => {
    if (errors.name || errors.deadline) {
      scrollToFirstInvalidField(formRef.current)
    }
  }, [errors])

  // Turning the switch off only discards a *pending* pick (has `.file`) — an
  // already-stored guide stays attached (visible again when toggled back on).
  const handleReferenceToggle = (value) =>
    setFormData((current) => ({
      ...current,
      hasReferenceDocument: value,
      ...(value || !current.referenceFile?.file ? {} : { referenceFile: null }),
    }))

  const handleReferenceSelect = (file) => setFormData((current) => ({ ...current, referenceFile: file }))

  const handleReferenceRemove = () =>
    setFormData((current) => ({
      ...current,
      referenceFile: null,
      removeReference: current.removeReference || Boolean(current.storedReferenceId),
    }))

  return (
    <form ref={formRef} onSubmit={onSubmit} className="flex min-h-0 flex-col gap-5 overflow-y-auto">
      <div className="flex flex-col gap-2">
        <label htmlFor="task-name" className="text-sm font-medium text-foreground">Task name</label>
        <Input
          id="task-name"
          value={formData.name}
          onChange={(event) => updateField("name", event.target.value)}
          placeholder="Task name"
          aria-invalid={errors.name || undefined}
          data-invalid-field={errors.name ? "true" : undefined}
          autoFocus
        />
        {errors.name && <p className="text-xs text-red-500">Task name is required.</p>}
      </div>

      <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
        <Switch label="Required?" checked={formData.required} onChange={(value) => updateField("required", value)} />
        <Switch
          label="Reference Document"
          checked={formData.hasReferenceDocument}
          onChange={handleReferenceToggle}
        />
      </div>
      {formData.hasReferenceDocument && (
        <div className="-mt-3 flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            The client will be asked to upload a file for this task before it can be reviewed.
          </p>
          <ReferenceDocumentUpload
            file={formData.referenceFile}
            onSelect={handleReferenceSelect}
            onRemove={handleReferenceRemove}
            disabled={submitting}
          />
          <p className="text-xs text-muted-foreground">
            Optionally attach a guide file for the client to reference.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor="task-due-date" className="text-sm font-medium text-foreground">Due date</label>
        <Input
          id="task-due-date"
          type="date"
          value={formData.deadline}
          onChange={(event) => updateField("deadline", event.target.value)}
          min={getLocalDateInputValue()}
          max={engagement?.targetEndDate ?? engagement?.startDate ?? undefined}
          aria-invalid={errors.deadline || undefined}
          data-invalid-field={errors.deadline ? "true" : undefined}
        />
        {errors.deadline && (
          <p className="text-xs text-red-500">
            {isTaskDeadlineInPast(formData.deadline)
              ? "Task deadline cannot be in the past."
              : "Task deadline cannot be later than the engagement deadline."}
          </p>
        )}
      </div>

      {submitError && <p className="text-xs text-red-600">{submitError}</p>}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>Cancel</Button>
        <Button type="submit" className="bg-[#02353C] text-white hover:opacity-90" disabled={submitting}>
          {submitting ? "Saving…" : mode === "edit" ? "Save Changes" : "Add Task"}
        </Button>
      </DialogFooter>
    </form>
  )
}

function TaskDialog({ open, mode, formData, setFormData, errors, submitError, onOpenChange, onSubmit, submitting, engagement }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit Task" : "Add Task"}</DialogTitle>
          <DialogDescription>
            {mode === "edit" ? "Update this task for the engagement." : "Create a task for this engagement."}
          </DialogDescription>
        </DialogHeader>
        <TaskForm
          mode={mode}
          formData={formData}
          setFormData={setFormData}
          errors={errors}
          submitError={submitError}
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
          submitting={submitting}
          engagement={engagement}
        />
      </DialogContent>
    </Dialog>
  )
}

// ── Request Revision Dialog ────────────────────────────────────────────────────

function RequestRevisionDialog({ open, onOpenChange, task, onSubmit }) {
  const [remark, setRemark] = useState("")
  const [remarkError, setRemarkError] = useState(false)

  const handleOpenChange = (next) => {
    if (next) {
      setRemark("")
      setRemarkError(false)
    }
    onOpenChange(next)
  }

  if (!task) return null

  const handleSubmit = (event) => {
    event.preventDefault()
    const validationErrors = getZodFieldErrors(revisionRemarkSchema, { remark })
    if (validationErrors.remark) {
      setRemarkError(true)
      return
    }
    onSubmit(remark.trim())
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request Revision</DialogTitle>
          <DialogDescription>Tell the client what needs to change for &ldquo;{task.name}&rdquo;.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="revision-remark" className="text-sm font-medium text-foreground">Remark</label>
            <textarea
              id="revision-remark"
              value={remark}
              onChange={(e) => {
                setRemark(e.target.value)
                setRemarkError(false)
              }}
              rows={4}
              aria-invalid={remarkError || undefined}
              autoFocus
              placeholder="e.g. The scanned copy is missing page 2."
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            {remarkError && <p className="text-xs text-red-500">Enter a revision remark.</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="bg-orange-600 text-white hover:bg-orange-700" disabled={!remark.trim()}>Send Back for Revision</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Task Detail Dialog (overview + edit + review) ─────────────────────────────

function DetailRow({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{children}</span>
    </div>
  )
}

function IconLink({ className, ...props }) {
  return (
    <a
      {...props}
      className={cn(
        "inline-flex size-7 shrink-0 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        className
      )}
    />
  )
}

function TaskDetailDialog({
  open,
  onOpenChange,
  task,
  documents = [],
  isTerminal,
  documentsLocked,
  canReview,
  onEdit,
  onApprove,
  onRequestRevision,
  onPreviewReference,
}) {
  if (!task) return null

  const reference = task.referenceDocument
  const showActions = !isTerminal

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="pr-6">
            {task.name}
            {task.required && <span className="ml-1 text-red-500">*</span>}
          </DialogTitle>
          <DialogDescription>Task details for this engagement</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/20 p-4">
            <DetailRow label="Status"><TaskStatusBadge status={task.status} /></DetailRow>
            <DetailRow label="Requirement">{task.required ? "Required" : "Optional"}</DetailRow>
            <DetailRow label="Deadline">
              {task.deadline ? formatDate(task.deadline) : <span className="font-normal italic text-muted-foreground">No deadline</span>}
            </DetailRow>
          </div>

          {task.status === "for_revision" && task.remark && (
            <div className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2.5 text-sm text-orange-800">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-orange-600">Revision remark</p>
              {task.remark}
            </div>
          )}

          {reference && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Guide for the client</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onPreviewReference}
                  className="inline-flex min-w-0 flex-1 items-center gap-2 rounded-md border bg-muted/40 px-2.5 py-1.5 text-left text-xs text-foreground transition-colors hover:bg-muted"
                >
                  <FileText className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{reference.name}</span>
                </button>
                <IconLink href={reference.downloadUrl} download={reference.name} title="Download guide">
                  <Download className="size-3.5" />
                </IconLink>
              </div>
            </div>
          )}

          {(task.hasReferenceDocument || documents.length > 0) && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Client submission</p>
              {documents.length === 0 ? (
                <p className="rounded-md border border-dashed px-3 py-3 text-xs text-muted-foreground">
                  {task.status === "missing"
                    ? "The client hasn't submitted a file for this task yet."
                    : documentsLocked
                      ? "Submitted. Files can be viewed once the engagement is moved to For Validation."
                      : task.status === "for_revision"
                        ? "Waiting for the client to resubmit."
                        : "No file to show."}
                </p>
              ) : (
                documents.map((document) => (
                  <div key={document.id} className="flex items-center gap-2">
                    <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border bg-muted/40 px-2.5 py-1.5 text-xs">
                      <Paperclip className="size-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate" title={document.name}>{document.name}</span>
                    </div>
                    {document.downloadUrl && (
                      <>
                        <IconLink href={document.downloadUrl} target="_blank" rel="noopener noreferrer" title="View document">
                          <Eye className="size-3.5" />
                        </IconLink>
                        <IconLink
                          href={document.downloadUrl}
                          download={document.name}
                          title="Download document"
                          className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-700"
                        >
                          <Download className="size-3.5" />
                        </IconLink>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {showActions && (
          <DialogFooter className="sm:justify-between">
            <Button type="button" variant="outline" className="gap-1.5" onClick={onEdit}>
              <Pencil className="size-3.5" />
              Edit Task
            </Button>
            {canReview && (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-1.5 border-orange-300 text-orange-700 hover:bg-orange-50 hover:text-orange-800"
                  onClick={onRequestRevision}
                >
                  <MessageSquareWarning className="size-4" />
                  Request Revision
                </Button>
                <Button type="button" className="gap-1.5 bg-[#02353C] text-white hover:opacity-90" onClick={onApprove}>
                  <Check className="size-4" />
                  Approve
                </Button>
              </div>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ── Task Row ──────────────────────────────────────────────────────────────────

function TaskRow({ task, fileCount, isTerminal, onOpen, onPreviewReference }) {
  const overdue =
    Boolean(task.deadline) && isTaskDeadlineInPast(task.deadline) && task.status !== "approved" && !isTerminal

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      onOpen()
    }
  }

  // Previewing the guide must not also open the task detail dialog (the row
  // itself is clickable).
  const handlePreviewReference = (event) => {
    event.stopPropagation()
    onPreviewReference?.()
  }

  return (
    <tr
      tabIndex={0}
      role="button"
      aria-label={`Open task ${task.name}`}
      onClick={onOpen}
      onKeyDown={handleKeyDown}
      className="group cursor-pointer border-b border-border transition-colors last:border-b-0 hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none"
    >
      <td className="min-w-0 px-6 py-3 pr-4">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span className="text-sm font-medium text-foreground group-hover:text-[#02353C]">
            {task.name}
            {task.required && <span className="ml-1 text-xs font-semibold text-red-500">*</span>}
          </span>
          {task.referenceDocument && (
            <button
              type="button"
              title="Preview guide file"
              aria-label={`Preview guide for ${task.name}`}
              onClick={handlePreviewReference}
              className="inline-flex items-center gap-1 rounded-md border bg-muted/40 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <FileText className="size-3" />
              Guide
              <Eye className="size-3" />
            </button>
          )}
          {fileCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
              <Paperclip className="size-3" />
              {fileCount} file{fileCount === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </td>

      <td className="w-[160px] px-5 py-3"><TaskStatusBadge status={task.status} /></td>

      <td className="w-[180px] px-5 py-3">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-xs",
            task.deadline ? (overdue ? "font-medium text-red-600" : "text-foreground") : "italic text-muted-foreground"
          )}
        >
          <Clock className="size-3 shrink-0" />
          {task.deadline ? formatDate(task.deadline) : "No deadline"}
        </span>
      </td>

      <td className="w-[48px] px-4 py-3 text-right">
        <ChevronRight className="ml-auto size-4 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
      </td>
    </tr>
  )
}

// ── Main TaskList Component ───────────────────────────────────────────────────

export function TaskList({
  engagement,
  documents = [],
  className,
  onTaskReview,
  onTaskCreate,
  onTaskUpdate,
  onBlockedAction,
}) {
  const tasks = engagement?.tasks ?? []
  const isTerminalEngagement =
    engagement?.status === "completed" || engagement?.status === "cancelled"
  const documentsByTask = useMemo(() => documents.reduce((grouped, document) => {
    const taskDocuments = grouped[document.engagementTaskId] ?? []
    grouped[document.engagementTaskId] = [...taskDocuments, document]
    return grouped
  }, {}), [documents])

  // The detail dialog reads the task by id so its status/remark stay live
  // after an approve or revision without reopening it.
  const [detailTaskId, setDetailTaskId] = useState(null)
  const detailTask = tasks.find((task) => task.id === detailTaskId) ?? null

  const [editingTask, setEditingTask] = useState(null)
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [taskDialogMode, setTaskDialogMode] = useState("add")
  const [taskFormData, setTaskFormData] = useState(createEmptyTaskForm)
  const [taskFormErrors, setTaskFormErrors] = useState({})
  const [taskSubmitting, setTaskSubmitting] = useState(false)
  const [taskSubmitError, setTaskSubmitError] = useState("")
  const [revisionDialogOpen, setRevisionDialogOpen] = useState(false)
  const [revisionTask, setRevisionTask] = useState(null)
  // Kept after close so the dialog doesn't blank during its close animation.
  const [referencePreviewTask, setReferencePreviewTask] = useState(null)
  const [referencePreviewOpen, setReferencePreviewOpen] = useState(false)

  const openAddTask = () => {
    if (isTerminalEngagement) {
      onBlockedAction?.()
      return
    }
    setTaskDialogMode("add")
    setEditingTask(null)
    setTaskFormData(createEmptyTaskForm())
    setTaskFormErrors({})
    setTaskSubmitError("")
    setTaskDialogOpen(true)
  }

  const openEditTask = (task) => {
    setDetailTaskId(null)
    setTaskDialogMode("edit")
    setEditingTask(task)
    setTaskFormData(taskToFormData(task))
    setTaskFormErrors({})
    setTaskSubmitError("")
    setTaskDialogOpen(true)
  }

  const handleTaskDialogChange = (open) => {
    setTaskDialogOpen(open)
    if (!open) {
      setTaskFormData(createEmptyTaskForm())
      setTaskFormErrors({})
      setEditingTask(null)
      setTaskSubmitError("")
    }
  }

  const handleTaskSubmit = async (event) => {
    event.preventDefault()
    if (isTerminalEngagement) {
      setTaskSubmitError("Tasks cannot be added to or edited on a completed or cancelled engagement.")
      onBlockedAction?.()
      return
    }

    const name = taskFormData.name.trim()
    const taskDeadlineInvalid = isTaskDeadlineAfterEngagement(taskFormData.deadline, engagement?.targetEndDate ?? engagement?.startDate)
    const taskDeadlineInPast = isTaskDeadlineInPast(taskFormData.deadline)
    const validationErrors = getZodFieldErrors(engagementTaskSchema, taskFormData)
    const nextErrors = {
      name: Boolean(validationErrors.name),
      deadline:
        Boolean(validationErrors.deadline) || taskDeadlineInvalid || taskDeadlineInPast,
    }

    if (nextErrors.name || nextErrors.deadline) {
      setTaskFormErrors(nextErrors)
      scrollToFirstInvalidField(event.currentTarget)
      return
    }

    setTaskFormErrors({})

    setTaskSubmitting(true)
    setTaskSubmitError("")
    try {
      if (taskDialogMode === "edit" && editingTask) {
        await onTaskUpdate?.(editingTask.id, {
          title: name,
          hasReferenceDocument: taskFormData.hasReferenceDocument,
          required: taskFormData.required,
          dueDate: taskFormData.deadline || null,
          referenceFile: taskFormData.referenceFile?.file ?? null,
          removeReferenceDocId: taskFormData.removeReference ? taskFormData.storedReferenceId : null,
        })
      } else {
        await onTaskCreate?.({
          title: name,
          hasReferenceDocument: taskFormData.hasReferenceDocument,
          required: taskFormData.required,
          dueDate: taskFormData.deadline || null,
          referenceFile: taskFormData.referenceFile?.file ?? null,
        })
      }
      handleTaskDialogChange(false)
    } catch (error) {
      setTaskSubmitError(error.message || "Could not save task")
    } finally {
      setTaskSubmitting(false)
    }
  }

  const handleApprove = (task) => {
    setDetailTaskId(null)
    onTaskReview?.(task.id, "approved", null)
  }

  const openRequestRevision = (task) => {
    setDetailTaskId(null)
    setRevisionTask(task)
    setRevisionDialogOpen(true)
  }

  const handleSubmitRevision = (remark) => {
    if (revisionTask) onTaskReview?.(revisionTask.id, "for_revision", remark)
    setRevisionDialogOpen(false)
    setRevisionTask(null)
  }

  const openReferencePreview = (task) => {
    setReferencePreviewTask(task)
    setReferencePreviewOpen(true)
  }

  const requiredCount = tasks.filter((task) => task.required).length
  const requiredDoneCount = tasks.filter((task) => task.required && task.status === "approved").length
  const completedCount = tasks.filter((task) => task.status === "approved").length

const detailCanReview =
Boolean(detailTask) &&
!isTerminalEngagement &&
(detailTask.status === "for_review" || detailTask.status === "for_revision")

  return (
    <div className={cn("rounded-xl border border-border bg-card shadow-sm", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-3.5">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Document Requirements</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {completedCount} of {tasks.length} approved
            {requiredCount > 0 && ` · ${requiredDoneCount} of ${requiredCount} required done`}
          </p>
        </div>
        {!isTerminalEngagement && (
          <Button type="button" size="sm" className="h-8 rounded-lg bg-[#02353C] px-3 text-xs text-white hover:bg-[#02353C]/90" onClick={openAddTask}>
            Add Task
          </Button>
        )}
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
          <div className="flex size-8 items-center justify-center rounded-full bg-muted"><Inbox className="size-4 text-muted-foreground" /></div>
          <p className="text-xs text-muted-foreground">No tasks available</p>
          <p className="text-xs text-muted-foreground/70">There are currently no tasks assigned to this engagement.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px]">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="min-w-0 px-6 py-2.5 text-xs font-medium text-foreground">Task</th>
                <th className="w-[160px] px-5 py-2.5 text-xs font-medium text-foreground">Status</th>
                <th className="w-[180px] px-5 py-2.5 text-xs font-medium text-foreground">Deadline</th>
                <th className="w-[48px] px-4 py-2.5"><span className="sr-only">Open</span></th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  fileCount={documentsByTask[task.id]?.length ?? 0}
                  isTerminal={isTerminalEngagement}
                  onOpen={() => setDetailTaskId(task.id)}
                  onPreviewReference={() => openReferencePreview(task)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <TaskDetailDialog
        open={Boolean(detailTask)}
        onOpenChange={(open) => !open && setDetailTaskId(null)}
        task={detailTask}
        documents={detailTask ? (documentsByTask[detailTask.id] ?? []) : []}
        isTerminal={isTerminalEngagement}
        documentsLocked={!canViewEngagementDocuments(engagement?.status)}
        canReview={detailCanReview}
        onEdit={() => detailTask && openEditTask(detailTask)}
        onApprove={() => detailTask && handleApprove(detailTask)}
        onRequestRevision={() => detailTask && openRequestRevision(detailTask)}
        onPreviewReference={() => detailTask && openReferencePreview(detailTask)}
      />

      <TaskDialog
        open={taskDialogOpen}
        mode={taskDialogMode}
        formData={taskFormData}
        setFormData={setTaskFormData}
        errors={taskFormErrors}
        submitError={taskSubmitError}
        onOpenChange={handleTaskDialogChange}
        onSubmit={handleTaskSubmit}
        submitting={taskSubmitting}
        engagement={engagement}
      />

      <RequestRevisionDialog open={revisionDialogOpen} onOpenChange={setRevisionDialogOpen} task={revisionTask} onSubmit={handleSubmitRevision} />
      <FilePreviewDialog
        open={referencePreviewOpen}
        onOpenChange={setReferencePreviewOpen}
        files={
          referencePreviewTask?.referenceDocument
            ? [normalizePreviewFile(referencePreviewTask.referenceDocument)]
            : []
        }
        subtitle={referencePreviewTask ? `Guide for "${referencePreviewTask.name}"` : undefined}
      />
    </div>
  )
}