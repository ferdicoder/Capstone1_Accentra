import { AuthLayout } from "@/layout/auth-layout"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useState } from "react"

import { registerClient } from "../../services/authService";
import { useNavigate } from "react-router-dom"


const initialFormState = {
  firstName: "",
  lastName: "",
  middleName: "",
  birthDate: "",
  email: "",
  password: "",
  confirmPassword: "",
  businessName: "",
  businessType: "",
  tin: "",
  industry: "",
  contactNumber: "",
  // Normalized address — House/Bldg/Unit No. and Street Name are separate
  // atomic fields (not merged into one free-text line), and Barangay,
  // District, City, ZIP each get their own column/field too.
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


  // Builds a single display string from the atomic fields, for anywhere
  // downstream that still expects one address string (e.g. an invoice PDF).
  // The atomic fields themselves are always sent too, so nothing is lossy.
  const formatAddress = () =>
    [
      [formData.houseNo, formData.streetName].filter(Boolean).join(" "),
      formData.barangay,
      formData.district,
      formData.city,
      formData.zipCode,
    ]
      .filter(Boolean)
      .join(", ")

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (currentStep < 2) {
      setCurrentStep((step) => step + 1)
      return
    }

    try{
      const newUser = await registerClient({
        ...formData,
        addressDisplay: formatAddress(),
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
                  <FieldLabel htmlFor="firstName">First Name</FieldLabel>
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
                  <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
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
                  <FieldLabel htmlFor="birthDate">Birthdate</FieldLabel>
                  <Input
                    id="birthDate"
                    name="birthDate"
                    type="date"
                    placeholder="1990-01-01"
                    required
                    value={formData.birthDate}
                    onChange={updateField}
                    className="bg-background"
                  />
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
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
                <FieldLabel htmlFor="password">Password</FieldLabel>
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
                <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
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
                  <FieldLabel htmlFor="businessName">Business Name</FieldLabel>
                  <Input
                    id="businessName"
                    name="businessName"
                    placeholder="Santos Retail Trading"
                    value={formData.businessName}
                    onChange={updateField}
                    className="bg-background"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="businessType">Type of Business</FieldLabel>
                  <select
                    id="businessType"
                    name="businessType"
                    value={formData.businessType}
                    onChange={updateField}
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
                  <FieldLabel htmlFor="tin">TIN Number</FieldLabel>
                  <Input
                    id="tin"
                    name="tin"
                    placeholder="123-456-789-000"
                    value={formData.tin}
                    onChange={updateField}
                    className="bg-background"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="industry">Industry</FieldLabel>
                  <select
                    id="industry"
                    name="industry"
                    value={formData.industry}
                    onChange={updateField}
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
                <FieldLabel htmlFor="contactNumber">Contact Number</FieldLabel>
                <Input
                  id="contactNumber"
                  name="contactNumber"
                  placeholder="09123456789"
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
                  <FieldLabel htmlFor="houseNo">House/Bldg./Unit No.</FieldLabel>
                  <Input
                    id="houseNo"
                    name="houseNo"
                    placeholder="12, Unit 4B"
                    value={formData.houseNo}
                    onChange={updateField}
                    className="bg-background"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="streetName">Street Name</FieldLabel>
                  <Input
                    id="streetName"
                    name="streetName"
                    placeholder="Mercado St."
                    value={formData.streetName}
                    onChange={updateField}
                    className="bg-background"
                  />
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="barangay">Barangay</FieldLabel>
                  <Input
                    id="barangay"
                    name="barangay"
                    placeholder="Barangay 789"
                    value={formData.barangay}
                    onChange={updateField}
                    className="bg-background"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="district">District</FieldLabel>
                  <Input
                    id="district"
                    name="district"
                    placeholder="District 6"
                    value={formData.district}
                    onChange={updateField}
                    className="bg-background"
                  />
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="city">City / Municipality</FieldLabel>
                  <Input
                    id="city"
                    name="city"
                    placeholder="Manila"
                    value={formData.city}
                    onChange={updateField}
                    className="bg-background"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="zipCode">ZIP Code</FieldLabel>
                  <Input
                    id="zipCode"
                    name="zipCode"
                    placeholder="1009"
                    inputMode="numeric"
                    maxLength={4}
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