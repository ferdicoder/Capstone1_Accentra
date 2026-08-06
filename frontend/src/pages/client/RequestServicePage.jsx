import { useRef, useState } from "react"
import { CheckCircle2, FileText, Send, Upload, X } from "lucide-react"

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/AppSidebar"
import { DashboardHeader } from "@/components/dashboard/DashboardHeader"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useNavigate } from "react-router-dom"

// import { createServiceRequest } from "@/services/requestService"

const currentUser = {
  name: "Maria Santos",
  email: "maria.santos@santosretail.com",
  avatar: "",
}

const SERVICE_TYPES = [
  { value: "itr_filing", label: "Annual ITR Filing" },
  { value: "quarterly_vat", label: "Quarterly VAT Return" },
  { value: "business_permit", label: "Business Permit Renewal" },
  { value: "bookkeeping", label: "Bookkeeping" },
  { value: "payroll", label: "Payroll Processing" },
  { value: "audit", label: "Financial Audit" },
  { value: "other", label: "Other" },
]

const PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
]

const MAX_FILE_SIZE_MB = 10
const ACCEPTED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]

const initialFormState = {
  serviceType: "",
  title: "",
  description: "",
  priority: "medium",
  preferredDeadline: "",
}

const controlClass = "h-10 w-full bg-background"
const selectClass = cn(
  controlClass,
  "rounded-lg border border-input px-3 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
)

function formatBytes(bytes) {
  if (!bytes) return "0 KB"
  const kb = bytes / 1024
  return kb < 1024 ? `${kb.toFixed(0)} KB` : `${(kb / 1024).toFixed(1)} MB`
}

