import { useRef, useState } from "react"
import { Pencil, Save, Trash2, Upload } from "lucide-react"

import { PageSkeleton } from "@/components/shared/loading/page-skeleton"
import { usePageMeta } from "@/hooks/usePageMeta"
import { cn } from "@/lib/utils"
import { firmLogoUrl } from "@/services/api/firmSettingsAPI"
import {
  useDeleteFirmLogoFile,
  useFetchFirmSettings,
  useUpdateFirmSettings,
  useUploadFirmLogo,
} from "@/hooks/useFirmSettings"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import { adminPersonalInfoSchema, firmSettingsSchema } from "@/schemas/profileSchema"

const currentUser = {
  name: "Carlo Reyes",
  email: "carlo@reyesassociates.ph",
  avatar: "",
}

// Personal Information tab is still local-only (mock); the Firm Information
// tab mirrors the public.firm_settings singleton.
const initialProfile = {
  firstName: "Carlo",
  lastName: "Reyes",
  workEmail: "carlo@reyesassociates.ph",
  contactNumber: "+63 917 001 0001",
}

const emptyFirmDraft = {
  firmName: "",
  contactEmail: "",
  about: "",
  termsAndConditions: "",
}

const tabs = [
  { key: "info", label: "Firm Information" },
  { key: "personal", label: "Personal Information" },
]

// Shared classes so every input on the page matches the shared Input
// (h-8, rounded-lg, neutral focus ring) used across the User Management module.
const controlClass = "w-full bg-background"

const MAX_LOGO_SIZE = 2 * 1024 * 1024

