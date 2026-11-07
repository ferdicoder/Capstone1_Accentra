import { z } from "zod"
import { passwordRequirements } from "@/lib/passwordRequirements"

const requiredText = (message) => z.string().trim().min(1, message)
const personName = (message, requiredMessage) => {
  const schema = z
    .string()
    .trim()
    .refine(
      (value) => !value || (/^[\p{L}\p{M}\s.'’-]+$/u.test(value) && /\p{L}/u.test(value)),
      message
    )
  return requiredMessage ? schema.min(1, requiredMessage) : schema
}
const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .email("Enter a valid email address.")
const strongPassword = z
  .string()
  .min(1, "Please enter a new password.")
  .refine(
    (value) => passwordRequirements.every((requirement) => requirement.test(value)),
    "Your password doesn't meet the requirements below."
  )
const optionalPhoneSchema = z.string().refine((value) => {
  if (!value.trim()) return true
  const digits = value.replace(/\D/g, "")
  return /^\+?[0-9][0-9\s-]*$/.test(value) && digits.length >= 10 && digits.length <= 15
}, "Enter a valid contact number.")

export const passwordChangeSchema = z
  .object({
    currentPassword: requiredText("Please enter your current password."),
    newPassword: strongPassword,
    confirmPassword: requiredText("Please confirm your new password."),
  })
  .superRefine((values, context) => {
    if (values.newPassword === values.currentPassword) {
      context.addIssue({
        code: "custom",
        path: ["newPassword"],
        message: "This password has already been used. Try another.",
      })
    }
    if (values.confirmPassword && values.newPassword !== values.confirmPassword) {
      context.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match.",
      })
    }
  })

export const profilePersonalInfoSchema = z.object({
  firstName: personName("Use letters only for the first name.", "First name is required."),
  middleName: personName("Use letters only for the middle name."),
  lastName: personName("Use letters only for the last name.", "Last name is required."),
  contactNumber: optionalPhoneSchema,
})

export const clientBusinessProfileSchema = z.object({
  businessName: z.string(),
  businessType: z.string(),
  tin: z.string().refine((value) => {
    const digits = value.replace(/\D/g, "")
    return !digits || digits.length === 9 || digits.length === 12
  }, "Invalid TIN ID. Must be 9 or 12 digits."),
  industry: z.string(),
  contactNumber: z.string().refine((value) => {
    const digits = value.replace(/\D/g, "")
    return !digits || /^9\d{9}$/.test(digits)
  }, "Enter a valid mobile number."),
  houseNo: z.string(),
  streetName: z.string(),
  barangay: z.string(),
  district: z.string(),
  city: z.string(),
  zipCode: z.string().refine((value) => /^\d*$/.test(value), "ZIP code must contain digits only."),
})

// Mirrors the public.firm_settings singleton: about / terms default to ''
// in the table, so they are optional here; contact_email is NOT NULL.
export const firmSettingsSchema = z.object({
  firmName: requiredText("Firm name is required."),
  contactEmail: emailSchema,
  about: z.string(),
  termsAndConditions: z.string(),
})

export const adminPersonalInfoSchema = z.object({
  firstName: personName("Use letters only for the first name.", "First name is required."),
  lastName: personName("Use letters only for the last name.", "Last name is required."),
  workEmail: emailSchema,
  contactNumber: optionalPhoneSchema,
})
