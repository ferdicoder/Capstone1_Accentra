import { useEffect, useRef, useState } from "react"
import { Check, Save, ShieldQuestion, X } from "lucide-react"

import { PageSkeleton } from "@/components/shared/loading/page-skeleton"
import { usePageMeta } from "@/hooks/usePageMeta"
import { cn } from "@/lib/utils"
import { passwordRequirements } from "@/lib/passwordRequirements"
import {
  changeAuthenticatedPassword,
  getPasswordReuseMessage,
} from "@/services/authService"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { AdminForgotPasswordModal } from "@/components/firm/admin-forgot-password-modal"

// import { updateFirmProfile, updateFirmPassword } from "@/services/firmService"

const currentUser = {
  name: "Carlo Reyes",
  email: "carlo@reyesassociates.ph",
  avatar: "",
}

// Field shape mirrors the "Register Your Firm" signup form exactly
const initialProfile = {
  firmName: "Reyes & Associates CPA",
  firstName: "Carlo",
  lastName: "Reyes",
  workEmail: "carlo@reyesassociates.ph",
  licenseNo: "CPA-2024-00123",
  firmType: "sole-practitioner",
  contactNumber: "+63 917 001 0001",
  address: "",
}

const initialSecurity = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
}

const tabs = [
  { key: "info", label: "Firm Information" },
  { key: "security", label: "Security" },
]

// Shared classes so every input / select on the page matches the shared Input
// (h-8, rounded-lg, neutral focus ring) used across the User Management module.
const controlClass = "w-full bg-background"
const selectClass = cn(
  controlClass,
  "h-8 rounded-lg border border-input px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
)

