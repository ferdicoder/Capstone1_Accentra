import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { ArrowLeft, Check, X, Eye, EyeOff } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LandingNav } from "@/components/landing/landing-nav";

import { registerClient } from "../../services/authService";
import { accountSchema, businessSchema, passwordRequirements } from "/src/schemas/signupSchema";
import { sanitizeValue, formatTin, formatContactNumber } from "/src/lib/signup-utils";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAYS = Array.from({ length: 31 }, (_, index) => index + 1);
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 83 }, (_, index) => CURRENT_YEAR - 18 - index);

const initialFormState = {
  firstName: "", lastName: "", middleName: "", extensionName: "",
  birthMonth: "", birthDay: "", birthYear: "", email: "", password: "",
  confirmPassword: "", birRegistrationStatus: "", businessName: "",
  businessType: "", tin: "", industry: "", contactNumber: "",
  houseNo: "", streetName: "", barangay: "", district: "", city: "", zipCode: "",
};

const personalFields = [
  { name: "firstName", label: "First Name", placeholder: "Juan", required: true },
  { name: "middleName", label: "Middle Name", placeholder: "Santos" },
  { name: "lastName", label: "Last Name", placeholder: "Dela Cruz", required: true },
  { name: "extensionName", label: "Extension Name", placeholder: "Jr., Sr., III", optional: true },
];

const addressFields = [
  { name: "houseNo", label: "House/Bldg./Unit No.", placeholder: "12, Unit 4B", required: true },
  { name: "streetName", label: "Street Name", placeholder: "Mercado St.", required: true },
  { name: "barangay", label: "Barangay", placeholder: "Barangay 789", required: true },
  { name: "district", label: "District", placeholder: "District 6", required: true },
  { name: "city", label: "City / Municipality", placeholder: "Manila", required: true },
];

const BUSINESS_TYPES = [
  ["sole-proprietorship", "Sole Proprietorship"],
  ["partnership", "Partnership"],
  ["corporation", "Corporation"],
  ["cooperative", "Cooperative"],
];

function getErrors(schema, data) {
  const result = schema.safeParse(data);
  if (result.success) return {};

  return result.error.issues.reduce((errors, issue) => {
    const field = issue.path[0];
    if (field && !errors[field]) errors[field] = issue.message;
    return errors;
  }, {});
}

function TextField({ field, value, onChange, error, ...props }) {
  const { name, label, placeholder, required, optional } = field;
  return (
    <Field>
      <FieldLabel htmlFor={name}>
        {label}{required && <span className="ml-0.5 text-red-500">*</span>}
        {optional && <span className="text-muted-foreground"> (Optional)</span>}
      </FieldLabel>
      <Input
        id={name}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="bg-background"
        aria-invalid={Boolean(error)}
        {...props}
      />
      {error && <FieldDescription className="text-red-600">{error}</FieldDescription>}
    </Field>
  );
}

function SelectField({ name, label, value, onChange, options, placeholder, error }) {
  return (
    <Field>
      <FieldLabel htmlFor={name}>
        {label}<span className="ml-0.5 text-red-500">*</span>
      </FieldLabel>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        aria-invalid={Boolean(error)}
        className={cn(
          "h-8 rounded-lg border border-input bg-background px-2.5 text-sm",
          error && "border-red-500"
        )}
      >
        <option value="">{placeholder}</option>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>{optionLabel}</option>
        ))}
      </select>
      {error && <FieldDescription className="text-red-600">{error}</FieldDescription>}
    </Field>
  );
}

