import { useState } from "react"
import { Clock, MoreHorizontal, Inbox, CircleDashed } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { formatDate } from "./engagement-variants"
import { engagementStore } from "./engagement-store"

// ── Status Helpers ────────────────────────────────────────────────────────────

// Map document statuses → task display statuses
const docToTaskStatus = {
  in_review: "for_review",
  submitted: "for_review",
  resubmitted: "for_review",
  approved: "approved",
  revision_requested: "for_review",
  rejected: "pending",
  pending: "pending",
}

// Map task statuses → document statuses (for writing back)
const taskToDocStatus = {
  approved: "approved",
  for_review: "in_review",
  pending: "pending",
  missing: "pending",
}

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
    label: "Pending",
    dotColor: "bg-red-500",
    className: "bg-red-500/10 text-red-600 ring-red-500/25",
  },
  pending: {
    label: "Pending",
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

// ── Derive tasks from engagement documents ────────────────────────────────────

function deriveTasksFromDocuments(engagement) {
  const docs = engagement?.documents ?? []
  if (docs.length === 0) return []

  return docs.map((doc, i) => ({
    id: doc.id,
    name: doc.name,
    required: true,
    status: docToTaskStatus[doc.status] ?? "pending",
    deadline: engagement.targetEndDate ?? "",
    // Keep original doc status for writing back
    _docStatus: doc.status,
  }))
}

// ── Deadline Display / Editor ─────────────────────────────────────────────────

function DeadlineCell({ deadline, onChange }) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <input
        type="date"
        defaultValue={deadline || ""}
        onChange={(e) => {
          onChange(e.target.value)
          setEditing(false)
        }}
        onBlur={() => setEditing(false)}
        autoFocus
        className="h-8 w-full cursor-pointer rounded-md border border-input bg-transparent px-2 text-xs text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={cn(
        "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors hover:bg-muted",
        deadline ? "text-foreground" : "text-muted-foreground italic"
      )}
    >
      <Clock className="size-3 shrink-0" />
      {deadline ? formatDate(deadline) : "No deadline"}
    </button>
  )
}

// ── Task Detail Dialog ────────────────────────────────────────────────────────

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

// ── Task Row ──────────────────────────────────────────────────────────────────

function TaskRow({ task, onStatusChange, onDeadlineChange, onOpenDetail }) {
  return (
    <tr className="border-b border-border last:border-b-0 transition-colors hover:bg-muted/30">
      {/* Task Name */}
      <td className="min-w-0 px-6 py-2.5 pr-4">
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
      <td className="w-[160px] px-5 py-2.5">
        <TaskStatusBadge status={task.status} />
      </td>

      {/* Deadline */}
      <td className="w-[180px] px-5 py-2.5">
        <DeadlineCell deadline={task.deadline} onChange={(val) => onDeadlineChange(task.id, val)} />
      </td>

      {/* Actions */}
      <td className="w-[72px] px-4 py-2.5 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon-sm" className="size-7 rounded-md ml-auto" />
            }
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-40">
            <DropdownMenuItem onClick={() => onStatusChange(task.id, "pending")}>
              <CircleDashed className="size-3.5" />
              Mark as Pending
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  )
}

// ── Main TaskList Component ───────────────────────────────────────────────────

export function TaskList({ engagement, className, onTaskClick, onDeadlineChange }) {
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [deadlineOverrides, setDeadlineOverrides] = useState({})

  const updateDocumentStatus = engagementStore((state) => state.updateDocumentStatus)
  const addReviewHistoryEntry = engagementStore((state) => state.addReviewHistoryEntry)

  const tasks = deriveTasksFromDocuments(engagement).map((t) =>
    deadlineOverrides[t.id] !== undefined ? { ...t, deadline: deadlineOverrides[t.id] } : t
  )

  const handleStatusChange = (taskId, newTaskStatus) => {
    // Map task status back to document status and update the store
    const newDocStatus = taskToDocStatus[newTaskStatus] ?? "pending"
    updateDocumentStatus(engagement.id, taskId, newDocStatus)

    // Add a review history entry for the status change
    const doc = (engagement.documents ?? []).find((d) => d.id === taskId)
    if (doc) {
      addReviewHistoryEntry(engagement.id, {
        id: `hist-${Date.now()}`,
        userName: "Firm Admin",
        action: newDocStatus,
        comment: `Status changed to ${newTaskStatus === "approved" ? "Approved" : newTaskStatus === "pending" ? "Pending" : "For Review"}.`,
        timestamp: new Date().toISOString(),
      })
    }
  }

  const handleDeadlineChange = (taskId, newDeadline) => {
    setDeadlineOverrides((prev) => ({ ...prev, [taskId]: newDeadline }))
    if (onDeadlineChange) onDeadlineChange(taskId, newDeadline)
  }

  const handleOpenDetail = (task) => {
    if (onTaskClick) {
      onTaskClick(task)
    } else {
      setSelectedTask(task)
      setDetailOpen(true)
    }
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
          <table className="w-full min-w-[560px]">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="min-w-0 px-6 py-2.5 text-xs font-medium text-muted-foreground">Task</th>
                <th className="w-[160px] px-5 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
                <th className="w-[180px] px-5 py-2.5 text-xs font-medium text-muted-foreground">Deadline</th>
                <th className="w-[72px] px-4 py-2.5 text-xs font-medium text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onStatusChange={handleStatusChange}
                  onDeadlineChange={handleDeadlineChange}
                  onOpenDetail={() => handleOpenDetail(task)}
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
    </div>
  )
}
