import { useEffect, useMemo, useState } from "react"
import {
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck,
  FileText,
  Inbox,
  RefreshCw,
  Upload,
  UploadCloud,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { formatDate } from "@/components/firm/engagements/engagement-variants"

// ── Status Helpers ────────────────────────────────────────────────────────────

const statusConfig = {
  approved: {
    label: "Approved",
    dotColor: "bg-emerald-500",
    className: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/25",
  },
  for_review: {
    label: "For Review",
    dotColor: "bg-amber-500",
    className: "bg-amber-500/10 text-amber-700 ring-amber-500/25",
  },
  missing: {
    label: "Missing",
    dotColor: "bg-red-500",
    className: "bg-red-500/10 text-red-600 ring-red-500/25",
  },
}

function TaskStatusBadge({ status }) {
  const config = statusConfig[status] ?? statusConfig.missing
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset",
        config.className
      )}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", config.dotColor)} />
      {config.label}
    </span>
  )
}

function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return null
  const kb = bytes / 1024
  return kb < 1024 ? `${kb.toFixed(0)} KB` : `${(kb / 1024).toFixed(1)} MB`
}

// ── Mock Task Data Generator (same shape as the firm side) ────────────────────

function generateMockTasks(engagement) {
  if (!engagement) return []
  const serviceName = engagement.serviceName ?? ""

  if (serviceName.toLowerCase().includes("tax filing")) {
    return [
      { id: "task-1", name: "Monthly Gross Sales Summary", required: true, status: "for_review", deadline: "2025-07-15" },
      { id: "task-2", name: "Sales Record", required: true, status: "approved", deadline: "2025-07-15" },
      { id: "task-3", name: "Valid ID", required: true, status: "missing", deadline: "2025-07-16" },
      { id: "task-4", name: "Supporting Documents", required: false, status: "for_review", deadline: "2025-07-18" },
    ]
  }

  if (serviceName.toLowerCase().includes("business registration")) {
    return [
      { id: "task-1", name: "Valid Government-issued ID", required: true, status: "approved", deadline: "2025-07-10" },
      { id: "task-2", name: "TIN Certificate", required: true, status: "approved", deadline: "2025-07-10" },
      { id: "task-3", name: "Business Address Proof", required: true, status: "for_review", deadline: "2025-07-15" },
      { id: "task-4", name: "Barangay Clearance", required: false, status: "missing", deadline: "2025-07-20" },
    ]
  }

  return [
    { id: "task-1", name: "Required Document 1", required: true, status: "for_review", deadline: "2025-07-15" },
    { id: "task-2", name: "Required Document 2", required: true, status: "approved", deadline: "2025-07-15" },
    { id: "task-3", name: "Supporting Document", required: false, status: "missing", deadline: "" },
  ]
}

// ── Task Detail Dialog (view-only) ─────────────────────────────────────────────

