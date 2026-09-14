import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
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

// ── Task Detail Dialog (view-only) ─────────────────────────────────────────────

function TaskDetailDialog({ open, onOpenChange, task }) {
  if (!task) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{task.name}</DialogTitle>
          <DialogDescription>Requirement details for this engagement</DialogDescription>
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

// ── Delete Confirmation Dialog ─────────────────────────────────────────────────
// Confirms before removing an already-uploaded file from a requirement.

function DeleteFileConfirmDialog({ open, onOpenChange, taskName, fileLabel, onConfirm }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-red-50">
            <AlertTriangle className="size-5 text-red-600" />
          </div>
          <DialogTitle className="text-center">Delete this file?</DialogTitle>
          <DialogDescription className="text-center">
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">{fileLabel}</span>
            {taskName ? ` from "${taskName}"` : ""}? This can&rsquo;t be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 flex justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="bg-red-600 text-white hover:bg-red-700"
            onClick={onConfirm}
          >
            Delete File
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── File Preview Dialog ────────────────────────────────────────────────────────
// Lets the client click an uploaded file chip and see what they actually
// submitted. Sized up (max-w-4xl / taller viewer) so images and PDFs are
// easier to actually read instead of feeling cramped.

function FilePreviewDialog({ open, onOpenChange, files = [], taskName }) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const selectedFile = files[selectedIndex] ?? files[0] ?? null

  const objectUrl = useMemo(() => {
    if (!selectedFile || selectedFile.downloadUrl) return null
    return URL.createObjectURL(selectedFile)
  }, [selectedFile])

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [objectUrl])

  if (!selectedFile) return null

  const fileType = selectedFile.mimeType ?? selectedFile.type
  const fileUrl = selectedFile.downloadUrl ?? objectUrl
  const isImage = fileType?.startsWith("image/")
  const isPdf = fileType === "application/pdf"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
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

        <div className="flex max-h-[80vh] min-h-[320px] items-center justify-center overflow-auto rounded-lg border border-border bg-muted/30">
          {isImage && fileUrl ? (
            <img
              src={fileUrl}
              alt={selectedFile.name}
              className="max-h-[80vh] w-auto max-w-full object-contain"
            />
          ) : isPdf && fileUrl ? (
            <iframe
              src={fileUrl}
              title={selectedFile.name}
              className="h-[80vh] w-full rounded-lg"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <FileText className="size-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                No inline preview available for this file type.
              </p>
              {fileUrl && (
                <a
                  href={fileUrl}
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
//      replace icon + a delete (X) icon that asks for confirmation first.

function TaskRow({
  task,
  pendingFiles,
  uploadedFiles,
  onOpenDetail,
  onOpenUpload,
  onConfirmUpload,
  onDiscardUpload,
  onPreviewUploaded,
  onRequestDelete,
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
      {/* Requirement Name */}
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
      <td className="w-[250px] py-2.5 pr-6">
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
            <button
              type="button"
              title="Delete file"
              onClick={onRequestDelete}
              className="inline-flex size-6 shrink-0 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-600 transition-colors hover:bg-red-100"
            >
              <X className="size-3.5" />
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

export function TaskList({ engagement, documents = [], className, onUploadFiles, onDeleteFile }) {
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerTask, setPickerTask] = useState(null)
  const [pendingByTask, setPendingByTask] = useState({}) // taskId -> File[] (picked, not yet confirmed)
  const [uploadedByTask, setUploadedByTask] = useState({}) // taskId -> File[] (confirmed/uploaded)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewTask, setPreviewTask] = useState(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteTask, setDeleteTask] = useState(null)
  const [uploadError, setUploadError] = useState("")
  const tasks = engagement?.tasks ?? []
  const persistedFilesByTask = useMemo(() => documents.reduce((filesByTask, document) => {
    const files = filesByTask[document.engagementTaskId] ?? []
    filesByTask[document.engagementTaskId] = [...files, document]
    return filesByTask
  }, {}), [documents])

  const handleOpenDetail = (task) => {
    setSelectedTask(task)
    setDetailOpen(true)
  }

  const handleOpenUpload = (task) => {
    setPickerTask(task)
    setPickerOpen(true)
  }

  const handleFilesChosen = (task, files) => {
    setPendingByTask((prev) => ({ ...prev, [task.id]: files }))
  }

  const handleConfirmUpload = async (task) => {
    const files = pendingByTask[task.id]
    if (!files || files.length === 0) return

    setUploadError("")
    try {
      const uploadedFiles = await onUploadFiles?.(task, files)

      setUploadedByTask((prev) => ({ ...prev, [task.id]: uploadedFiles ?? files }))
      setPendingByTask((prev) => {
        const next = { ...prev }
        delete next[task.id]
        return next
      })
    } catch (error) {
      setUploadError(error.message || "File upload failed")
    }
  }

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

  // X on an already-uploaded file — ask for confirmation first, don't
  // remove anything until the user confirms in the dialog.
  const handleRequestDelete = (task) => {
    setDeleteTask(task)
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deleteTask) return

    const files = uploadedByTask[deleteTask.id] ?? persistedFilesByTask[deleteTask.id] ?? []
    setUploadError("")
    try {
      await onDeleteFile?.(deleteTask, files)

      setUploadedByTask((prev) => {
        const next = { ...prev }
        delete next[deleteTask.id]
        return next
      })

      setDeleteConfirmOpen(false)
      setDeleteTask(null)
    } catch (error) {
      setUploadError(error.message || "File deletion failed")
    }
  }

  const requiredCount = tasks.filter((t) => t.required).length
  const completedCount = tasks.filter((t) => t.status === "approved").length

  const deleteFileLabel =
    deleteTask && (uploadedByTask[deleteTask.id] ?? persistedFilesByTask[deleteTask.id])
      ? (uploadedByTask[deleteTask.id] ?? persistedFilesByTask[deleteTask.id]).length === 1
        ? (uploadedByTask[deleteTask.id] ?? persistedFilesByTask[deleteTask.id])[0].name
        : `${(uploadedByTask[deleteTask.id] ?? persistedFilesByTask[deleteTask.id]).length} files`
      : "this file"

  return (
    <div className={cn("min-w-0 rounded-xl border border-border bg-card shadow-sm", className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-3.5">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Requirements</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {completedCount} of {tasks.length} completed
            {requiredCount > 0 && ` · ${requiredCount} required`}
          </p>
        </div>
      </div>

      {uploadError && (
        <p className="border-b border-red-200 bg-red-50 px-6 py-2.5 text-sm text-red-700">
          {uploadError}
        </p>
      )}

      {/* Table */}
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
          <div className="flex size-8 items-center justify-center rounded-full bg-muted">
            <Inbox className="size-4 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">No requirements available</p>
          <p className="text-xs text-muted-foreground/70">
            There are currently no requirements assigned to this engagement.
          </p>
        </div>
      ) : (
        <div className="min-w-0 overflow-x-auto">
          <table className="w-full min-w-[650px] table-fixed">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-6 py-2.5 text-xs font-medium text-muted-foreground">Requirement</th>
                <th className="w-[120px] px-4 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
                <th className="w-[140px] px-4 py-2.5 text-xs font-medium text-muted-foreground">Deadline</th>
                <th className="w-[250px] px-4 py-2.5 text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  pendingFiles={pendingByTask[task.id]}
                  uploadedFiles={uploadedByTask[task.id] ?? persistedFilesByTask[task.id]}
                  onOpenDetail={() => handleOpenDetail(task)}
                  onOpenUpload={() => handleOpenUpload(task)}
                  onConfirmUpload={() => handleConfirmUpload(task)}
                  onDiscardUpload={() => handleDiscardUpload(task)}
                  onPreviewUploaded={() => handlePreviewUploaded(task)}
                  onRequestDelete={() => handleRequestDelete(task)}
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
        files={previewTask ? uploadedByTask[previewTask.id] ?? persistedFilesByTask[previewTask.id] ?? [] : []}
        taskName={previewTask?.name}
      />

      <DeleteFileConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        taskName={deleteTask?.name}
        fileLabel={deleteFileLabel}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}