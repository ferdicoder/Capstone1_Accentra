import { z } from "zod"

const requiredText = (message) => z.string().trim().min(1, message)

export const paymentInformationSchema = z
  .object({
    paymentOption: z.enum(["bank_transfer", "gcash", ""], {
      error: "Select a payment option.",
    }),
    accountName: z.string(),
    accountNumber: z.string(),
  })
  .superRefine((values, context) => {
    const anyValue = Object.values(values).some((value) => value.trim())
    if (anyValue && !values.paymentOption) {
      context.addIssue({ code: "custom", path: ["paymentOption"], message: "Select a payment option." })
    }
    if (anyValue && !values.accountName.trim()) {
      context.addIssue({ code: "custom", path: ["accountName"], message: "Account name is required." })
    }
    if (anyValue && !values.accountNumber.trim()) {
      context.addIssue({ code: "custom", path: ["accountNumber"], message: "Account number is required." })
    }
  })

export const clientPaymentProofSchema = z.object({
  paymentMethod: z.enum(["gcash", "bank_transfer"]),
  referenceId: requiredText("Enter your payment reference."),
  proofFile: z
    .custom((file) => typeof File !== "undefined" && file instanceof File, "Upload your proof of payment.")
    .refine(
      (file) => Boolean(file) && ["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type),
      "Upload a JPG, PNG, WEBP, or PDF file."
    )
    .refine((file) => Boolean(file) && file.size <= 5 * 1024 * 1024, "The file must be 5 MB or smaller."),
})

export const billingSchema = z.object({
  clientId: requiredText("Select a client."),
  invoiceType: z.enum(["service_fee", "retainer_fee"], {
    error: "Select an invoice type.",
  }),
  amount: z.number().finite().positive("Amount must be greater than zero."),
  dueDate: z.string().date("Enter a valid due date."),
  engagementIds: z.array(z.string()).optional(),
  billingMonth: z.number().int().min(1).max(12).optional(),
  billingYear: z.number().int().min(1).optional(),
})

export const rejectionRemarksSchema = z.object({
  remarks: requiredText("Please enter a reason for rejection.").max(
    1000,
    "Remarks must be 1000 characters or fewer."
  ),
})
  