import { useEffect, useRef, useState } from "react"
import { Pencil, Save, Trash2, Upload } from "lucide-react"

import { PageSkeleton } from "@/components/shared/loading/page-skeleton"
import { usePageMeta } from "@/hooks/usePageMeta"
import { cn } from "@/lib/utils"

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
import {
  getZodFieldErrors,
  sanitizeNameInput,
  sanitizePhoneInput,
  scrollToFirstInvalidField,
} from "@/lib/form-validation"
import {
  adminPersonalInfoSchema,
  firmInformationSchema,
} from "@/schemas/profileSchema"

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

const tabs = [
  { key: "info", label: "Firm Information" },
  { key: "personal", label: "Personal Information" },
]

// Shared classes so every input / select on the page matches the shared Input
// (h-8, rounded-lg, neutral focus ring) used across the User Management module.
const controlClass = "w-full bg-background"
const selectClass = cn(
  controlClass,
  "h-8 rounded-lg border border-input px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
)

const MAX_LOGO_SIZE = 2 * 1024 * 1024

export default function FirmProfilePage() {
  const [activeTab, setActiveTab] = useState("info")
  const [profile, setProfile] = useState(initialProfile)
  const [profileErrors, setProfileErrors] = useState({})
  const [editingTab, setEditingTab] = useState(null)
  const [confirmationOpen, setConfirmationOpen] = useState(false)
  const [saveMessage, setSaveMessage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [logoPreview, setLogoPreview] = useState("")
  const [logoError, setLogoError] = useState("")
  const profileFormRef = useRef(null)
  const logoInputRef = useRef(null)
  const savedProfileRef = useRef(initialProfile)
  const savedLogoRef = useRef("")

  // Simulated load so the shared skeleton system has something to show.
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  const updateProfileField = (event) => {
    const { name, value } = event.target
    const nextValue = name === "contactNumber"
      ? sanitizePhoneInput(value)
      : ["firstName", "lastName"].includes(name)
        ? sanitizeNameInput(value)
        : value
    setProfile((current) => ({ ...current, [name]: nextValue }))
    setProfileErrors((current) => ({ ...current, [name]: undefined }))
  }

  const handleLogoUpload = (event) => {
    const file = event.target.files?.[0]
    // Reset so selecting the same file again still triggers a change event.
    event.target.value = ""
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setLogoError("Please upload an image file (PNG, JPG, WebP or SVG).")
      return
    }

    if (file.size > MAX_LOGO_SIZE) {
      setLogoError("Logo must be 2 MB or smaller.")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setLogoError("We couldn't read that file. Please try another image.")
        return
      }
      setLogoPreview(reader.result)
      setLogoError("")
      setSaveMessage(null)
    }
    reader.onerror = () => {
      setLogoError("We couldn't read that file. Please try another image.")
    }
    reader.readAsDataURL(file)
  }

  const removeLogo = () => {
    setLogoPreview("")
    setLogoError("")
    setSaveMessage(null)
  }

  const handleSaveInfo = (event) => {
    event.preventDefault()
    if (editingTab !== "info" && editingTab !== "personal") return
    const schema = editingTab === "info" ? firmInformationSchema : adminPersonalInfoSchema
    const values = editingTab === "info"
      ? { firmName: profile.firmName, firmType: profile.firmType }
      : {
          firstName: profile.firstName,
          lastName: profile.lastName,
          workEmail: profile.workEmail,
          contactNumber: profile.contactNumber,
        }
    const errors = getZodFieldErrors(schema, values)
    setProfileErrors(errors)
    if (Object.keys(errors).length > 0) {
      setSaveMessage({ type: "error", text: "Please correct the information before saving." })
      scrollToFirstInvalidField(profileFormRef.current)
      return
    }
    setSaveMessage(null)
    setConfirmationOpen(true)
  }

  const cancelEditing = () => {
    if (editingTab === "info" || editingTab === "personal") {
      setProfile(savedProfileRef.current)
      setLogoPreview(savedLogoRef.current)
    }
    setEditingTab(null)
    setConfirmationOpen(false)
    setProfileErrors({})
    setLogoError("")
    setSaveMessage(null)
  }

  const confirmChanges = () => {
    if (editingTab === "info" || editingTab === "personal") {
      savedProfileRef.current = { ...profile }
      savedLogoRef.current = logoPreview
      setSaveMessage({
        type: "success",
        text: "Information updated successfully for this session.",
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

  const firmInitial = profile.firmName.trim().charAt(0).toUpperCase() || "A"
  const editingLabel = editingTab === "personal" ? "Personal Information" : "Firm Information"

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-2">
      {loading ? (
        <PageSkeleton type="profile" />
      ) : (
        <>
          <div className="flex items-center gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-forest-900 text-sm font-semibold text-white">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt={`${profile.firmName} logo`}
                  className="size-full object-cover"
                />
              ) : (
                firmInitial
              )}
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
            <form ref={profileFormRef} onSubmit={handleSaveInfo} className="flex flex-col gap-6">
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-sm font-semibold">Firm Information</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Details about your accounting firm.
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {editingTab === "info" ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={cancelEditing}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          className="gap-2 bg-forest-900 text-white hover:opacity-90"
                        >
                          <Save className="size-4" />
                          Save Changes
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        className="gap-2"
                        onClick={() => {
                          setSaveMessage(null)
                          setEditingTab("info")
                        }}
                      >
                        <Pencil className="size-4" />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>

                <div className="mb-5 flex items-center gap-4">
                  <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted text-lg font-semibold text-muted-foreground">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt={`${profile.firmName} logo`}
                        className="size-full object-contain"
                      />
                    ) : (
                      firmInitial
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Firm Logo</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      PNG, JPG, WebP or SVG. Max 2 MB.
                    </p>
                    {editingTab === "info" && (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <input
                          ref={logoInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/svg+xml"
                          className="hidden"
                          onChange={handleLogoUpload}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => logoInputRef.current?.click()}
                        >
                          <Upload className="size-3.5" />
                          Upload Logo
                        </Button>
                        {logoPreview && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-muted-foreground hover:text-foreground"
                            onClick={removeLogo}
                          >
                            <Trash2 className="size-3.5" />
                            Remove
                          </Button>
                        )}
                      </div>
                    )}
                    {logoError && (
                      <p role="alert" className="mt-1 text-xs text-red-600">
                        {logoError}
                      </p>
                    )}
                  </div>
                </div>

                <FieldGroup className="gap-5">
                  <Field>
                    <FieldLabel htmlFor="firmName">Firm Name</FieldLabel>
                    <Input
                      id="firmName"
                      name="firmName"
                      value={profile.firmName}
                      onChange={updateProfileField}
                      disabled={editingTab !== "info"}
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
                      disabled={editingTab !== "info"}
                      className={selectClass}
                    >
                      <option value="">Select Firm Type</option>
                      <option value="sole-practitioner">Sole Practitioner</option>
                      <option value="partnership">Partnership</option>
                      <option value="corporation">Corporation</option>
                    </select>
                  </Field>
                </FieldGroup>
              </div>
            </form>
          )}

          {activeTab === "personal" && (
            <form ref={profileFormRef} onSubmit={handleSaveInfo} noValidate className="flex flex-col gap-6">
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-sm font-semibold">Personal Information</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Contact details for the firm administrator.
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {editingTab === "personal" ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={cancelEditing}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          className="gap-2 bg-forest-900 text-white hover:opacity-90"
                        >
                          <Save className="size-4" />
                          Save Changes
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        className="gap-2"
                        onClick={() => {
                          setSaveMessage(null)
                          setEditingTab("personal")
                        }}
                      >
                        <Pencil className="size-4" />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>

                <FieldGroup className="gap-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="firstName">First Name</FieldLabel>
                      <Input
                        id="firstName"
                        name="firstName"
                        value={profile.firstName}
                        onChange={updateProfileField}
                        disabled={editingTab !== "personal"}
                        aria-invalid={Boolean(profileErrors.firstName) || undefined}
                        data-invalid-field={profileErrors.firstName ? "true" : undefined}
                        className={controlClass}
                      />
                      {profileErrors.firstName && (
                        <FieldError>{profileErrors.firstName}</FieldError>
                      )}
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
                      <Input
                        id="lastName"
                        name="lastName"
                        value={profile.lastName}
                        onChange={updateProfileField}
                        disabled={editingTab !== "personal"}
                        aria-invalid={Boolean(profileErrors.lastName) || undefined}
                        data-invalid-field={profileErrors.lastName ? "true" : undefined}
                        className={controlClass}
                      />
                      {profileErrors.lastName && (
                        <FieldError>{profileErrors.lastName}</FieldError>
                      )}
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
                      disabled={editingTab !== "personal"}
                      className={controlClass}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="contactNumber">Contact Number</FieldLabel>
                    <Input
                      id="contactNumber"
                      name="contactNumber"
                      type="tel"
                      inputMode="tel"
                      value={profile.contactNumber}
                      onChange={updateProfileField}
                      disabled={editingTab !== "personal"}
                      aria-invalid={Boolean(profileErrors.contactNumber) || undefined}
                      data-invalid-field={profileErrors.contactNumber ? "true" : undefined}
                      className={controlClass}
                    />
                    {profileErrors.contactNumber && (
                      <FieldError>{profileErrors.contactNumber}</FieldError>
                    )}
                  </Field>
                </FieldGroup>
              </div>
            </form>
          )}
        </>
      )}

      <Dialog open={confirmationOpen} onOpenChange={setConfirmationOpen}>
        <DialogContent data-slot="firm-profile-save-confirmation">
          <DialogHeader>
            <DialogTitle>Confirm changes</DialogTitle>
            <DialogDescription>
              Save your changes to {editingLabel}? These changes apply to this
              session only.
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
