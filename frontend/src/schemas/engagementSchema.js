import { z } from "zod"

const requiredText = (message) => z.string().trim().min(1, message)

export const engagementSchema = z.object({
  serviceName: requiredText("Select a service."),
  assignedStaff: requiredText("Assign a staff member."),
  startDate: z.string().date("Enter a valid start date."),
  targetEndDate: z.string().date("Enter a valid target end date."),
  standaloneClient: z.string().optional(),
})

export const taxComputationSetupSchema = z
  .object({
    filingPeriod: requiredText("Filing period is required."),
    isVat: z.boolean(),
    vatFilingPeriod: z.string(),
    taxTreatment: z.string(),
    assignedStaff: requiredText("Select assigned staff."),
    internalNotes: z.string(),
  })
  .superRefine((values, context) => {
    const selection = values.isVat ? values.vatFilingPeriod : values.taxTreatment
    if (!selection) {
      context.addIssue({
        code: "custom",
        path: [values.isVat ? "vatFilingPeriod" : "taxTreatment"],
        message: values.isVat ? "Select a VAT filing period." : "Select the applicable tax treatment.",
      })
    }
  })

export const engagementTaskSchema = z.object({
  name: requiredText("Task name is required."),
  deadline: z.union([z.literal(""), z.string().date("Enter a valid task deadline.")]),
})

export const revisionRemarkSchema = z.object({
  remark: requiredText("Enter a revision remark."),
})

export const serviceTemplateSchema = z.object({
  name: requiredText("Service name is required."),
  category: requiredText("Select a category."),
  basePrice: z.number().finite().min(0, "Enter a valid base price."),
  estimatedTime: z.number().int().min(0, "Enter a valid estimated time."),
  tasks: z.array(z.object({ name: requiredText("Task name is required.") })),
})

export const categoryNameSchema = z.object({
  name: requiredText("Category name is required."),
})

export const activityUpdateSchema = z.object({
  title: requiredText("Title is required.").max(100, "Title must be 100 characters or fewer."),
  description: requiredText("Description is required.").max(
    500,
    "Description must be 500 characters or fewer."
  ),
})

export const noteSchema = z.object({
  content: requiredText("Note is required.").max(
    1000,
    "Note must be 1000 characters or fewer."
  ),
})

export const filingSchema = z.object({
  filingDate: z.string().date("Enter a valid filing date."),
  filingNotes: z.string(),
})

export const milestoneSchema = z
  .object({
    status: z.enum(["pending", "in_progress", "completed", "skipped"]),
    completionDate: z.union([z.literal(""), z.string().date("Enter a valid completion date.")]),
  })
  .superRefine((values, context) => {
    if (values.status === "completed" && !values.completionDate) {
      context.addIssue({
        code: "custom",
        path: ["completionDate"],
        message: "Completion date is required.",
      })
    }
  })
