import { z } from "zod"

const requiredText = (message) => z.string().trim().min(1, message)

export const serviceRequestSchema = z.object({
  serviceId: requiredText("Please select a service."),
  description: z.string(),
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
