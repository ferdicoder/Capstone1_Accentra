import { z } from "zod"
import { SERVICE_CATEGORIES } from "@/lib/service-categories"

const requiredText = (message) => z.string().trim().min(1, message)

export const serviceRequestSchema = z.object({
  category: requiredText("Please select a service category.").refine(
    (value) => SERVICE_CATEGORIES.includes(value),
    "Please select a service category."
  ),
})

export const rejectionRemarksSchema = z.object({
  remarks: requiredText("Please enter a reason for rejection.").max(
    1000,
    "Remarks must be 1000 characters or fewer."
  ),
})

export const optionalNoteSchema = z.object({
  content: z.string().max(1000, "Note must be 1000 characters or fewer."),
})
