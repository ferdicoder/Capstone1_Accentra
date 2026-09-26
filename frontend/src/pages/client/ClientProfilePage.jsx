import { useEffect, useState } from "react"
import { Save, Lock, Check, X } from "lucide-react"

import { PageSkeleton } from "@/components/shared/loading/page-skeleton"
import { usePageMeta } from "@/hooks/usePageMeta"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

// import { updateClientProfile, updateClientPassword } from "@/api/profileService"

const currentUser = {
  name: "Maria Santos",
  email: "maria.santos@santosretail.com",
  avatar: "",
}

// Field shape matches formData in SignupPage.jsx exactly (minus password/confirmPassword)
const initialProfile = {
  firstName: "Maria",
  middleName: "Reyes",
  lastName: "Santos",
  birthDate: "1990-04-12",
  email: "maria.santos@santosretail.com",
  businessName: "Santos Retail Trading",
  businessType: "sole-proprietorship",
  tin: "123-456-789-000",
  industry: "retail",
  contactNumber: "+63 917 555 1234",
  address: "12 Mercado St. Sta Ana Manila 1009",
}

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

export default function ClientProfilePage() {
  const [activeTab, setActiveTab] = useState("info")
  const [profile, setProfile] = useState(initialProfile)
  const [security, setSecurity] = useState(initialSecurity)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState(null)
  const [loading, setLoading] = useState(true)

  // Simulated load so the shared skeleton system has something to show.
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  // Personal Information (firstName, middleName, lastName, birthDate, email) is
  // read-only, so only Business Information fields go through this handler now.
  const updateProfileField = (event) => {
    const { name, value } = event.target
    setProfile((current) => ({ ...current, [name]: value }))
  }

  const updateSecurityField = (event) => {
    const { name, value } = event.target
    setSecurity((current) => ({ ...current, [name]: value }))
  }

  const handleSaveInfo = async (event) => {
    event.preventDefault()
    setIsSaving(true)
    setSaveMessage(null)
    try {
      // Only Business Information fields are editable/saved from this form.
      // await updateClientProfile(profile)
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

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-2">
          {loading ? (
            <PageSkeleton type="profile" />
          ) : (
            <>
          <div className="flex items-center gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-forest-900 text-sm font-semibold text-white">
              {currentUser.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">{currentUser.name}</h1>
              <p className="text-sm text-muted-foreground">
                {profile.businessName} · Client since January 2022
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

                {/* Mirrors SignupPage.jsx step 2 (Info / Firm Information) fields — still editable */}
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
                          value={profile.tin}
                          onChange={updateProfileField}
                          className={controlClass}
                        />
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

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field>
                        <FieldLabel htmlFor="contactNumber">
                          Contact Number
                        </FieldLabel>
                        <Input
                          id="contactNumber"
                          name="contactNumber"
                          value={profile.contactNumber}
                          onChange={updateProfileField}
                          className={controlClass}
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="address">
                          Address
                        </FieldLabel>
                        <Input
                          id="address"
                          name="address"
                          value={profile.address}
                          onChange={updateProfileField}
                          className={controlClass}
                        />
                      </Field>
                    </div>
                  </FieldGroup>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="gap-2 bg-forest-900 text-white hover:opacity-90"
                >
                  <Save className="size-4" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          )}

          {activeTab === "security" && (
            <form onSubmit={handleSavePassword} className="flex flex-col gap-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
                  <h2 className="mb-5 text-sm font-semibold">
                    Change Password
                  </h2>
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
                  className="gap-2 bg-forest-900 text-white hover:opacity-90"
                >
                  <Save className="size-4" />
                  {isSaving ? "Saving..." : "Update Password"}
                </Button>
              </div>
            </form>
          )}
            </>
          )}
        </div>
  )
}