function TaskDetailDialog({ open, onOpenChange, task }) {
  if (!task) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{task.name}</DialogTitle>
          <DialogDescription>Task details for this engagement</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <TaskStatusBadge status={task.status} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Required</span>
            <span className="text-sm font-medium text-foreground">{task.required ? "Yes" : "No"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Deadline</span>
            <span className="text-sm font-medium text-foreground">
              {task.deadline ? formatDate(task.deadline) : "No deadline"}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Choose Files Dialog ────────────────────────────────────────────────────────
// Just lets the client pick file(s) for a task. It doesn't upload anything
// itself — picking a file here only *stages* it. The actual upload only
// happens when the client hits the check button inline in the row, so they
// get a chance to back out (the X button) before anything is sent.

function TaskFilePickerDialog({ open, onOpenChange, task, onFilesChosen }) {
  const [files, setFiles] = useState([])

  const handleChange = (e) => {
    setFiles(Array.from(e.target.files ?? []))
  }

  const handleClose = (next) => {
    if (!next) setFiles([])
    onOpenChange(next)
  }

  const handleStage = () => {
    if (files.length === 0) return
    onFilesChosen?.(task, files)
    setFiles([])
    onOpenChange(false)
  }

  if (!task) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
          <DialogDescription>
            Choose the file(s) needed for &ldquo;{task.name}&rdquo;. You&rsquo;ll get a chance to
            confirm before it&rsquo;s uploaded.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border px-4 py-8 text-center transition-colors hover:border-[#02353C]/40 hover:bg-muted/30">
            <UploadCloud className="size-6 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Click to choose file(s)</span>
            <span className="text-xs text-muted-foreground">PDF, JPG, or PNG — up to 10MB each</span>
            <input type="file" multiple className="hidden" onChange={handleChange} />
          </label>

          {files.length > 0 && (
            <ul className="flex flex-col gap-1.5">
              {files.map((f, i) => (
                <li
                  key={`${f.name}-${i}`}
                  className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-1.5 text-xs text-foreground"
                >
                  <FileCheck className="size-3.5 shrink-0 text-emerald-600" />
                  <span className="truncate">{f.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-2 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="bg-emerald-600 text-white hover:bg-emerald-700"
            disabled={files.length === 0}
            onClick={handleStage}
          >
            Choose
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── File Preview Dialog ────────────────────────────────────────────────────────
// Lets the client click an uploaded file chip and see what they actually
// submitted. These files only exist client-side (not sent to a server yet in
// this mock), so previewing is done with an object URL — works for images
// and PDFs inline; anything else falls back to a details view with an
// "Open in new tab" action. URLs are revoked on close to avoid leaking memory.

function FilePreviewDialog({ open, onOpenChange, files = [], taskName }) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    if (open) setSelectedIndex(0)
  }, [open, files])

  const selectedFile = files[selectedIndex] ?? null

  const objectUrl = useMemo(() => {
    if (!selectedFile) return null
    return URL.createObjectURL(selectedFile)
  }, [selectedFile])

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [objectUrl])

  if (!selectedFile) return null

  const isImage = selectedFile.type?.startsWith("image/")
  const isPdf = selectedFile.type === "application/pdf"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="truncate">{selectedFile.name}</DialogTitle>
          <DialogDescription>
            {taskName ? `Uploaded for "${taskName}"` : "Uploaded file"}
            {formatFileSize(selectedFile.size) && ` · ${formatFileSize(selectedFile.size)}`}
          </DialogDescription>
        </DialogHeader>

        {files.length > 1 && (
          <div className="flex flex-wrap gap-1.5 border-b border-border pb-3">
            {files.map((f, i) => (
              <button
                key={`${f.name}-${i}`}
                type="button"
                onClick={() => setSelectedIndex(i)}
                className={cn(
                  "max-w-[160px] truncate rounded-md border px-2 py-1 text-xs font-medium transition-colors",
                  i === selectedIndex
                    ? "border-[#02353C]/30 bg-[#02353C]/10 text-[#02353C]"
                    : "border-border text-muted-foreground hover:bg-muted"
                )}
                title={f.name}
              >
                {f.name}
              </button>
            ))}
          </div>
        )}

        <div className="flex max-h-[65vh] min-h-[240px] items-center justify-center overflow-auto rounded-lg border border-border bg-muted/30">
          {isImage && objectUrl ? (
            <img
              src={objectUrl}
              alt={selectedFile.name}
              className="max-h-[65vh] w-auto max-w-full object-contain"
            />
          ) : isPdf && objectUrl ? (
            <iframe
              src={objectUrl}
              title={selectedFile.name}
              className="h-[65vh] w-full rounded-lg"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <FileText className="size-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                No inline preview available for this file type.
              </p>
              {objectUrl && (
                <a
                  href={objectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#02353C]/20 bg-[#02353C]/5 px-3 py-1.5 text-xs font-medium text-[#02353C] transition-colors hover:bg-[#02353C]/10"
                >
                  <ExternalLink className="size-3.5" />
                  Open in new tab
                </a>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Task Row ────────────────────────────────────────────────────────────────────
//
// Actions cell has three states:
//   1. Nothing staged/uploaded yet → plain "Upload Files" button.
//   2. File(s) picked but not confirmed → filename + check (confirm) / X (discard).
//   3. Confirmed/uploaded → clickable filename chip (opens preview) + a small
//      replace icon to stage a new file for that task again.

function TaskRow({
  task,
  pendingFiles,
  uploadedFiles,
  onOpenDetail,
  onOpenUpload,
  onConfirmUpload,
  onDiscardUpload,
  onPreviewUploaded,
}) {
  const hasPending = pendingFiles && pendingFiles.length > 0
  const hasUploaded = !hasPending && uploadedFiles && uploadedFiles.length > 0

  const pendingLabel = hasPending
    ? pendingFiles.length === 1
      ? pendingFiles[0].name
      : `${pendingFiles[0].name} +${pendingFiles.length - 1} more`
    : null

  const uploadedLabel = hasUploaded
    ? uploadedFiles.length === 1
      ? uploadedFiles[0].name
      : `${uploadedFiles[0].name} +${uploadedFiles.length - 1} more`
    : null

  return (
    <tr className="border-b border-border last:border-b-0 transition-colors hover:bg-muted/30">
      {/* Task Name */}
      <td className="px-6 py-2.5 pr-4">
        <button
          type="button"
          onClick={onOpenDetail}
          className="text-sm font-medium text-foreground hover:text-[#02353C] transition-colors"
        >
          {task.name}
          {task.required && (
            <span className="ml-1 text-xs text-red-500 font-semibold">*</span>
          )}
        </button>
      </td>

      {/* Status */}
      <td className="w-[120px] py-2.5 pr-4">
        <TaskStatusBadge status={task.status} />
      </td>

      {/* Deadline (display only) */}
      <td className="w-[140px] py-2.5 pr-4">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="size-3 shrink-0" />
          {task.deadline ? formatDate(task.deadline) : "No deadline"}
        </span>
      </td>

      {/* Actions */}
      <td className="w-[220px] py-2.5 pr-6">
        {hasPending ? (
          <div className="flex items-center gap-1.5">
            <span
              title={pendingFiles.map((f) => f.name).join(", ")}
              className="inline-flex min-w-0 max-w-[130px] items-center gap-1 truncate rounded-lg border border-[#02353C]/20 bg-[#02353C]/5 px-2 py-1 text-xs font-medium text-[#02353C]"
            >
              <FileCheck className="size-3.5 shrink-0" />
              <span className="truncate">{pendingLabel}</span>
            </span>
            <button
              type="button"
              title="Confirm upload"
              onClick={onConfirmUpload}
              className="inline-flex size-6 shrink-0 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-100"
            >
              <Check className="size-3.5" />
            </button>
            <button
              type="button"
              title="Discard"
              onClick={onDiscardUpload}
              className="inline-flex size-6 shrink-0 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-600 transition-colors hover:bg-red-100"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ) : hasUploaded ? (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              title="View uploaded file"
              onClick={onPreviewUploaded}
              className="inline-flex min-w-0 max-w-[150px] items-center gap-1 truncate rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
            >
              <CheckCircle2 className="size-3.5 shrink-0" />
              <span className="truncate underline-offset-2 hover:underline">{uploadedLabel}</span>
            </button>
            <button
              type="button"
              title="Replace file"
              onClick={onOpenUpload}
              className="inline-flex size-6 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <RefreshCw className="size-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenUpload}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#02353C]/20 bg-[#02353C]/5 px-2.5 py-1 text-xs font-medium text-[#02353C] transition-colors hover:bg-[#02353C]/10"
          >
            <Upload className="size-3.5" />
            Upload Files
          </button>
        )}
      </td>
    </tr>
  )
}

// ── Main ClientEngagementTaskList Component ────────────────────────────────────

export function TaskList({ engagement, className, onUploadFiles }) {
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerTask, setPickerTask] = useState(null)
  const [pendingByTask, setPendingByTask] = useState({}) // taskId -> File[] (picked, not yet confirmed)
  const [uploadedByTask, setUploadedByTask] = useState({}) // taskId -> File[] (confirmed/uploaded)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewTask, setPreviewTask] = useState(null)
  const [tasks] = useState(() => generateMockTasks(engagement))

  const handleOpenDetail = (task) => {
    setSelectedTask(task)
    setDetailOpen(true)
  }

  const handleOpenUpload = (task) => {
    setPickerTask(task)
    setPickerOpen(true)
  }

  // Picking file(s) only stages them against the task — nothing is uploaded yet.
  const handleFilesChosen = (task, files) => {
    setPendingByTask((prev) => ({ ...prev, [task.id]: files }))
  }

  // Check button — send the staged file(s), move them into "uploaded" so the
  // row keeps showing what was submitted instead of resetting to the button.
  const handleConfirmUpload = (task) => {
    const files = pendingByTask[task.id]
    if (!files || files.length === 0) return

    onUploadFiles?.(task, files)

    setUploadedByTask((prev) => ({ ...prev, [task.id]: files }))
    setPendingByTask((prev) => {
      const next = { ...prev }
      delete next[task.id]
      return next
    })
  }

  // X button — discard the staged file(s) without uploading.
  const handleDiscardUpload = (task) => {
    setPendingByTask((prev) => {
      const next = { ...prev }
      delete next[task.id]
      return next
    })
  }

  const handlePreviewUploaded = (task) => {
    setPreviewTask(task)
    setPreviewOpen(true)
  }

  const requiredCount = tasks.filter((t) => t.required).length
  const completedCount = tasks.filter((t) => t.status === "approved").length

  return (
    <div className={cn("rounded-xl border border-border bg-card shadow-sm", className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-3.5">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Task List</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {completedCount} of {tasks.length} completed
            {requiredCount > 0 && ` · ${requiredCount} required`}
          </p>
        </div>
      </div>

      {/* Table */}
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
          <div className="flex size-8 items-center justify-center rounded-full bg-muted">
            <Inbox className="size-4 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">No tasks available</p>
          <p className="text-xs text-muted-foreground/70">
            There are currently no tasks assigned to this engagement.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-6 py-2.5 text-xs font-medium text-muted-foreground">Task</th>
                <th className="w-[120px] px-4 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
                <th className="w-[140px] px-4 py-2.5 text-xs font-medium text-muted-foreground">Deadline</th>
                <th className="w-[220px] px-4 py-2.5 text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  pendingFiles={pendingByTask[task.id]}
                  uploadedFiles={uploadedByTask[task.id]}
                  onOpenDetail={() => handleOpenDetail(task)}
                  onOpenUpload={() => handleOpenUpload(task)}
                  onConfirmUpload={() => handleConfirmUpload(task)}
                  onDiscardUpload={() => handleDiscardUpload(task)}
                  onPreviewUploaded={() => handlePreviewUploaded(task)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <TaskDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        task={selectedTask}
      />

      <TaskFilePickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        task={pickerTask}
        onFilesChosen={handleFilesChosen}
      />

      <FilePreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        files={previewTask ? uploadedByTask[previewTask.id] ?? [] : []}
        taskName={previewTask?.name}
      />
    </div>
  )
}