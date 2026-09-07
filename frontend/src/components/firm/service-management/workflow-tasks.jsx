import { useRef, useState } from "react"
import { FileText, Plus, Upload, X } from "lucide-react"

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
import { createTaskId, formatBytes } from "./service-management-variants"

/**
 * Presentational single-file upload. Fully controlled via `file` +
 * `onSelect`/`onRemove`. No upload API — the raw File object is passed up so
 * a parent can handle it later (e.g. Supabase storage).
 */
export function ReferenceDocumentUpload({ file, onSelect, onRemove, disabled = false, error, className }) {
  const inputRef = useRef(null)

  const handleFiles = (fileList) => {
    const selected = fileList?.[0]
    if (!selected) return
    onSelect?.({ name: selected.name, size: selected.size, type: selected.type, file: selected })
  }

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        disabled={disabled}
        onChange={(event) => {
          handleFiles(event.target.files)
          event.target.value = "" // allow re-selecting the same file later
        }}
      />

      {!file ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="gap-1.5 border-dashed"
        >
          <Upload className="size-3.5" />
          Upload reference document
        </Button>
      ) : (
        <div className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-forest-900/10 text-forest-900 dark:bg-emerald-500/10 dark:text-emerald-300">
            <FileText className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
            {file.size != null && (
              <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled={disabled}
            onClick={onRemove}
            aria-label="Remove file"
            className="rounded-md text-muted-foreground hover:text-destructive"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      )}

      {error && <p className="mt-1 text-sm text-red-500">Upload a reference document.</p>}
    </div>
  )
}

/** Presentational row for a single workflow task. Fully controlled. */
export function WorkflowTaskItem({ task, onTaskChange, onRemove, disabled = false, error }) {
  const [removeOpen, setRemoveOpen] = useState(false)

  return (
    <>
      <div data-slot="workflow-task-item" className="rounded-lg border border-border bg-background p-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <Input
            value={task.name}
            onChange={(event) => onTaskChange({ name: event.target.value })}
            placeholder="Task name, e.g. Submit Valid Government-issued ID"
            disabled={disabled}
            aria-invalid={error?.name || undefined}
            className={cn(error?.name && "border-red-500 focus-visible:ring-red-500")}
          />
          {error?.name && <p className="mt-1 text-sm text-red-500">Task name is required.</p>}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={disabled}
          onClick={() => setRemoveOpen(true)}
          aria-label="Remove task"
          className="rounded-lg text-muted-foreground hover:text-destructive"
        >
          <X className="size-4" />
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-3">
        <Switch
          label="Required"
          checked={Boolean(task.required)}
          onChange={(value) => onTaskChange({ required: value })}
          disabled={disabled}
        />
        <Switch
          label="Reference document"
          checked={Boolean(task.hasReferenceDocument)}
          onChange={(value) =>
            onTaskChange({
              hasReferenceDocument: value,
              referenceDocument: value ? task.referenceDocument : null,
            })
          }
          disabled={disabled}
        />
      </div>

      {task.hasReferenceDocument && (
        <div className="mt-3">
          <ReferenceDocumentUpload
            file={task.referenceDocument}
            onSelect={(file) => onTaskChange({ referenceDocument: file })}
            onRemove={() => onTaskChange({ referenceDocument: null })}
            disabled={disabled}
            error={error?.reference}
          />
        </div>
      )}
      </div>
      <Dialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Workflow Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this workflow task?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setRemoveOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                onRemove?.()
                setRemoveOpen(false)
              }}
            >
              Remove Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

/** Presentational list of workflow tasks with add/remove/edit row handling. */
export function WorkflowTaskList({ tasks = [], onChange, disabled = false, errors = [], className }) {
  const updateTask = (id, patch) =>
    onChange?.(tasks.map((task) => (task.id === id ? { ...task, ...patch } : task)))
  const removeTask = (id) => onChange?.(tasks.filter((task) => task.id !== id))
  const addTask = () =>
    onChange?.([
      ...tasks,
      { id: createTaskId(), name: "", required: false, hasReferenceDocument: false, referenceDocument: null },
    ])

  return (
    <div data-slot="workflow-task-list" className={cn("flex flex-col gap-3", className)}>
      {tasks.length === 0 && (
        <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            No workflow tasks yet. Add tasks to collect documents or steps from clients.
          </p>
        </div>
      )}

      {tasks.map((task, index) => (
        <WorkflowTaskItem
          key={task.id}
          task={task}
          error={errors?.[index]}
          onTaskChange={(patch) => updateTask(task.id, patch)}
          onRemove={() => removeTask(task.id)}
          disabled={disabled}
        />
      ))}

      <div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={addTask}
          className="gap-1.5"
        >
          <Plus className="size-3.5" />
          Add task
        </Button>
      </div>
    </div>
  )
}
