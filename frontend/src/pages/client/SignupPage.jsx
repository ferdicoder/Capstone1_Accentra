import { AuthLayout } from "@/layout/auth-layout"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { Check, X } from "lucide-react"

import { registerClient } from "../../services/authService";
import { useNavigate } from "react-router-dom"


const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

// Most adult users signing up are recent-ish birth years, so listing from
// (this year - 18) downward means their year is near the top of the list
// instead of buried at the bottom.
const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from(
  { length: 83 }, // covers ages 18–100
  (_, i) => CURRENT_YEAR - 18 - i
)

const initialFormState = {
  firstName: "",
  lastName: "",
  middleName: "",
  extensionName: "",
  birthMonth: "",
  birthDay: "",
  birthYear: "",
  email: "",
  password: "",
  confirmPassword: "",
  businessName: "",
  businessType: "",
  tin: "",
  industry: "",
  contactNumber: "",
  houseNo: "",
  streetName: "",
  barangay: "",
  district: "",
  city: "",
  zipCode: "",
}

// --- Validation ----------------------------------------------------------

const NAME_PATTERN = /^[A-Za-z\s'-]+$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/

// Fields where disallowed characters are stripped as the user types,
// rather than only flagged after the fact.
const LETTERS_ONLY_FIELDS = new Set(["firstName", "middleName", "lastName", "extensionName"])
const DIGITS_ONLY_FIELDS = new Set(["tin", "contactNumber", "zipCode"])

// --- Password requirements (drives both live checklist + validation) -----

const passwordRequirements = [
  { key: "lowercase", label: "At least one lowercase letter", test: (pw) => /[a-z]/.test(pw) },
  { key: "uppercase", label: "At least one uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { key: "number", label: "At least one number", test: (pw) => /[0-9]/.test(pw) },
  { key: "minLength", label: "Minimum 8 characters", test: (pw) => pw.length >= 8 },
]

function isPasswordValid(password) {
  return passwordRequirements.every((req) => req.test(password))
}

function sanitizeValue(name, rawValue) {
  if (LETTERS_ONLY_FIELDS.has(name)) {
    const lettersOnly = rawValue.replace(/[^A-Za-z\s'-]/g, "")
    // Auto-capitalize the first letter of each word (e.g. "juan dela cruz"
    // -> "Juan Dela Cruz") as the user types.
    return lettersOnly.replace(/(^|[\s'-])([a-z])/g, (match, boundary, letter) =>
      boundary + letter.toUpperCase()
    )
  }
  if (DIGITS_ONLY_FIELDS.has(name)) {
    return rawValue.replace(/\D/g, "")
  }
  return rawValue
}

// Per-field format validation, used both for live feedback and for the
// full-step check run on Continue/Submit.
function validateField(name, value, formData) {
  switch (name) {
    case "firstName":
      if (!value.trim()) return "First name is required."
      if (!NAME_PATTERN.test(value)) return "First name can only contain letters."
      return ""

    case "middleName":
      if (value.trim() && !NAME_PATTERN.test(value)) {
        return "Middle name can only contain letters."
      }
      return ""

    case "lastName":
      if (!value.trim()) return "Last name is required."
      if (!NAME_PATTERN.test(value)) return "Last name can only contain letters."
      return ""

    case "extensionName":
      // Optional field — only validate format if something was entered.
      if (value.trim() && !NAME_PATTERN.test(value)) {
        return "Extension name can only contain letters."
      }
      return ""

    case "email":
      if (!value.trim()) return "Email address is required."
      if (!EMAIL_PATTERN.test(value)) {
        return "Enter a valid email address, e.g. example@gmail.com."
      }
      return ""

    case "password":
      if (!value) return "Password is required."
      if (!isPasswordValid(value)) return "Password doesn't meet the requirements below."
      return ""

    case "confirmPassword":
      if (!value) return "Please confirm your password."
      if (value !== formData.password) return "Passwords do not match."
      return ""

    case "tin":
      if (!value.trim()) return "TIN number is required."
      if (value.length !== 12) return "TIN number must be 12 digits."
      return ""

    case "contactNumber":
      if (!value.trim()) return "Contact number is required."
      return ""

    case "zipCode":
      if (!value.trim()) return "ZIP code is required."
      if (value.length < 4) return "ZIP code must be 4 digits."
      return ""

    default:
      return ""
  }
}

const STEP_ONE_FIELDS = ["firstName", "middleName", "lastName", "extensionName", "email", "password", "confirmPassword"]
const STEP_TWO_FIELDS = ["tin", "contactNumber", "zipCode"]

function getStepErrors(fieldNames, formData) {
  const errors = {}
  fieldNames.forEach((name) => {
    const message = validateField(name, formData[name], formData)
    if (message) errors[name] = message
  })
  return errors
}


export default function SignupPage() {
  const signupSteps = ["Account", "Info"]
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({})
  const navigate = useNavigate()


  const updateField = (event) => {
    const { name, value } = event.target
    const cleanValue = sanitizeValue(name, value)

    const nextFormData = { ...formData, [name]: cleanValue }
    setFormData(nextFormData)

    // Live-validate this field (and re-check confirmPassword if the user
    // goes back and edits password after already typing a confirmation).
    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, cleanValue, nextFormData),
      ...(name === "password" && prev.confirmPassword !== undefined
        ? {
            confirmPassword: validateField(
              "confirmPassword",
              nextFormData.confirmPassword,
              nextFormData
            ),
          }
        : {}),
    }))
  }

  const errorFor = (name) => errors[name] || ""

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (currentStep < 2) {
      const stepErrors = getStepErrors(STEP_ONE_FIELDS, formData)
      setErrors((prev) => ({ ...prev, ...stepErrors }))
      if (Object.keys(stepErrors).length > 0) return

      setCurrentStep((step) => step + 1)
      return
    }

    const stepErrors = getStepErrors(STEP_TWO_FIELDS, formData)
    setErrors((prev) => ({ ...prev, ...stepErrors }))
    if (Object.keys(stepErrors).length > 0) return

    try{
      // Combine the three birthdate dropdowns into a single ISO date
      // string (YYYY-MM-DD) for the backend, same shape the old native
      // date input used to send.
      const monthIndex = MONTHS.indexOf(formData.birthMonth) + 1
      const birthDate =
        formData.birthYear && monthIndex && formData.birthDay
          ? `${formData.birthYear}-${String(monthIndex).padStart(2, "0")}-${String(formData.birthDay).padStart(2, "0")}`
          : ""

      const newUser = await registerClient({
        ...formData,
        birthDate,
      });
      if(newUser.error) throw newUser.error;
      console.log("Registration submitted", formData);
      navigate('/client/signin');
    }catch(err){
      console.error(err);
    }

  }

  const handleBack = () => {
    setCurrentStep((step) => Math.max(1, step - 1))
  }

  return (
    <AuthLayout>
      <form className="flex flex-col gap-6" onSubmit={handleSubmit} noValidate>
        <div className="flex items-center justify-between gap-2">
          {signupSteps.map((step, index) => {
            const stepNumber = index + 1
            const isActive = currentStep === stepNumber
            const isComplete = currentStep > stepNumber

            return (
              <div key={step} className="flex flex-1 items-center justify-center">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex size-8 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
                      isActive || isComplete
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-background text-foreground"
                    )}
                  >
                    {stepNumber}
                  </span>
                  <h3
                    className={cn(
                      "text-xs font-bold transition-colors",
                      isActive || isComplete ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {step}
                  </h3>
                </div>
              </div>
            )
          })}
        </div>

        <FieldGroup>
          {currentStep === 1 && (
            <>
              <div className="flex flex-col items-center gap-1 text-center">
                <h1 className="text-2xl font-bold">Create your account</h1>
                <p className="text-sm text-balance text-muted-foreground">
                  Fill in the form below to create your account
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="firstName">
                    First Name<span className="ml-0.5 text-red-500">*</span>
                  </FieldLabel>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder="Juan"
                    required
                    value={formData.firstName}
                    onChange={updateField}
                    className="bg-background"
                    aria-invalid={Boolean(errorFor("firstName"))}
                  />
                  {errorFor("firstName") && (
                    <FieldDescription className="text-red-600">
                      {errorFor("firstName")}
                    </FieldDescription>
                  )}
                </Field>

                  <Field>
                  <FieldLabel htmlFor="middleName">Middle Name</FieldLabel>
                  <Input
                    id="middleName"
                    name="middleName"
                    type="text"
                    placeholder="Juan"
                    value={formData.middleName}
                    onChange={updateField}
                    className="bg-background"
                    aria-invalid={Boolean(errorFor("middleName"))}
                  />
                  {errorFor("middleName") && (
                    <FieldDescription className="text-red-600">
                      {errorFor("middleName")}
                    </FieldDescription>
                  )}
                </Field>

                <Field>
                  <FieldLabel htmlFor="lastName">
                    Last Name<span className="ml-0.5 text-red-500">*</span>
                  </FieldLabel>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    placeholder="Dela Cruz"
                    required
                    value={formData.lastName}
                    onChange={updateField}
                    className="bg-background"
                    aria-invalid={Boolean(errorFor("lastName"))}
                  />
                  {errorFor("lastName") && (
                    <FieldDescription className="text-red-600">
                      {errorFor("lastName")}
                    </FieldDescription>
                  )}
                </Field>

                <Field>
                  <FieldLabel htmlFor="extensionName">
                    Extension Name{" "}
                    <span className="text-muted-foreground">(Optional)</span>
                  </FieldLabel>
                  <Input
                    id="extensionName"
                    name="extensionName"
                    type="text"
                    placeholder="Jr, Sr, III"
                    value={formData.extensionName}
                    onChange={updateField}
                    className="bg-background"
                    aria-invalid={Boolean(errorFor("extensionName"))}
                  />
                  {errorFor("extensionName") && (
                    <FieldDescription className="text-red-600">
                      {errorFor("extensionName")}
                    </FieldDescription>
                  )}
                </Field>

                <Field className="md:col-span-2">
                  <FieldLabel>
                    Birthdate<span className="ml-0.5 text-red-500">*</span>
                  </FieldLabel>
                  <div className="grid grid-cols-3 gap-3">
                    <select
                      name="birthMonth"
                      value={formData.birthMonth}
                      onChange={updateField}
                      required
                      className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
                    >
                      <option value="">Month</option>
                      {MONTHS.map((month) => (
                        <option key={month} value={month}>
                          {month}
                        </option>
                      ))}
                    </select>

                    <select
                      name="birthDay"
                      value={formData.birthDay}
                      onChange={updateField}
                      required
                      className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
                    >
                      <option value="">Day</option>
                      {DAYS.map((day) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </select>

                    <select
                      name="birthYear"
                      value={formData.birthYear}
                      onChange={updateField}
                      required
                      className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
                    >
                      <option value="">Year</option>
                      {YEARS.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="email">
                  Email<span className="ml-0.5 text-red-500">*</span>
                </FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={formData.email}
                  onChange={updateField}
                  className="bg-background"
                  aria-invalid={Boolean(errorFor("email"))}
                />
                <FieldDescription className={errorFor("email") ? "text-red-600" : undefined}>
                  {errorFor("email") ||
                    "We'll use this to contact you. We will not share your email with anyone else."}
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="password">
                  Password<span className="ml-0.5 text-red-500">*</span>
                </FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={updateField}
                  className="bg-background"
                  aria-invalid={Boolean(errorFor("password"))}
                />

                {/*
                  Smooth show/hide: the wrapper is ALWAYS mounted (never
                  conditionally rendered), so CSS transitions can animate it.
                  grid-template-rows 0fr -> 1fr animates height smoothly,
                  combined with an opacity fade for a soft, non-abrupt reveal.
                */}
                <div
                  className={cn(
                    "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
                    formData.password
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="mt-2 rounded-lg border border-border bg-muted/30 p-3.5">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground/70">
                        Password must contain:
                      </p>
                      <ul className="flex flex-col gap-1.5">
                        {passwordRequirements.map((req) => {
                          const passed = req.test(formData.password)
                          return (
                            <li
                              key={req.key}
                              className={cn(
                                "flex items-center gap-2 text-xs transition-colors duration-200",
                                passed ? "text-emerald-700" : "text-red-600"
                              )}
                            >
                              {passed ? (
                                <Check className="size-3.5 shrink-0" />
                              ) : (
                                <X className="size-3.5 shrink-0" />
                              )}
                              {req.label}
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  </div>
                </div>
              </Field>

              <Field>
                <FieldLabel htmlFor="confirmPassword">
                  Confirm Password<span className="ml-0.5 text-red-500">*</span>
                </FieldLabel>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={updateField}
                  className="bg-background"
                  aria-invalid={Boolean(errorFor("confirmPassword"))}
                />
                <FieldDescription className={errorFor("confirmPassword") ? "text-red-600" : undefined}>
                  {errorFor("confirmPassword") || "Please confirm your password."}
                </FieldDescription>
              </Field>

              <Field>
                <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600">
                  Continue
                </Button>
              </Field>
            </>
          )}

          {currentStep === 2 && (
            <>
              <div className="flex flex-col items-center gap-1 text-center">
                <h1 className="text-2xl font-bold">Business Information</h1>
                <p className="text-sm text-muted-foreground">Enter your business information</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="businessName">
                    Business Name<span className="ml-0.5 text-red-500">*</span>
                  </FieldLabel>
                  <Input
                    id="businessName"
                    name="businessName"
                    placeholder="Santos Retail Trading"
                    required
                    value={formData.businessName}
                    onChange={updateField}
                    className="bg-background"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="businessType">
                    Type of Business<span className="ml-0.5 text-red-500">*</span>
                  </FieldLabel>
                  <select
                    id="businessType"
                    name="businessType"
                    value={formData.businessType}
                    onChange={updateField}
                    required
                    className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
                  >
                    <option value="">Select Type of Business</option>
                    <option value="sole-proprietorship">Sole Proprietorship</option>
                    <option value="partnership">Partnership</option>
                    <option value="corporation">Corporation</option>
                    <option value="cooperative">Cooperative</option>
                  </select>
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="tin">
                    TIN Number<span className="ml-0.5 text-red-500">*</span>
                  </FieldLabel>
                  <Input
                    id="tin"
                    name="tin"
                    type="text"
                    inputMode="numeric"
                    maxLength={12}
                    placeholder="123456789000"
                    required
                    value={formData.tin}
                    onChange={updateField}
                    className="bg-background"
                    aria-invalid={Boolean(errorFor("tin"))}
                  />
                  {errorFor("tin") && (
                    <FieldDescription className="text-red-600">
                      {errorFor("tin")}
                    </FieldDescription>
                  )}
                </Field>

                <Field>
                  <FieldLabel htmlFor="industry">
                    Industry<span className="ml-0.5 text-red-500">*</span>
                  </FieldLabel>
                  <select
                    id="industry"
                    name="industry"
                    value={formData.industry}
                    onChange={updateField}
                    required
                    className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
                  >
                    <option value="">Select Industry</option>
                    <option value="retail">Retail</option>
                    <option value="manufacturing">Manufacturing</option>
                    <option value="services">Services</option>
                    <option value="accounting">Hybrid</option>
                  </select>
                </Field>
              </div>

               <Field>
                <FieldLabel htmlFor="contactNumber">
                  Contact Number<span className="ml-0.5 text-red-500">*</span>
                </FieldLabel>
                <Input
                  id="contactNumber"
                  name="contactNumber"
                  type="text"
                  inputMode="numeric"
                  placeholder="09123456789"
                  required
                  value={formData.contactNumber}
                  onChange={updateField}
                  className="bg-background"
                  aria-invalid={Boolean(errorFor("contactNumber"))}
                />
                {errorFor("contactNumber") && (
                  <FieldDescription className="text-red-600">
                    {errorFor("contactNumber")}
                  </FieldDescription>
                )}
              </Field>

              {/* Normalized address — House/Unit No. is its own field (not merged
                  into Street Name), and Barangay/District/City/ZIP each get
                  their own column. */}
              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="houseNo">
                    House/Bldg./Unit No.<span className="ml-0.5 text-red-500">*</span>
                  </FieldLabel>
                  <Input
                    id="houseNo"
                    name="houseNo"
                    placeholder="12, Unit 4B"
                    required
                    value={formData.houseNo}
                    onChange={updateField}
                    className="bg-background"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="streetName">
                    Street Name<span className="ml-0.5 text-red-500">*</span>
                  </FieldLabel>
                  <Input
                    id="streetName"
                    name="streetName"
                    placeholder="Mercado St."
                    required
                    value={formData.streetName}
                    onChange={updateField}
                    className="bg-background"
                  />
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="barangay">
                    Barangay<span className="ml-0.5 text-red-500">*</span>
                  </FieldLabel>
                  <Input
                    id="barangay"
                    name="barangay"
                    placeholder="Barangay 789"
                    required
                    value={formData.barangay}
                    onChange={updateField}
                    className="bg-background"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="district">
                    District<span className="ml-0.5 text-red-500">*</span>
                  </FieldLabel>
                  <Input
                    id="district"
                    name="district"
                    placeholder="District 6"
                    required
                    value={formData.district}
                    onChange={updateField}
                    className="bg-background"
                  />
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="city">
                    City / Municipality<span className="ml-0.5 text-red-500">*</span>
                  </FieldLabel>
                  <Input
                    id="city"
                    name="city"
                    placeholder="Manila"
                    required
                    value={formData.city}
                    onChange={updateField}
                    className="bg-background"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="zipCode">
                    ZIP Code<span className="ml-0.5 text-red-500">*</span>
                  </FieldLabel>
                  <Input
                    id="zipCode"
                    name="zipCode"
                    placeholder="1009"
                    inputMode="numeric"
                    maxLength={4}
                    required
                    value={formData.zipCode}
                    onChange={updateField}
                    className="bg-background"
                    aria-invalid={Boolean(errorFor("zipCode"))}
                  />
                  {errorFor("zipCode") && (
                    <FieldDescription className="text-red-600">
                      {errorFor("zipCode")}
                    </FieldDescription>
                  )}
                </Field>
              </div>

              <Field>
                <div className="flex gap-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={handleBack}>
                    Back
                  </Button>
                  <Button type="submit" className="flex-1 bg-emerald-500 hover:bg-emerald-600">
                    Submit
                  </Button>
                </div>
              </Field>
            </>
          )}


        </FieldGroup>
      </form>
    </AuthLayout>
  )
}