import { useState } from "react"
import { ChevronDown, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
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
import { WorkflowTaskList } from "./workflow-tasks"
import {
  categoryFilterOptions,
  createDefaultWorkflowTasks,
  statusFilterOptions,
} from "./service-management-variants"

const textareaClass =
  "min-h-20 w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 dark:bg-input/30 dark:disabled:bg-input/80"

const sectionHeadingClass = "font-heading text-sm font-medium text-foreground"

// Shared by the Add and Edit dialogs. Owns all form state (including workflow
// tasks) and reports values through onSubmit. Layout mirrors the User
// Management dialog forms — flat fields, scrollable, footer inside the form.
export function ServiceTemplateForm({
  mode = "create",
  initialValues,
  onSubmit,
  submitting = false,
  onCancel,
  submitLabel = "Save Service",
  cancelLabel = "Cancel",
  error,
  className,
}) {
  const [name, setName] = useState(() => initialValues?.name ?? "")
  const [category, setCategory] = useState(
    () => initialValues?.category ?? categoryFilterOptions[0]?.value ?? ""
  )
  const [description, setDescription] = useState(() => initialValues?.description ?? "")
  const [basePrice, setBasePrice] = useState(() =>
    initialValues?.basePrice != null ? String(initialValues.basePrice) : ""
  )
  const [estimatedTime, setEstimatedTime] = useState(() => initialValues?.estimatedTime ?? "")
  const [status, setStatus] = useState(() => initialValues?.status ?? "inactive")
  const [tasks, setTasks] = useState(() => {
    if (initialValues?.workflowTasks?.length) return initialValues.workflowTasks
    return mode === "create" ? createDefaultWorkflowTasks() : []
  })
  const [errors, setErrors] = useState({})

  const activeCategory = categoryFilterOptions.find((option) => option.value === category)
  const activeStatus = statusFilterOptions.find((option) => option.value === status)
  const [isRecurring, setIsRecurring] = useState(() => initialValues?.isRecurring ?? false)

  // Clear stale task errors whenever the task list changes.
  const handleTasksChange = (nextTasks) => {
    setTasks(nextTasks)
    setErrors((prev) => (prev.tasks ? { ...prev, tasks: undefined } : prev))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const parsedPrice = Number(basePrice)
    const taskErrors = tasks.map((task) => ({
      name: !task.name.trim(),
      reference: Boolean(task.hasReferenceDocument) && !task.referenceDocument,
    }))

    const newErrors = {
      name: !name.trim(),
      category: !category,
      basePrice: !basePrice.trim() || !Number.isFinite(parsedPrice) || parsedPrice < 0,
      estimatedTime: !estimatedTime.trim(),
      tasks: taskErrors,
    }
    setErrors(newErrors)

    const invalid =
      newErrors.name ||
      newErrors.category ||
      newErrors.basePrice ||
      newErrors.estimatedTime ||
      taskErrors.some((taskError) => taskError.name || taskError.reference)
    if (invalid) return

    onSubmit?.({
      id: initialValues?.id,
      name: name.trim(),
      category,
      description: description.trim(),
      basePrice: parsedPrice,
      estimatedTime: estimatedTime.trim(),
      status,
      isRecurring,
      workflowTasks: tasks.map((task) => ({ ...task, name: task.name.trim() })),
    })
  }

  return (
    <form onSubmit={handleSubmit} className={cn("flex flex-1 flex-col gap-5 overflow-y-auto", className)}>
      {error && (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      )}

      <FieldGroup>
        <div className="flex flex-col gap-1">
          <h3 className={sectionHeadingClass}>Basic Information</h3>
          <p className="text-sm text-muted-foreground">
            Details clients see when browsing your service catalog.
          </p>
        </div>

        <Field>
          <FieldLabel htmlFor="service-name">
            Service Name<span className="text-red-500">*</span>
          </FieldLabel>
          <Input
            id="service-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Tax Filing - Non VAT"
            disabled={submitting}
            className={cn(errors.name && "border-red-500 focus-visible:ring-red-500")}
          />
          {errors.name && <p className="text-sm text-red-500">Service name is required.</p>}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>Category<span className="text-red-500">*</span></FieldLabel>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    disabled={submitting}
                    className={cn(
                      "h-8 w-full justify-between rounded-lg px-2.5 font-normal",
                      errors.category && "border-red-500 focus-visible:ring-red-500"
                    )}
                  />
                }
              >
                {activeCategory?.label ?? "Select category"}
                <ChevronDown className="size-4 opacity-60" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-40">
                {categoryFilterOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => setCategory(option.value)}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {errors.category && <p className="text-sm text-red-500">Select a category.</p>}
          </Field>

          <Field>
            <FieldLabel>Status<span className="text-red-500">*</span></FieldLabel>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    disabled={submitting}
                    className="h-8 w-full justify-between rounded-lg px-2.5 font-normal"
                  />
                }
              >
                {activeStatus?.label ?? "Select status"}
                <ChevronDown className="size-4 opacity-60" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-40">
                {statusFilterOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => setStatus(option.value)}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <FieldDescription>
              Inactive services are drafts and are not listed for clients.
            </FieldDescription>
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="service-description">Description</FieldLabel>
          <textarea
            id="service-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What does this service cover?"
            disabled={submitting}
            rows={3}
            className={textareaClass}
          />
          <FieldDescription>
            Shown to clients when they browse your service catalog.
          </FieldDescription>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="service-base-price">
              Base Price (₱)<span className="text-red-500">*</span>
            </FieldLabel>
            <Input
              id="service-base-price"
              type="number"
              min="0"
              step="0.01"
              value={basePrice}
              onChange={(event) => setBasePrice(event.target.value)}
              placeholder="2500"
              disabled={submitting}
              className={cn(
                errors.basePrice && "border-red-500 focus-visible:ring-red-500"
              )}
            />
            {errors.basePrice && (
              <p className="text-sm text-red-500">Enter a valid base price.</p>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="service-estimated-time">
              Estimated Time<span className="text-red-500">*</span>
            </FieldLabel>
            <Input
              id="service-estimated-time"
              value={estimatedTime}
              onChange={(event) => setEstimatedTime(event.target.value)}
              placeholder="3 business days"
              disabled={submitting}
              className={cn(
                errors.estimatedTime && "border-red-500 focus-visible:ring-red-500"
              )}
            />
            {errors.estimatedTime && (
              <p className="text-sm text-red-500">Estimated time is required.</p>
            )}
          </Field>
        </div>
      </FieldGroup>

      <div className="flex flex-col gap-1">
        <h3 className={sectionHeadingClass}>Workflow Tasks</h3>
        <p className="text-sm text-muted-foreground">
          Define the documents and steps a client must complete for this service.
          Toggle a reference document to attach a template or guide.
        </p>
      </div>

      <WorkflowTaskList
        tasks={tasks}
        onChange={handleTasksChange}
        disabled={submitting}
        errors={errors.tasks}
      />

      <DialogFooter className="flex-row justify-end gap-2">
        <Button type="button" variant="outline" disabled={submitting} onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button type="submit" disabled={submitting} className="bg-forest-900 text-white hover:opacity-90">
          {submitting && <Loader2 className="size-4 animate-spin" />}
          {submitting ? "Saving…" : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  )
}

/**
 * Floating "Add Service" dialog. The dialog content unmounts when closed, so
 * the form state resets on every open. Fully controlled via props.
 */
export function ServiceCreateDialog({
  open = false,
  onOpenChange,
  onSubmit,
  submitting = false,
  error,
  title = "Add Service",
  description = "Create a new service template for your firm.",
  submitLabel = "Add Service",
  cancelLabel = "Cancel",
  className,
  ...props
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} {...props}>
      <DialogContent data-slot="service-create-dialog" className={className}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <ServiceTemplateForm
          mode="create"
          onSubmit={onSubmit}
          submitting={submitting}
          error={error}
          onCancel={() => onOpenChange?.(false)}
          submitLabel={submitLabel}
          cancelLabel={cancelLabel}
        />
      </DialogContent>
    </Dialog>
  )
}

/**
 * Floating "Edit Service" dialog, pre-filled from `service`. Mirrors the
 * create dialog so both share the exact same layout.
 */
export function ServiceEditDialog({
  open = false,
  onOpenChange,
  onSubmit,
  service,
  submitting = false,
  error,
  title = "Edit Service",
  description = "Update the service template details.",
  submitLabel = "Save Changes",
  cancelLabel = "Cancel",
  className,
  ...props
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} {...props}>
      <DialogContent data-slot="service-edit-dialog" className={className}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <ServiceTemplateForm
          mode="edit"
          initialValues={service}
          onSubmit={onSubmit}
          submitting={submitting}
          error={error}
          onCancel={() => onOpenChange?.(false)}
          submitLabel={submitLabel}
          cancelLabel={cancelLabel}
        />
      </DialogContent>
    </Dialog>
  )
}
