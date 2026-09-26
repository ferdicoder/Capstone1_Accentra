import { useEffect, useRef, useState } from "react"
import { Save, Lock, Check, X, ShieldQuestion, Loader2 } from "lucide-react"

import { PageSkeleton } from "@/components/shared/loading/page-skeleton"
import { usePageMeta } from "@/hooks/usePageMeta"
import { cn } from "@/lib/utils"
import { authStore } from "@/store/authStore"
import { useFetchMyBusiness } from "@/hooks/useBusinesses"

import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ForgotPasswordModal } from "@/components/client/ForgotPasswordModal"

// import { updateClientBusiness, updateClientPassword } from "@/api/profileService"

const initialSecurity = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
}

const tabs = [
  { key: "info", label: "Personal & Business Info" },
  { key: "security", label: "Security" },
]

// Shared classes so every input / select on the page matches the shared Input
// (h-8, rounded-lg, neutral focus ring) used across the User Management module.
const controlClass = "w-full bg-background"
const selectClass = cn(
  controlClass,
  "h-8 rounded-lg border border-input px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
)
// Personal Information fields are read-only — styled visibly disabled so it's
// clear at a glance these can't be edited from this page.
const readOnlyClass = cn(controlClass, "cursor-not-allowed bg-muted/50 text-muted-foreground")

// --- Password requirements (kept local to this page — not a shared component) ---

