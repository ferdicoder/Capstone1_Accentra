import { useState, useEffect } from "react"
import { Clock, MoreHorizontal, Inbox, Check, X, MessageSquareWarning } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ReferenceDocumentUpload } from "@/components/firm/service-management/workflow-tasks"
import { formatDate } from "./engagement-variants"

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
  for_revision: {
    label: "For Revision",
    dotColor: "bg-orange-500",
    className: "bg-orange-500/10 text-orange-700 ring-orange-500/25",
  },
  missing: {
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

// ── Derive display tasks from the engagement's real task list ─────────────────
// engagement.tasks comes from engagementAPI's mapEngagementRow, already carrying
// the server-computed status/remark — no client-side derivation needed anymore.

function deriveTasks(engagement) {
  return (engagement?.tasks ?? []).map((task) => ({
    id: task.id,
    name: task.name,
    required: task.required,
    hasReferenceDocument: task.hasReferenceDocument,
    completed: task.completed,
    status: task.status,
    remark: task.remark,
    referenceDocumentFile: null,
    deadline: engagement?.targetEndDate ?? "",
    _persisted: true,
  }))
}

function createTaskId() {
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function createEmptyTaskForm() {
  return {
    name: "",
    required: false,
    referenceDocument: false,
    referenceDocumentFile: null,
    deadline: "",
  }
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

function TaskForm({ mode, formData, setFormData, errors, onSubmit, onCancel }) {
  const updateField = (field, value) => setFormData((current) => ({ ...current, [field]: value }))

  return (
    <form onSubmit={onSubmit} className="flex min-h-0 flex-col gap-5 overflow-y-auto">
      <div className="flex flex-col gap-2">
        <label htmlFor="task-name" className="text-sm font-medium text-foreground">Task name</label>
        <Input
          id="task-name"
          value={formData.name}
          onChange={(event) => updateField("name", event.target.value)}
          placeholder="Task name"
          aria-invalid={errors.name || undefined}
          autoFocus
        />
        {errors.name && <p className="text-xs text-red-500">Task name is required.</p>}
      </div>

      <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
        <Switch label="Required?" checked={formData.required} onChange={(value) => updateField("required", value)} />
        <Switch
          label="Reference Document"
          checked={formData.referenceDocument}
          onChange={(value) => setFormData((current) => ({
            ...current,
            referenceDocument: value,
            referenceDocumentFile: value ? current.referenceDocumentFile : null,
          }))}
        />
      </div>

      {formData.referenceDocument && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-foreground">Reference Document</span>
          <ReferenceDocumentUpload
            file={formData.referenceDocumentFile}
            onSelect={(file) => updateField("referenceDocumentFile", file)}
            onRemove={() => updateField("referenceDocumentFile", null)}
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor="task-due-date" className="text-sm font-medium text-foreground">Due date</label>
        <Input
          id="task-due-date"
          type="date"
          value={formData.deadline}
          onChange={(event) => updateField("deadline", event.target.value)}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" className="bg-[#02353C] text-white hover:opacity-90">{mode === "edit" ? "Save Changes" : "Add Task"}</Button>
      </DialogFooter>
    </form>
  )
}

function TaskDialog({ open, mode, formData, setFormData, errors, onOpenChange, onSubmit }) {
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
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

// ── Request Revision Dialog ────────────────────────────────────────────────────

function RequestRevisionDialog({ open, onOpenChange, task, onSubmit }) {
  const [remark, setRemark] = useState("")

  useEffect(() => {
    if (open) setRemark("")
  }, [open, task?.id])

  if (!task) return null

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!remark.trim()) return
    onSubmit(remark.trim())
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request Revision</DialogTitle>
          <DialogDescription>
            Tell the client what needs to change for &ldquo;{task.name}&rdquo;.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="revision-remark" className="text-sm font-medium text-foreground">Remark</label>
            <textarea
              id="revision-remark"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              rows={4}
              autoFocus
              placeholder="e.g. The scanned copy is missing page 2."
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="bg-orange-600 text-white hover:bg-orange-700" disabled={!remark.trim()}>
              Send Back for Revision
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
          {task.status === "for_revision" && task.remark && (
            <div className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2.5 text-sm text-orange-800">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-orange-600">Revision remark</p>
              {task.remark}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Task Row ──────────────────────────────────────────────────────────────────

function TaskRow({ task, onEdit, onSendReminder, onDeadlineChange, onOpenDetail, onToggleComplete, onApprove, onRequestRevision }) {
  const isDocBacked = task.hasReferenceDocument
  const canReview = isDocBacked && (task.status === "for_review" || task.status === "for_revision")

  return (
    <tr className="border-b border-border last:border-b-0 transition-colors hover:bg-muted/30">
      {/* Complete toggle (docless only) + Task Name */}
      <td className="min-w-0 px-6 py-2.5 pr-4">
        <div className="flex items-center gap-2.5">
          {!isDocBacked && (
            <button
              type="button"
              role="checkbox"
              aria-checked={task.completed}
              title={task.completed ? "Mark incomplete" : "Mark complete"}
              onClick={() => onToggleComplete(task)}
              className={cn(
                "flex size-4 shrink-0 items-center justify-center rounded border transition-colors",
                task.completed
                  ? "border-[#02353C] bg-[#02353C] text-white"
                  : "border-input bg-transparent hover:border-[#02353C]/50"
              )}
            >
              {task.completed && <Check className="size-3" />}
            </button>
          )}
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
        </div>
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
      <td className="w-[100px] px-4 py-2.5 text-right">
        <div className="flex items-center justify-end gap-1">
          {canReview && (
            <>
              <button
                type="button"
                title="Approve"
                onClick={() => onApprove(task)}
                className="inline-flex size-7 shrink-0 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-100"
              >
                <Check className="size-4" />
              </button>
              <button
                type="button"
                title="Request Revision"
                onClick={() => onRequestRevision(task)}
                className="inline-flex size-7 shrink-0 items-center justify-center rounded-md border border-orange-200 bg-orange-50 text-orange-700 transition-colors hover:bg-orange-100"
              >
                <MessageSquareWarning className="size-4" />
              </button>
            </>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon-sm" className="size-7 rounded-md" />
              }
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-40">
              <DropdownMenuItem onClick={onEdit}>Edit Task</DropdownMenuItem>
              <DropdownMenuItem onClick={onSendReminder}>Send Reminder</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </tr>
  )
}

// ── Main TaskList Component ───────────────────────────────────────────────────

export function TaskList({ engagement, className, onTaskClick, onDeadlineChange, onTaskComplete, onTaskReview }) {
  const [tasks, setTasks] = useState(() => deriveTasks(engagement))
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [taskDialogMode, setTaskDialogMode] = useState("add")
  const [taskFormData, setTaskFormData] = useState(createEmptyTaskForm)
  const [taskFormErrors, setTaskFormErrors] = useState({})
  const [reminderFeedback, setReminderFeedback] = useState("")
  const [revisionDialogOpen, setRevisionDialogOpen] = useState(false)
  const [revisionTask, setRevisionTask] = useState(null)

  useEffect(() => {
    setTasks((current) => {
      const serverTasks = deriveTasks(engagement)
      const localOnly = current.filter((task) => !task._persisted)
      return [...serverTasks, ...localOnly]
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engagement?.tasks])

  const openAddTask = () => {
    setTaskDialogMode("add")
    setTaskFormData(createEmptyTaskForm())
    setTaskFormErrors({})
    setTaskDialogOpen(true)
  }

  const openEditTask = (task) => {
    setTaskDialogMode("edit")
    setSelectedTask(task)
    setTaskFormData({
      name: task.name,
      required: task.required,
      referenceDocument: task.hasReferenceDocument,
      referenceDocumentFile: task.referenceDocumentFile,
      deadline: task.deadline,
    })
    setTaskFormErrors({})
    setTaskDialogOpen(true)
  }

  const handleTaskDialogChange = (open) => {
    setTaskDialogOpen(open)
    if (!open) {
      setTaskFormData(createEmptyTaskForm())
      setTaskFormErrors({})
      setSelectedTask(null)
    }
  }

  const handleTaskSubmit = (event) => {
    event.preventDefault()
    const name = taskFormData.name.trim()
    if (!name) {
      setTaskFormErrors({ name: true })
      return
    }

    // Still local-only — see the earlier note about wiring a createEngagementTask mutation.
    const nextTask = {
      name,
      required: taskFormData.required,
      hasReferenceDocument: taskFormData.referenceDocument,
      referenceDocumentFile: taskFormData.referenceDocumentFile,
      deadline: taskFormData.deadline,
      id: selectedTask?.id ?? createTaskId(),
      status: selectedTask?.status ?? "missing",
      completed: selectedTask?.completed ?? false,
      remark: selectedTask?.remark ?? null,
      _persisted: selectedTask?._persisted ?? false,
    }

    setTasks((current) => selectedTask
      ? current.map((task) => task.id === selectedTask.id ? { ...task, ...nextTask } : task)
      : [...current, nextTask])
    handleTaskDialogChange(false)
  }

  const handleDeadlineChange = (taskId, newDeadline) => {
    setTasks((current) => current.map((task) => task.id === taskId ? { ...task, deadline: newDeadline } : task))
    onDeadlineChange?.(taskId, newDeadline)
  }

  const handleToggleComplete = (task) => {
    if (!task._persisted) {
      setTasks((current) => current.map((t) => t.id === task.id ? { ...t, completed: !t.completed } : t))
      return
    }
    onTaskComplete?.(task.id, !task.completed)
  }

  const handleApprove = (task) => {
    if (!task._persisted) return
    onTaskReview?.(task.id, "approved", null)
  }

  const openRequestRevision = (task) => {
    setRevisionTask(task)
    setRevisionDialogOpen(true)
  }

  const handleSubmitRevision = (remark) => {
    if (revisionTask?._persisted) {
      onTaskReview?.(revisionTask.id, "for_revision", remark)
    }
    setRevisionDialogOpen(false)
    setRevisionTask(null)
  }

  const handleSendReminder = (task) => {
    setReminderFeedback(`Reminder sent to client for "${task.name}".`)
    window.setTimeout(() => setReminderFeedback(""), 3000)
  }

  const handleOpenDetail = (task) => {
    if (onTaskClick) {
      onTaskClick(task)
    } else {
      setSelectedTask(task)
      setDetailOpen(true)
    }
  }

  const requiredCount = tasks.filter((task) => task.required).length
  const completedCount = tasks.filter((task) => task.status === "approved").length

  return (
    <div className={cn("rounded-xl border border-border bg-card shadow-sm", className)}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-3.5">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Task List</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {completedCount} of {tasks.length} completed
            {requiredCount > 0 && ` · ${requiredCount} required`}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          className="h-8 rounded-lg bg-[#02353C] px-3 text-xs text-white hover:bg-[#02353C]/90"
          onClick={openAddTask}
        >
          Add Task
        </Button>
      </div>

      {reminderFeedback && (
        <p role="status" className="border-b border-border bg-emerald-500/10 px-6 py-2 text-xs text-emerald-700">
          {reminderFeedback}
        </p>
      )}

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
                <th className="w-[100px] px-4 py-2.5 text-xs font-medium text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onEdit={() => openEditTask(task)}
                  onSendReminder={() => handleSendReminder(task)}
                  onDeadlineChange={handleDeadlineChange}
                  onOpenDetail={() => handleOpenDetail(task)}
                  onToggleComplete={handleToggleComplete}
                  onApprove={handleApprove}
                  onRequestRevision={openRequestRevision}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <TaskDialog
        open={taskDialogOpen}
        mode={taskDialogMode}
        formData={taskFormData}
        setFormData={setTaskFormData}
        errors={taskFormErrors}
        onOpenChange={handleTaskDialogChange}
        onSubmit={handleTaskSubmit}
      />

      <TaskDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        task={selectedTask}
      />

      <RequestRevisionDialog
        open={revisionDialogOpen}
        onOpenChange={setRevisionDialogOpen}
        task={revisionTask}
        onSubmit={handleSubmitRevision}
      />
    </div>
  )
}