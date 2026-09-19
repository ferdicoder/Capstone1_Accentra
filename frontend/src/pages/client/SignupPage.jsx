import { AuthLayout } from "@/layout/auth-layout"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useState } from "react"

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


export default function SignupPage() {
  const signupSteps = ["Account", "Info"]
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState(initialFormState);
  const navigate = useNavigate()


  const updateField = (event) => {
    const { name, value } = event.target

    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (currentStep < 2) {
      setCurrentStep((step) => step + 1)
      return
    }

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
      <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
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
                  />
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
                  />
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
                  />
                </Field>

                <Field>
                  <FieldLabel>
                    Birthdate<span className="ml-0.5 text-red-500">*</span>
                  </FieldLabel>
                  <div className="grid grid-cols-3 gap-2">
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
                />
                <FieldDescription>
                  We&apos;ll use this to contact you. We will not share your email with anyone else.
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
                />
                <FieldDescription>Must be at least 8 characters long.</FieldDescription>
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
                />
                <FieldDescription>Please confirm your password.</FieldDescription>
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
                <h1 className="text-2xl font-bold">Firm Information</h1>
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
                    placeholder="123-456-789-000"
                    required
                    value={formData.tin}
                    onChange={updateField}
                    className="bg-background"
                  />
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
                  placeholder="09123456789"
                  required
                  value={formData.contactNumber}
                  onChange={updateField}
                  className="bg-background"
                />
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
                  />
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