const passwordRequirements = [
  { key: "lowercase", label: "At least one lowercase letter", test: (pw) => /[a-z]/.test(pw) },
  { key: "uppercase", label: "At least one uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { key: "number", label: "At least one number", test: (pw) => /[0-9]/.test(pw) },
  { key: "minLength", label: "Minimum 8 characters", test: (pw) => pw.length >= 8 },
]

function isPasswordValid(password) {
  return passwordRequirements.every((req) => req.test(password))
}

// Field shape matches formData in SignupPage.jsx exactly (minus password/confirmPassword).
// Address is normalized into houseNo/streetName/barangay/district/city/zipCode —
// same six fields SignupPage step 2 collects — instead of one free-text string,
// so what the client edits here maps 1:1 to what was captured at signup.
const emptyProfile = {
  firstName: "",
  middleName: "",
  lastName: "",
  birthDate: "",
  email: "",
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

// Only these fields are actually editable/saved from this page — Personal
// Information is read-only, so it's excluded from the "did anything change"
// comparison used to gate the Save button / success message.
const EDITABLE_BUSINESS_FIELDS = [
  "businessName",
  "businessType",
  "tin",
  "industry",
  "contactNumber",
  "houseNo",
  "streetName",
  "barangay",
  "district",
  "city",
  "zipCode",
]

// Builds the profile shape above from the logged-in user + their fetched
// business record, so the form is always synced to whoever is actually
// signed in rather than a hardcoded sample client.
function buildProfile(user, business) {
  return {
    firstName: user?.firstName ?? "",
    middleName: user?.middleName ?? "",
    lastName: user?.lastName ?? "",
    birthDate: user?.birthDate ?? "",
    email: user?.email ?? "",
    businessName: business?.businessName ?? "",
    businessType: business?.businessType ?? "",
    tin: business?.tin ?? "",
    industry: business?.industry ?? "",
    contactNumber: business?.contactNumber ?? "",
    houseNo: business?.houseNo ?? "",
    streetName: business?.streetName ?? "",
    barangay: business?.barangay ?? "",
    district: business?.district ?? "",
    city: business?.city ?? "",
    zipCode: business?.zipCode ?? "",
  }
}

// Fields where non-digit characters are stripped as the user types.
// TIN is handled separately below since it also gets auto-hyphenated.
const DIGITS_ONLY_FIELDS = new Set(["contactNumber", "zipCode"])

// Formats a raw digit string as XXX-XXX-XXX-XXX (BIR's 12-digit online format),
// inserting hyphens progressively as the user types rather than all at once.
function formatTin(digitsOnly) {
  const groups = [
    digitsOnly.slice(0, 3),
    digitsOnly.slice(3, 6),
    digitsOnly.slice(6, 9),
    digitsOnly.slice(9, 12),
  ]
  return groups.filter(Boolean).join("-")
}

// A complete TIN is either the legacy 9-digit format or the 12-digit online
// format (9 digits + a 3-digit branch code, usually "000"). Anything shorter
// than 9 is incomplete/invalid outright; exactly 9 is valid but not yet in
// the 12-digit shape most online portals require, so that gets its own
// reminder rather than a flat "invalid" — 10 or 11 digits is a half-finished
// 12-digit number, so it's treated the same as "too short."
function getTinWarning(digitsOnly) {
  if (!digitsOnly) return ""
  if (digitsOnly.length < 9) return "Invalid TIN ID. Must be at least 9 digits."
  if (digitsOnly.length === 9) {
    return "This is a 9-digit TIN. Add 000 at the end to complete the 12-digit format."
  }
  if (digitsOnly.length < 12) return "Invalid TIN ID. Must be 9 or 12 digits."
  return ""
}

function getInitials(firstName, lastName) {
  const letters = [firstName?.[0], lastName?.[0]].filter(Boolean)
  return letters.length ? letters.join("").toUpperCase() : "?"
}

export default function ClientProfilePage() {
  const user = authStore((state) => state.user)
  const authLoading = authStore((state) => state.loading)

  const { data: business, isLoading: businessLoading } = useFetchMyBusiness(user?.id)
  const businessId = business?.id

  const [activeTab, setActiveTab] = useState("info")
  const [profile, setProfile] = useState(emptyProfile)
  const [security, setSecurity] = useState(initialSecurity)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false)

  // Snapshot of the last-saved (or last-loaded) profile, used to detect
  // whether the user actually changed anything before hitting Save.
  const savedProfileRef = useRef(emptyProfile)

  const loading = authLoading || businessLoading

  // Keep the form synced to whoever is actually logged in: re-derive
  // profile whenever the user or their business record (re)loads, instead
  // of only ever showing the static sample data it was initialized with.
  useEffect(() => {
    if (!loading) {
      const nextProfile = buildProfile(user, business)
      setProfile(nextProfile)
      savedProfileRef.current = nextProfile
    }
  }, [loading, user, business])

  // Personal Information (firstName, middleName, lastName, birthDate, email) is
  // read-only, so only Business Information fields go through this handler now.
  const updateProfileField = (event) => {
    const { name, value } = event.target

    if (name === "tin") {
      // Letters (or any char besides digits/hyphens) typed or pasted in —
      // hyphens are allowed through since we insert them ourselves, but
      // anything else triggers the "Numbers only." message. That check
      // takes priority; otherwise fall back to the length-based warning.
      const hasInvalidChar = /[^\d-]/.test(value)
      const digitsOnly = value.replace(/\D/g, "").slice(0, 12)

      setFieldErrors((current) => ({
        ...current,
        tin: hasInvalidChar ? "Numbers only." : getTinWarning(digitsOnly),
      }))
      setProfile((current) => ({ ...current, tin: formatTin(digitsOnly) }))
      return
    }

    if (DIGITS_ONLY_FIELDS.has(name)) {
      const cleanValue = value.replace(/\D/g, "")
      setFieldErrors((current) => ({
        ...current,
        [name]: cleanValue !== value ? "Numbers only." : "",
      }))
      setProfile((current) => ({ ...current, [name]: cleanValue }))
      return
    }

    setProfile((current) => ({ ...current, [name]: value }))
  }

  const updateSecurityField = (event) => {
    const { name, value } = event.target
    setSecurity((current) => ({ ...current, [name]: value }))
  }

  const hasProfileChanges = EDITABLE_BUSINESS_FIELDS.some(
    (key) => profile[key] !== savedProfileRef.current[key]
  )

  const handleSaveInfo = async (event) => {
    event.preventDefault()
    setSaveMessage(null)

    // Nothing to persist — don't hit the API or claim success for a no-op.
    if (!hasProfileChanges) {
      setSaveMessage({ type: "error", text: "No changes to save yet." })
      return
    }

    setIsSaving(true)
    try {
      // Only Business Information fields are editable/saved from this form.
      // await updateClientBusiness(businessId, {
      //   businessName: profile.businessName,
      //   businessType: profile.businessType,
      //   tin: profile.tin,
      //   industry: profile.industry,
      //   contactNumber: profile.contactNumber,
      //   houseNo: profile.houseNo,
      //   streetName: profile.streetName,
      //   barangay: profile.barangay,
      //   district: profile.district,
      //   city: profile.city,
      //   zipCode: profile.zipCode,
      // })

      // TODO: remove once updateClientBusiness above is wired up — this
      // simulated delay exists purely so the "Saving..." state is visible
      // instead of flashing instantly, since there's currently no real
      // network request to await.
      await new Promise((resolve) => setTimeout(resolve, 700))

      savedProfileRef.current = profile
      setSaveMessage({ type: "success", text: "Profile updated successfully." })
    } catch (err) {
      console.error(err)
      setSaveMessage({ type: "error", text: "Something went wrong. Please try again." })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSavePassword = async (event) => {
    event.preventDefault()

    if (!security.currentPassword) {
      setSaveMessage({ type: "error", text: "Enter your current password." })
      return
    }
    if (!isPasswordValid(security.newPassword)) {
      setSaveMessage({ type: "error", text: "Password doesn't meet the requirements below." })
      return
    }
    if (security.newPassword !== security.confirmPassword) {
      setSaveMessage({ type: "error", text: "New password and confirmation don't match." })
      return
    }

    setIsSaving(true)
    setSaveMessage(null)
    try {
      // await updateClientPassword(security)

      // TODO: remove once updateClientPassword above is wired up — see note
      // in handleSaveInfo.
      await new Promise((resolve) => setTimeout(resolve, 700))

      setSecurity(initialSecurity)
      setSaveMessage({ type: "success", text: "Password updated successfully." })
    } catch (err) {
      console.error(err)
      setSaveMessage({ type: "error", text: "Something went wrong. Please try again." })
    } finally {
      setIsSaving(false)
    }
  }

  usePageMeta({
    title: "My Profile",
    breadcrumbs: [{ label: "Home", href: "/client/dashboard" }],
    hasUnreadNotifications: true,
  })

  const displayName = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || "My Profile"

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-2">
          {loading ? (
            <PageSkeleton type="profile" />
          ) : (
            <>
          <div className="flex items-center gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-forest-900 text-sm font-semibold text-white">
              {getInitials(profile.firstName, profile.lastName)}
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">{displayName}</h1>
              <p className="text-sm text-muted-foreground">
                {profile.businessName || "No business on file"}
              </p>
            </div>
          </div>

          <div className="flex gap-8 border-b">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key)
                  setSaveMessage(null)
                }}
                className={cn(
                  "-mb-px border-b-2 pb-3 text-sm font-medium transition-colors",
                  activeTab === tab.key
                    ? "border-emerald-600 text-emerald-700"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {saveMessage && (
            <div
              className={cn(
                "rounded-lg px-4 py-2.5 text-sm",
                saveMessage.type === "success"
                  ? "bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/20 ring-inset"
                  : "bg-red-500/10 text-red-600 ring-1 ring-red-500/20 ring-inset"
              )}
            >
              {saveMessage.text}
            </div>
          )}

          {activeTab === "info" && (
            <form onSubmit={handleSaveInfo} className="flex flex-col gap-6">
              {/* Personal + Business cards sit side by side at equal width on large screens,
                  so the form fills the same rail as the header instead of trailing off into empty space. */}
              <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
                {/* Read-only: personal identity fields can't be edited by the client directly. */}
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-sm font-semibold">
                      Personal Information
                    </h2>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      <Lock className="size-3" />
                      Read-only
                    </span>
                  </div>
                  <FieldGroup className="gap-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field>
                        <FieldLabel htmlFor="firstName">First Name</FieldLabel>
                        <Input
                          id="firstName"
                          name="firstName"
                          value={profile.firstName}
                          readOnly
                          disabled
                          className={readOnlyClass}
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="middleName">Middle Name</FieldLabel>
                        <Input
                          id="middleName"
                          name="middleName"
                          value={profile.middleName}
                          readOnly
                          disabled
                          className={readOnlyClass}
                        />
                      </Field>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field>
                        <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
                        <Input
                          id="lastName"
                          name="lastName"
                          value={profile.lastName}
                          readOnly
                          disabled
                          className={readOnlyClass}
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="birthDate">Birthdate</FieldLabel>
                        <Input
                          id="birthDate"
                          name="birthDate"
                          type="date"
                          value={profile.birthDate}
                          readOnly
                          disabled
                          className={readOnlyClass}
                        />
                      </Field>
                    </div>

                    <Field>
                      <FieldLabel htmlFor="email">Email Address</FieldLabel>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={profile.email}
                        readOnly
                        disabled
                        className={readOnlyClass}
                      />
                    </Field>

                    <p className="text-xs text-muted-foreground">
                      To change your personal information, please contact your firm or support.
                    </p>
                  </FieldGroup>
                </div>

                {/* Mirrors SignupPage.jsx step 2 (Info / Firm Information) fields — still editable.
                    Address is now the same six normalized fields signup collects, instead of
                    one free-text "address" string. */}
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <h2 className="mb-5 text-sm font-semibold">
                    Business Information
                  </h2>
                  <FieldGroup className="gap-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field>
                        <FieldLabel htmlFor="businessName">
                          Business Name
                        </FieldLabel>
                        <Input
                          id="businessName"
                          name="businessName"
                          value={profile.businessName}
                          onChange={updateProfileField}
                          className={controlClass}
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="businessType">
                          Type of Business
                        </FieldLabel>
                        <select
                          id="businessType"
                          name="businessType"
                          value={profile.businessType}
                          onChange={updateProfileField}
                          className={selectClass}
                        >
                          <option value="">Select Type of Business</option>
                          <option value="sole-proprietorship">Sole Proprietorship</option>
                          <option value="partnership">Partnership</option>
                          <option value="corporation">Corporation</option>
                          <option value="cooperative">Cooperative</option>
                        </select>
                      </Field>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field>
                        <FieldLabel htmlFor="tin">
                          TIN Number
                        </FieldLabel>
                        <Input
                          id="tin"
                          name="tin"
                          inputMode="numeric"
                          placeholder="123-456-789-000"
                          maxLength={15}
                          value={profile.tin}
                          onChange={updateProfileField}
                          className={controlClass}
                          aria-invalid={Boolean(fieldErrors.tin)}
                        />
                        <FieldDescription
                          className={fieldErrors.tin ? "text-red-600" : undefined}
                        >
                          {fieldErrors.tin ||
                            "12 digits, formatted as XXX-XXX-XXX-XXX. If your TIN card only shows 9 digits, add 000 at the end to complete the 12-digit format required by online portals like BIR ORUS."}
                        </FieldDescription>
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="industry">Industry</FieldLabel>
                        <select
                          id="industry"
                          name="industry"
                          value={profile.industry}
                          onChange={updateProfileField}
                          className={selectClass}
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
                        Contact Number
                      </FieldLabel>
                      <Input
                        id="contactNumber"
                        name="contactNumber"
                        inputMode="numeric"
                        value={profile.contactNumber}
                        onChange={updateProfileField}
                        className={controlClass}
                        aria-invalid={Boolean(fieldErrors.contactNumber)}
                      />
                      {fieldErrors.contactNumber && (
                        <FieldDescription className="text-red-600">
                          {fieldErrors.contactNumber}
                        </FieldDescription>
                      )}
                    </Field>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field>
                        <FieldLabel htmlFor="houseNo">
                          House/Bldg./Unit No.
                        </FieldLabel>
                        <Input
                          id="houseNo"
                          name="houseNo"
                          value={profile.houseNo}
                          onChange={updateProfileField}
                          className={controlClass}
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="streetName">
                          Street Name
                        </FieldLabel>
                        <Input
                          id="streetName"
                          name="streetName"
                          value={profile.streetName}
                          onChange={updateProfileField}
                          className={controlClass}
                        />
                      </Field>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field>
                        <FieldLabel htmlFor="barangay">
                          Barangay
                        </FieldLabel>
                        <Input
                          id="barangay"
                          name="barangay"
                          value={profile.barangay}
                          onChange={updateProfileField}
                          className={controlClass}
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="district">
                          District
                        </FieldLabel>
                        <Input
                          id="district"
                          name="district"
                          value={profile.district}
                          onChange={updateProfileField}
                          className={controlClass}
                        />
                      </Field>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field>
                        <FieldLabel htmlFor="city">
                          City / Municipality
                        </FieldLabel>
                        <Input
                          id="city"
                          name="city"
                          value={profile.city}
                          onChange={updateProfileField}
                          className={controlClass}
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="zipCode">
                          ZIP Code
                        </FieldLabel>
                        <Input
                          id="zipCode"
                          name="zipCode"
                          inputMode="numeric"
                          maxLength={4}
                          value={profile.zipCode}
                          onChange={updateProfileField}
                          className={controlClass}
                          aria-invalid={Boolean(fieldErrors.zipCode)}
                        />
                        {fieldErrors.zipCode && (
                          <FieldDescription className="text-red-600">
                            {fieldErrors.zipCode}
                          </FieldDescription>
                        )}
                      </Field>
                    </div>
                  </FieldGroup>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isSaving || !hasProfileChanges}
                  className="gap-2 bg-forest-900 text-white hover:opacity-90 disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          )}

          {activeTab === "security" && (
            <form onSubmit={handleSavePassword} className="flex flex-col gap-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
                  <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-sm font-semibold">
                      Change Password
                    </h2>
                    <button
                      type="button"
                      onClick={() => setIsForgotPasswordOpen(true)}
                      className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 underline-offset-4 hover:underline"
                    >
                      <ShieldQuestion className="size-4" />
                      Forgot your current password?
                    </button>
                  </div>
                  <FieldGroup className="gap-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field>
                        <FieldLabel htmlFor="currentPassword">
                          Current Password
                        </FieldLabel>
                        <Input
                          id="currentPassword"
                          name="currentPassword"
                          type="password"
                          value={security.currentPassword}
                          onChange={updateSecurityField}
                          className={controlClass}
                        />
                      </Field>
                      <div />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field>
                        <FieldLabel htmlFor="newPassword">
                          New Password
                        </FieldLabel>
                        <Input
                          id="newPassword"
                          name="newPassword"
                          type="password"
                          value={security.newPassword}
                          onChange={updateSecurityField}
                          className={controlClass}
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="confirmPassword">
                          Confirm New Password
                        </FieldLabel>
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          value={security.confirmPassword}
                          onChange={updateSecurityField}
                          className={controlClass}
                        />
                      </Field>
                    </div>

                    {/*
                      Smooth show/hide: the wrapper is ALWAYS mounted (never
                      conditionally rendered), so CSS transitions can animate it.
                      grid-template-rows 0fr -> 1fr animates height smoothly
                      (a plain max-height transition tends to feel janky/stepped),
                      combined with an opacity fade for a soft, non-abrupt reveal.
                    */}
                    <div
                      className={cn(
                        "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
                        security.newPassword
                          ? "grid-rows-[1fr] opacity-100"
                          : "grid-rows-[0fr] opacity-0"
                      )}
                    >
                      <div className="overflow-hidden">
                        <div className="rounded-lg border border-border bg-muted/30 p-3.5">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground/70">
                            Password must contain:
                          </p>
                          <ul className="flex flex-col gap-1.5">
                            {passwordRequirements.map((req) => {
                              const passed = req.test(security.newPassword)
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
                  </FieldGroup>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="gap-2 bg-forest-900 text-white hover:opacity-90 disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  {isSaving ? "Saving..." : "Update Password"}
                </Button>
              </div>
            </form>
          )}
            </>
          )}

      <ForgotPasswordModal
        open={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
      />
        </div>
  )
}