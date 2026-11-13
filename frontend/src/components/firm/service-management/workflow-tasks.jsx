import { useEffect, useRef, useState } from "react"
import { Plus, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  FileDropzone,
  FilePreviewDialog,
  SelectedFileList,
} from "@/components/shared/file-preview-dialog"
import {
  createTaskId,
  getInvalidFileTypeMessage,
  REFERENCE_DOCUMENT_ACCEPT,
  REFERENCE_DOCUMENT_MIME_TYPES,
} from "./service-management-variants"

const ATTACHMENT_SKELETON_DELAY_MS = 500

/**
 * Presentational single-file upload. Fully controlled via `file` +
 * `onSelect`/`onRemove`. No upload API — the raw File object is passed up so
 * a parent can handle it later (e.g. Supabase storage).
 *
 * The picker box, the chosen-file row and the preview popup are the shared
 * components from file-preview-dialog.jsx, so this looks the same as every
 * other upload in the app.
 *
 * A file outside the supported types is rejected by the dropzone, so it never
 * reaches the form state and is never included in an upload.
 */
export function ReferenceDocumentUpload({
  file,
  onSelect,
  onRemove,
  disabled = false,
  uploading = false,
  error,
  className,
}) {
  const attachmentTimerRef = useRef(null)
  const [pendingFile, setPendingFile] = useState(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  useEffect(
    () => () => {
      if (attachmentTimerRef.current) {
        clearTimeout(attachmentTimerRef.current)
      }
    },
    []
  )

  const handleFiles = ([selected]) => {
    if (!selected) return

    const selectedFile = {
      name: selected.name,
      size: selected.size,
      type: selected.type,
      file: selected,
    }
    setPendingFile(selectedFile)
    attachmentTimerRef.current = setTimeout(() => {
      onSelect?.(selectedFile)
      setPendingFile(null)
      attachmentTimerRef.current = null
    }, ATTACHMENT_SKELETON_DELAY_MS)
  }

  const handleRemove = () => {
    if (attachmentTimerRef.current) {
      clearTimeout(attachmentTimerRef.current)
      attachmentTimerRef.current = null
    }
    setPendingFile(null)
    onRemove?.()
  }

  return (
    <div className={className}>
      {pendingFile || (uploading && file) ? (
        <div
          role="status"
          aria-label={
            pendingFile
              ? `Attaching ${pendingFile.name}`
              : `Uploading ${file.name}`
          }
          className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2"
        >
          <Skeleton className="size-8 shrink-0 rounded-md" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="size-7 shrink-0 rounded-md" />
        </div>
      ) : !file ? (
        <FileDropzone
          accept={REFERENCE_DOCUMENT_ACCEPT}
          allowedTypes={REFERENCE_DOCUMENT_MIME_TYPES}
          typeLabel="a supported document"
          title="Click to upload reference document"
          disabled={disabled}
          onSelect={handleFiles}
        />
      ) : (
        <SelectedFileList
          files={[file]}
          disabled={disabled}
          onRemove={handleRemove}
          onPreview={() => setPreviewOpen(true)}
        />
      )}

      {error && <p className="mt-1 text-sm text-red-500">Upload a reference document.</p>}

      <FilePreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        files={file ? [file] : []}
        subtitle="Reference document"
        allowDownload={false}
      />
    </div>
  )
}

/** Presentational row for a single engagement task. Fully controlled. */
export function WorkflowTaskItem({
  task,
  onTaskChange,
  onRemove,
  disabled = false,
  uploading = false,
  error,
}) {
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
            data-invalid-field={error?.name ? "true" : undefined}
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
            uploading={uploading}
            error={error?.reference}
          />
        </div>
      )}
      </div>
      <Dialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Engagement Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this engagement task?
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
export function WorkflowTaskList({
  tasks = [],
  onChange,
  disabled = false,
  uploadingTaskIndexes = [],
  errors = [],
  className,
}) {
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
            No engagement tasks yet. Add tasks to collect documents or steps from clients.
          </p>
        </div>
      )}

      {tasks.map((task, index) => (
        <WorkflowTaskItem
          key={task.id}
          task={task}
          error={errors?.[index]}
          uploading={uploadingTaskIndexes.includes(index)}
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