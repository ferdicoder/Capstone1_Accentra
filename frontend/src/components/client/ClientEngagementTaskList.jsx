import { useState } from "react"
import { Clock, FileCheck, Inbox, Upload, UploadCloud } from "lucide-react"

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

// ── Upload Files Dialog ────────────────────────────────────────────────────────
// Lets the client attach the file(s) a task needs directly from the action
// table, instead of having to leave the Overview tab to find the right row
// in Documents.

function TaskUploadDialog({ open, onOpenChange, task, onUpload }) {
  const [files, setFiles] = useState([])

  const handleChange = (e) => {
    setFiles(Array.from(e.target.files ?? []))
  }

  const handleClose = (next) => {
    if (!next) setFiles([])
    onOpenChange(next)
  }

  const handleSubmit = () => {
    if (files.length === 0) return
    onUpload?.(task, files)
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
            Attach the file(s) needed for &ldquo;{task.name}&rdquo;. They&rsquo;ll appear in the
            Documents tab once uploaded.
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
            onClick={handleSubmit}
          >
            Upload
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Task Row ────────────────────────────────────────────────────────────────────

function TaskRow({ task, onOpenDetail, onOpenUpload }) {
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
      <td className="w-[140px] py-2.5 pr-6">
        <button
          type="button"
          onClick={onOpenUpload}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#02353C]/20 bg-[#02353C]/5 px-2.5 py-1 text-xs font-medium text-[#02353C] transition-colors hover:bg-[#02353C]/10"
        >
          <Upload className="size-3.5" />
          Upload Files
        </button>
      </td>
    </tr>
  )
}

// ── Main ClientEngagementTaskList Component ────────────────────────────────────

export function TaskList({ engagement, className, onUploadFiles }) {
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadTask, setUploadTask] = useState(null)
  const [tasks] = useState(() => generateMockTasks(engagement))

  const handleOpenDetail = (task) => {
    setSelectedTask(task)
    setDetailOpen(true)
  }

  const handleOpenUpload = (task) => {
    setUploadTask(task)
    setUploadOpen(true)
  }

  const handleUpload = (task, files) => {
    onUploadFiles?.(task, files)
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
                <th className="w-[140px] px-4 py-2.5 text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onOpenDetail={() => handleOpenDetail(task)}
                  onOpenUpload={() => handleOpenUpload(task)}
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

      <TaskUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        task={uploadTask}
        onUpload={handleUpload}
      />
    </div>
  )
}