export default function SignupPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [isTinFocused, setIsTinFocused] = useState(false);
  const [isContactFocused, setIsContactFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const slideClass = location.state?.clientAuthSlide
    ? "client-auth-slide-up"
    : "";

  const errorFor = (name) => errors[name] || "";
  const displayedTin = formatTin(formData.tin, !isTinFocused);
  const displayedContact = formatContactNumber(formData.contactNumber, !isContactFocused);

  const updateField = (event) => {
    const { name, value } = event.target;
    const cleanValue = sanitizeValue(name, value);
    const nextData = { ...formData, [name]: cleanValue };
    setFormData(nextData);

    const schema = currentStep === 1 ? accountSchema : businessSchema;
    const checked = getErrors(schema, nextData);
    const related = [name];

    if (name === "password") related.push("confirmPassword");
    if (name === "businessType" || name === "birRegistrationStatus") related.push("tin");

    setErrors((previous) => {
      const next = { ...previous };
      related.forEach((field) => {
        if (previous[field] !== undefined || field === name) {
          if (checked[field]) next[field] = checked[field];
          else delete next[field];
        }
      });
      return next;
    });
  };

  const submitRegistration = async (registrationData = formData) => {
    const month = MONTHS.indexOf(registrationData.birthMonth) + 1;
    const birthDate = `${registrationData.birthYear}-${String(month).padStart(2, "0")}-${String(registrationData.birthDay).padStart(2, "0")}`;

    try {
      setIsSubmitting(true);
      setSubmitError("");
      const result = await registerClient({
        ...registrationData,
        birthDate,
        tin: registrationData.tin,
      });

      if (result?.error) throw new Error(
        typeof result.error === "string" ? result.error : result.error.message
      );
      if (!result?.data?.user) throw new Error("Registration could not be completed. Please try again.");

      navigate("/client/signin", { state: { clientAuthSlide: true } });
    } catch (error) {
      console.error("Client registration failed:", error);
      setSubmitError(error.message || "Something went wrong during registration.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError("");

    const schema = currentStep === 1 ? accountSchema : businessSchema;
    const skipsBusinessDetails =
      currentStep === 2 && formData.birRegistrationStatus === "none";
    const stepErrors = skipsBusinessDetails ? {} : getErrors(schema, formData);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length) return;

    if (currentStep === 1) {
      setCurrentStep(2);
      return;
    }

    await submitRegistration();
  };


  const handleBack = () => {
    setErrors({});
    setSubmitError("");
    setCurrentStep(1);
  };

  const steps = ["Personal Information", "Business Registration"];

  return (
    <>
      <LandingNav
        onSignIn={() => navigate("/client/signin", { state: { clientAuthSlide: true } })}
        sectionPrefix="/"
      />
      <main className="min-h-svh pt-[4.5rem]">
        <div className="relative flex min-h-[calc(100svh-4.5rem)] flex-col items-center justify-center gap-5 bg-[#fbfcfa] px-4 py-8 sm:gap-6">
          <header className="absolute left-4 top-4 z-10">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-1.5 rounded-md py-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#02353C]"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back
            </button>
          </header>
          <div className={`client-auth-card w-full max-w-2xl rounded-xl border border-border bg-white p-5 shadow-[0_20px_50px_rgba(15,71,62,0.14)] sm:p-8 ${slideClass}`}>
        <form className="flex flex-col gap-6" onSubmit={handleSubmit} noValidate>
        <div className="flex items-center justify-between gap-2">
          {steps.map((step, index) => {
            const number = index + 1;
            const active = currentStep === number;
            const complete = currentStep > number;
            return (
              <div key={step} className="flex flex-1 items-center justify-center">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "flex size-8 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
                    active || complete
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-background text-foreground"
                  )}>{number}</span>
                  <h3 className={cn(
                    "text-xs font-bold transition-colors",
                    active || complete ? "text-foreground" : "text-muted-foreground"
                  )}>{step}</h3>
                </div>
              </div>
            );
          })}
        </div>

        <FieldGroup>
          {currentStep === 1 ? (
            <>
              <div className="flex flex-col items-center gap-1 text-center">
                <h1 className="text-2xl font-bold">Create your account</h1>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {personalFields.map((field) => (
                  <TextField
                    key={field.name}
                    field={field}
                    value={formData[field.name]}
                    onChange={updateField}
                    error={errorFor(field.name)}
                  />
                ))}
                <Field className="md:col-span-2">
                  <FieldLabel>Birthdate<span className="ml-0.5 text-red-500">*</span></FieldLabel>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      ["birthMonth", "Month", MONTHS.map((month) => [month, month])],
                      ["birthDay", "Day", DAYS.map((day) => [String(day), String(day)])],
                      ["birthYear", "Year", YEARS.map((year) => [String(year), String(year)])],
                    ].map(([name, placeholder, options]) => (
                      <select
                        key={name}
                        name={name}
                        value={formData[name]}
                        onChange={updateField}
                        className={cn(
                          "h-8 rounded-lg border border-input bg-background px-2.5 text-sm",
                          errorFor(name) && "border-red-500"
                        )}
                      >
                        <option value="">{placeholder}</option>
                        {options.map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    ))}
                  </div>
                  {["birthMonth", "birthDay", "birthYear"].some(errorFor) && (
                    <FieldDescription className="text-red-600">
                      {errorFor("birthDay") || errorFor("birthYear") || errorFor("birthMonth")}
                    </FieldDescription>
                  )}
                </Field>
              </div>

              <TextField
                field={{ name: "email", label: "Email", placeholder: "m@example.com", required: true }}
                value={formData.email}
                onChange={updateField}
                error={errorFor("email")}
                type="email"
              />
              {!errorFor("email") && (
                <FieldDescription>
                  We'll use this to contact you. We will not share your email with anyone else.
                </FieldDescription>
              )}

             
      <Field>
        <FieldLabel htmlFor="password">
          Password<span className="ml-0.5 text-red-500">*</span>
        </FieldLabel>

        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={updateField}
            className="bg-background pr-10"
            aria-invalid={Boolean(errorFor("password"))}
            autoComplete="new-password"
          />

          <button
            type="button"
            onClick={() => setShowPassword((previous) => !previous)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#02353C]"
          >
            {showPassword ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>

        <div className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
          formData.password ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}>
          <div className="overflow-hidden">
            <div className="mt-2 rounded-lg border border-border bg-muted/30 p-3.5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground/70">
                Password must contain:
              </p>
              <ul className="flex flex-col gap-1.5">
                {passwordRequirements.map((requirement) => {
                  const passed = requirement.test(formData.password);
                  return (
                    <li key={requirement.key} className={cn(
                      "flex items-center gap-2 text-xs transition-colors duration-200",
                      passed ? "text-emerald-700" : "text-red-600"
                    )}>
                      {passed ? (
                        <Check className="size-3.5 shrink-0" />
                      ) : (
                        <X className="size-3.5 shrink-0" />
                      )}
                      {requirement.label}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>

        {errorFor("password") && (
          <FieldDescription className="text-red-600">
            {errorFor("password")}
          </FieldDescription>
        )}
      </Field>


              
          <Field>
            <FieldLabel htmlFor="confirmPassword">
              Confirm Password<span className="ml-0.5 text-red-500">*</span>
            </FieldLabel>

            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={updateField}
                className="bg-background pr-10"
                aria-invalid={Boolean(errorFor("confirmPassword"))}
                autoComplete="new-password"
              />

                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((previous) => !previous)}
                      aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                      aria-pressed={showConfirmPassword}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#02353C]"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="size-4" aria-hidden="true" />
                      ) : (
                        <Eye className="size-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>

                  {errorFor("confirmPassword") && (
                    <FieldDescription className="text-red-600">
                      {errorFor("confirmPassword")}
                    </FieldDescription>
                  )}
                </Field>


                <Button
                  type="submit"
                  className="h-12 w-4/5 max-w-sm self-center bg-forest-900 text-lg text-white hover:bg-[#18a16f]"
                >
                  Continue
                </Button>
              </>
            ) : (
              <>
                <div className="flex flex-col items-center gap-1 text-center">
                  <h1 className="text-2xl font-bold">Business Registration</h1>
                </div>

                <Field>
                  <FieldLabel>Is your business already registered?<span className="ml-0.5 text-red-500">*</span></FieldLabel>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      ["registered", "Yes, my business is already registered"],
                      ["none", "No, not yet — I'll add my business later"],
                    ].map(([value, label]) => (
                      <label
                        key={value}
                        className={cn(
                          "flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors",
                          formData.birRegistrationStatus === value
                            ? "border-emerald-600 bg-emerald-50/60"
                            : "border-input hover:bg-muted/40"
                        )}
                      >
                        <input
                          type="radio"
                          name="birRegistrationStatus"
                          value={value}
                          checked={formData.birRegistrationStatus === value}
                          onChange={(event) => {
                            const selectedStatus = event.target.value;
                            setFormData((previous) => ({
                              ...previous,
                              birRegistrationStatus: selectedStatus,
                              ...(selectedStatus !== "registered" ? {
                                businessName: "", businessType: "", tin: "", industry: "",
                                contactNumber: "", houseNo: "", streetName: "", barangay: "",
                                district: "", city: "", zipCode: "",
                              } : {}),
                            }));
                            setErrors({});
                            setSubmitError("");
                          }}
                          className="mt-0.5 accent-emerald-600"
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                  {errorFor("birRegistrationStatus") && (
                    <FieldDescription className="text-red-600">{errorFor("birRegistrationStatus")}</FieldDescription>
                  )}
              </Field>

              {formData.birRegistrationStatus === "registered" ? (
                <>
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-sm text-muted-foreground">
                      Please provide your registered business details so the firm can properly identify your business.
                    </p>
                  </div>

                  <TextField
                    field={{ name: "businessName", label: "Business Name", placeholder: "Santos Retail Trading", required: true }}
                    value={formData.businessName}
                    onChange={updateField}
                    error={errorFor("businessName")}
                  />

                  <SelectField
                    name="businessType"
                    label="Type of Business"
                    value={formData.businessType}
                    onChange={updateField}
                    placeholder="Select Type of Business"
                    options={BUSINESS_TYPES}
                    error={errorFor("businessType")}
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <TextField
                      field={{ name: "tin", label: "TIN Number", placeholder: "123-456-789-000", required: true }}
                      value={displayedTin}
                      onChange={updateField}
                      onFocus={() => setIsTinFocused(true)}
                      onBlur={() => setIsTinFocused(false)}
                      error={errorFor("tin")}
                      inputMode="numeric"
                      maxLength={15}
                    />
                    <SelectField
                      name="industry"
                      label="Industry"
                      value={formData.industry}
                      onChange={updateField}
                      placeholder="Select Industry"
                      options={[
                        ["retail", "Retail"],
                        ["manufacturing", "Manufacturing"],
                        ["services", "Services"],
                        ["accounting", "Hybrid"],
                      ]}
                      error={errorFor("industry")}
                    />
                  </div>

                  <TextField
                    field={{ name: "contactNumber", label: "Contact Number", placeholder: "09123456789", required: true }}
                    value={displayedContact}
                    onChange={updateField}
                    onFocus={() => setIsContactFocused(true)}
                    onBlur={() => setIsContactFocused(false)}
                    error={errorFor("contactNumber")}
                    inputMode="numeric"
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    {addressFields.map((field) => (
                      <TextField
                        key={field.name}
                        field={field}
                        value={formData[field.name]}
                        onChange={updateField}
                        error={errorFor(field.name)}
                      />
                    ))}
                    <TextField
                      field={{ name: "zipCode", label: "ZIP Code", placeholder: "1009", required: true }}
                      value={formData.zipCode}
                      onChange={updateField}
                      error={errorFor("zipCode")}
                      inputMode="numeric"
                      maxLength={4}
                    />
                  </div>
                </>
              ) : formData.birRegistrationStatus === "none" ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-4">
                  <p className="text-sm font-medium text-foreground">You can skip your business details for now.</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Whether your business isn't BIR-registered yet or you don't have one yet, you can add it later from your profile whenever you're ready.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Select an option above to continue with your registration.
                </p>
              )}

              {submitError && (
                <FieldDescription className="text-red-600">{submitError}</FieldDescription>
              )}

              <div className="flex gap-4">
                <Button type="button" variant="outline" className="flex-1" onClick={handleBack} disabled={isSubmitting}>
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                  disabled={isSubmitting || !formData.birRegistrationStatus}
                >
                  {isSubmitting ? "Submitting..." : "Submit"}
                </Button>
              </div>
            </>
          )}
        </FieldGroup>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            to="/client/signin"
            state={{ clientAuthSlide: true }}
            className="font-medium text-forest-900 underline underline-offset-4 hover:text-emerald-700"
          >
            Sign in
          </Link>
        </p>
          </div>
        </div>
      </main>
    </>
  );
}
