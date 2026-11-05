import { useEffect, useRef, useState } from "react"
import { Check, Pencil, Save, ShieldQuestion, X } from "lucide-react"

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AdminForgotPasswordModal } from "@/components/firm/admin-forgot-password-modal"
import { scrollToFirstInvalidField } from "@/lib/form-validation"

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
  firmType: "sole-practitioner",
  contactNumber: "+63 917 001 0001",
}

const initialPaymentInformation = {
  paymentOption: "",
  accountName: "",
  accountNumber: "",
}

const initialSecurity = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
}

const tabs = [
  { key: "info", label: "Firm Information" },
  { key: "personal", label: "Personal Information" },
  { key: "payment", label: "Payment Information" },
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
  const [paymentInformation, setPaymentInformation] = useState(initialPaymentInformation)
  const [security, setSecurity] = useState(initialSecurity)
  const [securityErrors, setSecurityErrors] = useState({})
  const [editingTab, setEditingTab] = useState(null)
  const [confirmationOpen, setConfirmationOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const passwordSaveInProgress = useRef(false)
  const securityFormRef = useRef(null)
  const savedProfileRef = useRef(initialProfile)
  const savedPaymentInformationRef = useRef(initialPaymentInformation)
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

  const handleSaveInfo = (event) => {
    event.preventDefault()
    if (editingTab !== "info" && editingTab !== "personal") return
    setConfirmationOpen(true)
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
      scrollToFirstInvalidField(securityFormRef.current)
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

  const handleSavePaymentInformation = (event) => {
    event.preventDefault()
    if (editingTab !== "payment") return
    setConfirmationOpen(true)
  }

  const updatePaymentField = (event) => {
    const { name, value } = event.target
    setPaymentInformation((current) => ({ ...current, [name]: value }))
    setSaveMessage(null)
  }

  const cancelEditing = () => {
    if (editingTab === "info" || editingTab === "personal") {
      setProfile(savedProfileRef.current)
    } else if (editingTab === "payment") {
      setPaymentInformation(savedPaymentInformationRef.current)
    }
    setEditingTab(null)
    setConfirmationOpen(false)
    setSaveMessage(null)
  }

  const confirmChanges = () => {
    if (editingTab === "info" || editingTab === "personal") {
      savedProfileRef.current = { ...profile }
      setSaveMessage({
        type: "success",
        text: "Information updated successfully for this session.",
      })
    } else if (editingTab === "payment") {
      savedPaymentInformationRef.current = { ...paymentInformation }
      setSaveMessage({
        type: "success",
        text: "Payment information updated for this session.",
      })
    }
    setEditingTab(null)
    setConfirmationOpen(false)
  }

  usePageMeta({
    title: "Firm Profile",
    breadcrumbs: [{ label: "Dashboard", href: "/admin/dashboard" }],
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
                Managed by {currentUser.name}
              </p>
            </div>
          </div>

          <div className="flex gap-8 border-b">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  cancelEditing()
                  setActiveTab(tab.key)
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
              <div className="grid gap-6">
                <div className="flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm">
                  <h2 className="text-sm font-semibold">Firm Information</h2>
                  <p className="mb-5 mt-1 text-sm text-muted-foreground">
                    Details about your accounting firm.
                  </p>
                  <FieldGroup className="gap-5">
                    <Field>
                      <FieldLabel htmlFor="firmName">Firm Name</FieldLabel>
                      <Input
                        id="firmName"
                        name="firmName"
                        value={profile.firmName}
                        onChange={updateProfileField}
                        disabled={editingTab !== "info" || isSaving}
                        className={controlClass}
                      />
                    </Field>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field>
                        <FieldLabel htmlFor="firmType">Firm Type</FieldLabel>
                        <select
                          id="firmType"
                          name="firmType"
                          value={profile.firmType}
                          onChange={updateProfileField}
                          disabled={editingTab !== "info" || isSaving}
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

              </div>

              <div className="flex justify-end gap-2">
                {editingTab === "info" ? (
                  <>
                    <Button type="button" variant="outline" onClick={cancelEditing}>
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSaving}
                      className="gap-2 bg-forest-900 text-white hover:opacity-90"
                    >
                      <Save className="size-4" />
                      Save Changes
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    onClick={() => {
                      setSaveMessage(null)
                      setEditingTab("info")
                    }}
                    className="gap-2 bg-forest-900 text-white hover:opacity-90"
                  >
                    <Pencil className="size-4" />
                    Edit
                  </Button>
                )}
              </div>
            </form>
          )}

          {activeTab === "personal" && (
            <form onSubmit={handleSaveInfo} className="flex flex-col gap-6">
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <h2 className="text-sm font-semibold">Personal Information</h2>
                <p className="mb-5 mt-1 text-sm text-muted-foreground">
                  Contact details for the firm administrator.
                </p>
                <FieldGroup className="gap-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="firstName">First Name</FieldLabel>
                      <Input
                        id="firstName"
                        name="firstName"
                        value={profile.firstName}
                        onChange={updateProfileField}
                        disabled={editingTab !== "personal" || isSaving}
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
                        disabled={editingTab !== "personal" || isSaving}
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
                      disabled={editingTab !== "personal" || isSaving}
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
                      disabled={editingTab !== "personal" || isSaving}
                      className={controlClass}
                    />
                  </Field>
                </FieldGroup>
              </div>
              <div className="flex justify-end gap-2">
                {editingTab === "personal" ? (
                  <>
                    <Button type="button" variant="outline" onClick={cancelEditing}>
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSaving}
                      className="gap-2 bg-forest-900 text-white hover:opacity-90"
                    >
                      <Save className="size-4" />
                      Save Changes
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    onClick={() => {
                      setSaveMessage(null)
                      setEditingTab("personal")
                    }}
                    className="gap-2 bg-forest-900 text-white hover:opacity-90"
                  >
                    <Pencil className="size-4" />
                    Edit
                  </Button>
                )}
              </div>
            </form>
          )}

          {activeTab === "payment" && (
            <form onSubmit={handleSavePaymentInformation} className="flex flex-col gap-6">
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <h2 className="text-sm font-semibold">Payment Information</h2>
                <p className="mb-5 mt-1 text-sm text-muted-foreground">
                  Payment account details used for receiving payments.
                </p>
                <FieldGroup className="gap-5">
                  <Field>
                    <FieldLabel htmlFor="paymentOption">Payment Option</FieldLabel>
                    <select
                      id="paymentOption"
                      name="paymentOption"
                      value={paymentInformation.paymentOption}
                      onChange={updatePaymentField}
                      disabled={editingTab !== "payment" || isSaving}
                      className={selectClass}
                    >
                      <option value="">Select payment option</option>
                      <option value="gcash">GCash</option>
                      <option value="bank_transfer">Bank Transfer</option>
                    </select>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="accountName">Account Name</FieldLabel>
                    <Input
                      id="accountName"
                      name="accountName"
                      value={paymentInformation.accountName}
                      onChange={updatePaymentField}
                      disabled={editingTab !== "payment" || isSaving}
                      className={controlClass}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="accountNumber">Account Number</FieldLabel>
                    <Input
                      id="accountNumber"
                      name="accountNumber"
                      value={paymentInformation.accountNumber}
                      onChange={updatePaymentField}
                      disabled={editingTab !== "payment" || isSaving}
                      className={controlClass}
                    />
                  </Field>
                </FieldGroup>
              </div>
              <div className="flex justify-end gap-2">
                {editingTab === "payment" ? (
                  <>
                    <Button type="button" variant="outline" onClick={cancelEditing}>
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSaving}
                      className="gap-2 bg-forest-900 text-white hover:opacity-90"
                    >
                      <Save className="size-4" />
                      Save Changes
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    onClick={() => {
                      setSaveMessage(null)
                      setEditingTab("payment")
                    }}
                    className="gap-2 bg-forest-900 text-white hover:opacity-90"
                  >
                    <Pencil className="size-4" />
                    Edit
                  </Button>
                )}
              </div>
            </form>
          )}

          {activeTab === "security" && (
            <form
              ref={securityFormRef}
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
      <Dialog open={confirmationOpen} onOpenChange={setConfirmationOpen}>
        <DialogContent data-slot="firm-profile-save-confirmation">
          <DialogHeader>
            <DialogTitle>Confirm changes</DialogTitle>
            <DialogDescription>
              Save your changes to{" "}
              {editingTab === "info"
                ? "Firm Information"
                : editingTab === "personal"
                  ? "Personal Information"
                  : "Payment Information"}
              ? These changes apply to this session only.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmationOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmChanges}
              className="bg-forest-900 text-white hover:opacity-90"
            >
              Confirm and Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}