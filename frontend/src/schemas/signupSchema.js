import { z } from "zod";

const NAME_PATTERN = /^[A-Za-z\s'-]+$/;
const BUSINESS_TYPES = [
  "sole-proprietorship",
  "partnership",
  "corporation",
  "cooperative",
];

const requiredName = (label) =>
  z.string().trim().min(1, `${label} is required.`).regex(
    NAME_PATTERN,
    `${label} can only contain letters.`
  );

const optionalName = (label) =>
  z.string().refine(
    (value) => !value.trim() || NAME_PATTERN.test(value),
    `${label} can only contain letters.`
  );

const emailSchema = z.string().trim().min(1, "Email is required.").email("Enter a valid email address.");

export const firmRegistrationInfoSchema = z.object({
  businessName: z.string().trim().min(1, "Business name is required."),
  businessType: z.string().trim().min(1, "Select a business type."),
  tin: z.string().trim().min(1, "TIN number is required."),
  industry: z.string().trim().min(1, "Industry is required."),
  email: emailSchema,
  address: z.string().trim().min(1, "Address is required."),
});

export const passwordRequirements = [
  { key: "lowercase", label: "At least one lowercase letter", test: (value) => /[a-z]/.test(value) },
  { key: "uppercase", label: "At least one uppercase letter", test: (value) => /[A-Z]/.test(value) },
  { key: "number", label: "At least one number", test: (value) => /[0-9]/.test(value) },
  { key: "minLength", label: "Minimum 8 characters", test: (value) => value.length >= 8 },
];

export const accountSchema = z.object({
  firstName: requiredName("First name"),
  middleName: optionalName("Middle name"),
  lastName: requiredName("Last name"),
  extensionName: optionalName("Extension name"),
  birthMonth: z.string().min(1, "Please select your birth month."),
  birthDay: z.string().min(1, "Please select your birth day."),
  birthYear: z.string().min(1, "Please select your birth year."),
  email: z.string().trim().min(1, "Email address is required.").email(
    "Enter a valid email address, e.g. example@gmail.com."
  ),
  password: z.string().min(1, "Password is required.").refine(
    (value) => passwordRequirements.every((requirement) => requirement.test(value)),
    "Password doesn't meet the requirements below."
  ),
  confirmPassword: z.string().min(1, "Please confirm your password."),
}).superRefine((data, ctx) => {
  if (data.birthMonth && data.birthDay && data.birthYear) {
    const month = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ].indexOf(data.birthMonth);
    const year = Number(data.birthYear);
    const day = Number(data.birthDay);
    const date = new Date(year, month, day);
    const validDate =
      month >= 0 &&
      date.getFullYear() === year &&
      date.getMonth() === month &&
      date.getDate() === day;

    if (!validDate) {
      ctx.addIssue({
        code: "custom",
        path: ["birthDay"],
        message: "Please enter a valid birthdate.",
      });
    } else {
      const today = new Date();
      let age = today.getFullYear() - year;
      const birthdayHasPassed =
        today.getMonth() > month ||
        (today.getMonth() === month && today.getDate() >= day);
      if (!birthdayHasPassed) age -= 1;

      if (age < 18) {
        ctx.addIssue({
          code: "custom",
          path: ["birthYear"],
          message: "You must be at least 18 years old to register.",
        });
      }
    }
  }

  if (
    data.password &&
    data.confirmPassword &&
    data.password !== data.confirmPassword
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["confirmPassword"],
      message: "Passwords do not match.",
    });
  }
});

// Business details are collected only when the client confirms that the
// business is already BIR-registered. The combined "not yet" path (no
// business / not registered) bypasses this schema.
export const businessSchema = z.object({
  birRegistrationStatus: z.literal("registered", {
    error: "Please confirm that your business is BIR-registered.",
  }),
  businessName: z.string().trim().min(1, "Business name is required."),
  businessType: z.string().min(1, "Please select a business type.").refine(
    (value) => BUSINESS_TYPES.includes(value),
    "Select a valid business type."
  ),
  tin: z.string().min(1, "TIN number is required."),
  industry: z.string().min(1, "Please select an industry."),
  contactNumber: z.string().min(1, "Contact number is required.").regex(
    /^9\d{9}$/,
    "Enter 10 digits after +63."
  ),
  houseNo: z.string().trim().min(1, "House/building/unit number is required."),
  streetName: z.string().trim().min(1, "Street name is required."),
  barangay: z.string().trim().min(1, "Barangay is required."),
  district: z.string().trim().min(1, "District is required."),
  city: z.string().trim().min(1, "City/municipality is required."),
  zipCode: z.string().regex(/^\d{4,}$/, "ZIP code must contain at least 4 digits."),
}).superRefine((data, ctx) => {
  const expectedLength = data.businessType === "sole-proprietorship" ? 9 : 12;
  if (data.tin.length !== expectedLength) {
    ctx.addIssue({
      code: "custom",
      path: ["tin"],
      message: `TIN number must contain ${expectedLength} digits for the selected business type.`,
    });
  }
});
