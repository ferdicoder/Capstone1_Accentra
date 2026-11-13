import { z } from "zod"

const requiredText = (message) => z.string().trim().min(1, message)
const optionalText = z.string()
const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .email("Enter a valid email address.")
const phoneSchema = z.string().regex(/^\+?[0-9\s-]{10,14}$/, "Enter a valid contact number.")

export const firmUserCreateSchema = z.object({
  firstName: requiredText("First name is required."),
  middleName: optionalText,
  lastName: requiredText("Last name is required."),
  extension: optionalText,
  email: emailSchema,
  contactNumber: phoneSchema,
  birthdate: optionalText,
  temporaryPassword: z.string().min(8, "Password must be at least 8 characters."),
  role: requiredText("Select a role."),
})

export const firmUserEditSchema = z.object({
  firstName: requiredText("First name is required."),
  middleName: optionalText,
  lastName: requiredText("Last name is required."),
  extension: optionalText,
  email: emailSchema,
  contactNumber: phoneSchema,
  role: requiredText("Select a role."),
})

export const protectedFirmUserEditSchema = z.object({
  role: requiredText("Select a role."),
})

export const clientEditSchema = z.object({
  clientType: requiredText("Select a client type."),
  firstName: requiredText("First name is required."),
  middleName: optionalText,
  lastName: requiredText("Last name is required."),
  email: emailSchema,
  contactNo: z
    .string()
    .refine((value) => !value.trim() || /^\+?[0-9\s-]{10,14}$/.test(value), "Enter a valid contact number."),
  businessName: requiredText("Business name is required."),
  businessType: optionalText,
  industry: optionalText,
  tinNo: optionalText,
  address: optionalText,
})
