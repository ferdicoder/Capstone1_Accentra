import { useState } from "react"
import { CheckCircle2, Clock, MoreHorizontal, Eye, Send, AlertCircle, Inbox } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { formatDate } from "./engagement-variants"
import { RequestUploadDialog } from "./RequestUploadDialog"

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

// ── Mock Task Data Generator ──────────────────────────────────────────────────

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

  const config = statusConfig[task.status] ?? statusConfig.missing

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
  const [requestOpen, setRequestOpen] = useState(false)

  return (
    <>
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

        {/* Deadline */}
        <td className="w-[140px] py-2.5 pr-4">
          <DeadlineCell deadline={task.deadline} onChange={onDeadlineChange} />
        </td>

        {/* Actions */}
        <td className="w-[48px] px-4 py-2.5 text-right">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon-sm" className="size-7 rounded-md ml-auto" />
              }
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-40">
              <DropdownMenuItem onClick={onOpenDetail}>
                <Eye className="size-3.5" />
                View Details
              </DropdownMenuItem>
              {task.status === "for_review" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onStatusChange("approved")}>
                    <CheckCircle2 className="size-3.5" />
                    Approve
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onStatusChange("missing")}>
                    <AlertCircle className="size-3.5" />
                    Request Revision
                  </DropdownMenuItem>
                </>
              )}
              {task.status === "missing" && (
                <DropdownMenuItem onClick={() => setRequestOpen(true)}>
                  <Send className="size-3.5" />
                  Request Upload
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </td>
      </tr>

      <RequestUploadDialog
        open={requestOpen}
        onOpenChange={setRequestOpen}
        taskName={task.name}
        onSubmit={() => setRequestOpen(false)}
      />
    </>
  )
}

// ── Main TaskList Component ───────────────────────────────────────────────────

export function TaskList({ engagement, className }) {
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [tasks, setTasks] = useState(() => generateMockTasks(engagement))

  const handleStatusChange = (taskId, newStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    )
  }

  const handleDeadlineChange = (taskId, newDeadline) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, deadline: newDeadline } : t))
    )
  }

  const handleOpenDetail = (task) => {
    setSelectedTask(task)
    setDetailOpen(true)
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
                <th className="w-[48px] px-4 py-2.5 text-xs font-medium text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onStatusChange={(status) => handleStatusChange(task.id, status)}
                  onDeadlineChange={(deadline) => handleDeadlineChange(task.id, deadline)}
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