export default function FirmProfilePage() {
  const [activeTab, setActiveTab] = useState("info")
  const [profile, setProfile] = useState(initialProfile)
  const [security, setSecurity] = useState(initialSecurity)
  const [securityErrors, setSecurityErrors] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const passwordSaveInProgress = useRef(false)
  const profileSaveInProgress = useRef(false)
  const [saveMessage, setSaveMessage] = useState(null)
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  // Simulated load so the shared skeleton system has something to show.
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  const updateProfileField = (event) => {
    const { name, value } = event.target
    setProfile((current) => ({ ...current, [name]: value }))
  }

  const updateSecurityField = (name, value) => {
    setSecurity((current) => ({ ...current, [name]: value }))
    setSecurityErrors((current) => ({ ...current, [name]: undefined }))
    setSaveMessage(null)
  }

  const handleSaveInfo = async (event) => {
    event.preventDefault()

    if (profileSaveInProgress.current) return

    profileSaveInProgress.current = true
    setIsSaving(true)
    setSaveMessage(null)
    try {
      // await updateFirmProfile(profile)
      setSaveMessage({ type: "success", text: "Firm profile updated successfully." })
    } catch (err) {
      console.error(err)
      setSaveMessage({ type: "error", text: "Something went wrong. Please try again." })
    } finally {
      profileSaveInProgress.current = false
      setIsSaving(false)
    }
  }

  const handleSavePassword = async (event) => {
    event.preventDefault()

    if (passwordSaveInProgress.current) return

    const nextErrors = {}
    if (!security.currentPassword) {
      nextErrors.currentPassword = "Please enter your current password."
    }
    if (!security.newPassword) {
      nextErrors.newPassword = "Please enter a new password."
    } else if (
      !passwordRequirements.every((requirement) => requirement.test(security.newPassword))
    ) {
      nextErrors.newPassword = "Your password doesn't meet the requirements below."
    } else if (security.newPassword === security.currentPassword) {
      nextErrors.newPassword = "This password has already been used. Try another."
    }
    if (!security.confirmPassword) {
      nextErrors.confirmPassword = "Please confirm your new password."
    } else if (security.newPassword !== security.confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match."
    }

    setSecurityErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setSaveMessage(null)
      return
    }

    passwordSaveInProgress.current = true
    setIsSaving(true)
    setSaveMessage(null)
    try {
      await changeAuthenticatedPassword({
        currentPassword: security.currentPassword,
        newPassword: security.newPassword,
      })
      setSecurity(initialSecurity)
      setSecurityErrors({})
      setSaveMessage({ type: "success", text: "Password updated successfully." })
    } catch (err) {
      console.error("Admin password change failed:", err?.message)
      const reuseMessage = getPasswordReuseMessage(err)
      if (reuseMessage) {
        setSecurity((current) => ({ ...current, currentPassword: "" }))
        setSecurityErrors({ newPassword: reuseMessage })
        setSaveMessage(null)
        return
      }
      setSecurity(initialSecurity)
      if (err?.message === "Current password is incorrect.") {
        setSecurityErrors({ currentPassword: err.message })
      } else {
        setSaveMessage({
          type: "error",
          text: "We couldn't update your password. Please try again.",
        })
      }
    } finally {
      passwordSaveInProgress.current = false
      setIsSaving(false)
    }
  }

  usePageMeta({
    title: "Firm Profile",
    breadcrumbs: [{ label: "Home", href: "/admin/dashboard" }],
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
              A
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">
                {profile.firmName}
              </h1>
              <p className="text-sm text-muted-foreground">
                License {profile.licenseNo} · Managed by {currentUser.name}
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
              role={saveMessage.type === "error" ? "alert" : "status"}
              aria-live={saveMessage.type === "error" ? "assertive" : "polite"}
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
              {/* items-stretch (not items-start) so both cards match height even though their
                  field content differs slightly — avoids the shorter card trailing off with dead space. */}
              <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
                {/* Firm Details: 3 field-rows */}
                <div className="flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm">
                  <h2 className="mb-5 text-sm font-semibold">
                    Firm Details
                  </h2>
                  <FieldGroup className="gap-5">
                    <Field>
                      <FieldLabel htmlFor="firmName">Firm Name</FieldLabel>
                      <Input
                        id="firmName"
                        name="firmName"
                        value={profile.firmName}
                        onChange={updateProfileField}
                        className={controlClass}
                      />
                    </Field>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field>
                        <FieldLabel htmlFor="licenseNo">License No.</FieldLabel>
                        <Input
                          id="licenseNo"
                          name="licenseNo"
                          value={profile.licenseNo}
                          onChange={updateProfileField}
                          className={controlClass}
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="firmType">Firm Type</FieldLabel>
                        <select
                          id="firmType"
                          name="firmType"
                          value={profile.firmType}
                          onChange={updateProfileField}
                          className={selectClass}
                        >
                          <option value="">Select Firm Type</option>
                          <option value="sole-practitioner">Sole Practitioner</option>
                          <option value="partnership">Partnership</option>
                          <option value="corporation">Corporation</option>
                        </select>
                      </Field>
                    </div>
                  </FieldGroup>
                </div>

                {/* Admin Contact: 3 field-rows — Contact Number moved here (was previously with Firm
                    Details), so both cards run the same number of rows and finish at the same height. */}
                <div className="flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm">
                  <h2 className="mb-5 text-sm font-semibold">
                    Admin Contact
                  </h2>
                  <FieldGroup className="gap-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field>
                        <FieldLabel htmlFor="firstName">First Name</FieldLabel>
                        <Input
                          id="firstName"
                          name="firstName"
                          value={profile.firstName}
                          onChange={updateProfileField}
                          className={controlClass}
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
                        <Input
                          id="lastName"
                          name="lastName"
                          value={profile.lastName}
                          onChange={updateProfileField}
                          className={controlClass}
                        />
                      </Field>
                    </div>

                    <Field>
                      <FieldLabel htmlFor="workEmail">Work Email</FieldLabel>
                      <Input
                        id="workEmail"
                        name="workEmail"
                        type="email"
                        value={profile.workEmail}
                        onChange={updateProfileField}
                        className={controlClass}
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="contactNumber">Contact Number</FieldLabel>
                      <Input
                        id="contactNumber"
                        name="contactNumber"
                        value={profile.contactNumber}
                        onChange={updateProfileField}
                        className={controlClass}
                      />
                    </Field>
                  </FieldGroup>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <h2 className="mb-5 text-sm font-semibold">Office Address</h2>
                <Field>
                  <FieldLabel htmlFor="address">Office Address</FieldLabel>
                  <Input
                    id="address"
                    name="address"
                    value={profile.address}
                    onChange={updateProfileField}
                    className={controlClass}
                  />
                </Field>
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
            <form
              onSubmit={handleSavePassword}
              noValidate
              className="flex flex-col gap-6"
            >
              {/* Same grid + col-span-2 wrapper pattern as ClientProfilePage's Security tab,
                  so the card sits on the same rail even though it's a single full-width block. */}
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
                  <div className="mb-5 flex items-center justify-between">
                    <h2 className="text-sm font-semibold">
                      Change Password
                    </h2>
                    <button
                      type="button"
                      onClick={() => setIsForgotPasswordOpen(true)}
                      className="flex cursor-pointer items-center gap-1.5 text-sm font-medium text-emerald-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                    >
                      <ShieldQuestion className="size-4" />
                      Forgot your current password?
                    </button>
                  </div>
                  <FieldGroup className="gap-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field data-invalid={Boolean(securityErrors.currentPassword) || undefined}>
                        <FieldLabel htmlFor="currentPassword">
                          Current Password<span className="text-red-500">*</span>
                        </FieldLabel>
                        <Input
                          id="currentPassword"
                          name="currentPassword"
                          type="password"
                          autoComplete="current-password"
                          value={security.currentPassword}
                          onValueChange={(value) => updateSecurityField("currentPassword", value)}
                          disabled={isSaving}
                          aria-required="true"
                          aria-invalid={Boolean(securityErrors.currentPassword) || undefined}
                          aria-describedby={securityErrors.currentPassword ? "current-password-error" : undefined}
                          className={controlClass}
                        />
                        <FieldError id="current-password-error">
                          {securityErrors.currentPassword}
                        </FieldError>
                      </Field>
                      <div />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field data-invalid={Boolean(securityErrors.newPassword) || undefined}>
                        <FieldLabel htmlFor="newPassword">
                          New Password<span className="text-red-500">*</span>
                        </FieldLabel>
                        <Input
                          id="newPassword"
                          name="newPassword"
                          type="password"
                          autoComplete="new-password"
                          value={security.newPassword}
                          onValueChange={(value) => updateSecurityField("newPassword", value)}
                          disabled={isSaving}
                          aria-required="true"
                          aria-invalid={Boolean(securityErrors.newPassword) || undefined}
                          aria-describedby={securityErrors.newPassword ? "new-password-error" : undefined}
                          className={controlClass}
                        />
                        <FieldError id="new-password-error">
                          {securityErrors.newPassword}
                        </FieldError>
                      </Field>
                      <Field data-invalid={Boolean(securityErrors.confirmPassword) || undefined}>
                        <FieldLabel htmlFor="confirmPassword">
                          Confirm New Password<span className="text-red-500">*</span>
                        </FieldLabel>
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          autoComplete="new-password"
                          value={security.confirmPassword}
                          onValueChange={(value) => updateSecurityField("confirmPassword", value)}
                          disabled={isSaving}
                          aria-required="true"
                          aria-invalid={Boolean(securityErrors.confirmPassword) || undefined}
                          aria-describedby={securityErrors.confirmPassword ? "confirm-password-error" : undefined}
                          className={controlClass}
                        />
                        <FieldError id="confirm-password-error">
                          {securityErrors.confirmPassword}
                        </FieldError>
                      </Field>
                    </div>
                    <ul className="flex flex-col gap-1 text-xs">
                      {passwordRequirements.map((requirement) => (
                        <li
                          key={requirement.key}
                          className={cn(
                            "flex items-center gap-2 transition-colors",
                            requirement.test(security.newPassword)
                              ? "text-emerald-700"
                              : "text-muted-foreground"
                          )}
                        >
                          {requirement.test(security.newPassword) ? (
                            <Check aria-hidden="true" className="size-3.5 shrink-0" />
                          ) : (
                            <X aria-hidden="true" className="size-3.5 shrink-0" />
                          )}
                          {requirement.label}
                        </li>
                      ))}
                    </ul>
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

      {isForgotPasswordOpen && (
        <AdminForgotPasswordModal
          floating
          onClose={() => setIsForgotPasswordOpen(false)}
        />
      )}
    </div>
  )
}