export default function FirmProfilePage() {
  const [activeTab, setActiveTab] = useState("info")
  const [profile, setProfile] = useState(initialProfile)
  const [formErrors, setFormErrors] = useState({})
  const [editingTab, setEditingTab] = useState(null)
  const [confirmationOpen, setConfirmationOpen] = useState(false)
  const [saveMessage, setSaveMessage] = useState(null)
  const [saving, setSaving] = useState(false)

  // Null while not editing: firmValues then falls back to the saved row, so
  // the form always mirrors firm_settings without a sync effect.
  const [firmDraft, setFirmDraft] = useState(null)
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState("")
  const [logoRemoved, setLogoRemoved] = useState(false)
  const [brokenLogoSrc, setBrokenLogoSrc] = useState(null)

  const profileFormRef = useRef(null)
  const logoInputRef = useRef(null)
  const savedProfileRef = useRef(initialProfile)

  const { data: settings, isLoading } = useFetchFirmSettings()
  const updateSettings = useUpdateFirmSettings()
  const uploadLogo = useUploadFirmLogo()
  const deleteLogo = useDeleteFirmLogoFile()

  const editing = editingTab === "info"
  const firmValues = editing && firmDraft
    ? firmDraft
    : {
        firmName: settings?.firmName ?? "",
        contactEmail: settings?.contactEmail ?? "",
        about: settings?.about ?? "",
        termsAndConditions: settings?.termsAndConditions ?? "",
      }
  const displayFirmName = editing
    ? firmValues.firmName
    : settings?.firmName || "Your Firm"
  const logoSrc = logoRemoved
    ? ""
    : logoPreview || (settings?.logoStorageKey ? firmLogoUrl : "")
  // Brokenness is keyed to the src, so a new src clears it without an effect.
  const logoBroken = Boolean(logoSrc) && brokenLogoSrc === logoSrc

  const updateProfileField = (event) => {
    const { name, value } = event.target
    const nextValue = name === "contactNumber"
      ? sanitizePhoneInput(value)
      : ["firstName", "lastName"].includes(name)
        ? sanitizeNameInput(value)
        : value
    setProfile((current) => ({ ...current, [name]: nextValue }))
    setFormErrors((current) => ({ ...current, [name]: undefined }))
  }

  const updateFirmField = (event) => {
    const { name, value } = event.target
    setFirmDraft((current) => ({ ...current, [name]: value }))
    setFormErrors((current) => ({ ...current, [name]: undefined }))
    setSaveMessage(null)
  }

  const handleLogoUpload = (event) => {
    const file = event.target.files?.[0]
    // Reset so selecting the same file again still triggers a change event.
    event.target.value = ""
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setFormErrors((current) => ({
        ...current,
        logo: "Please upload an image file (PNG, JPG, WebP or SVG).",
      }))
      return
    }

    if (file.size > MAX_LOGO_SIZE) {
      setFormErrors((current) => ({
        ...current,
        logo: "Logo must be 2 MB or smaller.",
      }))
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setFormErrors((current) => ({
          ...current,
          logo: "We couldn't read that file. Please try another image.",
        }))
        return
      }
      setLogoFile(file)
      setLogoPreview(reader.result)
      setLogoRemoved(false)
      setFormErrors((current) => ({ ...current, logo: undefined }))
      setSaveMessage(null)
    }
    reader.onerror = () => {
      setFormErrors((current) => ({
        ...current,
        logo: "We couldn't read that file. Please try another image.",
      }))
    }
    reader.readAsDataURL(file)
  }

  const removeLogo = () => {
    setLogoFile(null)
    setLogoPreview("")
    setLogoRemoved(true)
    setFormErrors((current) => ({ ...current, logo: undefined }))
    setSaveMessage(null)
  }

  const resetLogoState = () => {
    setLogoFile(null)
    setLogoPreview("")
    setLogoRemoved(false)
    setBrokenLogoSrc(null)
  }

  const handleSaveInfo = (event) => {
    event.preventDefault()
    if (editingTab !== "info" && editingTab !== "personal") return
    const schema = editingTab === "info" ? firmSettingsSchema : adminPersonalInfoSchema
    const values = editingTab === "info"
      ? {
          firmName: firmDraft.firmName,
          contactEmail: firmDraft.contactEmail,
          about: firmDraft.about,
          termsAndConditions: firmDraft.termsAndConditions,
        }
      : {
          firstName: profile.firstName,
          lastName: profile.lastName,
          workEmail: profile.workEmail,
          contactNumber: profile.contactNumber,
        }
    const errors = getZodFieldErrors(schema, values)
    setFormErrors(errors)
    if (Object.keys(errors).length > 0) {
      setSaveMessage({ type: "error", text: "Please correct the information before saving." })
      scrollToFirstInvalidField(profileFormRef.current)
      return
    }
    setSaveMessage(null)
    setConfirmationOpen(true)
  }

  const cancelEditing = () => {
    if (editingTab === "info") {
      if (settings) {
        setFirmDraft({
          firmName: settings.firmName,
          contactEmail: settings.contactEmail,
          about: settings.about,
          termsAndConditions: settings.termsAndConditions,
        })
      } else {
        setFirmDraft(emptyFirmDraft)
      }
      resetLogoState()
    } else if (editingTab === "personal") {
      setProfile(savedProfileRef.current)
    }
    setEditingTab(null)
    setConfirmationOpen(false)
    setFormErrors({})
    setSaveMessage(null)
    setSaving(false)
  }

  const confirmChanges = async () => {
    if (editingTab === "personal") {
      savedProfileRef.current = { ...profile }
      setSaveMessage({
        type: "success",
        text: "Information updated successfully for this session.",
      })
      setEditingTab(null)
      setConfirmationOpen(false)
      return
    }

    if (editingTab !== "info") return

    const previousLogo = {
      storageKey: settings?.logoStorageKey ?? null,
      fileId: settings?.logoB2FileId ?? null,
    }

    try {
      setSaving(true)
      let logoKeys = {
        logoStorageKey: previousLogo.storageKey,
        logoB2FileId: previousLogo.fileId,
        logoFileName: settings?.logoFileName ?? null,
        logoMimeType: settings?.logoMimeType ?? null,
      }

      if (logoFile) {
        const uploaded = await uploadLogo.mutateAsync(logoFile)
        logoKeys = {
          logoStorageKey: uploaded.storageKey,
          logoB2FileId: uploaded.b2FileId,
          logoFileName: uploaded.fileName,
          logoMimeType: uploaded.mimeType,
        }
      } else if (logoRemoved) {
        logoKeys = {
          logoStorageKey: null,
          logoB2FileId: null,
          logoFileName: null,
          logoMimeType: null,
        }
      }

      await updateSettings.mutateAsync({
        firmName: firmDraft.firmName.trim(),
        contactEmail: firmDraft.contactEmail.trim(),
        about: firmDraft.about,
        termsAndConditions: firmDraft.termsAndConditions,
        ...logoKeys,
      })

      // Best-effort cleanup of the superseded file once the row points elsewhere.
      if ((logoFile || logoRemoved) && previousLogo.storageKey && previousLogo.fileId) {
        try {
          await deleteLogo.mutateAsync(previousLogo)
        } catch (cleanupErr) {
          console.error("Previous logo cleanup failed:", cleanupErr)
        }
      }

      setSaveMessage({ type: "success", text: "Firm settings updated." })
      setEditingTab(null)
      resetLogoState()
      setConfirmationOpen(false)
    } catch (error) {
      console.error("Saving firm settings failed:", error)
      setSaveMessage({
        type: "error",
        text: error?.message || "Could not save firm settings. Please try again.",
      })
      setConfirmationOpen(false)
    } finally {
      setSaving(false)
    }
  }

  usePageMeta({
    title: "Firm Profile",
    breadcrumbs: [{ label: "Dashboard", href: "/admin/dashboard" }],
    hasUnreadNotifications: true,
  })

  const firmInitial = displayFirmName.trim().charAt(0).toUpperCase() || "A"
  const editingLabel = editingTab === "personal" ? "Personal Information" : "Firm Information"
  const avatarSrc = logoBroken ? "" : logoSrc

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-2">
      {isLoading ? (
        <PageSkeleton type="profile" />
      ) : (
        <>
          <div className="flex items-center gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-forest-900 text-sm font-semibold text-white">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={`${displayFirmName} logo`}
                  className="size-full object-cover"
                  onError={() => setBrokenLogoSrc(logoSrc)}
                />
              ) : (
                firmInitial
              )}
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">
                {displayFirmName}
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

          {!settings && (
            <div
              role="alert"
              className="rounded-lg bg-amber-500/10 px-4 py-2.5 text-sm text-amber-700 ring-1 ring-amber-500/20 ring-inset"
            >
              Firm settings not found. Run the firm_settings seed SQL before editing.
            </div>
          )}

          {activeTab === "info" && (
            <form ref={profileFormRef} onSubmit={handleSaveInfo} noValidate className="flex flex-col gap-6">
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-sm font-semibold">Firm Information</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Public details shown on the landing page, sidebar and signup terms.
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {editingTab === "info" ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={cancelEditing}
                          disabled={saving}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={saving || !settings}
                          className="gap-2 bg-forest-900 text-white hover:opacity-90"
                        >
                          <Save className="size-4" />
                          {saving ? "Saving..." : "Save Changes"}
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        className="gap-2"
                        disabled={!settings}
                        onClick={() => {
                          setFirmDraft({
                            firmName: settings.firmName,
                            contactEmail: settings.contactEmail,
                            about: settings.about,
                            termsAndConditions: settings.termsAndConditions,
                          })
                          resetLogoState()
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
                    {avatarSrc ? (
                      <img
                        src={avatarSrc}
                        alt={`${displayFirmName} logo`}
                        className="size-full object-contain"
                        onError={() => setBrokenLogoSrc(logoSrc)}
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
                          {settings?.logoStorageKey || logoPreview ? "Replace Logo" : "Upload Logo"}
                        </Button>
                        {(settings?.logoStorageKey || logoPreview) && !logoRemoved && (
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
                    {formErrors.logo && (
                      <p role="alert" className="mt-1 text-xs text-red-600">
                        {formErrors.logo}
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
                      value={firmValues.firmName}
                      onChange={updateFirmField}
                      disabled={!editing}
                      aria-invalid={Boolean(formErrors.firmName) || undefined}
                      data-invalid-field={formErrors.firmName ? "true" : undefined}
                      className={controlClass}
                    />
                    {formErrors.firmName && <FieldError>{formErrors.firmName}</FieldError>}
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="contactEmail">Contact Email</FieldLabel>
                    <Input
                      id="contactEmail"
                      name="contactEmail"
                      type="email"
                      value={firmValues.contactEmail}
                      onChange={updateFirmField}
                      disabled={!editing}
                      aria-invalid={Boolean(formErrors.contactEmail) || undefined}
                      data-invalid-field={formErrors.contactEmail ? "true" : undefined}
                      className={controlClass}
                    />
                    {formErrors.contactEmail && <FieldError>{formErrors.contactEmail}</FieldError>}
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="about">About</FieldLabel>
                    <Textarea
                      id="about"
                      name="about"
                      rows={4}
                      value={firmValues.about}
                      onChange={updateFirmField}
                      disabled={!editing}
                      placeholder="Short description of the firm shown on the landing page."
                      aria-invalid={Boolean(formErrors.about) || undefined}
                      data-invalid-field={formErrors.about ? "true" : undefined}
                      className={controlClass}
                    />
                    {formErrors.about && <FieldError>{formErrors.about}</FieldError>}
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="termsAndConditions">Terms and Conditions</FieldLabel>
                    <Textarea
                      id="termsAndConditions"
                      name="termsAndConditions"
                      rows={8}
                      value={firmValues.termsAndConditions}
                      onChange={updateFirmField}
                      disabled={!editing}
                      placeholder="Full terms shown to clients in the signup popup."
                      aria-invalid={Boolean(formErrors.termsAndConditions) || undefined}
                      data-invalid-field={formErrors.termsAndConditions ? "true" : undefined}
                      className={controlClass}
                    />
                    {formErrors.termsAndConditions && (
                      <FieldError>{formErrors.termsAndConditions}</FieldError>
                    )}
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
                        aria-invalid={Boolean(formErrors.firstName) || undefined}
                        data-invalid-field={formErrors.firstName ? "true" : undefined}
                        className={controlClass}
                      />
                      {formErrors.firstName && (
                        <FieldError>{formErrors.firstName}</FieldError>
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
                        aria-invalid={Boolean(formErrors.lastName) || undefined}
                        data-invalid-field={formErrors.lastName ? "true" : undefined}
                        className={controlClass}
                      />
                      {formErrors.lastName && (
                        <FieldError>{formErrors.lastName}</FieldError>
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
                      aria-invalid={Boolean(formErrors.contactNumber) || undefined}
                      data-invalid-field={formErrors.contactNumber ? "true" : undefined}
                      className={controlClass}
                    />
                    {formErrors.contactNumber && (
                      <FieldError>{formErrors.contactNumber}</FieldError>
                    )}
                  </Field>
                </FieldGroup>
              </div>
            </form>
          )}
        </>
      )}

      <Dialog open={confirmationOpen} onOpenChange={(open) => {
        if (!saving) setConfirmationOpen(open)
      }}>
        <DialogContent data-slot="firm-profile-save-confirmation">
          <DialogHeader>
            <DialogTitle>Confirm changes</DialogTitle>
            <DialogDescription>
              Save your changes to {editingLabel}? This updates the firm's
              public settings.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmationOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmChanges}
              disabled={saving}
              className="bg-forest-900 text-white hover:opacity-90"
            >
              {saving ? "Saving..." : "Confirm and Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