function AttachmentUploader({ files, error, onAdd, onRemove }) {
  const inputRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFiles = (fileList) => {
    Array.from(fileList ?? []).forEach((file) => onAdd(file))
  }

  return (
    <Field>
      <FieldLabel htmlFor="attachments">Supporting Documents</FieldLabel>

      <input
        ref={inputRef}
        id="attachments"
        type="file"
        multiple
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files)
          e.target.value = ""
        }}
      />

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          handleFiles(e.dataTransfer.files)
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors",
          isDragging
            ? "border-emerald-500 bg-emerald-50"
            : "border-muted-foreground/25 hover:border-emerald-400 hover:bg-emerald-50/50",
          error && "border-red-500"
        )}
      >
        <div className="flex size-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <Upload className="size-5" />
        </div>
        <p className="text-sm font-medium">
          <span className="text-emerald-700">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-muted-foreground">
          PDF, DOCX, XLSX, PNG or JPG (max {MAX_FILE_SIZE_MB}MB each) — optional
        </p>
      </div>

      {files.length > 0 && (
        <ul className="flex flex-col gap-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center gap-3 rounded-xl border bg-background p-3"
            >
              {file.previewUrl ? (
                <img
                  src={file.previewUrl}
                  alt={file.name}
                  className="size-10 shrink-0 rounded-lg border object-cover"
                />
              ) : (
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <FileText className="size-4" />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
              </div>

              <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />

              <button
                type="button"
                onClick={() => onRemove(index)}
                className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </Field>
  )
}

export default function NewServiceRequestPage() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState(initialFormState)
  const [attachments, setAttachments] = useState([])
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState(null)

  const updateField = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  const setPriority = (value) => {
    setFormData((current) => ({ ...current, priority: value }))
  }

  const addAttachment = (file) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setErrors((prev) => ({ ...prev, attachments: "One or more files have an unsupported type." }))
      return
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, attachments: `Each file must be smaller than ${MAX_FILE_SIZE_MB}MB.` }))
      return
    }

    setErrors((prev) => ({ ...prev, attachments: undefined }))
    setAttachments((current) => [
      ...current,
      {
        name: file.name,
        size: file.size,
        type: file.type,
        previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
        file,
      },
    ])
  }

  const removeAttachment = (index) => {
    setAttachments((current) => current.filter((_, i) => i !== index))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const newErrors = {
      serviceType: !formData.serviceType ? "Please select a service type." : undefined,
      title: !formData.title ? "Please give your request a short title." : undefined,
      description: !formData.description ? "Please describe what you need." : undefined,
    }
    setErrors((prev) => ({ ...prev, ...newErrors }))
    if (newErrors.serviceType || newErrors.title || newErrors.description) return

    setIsSubmitting(true)
    setSubmitMessage(null)
    try {
      // await createServiceRequest({
      //   ...formData,
      //   attachments: attachments.map((a) => a.file),
      // })
      setSubmitMessage({ type: "success", text: "Your service request has been submitted." })
      setTimeout(() => navigate("/client/service-requests"), 1200)
    } catch (err) {
      console.error(err)
      setSubmitMessage({ type: "error", text: "Something went wrong. Please try again." })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar role="client" user={currentUser} />
      <SidebarInset>
        <DashboardHeader
          role="client"
          user={currentUser}
          breadcrumbs={[{ label: "Home", href: "/client/dashboard" }]}
          title="Request a Service"
          hasUnreadNotifications
          onNotificationsClick={() => {}}
        />

        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-6">
          <div>
            <h1 className="text-lg font-semibold leading-tight">Request a Service</h1>
            <p className="text-sm text-muted-foreground">
              Tell your firm what you need — they'll follow up to confirm scope and timeline.
            </p>
          </div>

          {submitMessage && (
            <div
              className={cn(
                "rounded-lg px-4 py-2.5 text-sm",
                submitMessage.type === "success"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              )}
            >
              {submitMessage.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
              <div className="rounded-xl border bg-background p-6">
                <h2 className="mb-5 text-sm font-semibold">Request Details</h2>
                <FieldGroup className="gap-5">
                  <Field>
                    <FieldLabel htmlFor="serviceType" className="gap-0">
                      Service Type<span className="text-red-500">*</span>
                    </FieldLabel>
                    <select
                      id="serviceType"
                      name="serviceType"
                      value={formData.serviceType}
                      onChange={updateField}
                      className={cn(selectClass, errors.serviceType && "border-red-500")}
                    >
                      <option value="">Select a service</option>
                      {SERVICE_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    {errors.serviceType && (
                      <p className="text-sm text-red-500">{errors.serviceType}</p>
                    )}
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="title" className="gap-0">
                      Request Title<span className="text-red-500">*</span>
                    </FieldLabel>
                    <Input
                      id="title"
                      name="title"
                      placeholder="e.g. Q1 2025 VAT Return Filing"
                      value={formData.title}
                      onChange={updateField}
                      className={cn(controlClass, errors.title && "border-red-500 focus-visible:ring-red-500")}
                    />
                    {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="description" className="gap-0">
                      Description<span className="text-red-500">*</span>
                    </FieldLabel>
                    <textarea
                      id="description"
                      name="description"
                      rows={5}
                      placeholder="Describe what you need help with, any relevant deadlines, and context your firm should know."
                      value={formData.description}
                      onChange={updateField}
                      className={cn(
                        "w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40",
                        errors.description && "border-red-500"
                      )}
                    />
                    <FieldDescription>
                      The more detail you give, the faster your firm can scope the work.
                    </FieldDescription>
                    {errors.description && (
                      <p className="text-sm text-red-500">{errors.description}</p>
                    )}
                  </Field>
                </FieldGroup>
              </div>

              <div className="rounded-xl border bg-background p-6">
                <h2 className="mb-5 text-sm font-semibold">Priority & Timeline</h2>
                <FieldGroup className="gap-5">
                  <Field>
                    <FieldLabel className="gap-0">Priority</FieldLabel>
                    <div className="grid grid-cols-3 gap-2">
                      {PRIORITIES.map((p) => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => setPriority(p.value)}
                          className={cn(
                            "rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
                            formData.priority === p.value
                              ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                              : "border-input text-muted-foreground hover:bg-muted"
                          )}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="preferredDeadline">
                      Preferred Deadline
                    </FieldLabel>
                    <Input
                      id="preferredDeadline"
                      name="preferredDeadline"
                      type="date"
                      value={formData.preferredDeadline}
                      onChange={updateField}
                      className={controlClass}
                    />
                    <FieldDescription>
                      Optional — leave blank if there's no hard deadline.
                    </FieldDescription>
                  </Field>

                  <AttachmentUploader
                    files={attachments}
                    error={errors.attachments}
                    onAdd={addAttachment}
                    onRemove={removeAttachment}
                  />
                </FieldGroup>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/client/service-requests")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <Send className="size-4" />
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </form>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}