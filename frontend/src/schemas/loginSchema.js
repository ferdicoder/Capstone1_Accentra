import { z } from "zod"

const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .email("Enter a valid email address.")

export const loginFormSchema = z.object({
  email: emailSchema,
  password: z.string().trim().min(1, "Password is required."),
})

export const emailRecoverySchema = z.object({ email: emailSchema })

export const phoneRecoverySchema = z.object({
  contact: z.string().regex(/^\d{11}$/, "Enter a valid mobile number."),
})

export const otpSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code."),
})

export const signupOtpSchema = z.object({
  code: z.string().regex(/^\d{8}$/, "Enter the 8-digit code."),
})

const passwordRequirements = [
  (value) => /[a-z]/.test(value),
  (value) => /[A-Z]/.test(value),
  (value) => /[0-9]/.test(value),
  (value) => value.length >= 8,
]
const strongPassword = z
  .string()
  .min(1, "Please enter a new password.")
  .refine(
    (value) => passwordRequirements.every((requirement) => requirement(value)),
    "Your password doesn't meet the requirements below."
  )

export const resetPasswordSchema = z
  .object({
    newPassword: strongPassword,
    confirmPassword: z.string().trim().min(1, "Please confirm your new password."),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  })
