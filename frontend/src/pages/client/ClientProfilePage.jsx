import { useEffect, useRef, useState } from "react"
import { Save, Lock, Loader2, FileEdit, Pencil } from "lucide-react"

import { PageSkeleton } from "@/components/shared/loading/page-skeleton"
import { usePageMeta } from "@/hooks/usePageMeta"
import { getZodFieldErrors, scrollToFirstInvalidField } from "@/lib/form-validation"
import { cn } from "@/lib/utils"
import { authStore } from "@/store/authStore"
import { useFetchMyBusiness, useUpdateMyBusiness, useCreateMyBusiness } from "@/hooks/useBusinesses"
import { useFetchMyProfile, useUpdateMyProfile } from "@/hooks/useMyProfile" // adjust to your hook file's path
import { clientBusinessProfileSchema, clientPersonalInfoSchema } from "@/schemas/profileSchema"

import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

// Shared classes so every input / select matches the shared Input used across
// the User Management module and the admin Firm Profile page.
const controlClass = "w-full bg-background"
const selectClass = cn(
  controlClass,
  "h-8 rounded-lg border border-input px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
)
// Visibly disabled look used for non-editable fields (same as the admin profile).
const readOnlyClass = cn(controlClass, "cursor-not-allowed bg-muted/50 text-muted-foreground")
const readOnlySelectClass = cn(selectClass, "cursor-not-allowed bg-muted/50 text-muted-foreground")

const TABS = [
  { id: "business", label: "Business Information" },
  { id: "personal", label: "Personal Information" },
]

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

// Which fields belong to which tab. Used for change detection and for Cancel
// (so cancelling one tab never touches the other tab's values).
// Email is intentionally NOT editable: it's the OTP-verified login identity.
const SECTION_FIELDS = {
  business: [
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
  ],
  // birthDate and email are display-only, so they are not in this list.
  personal: ["firstName", "middleName", "lastName"],
}

const DIGITS_ONLY_FIELDS = new Set(["zipCode"])
const NAME_FIELDS = new Set(["firstName", "middleName", "lastName"])
// Letters (incl. accented / ñ), spaces, periods, apostrophes, hyphens.
const INVALID_NAME_CHAR = /[^\p{L}\s.'-]/u

// --- Philippine mobile number: +63 9XX XXX XXXX --------------------------
const PH_MOBILE_MAX_DIGITS = 10
const TOO_MANY_DIGITS_MESSAGE = "Too many digits. A PH mobile number is 10 digits after +63"
const TOO_MANY_DIGITS_TIMEOUT_MS = 2000

function stripPhPrefix(rawValue) {
  let digits = String(rawValue ?? "").replace(/\D/g, "")
  if (digits.startsWith("63")) digits = digits.slice(2)
  else if (digits.startsWith("0")) digits = digits.slice(1)
  return digits
}

function toNationalMobile(rawValue) {
  return stripPhPrefix(rawValue).slice(0, PH_MOBILE_MAX_DIGITS)
}

function formatPhMobile(national) {
  return [national.slice(0, 3), national.slice(3, 6), national.slice(6, 10)]
    .filter(Boolean)
    .join(" ")
}

function getPhoneWarning(national) {
  if (!national) return ""
  if (national[0] !== "9") {
    return "Invalid phone number. PH mobile numbers start with 9 (e.g. +63 917 123 4567)."
  }
  if (national.length < PH_MOBILE_MAX_DIGITS) {
    return "Invalid phone number. Enter all 10 digits after +63."
  }
  return ""
}

// XXX-XXX-XXX-XXX (BIR's 12-digit online format), hyphens inserted as you type.
function formatTin(digitsOnly) {
  const groups = [
    digitsOnly.slice(0, 3),
    digitsOnly.slice(3, 6),
    digitsOnly.slice(6, 9),
    digitsOnly.slice(9, 12),
  ]
  return groups.filter(Boolean).join("-")
}

function getTinWarning(digitsOnly) {
  if (!digitsOnly) return ""
  if (digitsOnly.length < 9) return "Invalid TIN ID. Must be at least 9 digits."
  if (digitsOnly.length === 9) {
    return "This is a 9-digit TIN. Add 000 at the end to complete the 12-digit format."
  }
  if (digitsOnly.length < 12) return "Invalid TIN ID. Must be 9 or 12 digits."
  return ""
}

function getInitial(text) {
  return text?.trim()?.[0]?.toUpperCase() || "?"
}

// personal = row from public.users (useFetchMyProfile), falls back to the auth
// store user while it loads or if the row is missing.
// business = row from the businesses table (or null).
function buildProfile(user, personal, business) {
  const source = personal ?? user
  return {
    firstName: source?.firstName ?? "",
    middleName: source?.middleName ?? "",
    lastName: source?.lastName ?? "",
    birthDate: source?.birthDate ?? "",
    email: personal?.email || user?.email || "",
    businessName: business?.businessName ?? business?.name ?? "",
    businessType: business?.businessType ?? "",
    tin: business?.tin ?? business?.tinNo ?? "",
    industry: business?.industry ?? "",
    contactNumber: formatPhMobile(toNationalMobile(business?.contactNumber ?? business?.contactNo)),
    houseNo: business?.houseNo ?? "",
    streetName: business?.streetName ?? "",
    barangay: business?.barangay ?? "",
    district: business?.district ?? "",
    city: business?.city ?? "",
    zipCode: business?.zipCode ?? "",
  }
}

// --- Underline tabs (matches the admin Firm Profile tab bar) ---------------
function ProfileTabs({ tabs, activeTab, onChange }) {
  return (
    <div role="tablist" className="flex gap-6 border-b border-border">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            onClick={() => onChange(tab.id)}
            className={cn(
              "-mb-px border-b-2 pb-3 text-sm font-medium transition-colors",
              isActive
                ? "border-forest-900 text-forest-900"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

// Card header: title + description on the left, Edit button on the right
// (hidden while editing, like the admin profile).
function SectionHeader({ title, description, isEditing, onEdit, editLabel = "Edit" }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {!isEditing && (
        <Button type="button" variant="outline" size="sm" onClick={onEdit} className="gap-2">
          <Pencil className="size-3.5" />
          {editLabel}
        </Button>
      )}
    </div>
  )
}

// Cancel / Save footer shown only while a card is in edit mode.
function SectionActions({ isSaving, canSave, onCancel }) {
  return (
    <div className="mt-6 flex justify-end gap-2">
      <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
        Cancel
      </Button>
      <Button
        type="submit"
        disabled={isSaving || !canSave}
        className="gap-2 bg-forest-900 text-white hover:opacity-90 disabled:opacity-50"
      >
        {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        {isSaving ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  )
}

// --- Confirmation modal ---------------------------------------------------
function ConfirmationModal({
  open,
  icon: Icon,
  title,
  description,
  confirmLabel,
  isConfirming,
  onCancel,
  onConfirm,
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={isConfirming ? undefined : onCancel}
        aria-hidden="true"
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-description"
        className="relative w-full max-w-xs rounded-3xl border border-border bg-card pt-10 pb-6 px-6 text-center shadow-lg"
      >
        <div className="absolute left-1/2 top-0 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-amber-500 text-white shadow-md">
          <Icon className="size-7" />
        </div>

        <h2 id="confirm-modal-title" className="text-base font-bold text-foreground">
          {title}
        </h2>
        <p id="confirm-modal-description" className="mt-1.5 text-sm text-muted-foreground">
          {description}
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isConfirming}
            className="h-11 w-full gap-2 rounded-full bg-forest-900 text-white hover:opacity-90 disabled:opacity-60"
          >
            {isConfirming && <Loader2 className="size-4 animate-spin" />}
            {isConfirming ? "Saving..." : confirmLabel}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isConfirming}
            className="h-11 w-full rounded-full border-2 text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function ClientProfilePage() {
  const user = authStore((state) => state.user)
  const authLoading = authStore((state) => state.loading)

  const { data: business, isLoading: businessLoading } = useFetchMyBusiness(user?.id)
  const businessId = business?.id
  const updateBusiness = useUpdateMyBusiness(user?.id)
  const createBusiness = useCreateMyBusiness(user?.id)

  // Personal info: fetched from / saved to public.users.
  const { data: personalInfo, isLoading: personalLoading } = useFetchMyProfile(user?.id)
  const updateMyProfile = useUpdateMyProfile()

  const [activeTab, setActiveTab] = useState("business")
  // Each tab has its own edit mode, so editing one never unlocks the other.
  const [editing, setEditing] = useState({ business: false, personal: false })
  const [profile, setProfile] = useState(emptyProfile)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  // Which section's "Are you sure?" modal is open (null = closed).
  const [confirmSection, setConfirmSection] = useState(null)

  const savedProfileRef = useRef(emptyProfile)
  const formRefs = useRef({ business: null, personal: null })
  const tooManyDigitsTimerRef = useRef(null)

  const loading = authLoading || businessLoading || personalLoading

  useEffect(() => {
    return () => clearTimeout(tooManyDigitsTimerRef.current)
  }, [])

  // Keep the form synced to whoever is logged in.
  useEffect(() => {
    if (!loading) {
      const nextProfile = buildProfile(user, personalInfo, business)
      setProfile(nextProfile)
      savedProfileRef.current = nextProfile
    }
  }, [loading, user, personalInfo, business])

  const updateProfileField = (event) => {
    const { name, value } = event.target

    // --- Personal: names (letters only) ---
    if (NAME_FIELDS.has(name)) {
      const hasInvalidChar = INVALID_NAME_CHAR.test(value)
      const cleanValue = value.replace(new RegExp(INVALID_NAME_CHAR, "gu"), "")
      setFieldErrors((current) => ({
        ...current,
        [name]: hasInvalidChar ? "Letters only." : "",
      }))
      setProfile((current) => ({ ...current, [name]: cleanValue }))
      return
    }

    // --- Business: TIN ---
    if (name === "tin") {
      const hasInvalidChar = /[^\d-]/.test(value)
      const digitsOnly = value.replace(/\D/g, "").slice(0, 12)

      setFieldErrors((current) => ({
        ...current,
        tin: hasInvalidChar ? "Numbers only." : getTinWarning(digitsOnly),
      }))
      setProfile((current) => ({ ...current, tin: formatTin(digitsOnly) }))
      return
    }

    // --- Business: contact number ---
    if (name === "contactNumber") {
      const hasInvalidChar = /[^\d\s+\-()]/.test(value)
      const fullNational = stripPhPrefix(value)
      const national = fullNational.slice(0, PH_MOBILE_MAX_DIGITS)
      const hasTooManyDigits = fullNational.length > PH_MOBILE_MAX_DIGITS

      clearTimeout(tooManyDigitsTimerRef.current)

      setFieldErrors((current) => ({
        ...current,
        contactNumber: hasInvalidChar
          ? "Numbers only."
          : hasTooManyDigits
            ? TOO_MANY_DIGITS_MESSAGE
            : getPhoneWarning(national),
      }))

      if (hasTooManyDigits && !hasInvalidChar) {
        tooManyDigitsTimerRef.current = setTimeout(() => {
          setFieldErrors((current) =>
            current.contactNumber === TOO_MANY_DIGITS_MESSAGE
              ? { ...current, contactNumber: "" }
              : current
          )
        }, TOO_MANY_DIGITS_TIMEOUT_MS)
      }

      setProfile((current) => ({ ...current, contactNumber: formatPhMobile(national) }))
      return
    }

    // --- Business: digits-only fields (ZIP) ---
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

  const hasChanges = (section) =>
    SECTION_FIELDS[section].some((key) => profile[key] !== savedProfileRef.current[key])

  const hasBusinessChanges = hasChanges("business")
  const hasPersonalChanges = hasChanges("personal")

  const changeTab = (tabId) => {
    setSaveMessage(null)
    setActiveTab(tabId)
  }

  const startEditing = (section) => {
    setSaveMessage(null)
    setEditing((current) => ({ ...current, [section]: true }))
  }

  // Discard edits for ONE section only and return it to read-only.
  const cancelEditing = (section) => {
    clearTimeout(tooManyDigitsTimerRef.current)
    const saved = savedProfileRef.current
    setProfile((current) => {
      const next = { ...current }
      SECTION_FIELDS[section].forEach((key) => {
        next[key] = saved[key]
      })
      return next
    })
    setFieldErrors((current) => {
      const next = { ...current }
      SECTION_FIELDS[section].forEach((key) => delete next[key])
      return next
    })
    setSaveMessage(null)
    setEditing((current) => ({ ...current, [section]: false }))
  }

  // Step 1: validate the section's fields, then open the confirmation modal.
  const handleSaveSection = (section) => (event) => {
    event.preventDefault()
    setSaveMessage(null)

    if (!hasChanges(section)) {
      setSaveMessage({ type: "error", text: "No changes to save yet." })
      return
    }

    const validationErrors =
      section === "business"
        ? getZodFieldErrors(clientBusinessProfileSchema, {
            ...profile,
            contactNumber: profile.contactNumber.replace(/\D/g, ""),
          })
        : getZodFieldErrors(clientPersonalInfoSchema, profile)

    setFieldErrors((current) => ({ ...current, ...validationErrors }))
    if (Object.keys(validationErrors).length > 0) {
      setSaveMessage({ type: "error", text: "Please fix the highlighted fields before saving." })
      scrollToFirstInvalidField(formRefs.current[section])
      return
    }

    setConfirmSection(section)
  }

  // Step 2: runs only after "Yes" in the modal.
  const confirmSectionChange = async () => {
    const section = confirmSection
    if (!section) return
    if (!navigator.onLine) {
      setConfirmSection(null)
      setSaveMessage({
        type: "error",
        text: "You're offline. Check your connection and try again.",
      })
      return
    }

    setIsSaving(true)
    setSaveMessage(null)
    try {
      if (section === "business") {
        const phoneNational = profile.contactNumber.replace(/\D/g, "")
        const businessPayload = {
          userId: user?.id,
          businessName: profile.businessName,
          businessType: profile.businessType,
          tin: profile.tin,
          industry: profile.industry,
          contactNumber: phoneNational ? `+63${phoneNational}` : "",
          houseNo: profile.houseNo,
          streetName: profile.streetName,
          barangay: profile.barangay,
          district: profile.district,
          city: profile.city,
          zipCode: profile.zipCode,
        }

        const savedBusiness = businessId
          ? await updateBusiness.mutateAsync({ ...businessPayload, businessId })
          : await createBusiness.mutateAsync(businessPayload)

        // Pass personalInfo so the signature matches; only the business fields
        // are taken from the result below.
        const updatedProfile = buildProfile(user, personalInfo, savedBusiness)
        // Only take the business fields from the server response so unsaved
        // personal edits (if any) aren't overwritten.
        setProfile((current) => ({
          ...current,
          ...Object.fromEntries(SECTION_FIELDS.business.map((key) => [key, updatedProfile[key]])),
        }))
        savedProfileRef.current = {
          ...savedProfileRef.current,
          ...Object.fromEntries(SECTION_FIELDS.business.map((key) => [key, updatedProfile[key]])),
        }
        setSaveMessage({
          type: "success",
          text: businessId ? "Business information updated." : "Business added successfully.",
        })
      } else {
        const savedRow = await updateMyProfile.mutateAsync({
          userId: user?.id,
          firstName: profile.firstName.trim(),
          middleName: profile.middleName.trim(),
          lastName: profile.lastName.trim(),
        })

        const saved = {
          firstName: savedRow.firstName,
          middleName: savedRow.middleName,
          lastName: savedRow.lastName,
        }
        setProfile((current) => ({ ...current, ...saved }))
        savedProfileRef.current = { ...savedProfileRef.current, ...saved }
        setSaveMessage({ type: "success", text: "Personal information updated." })
      }

      setConfirmSection(null)
      setEditing((current) => ({ ...current, [section]: false }))
    } catch (err) {
      console.error(err)
      setConfirmSection(null)
      setSaveMessage({ type: "error", text: "Something went wrong. Please try again." })
    } finally {
      setIsSaving(false)
    }
  }

  usePageMeta({
    title: TABS.find((tab) => tab.id === activeTab)?.label ?? "Business Information",
    breadcrumbs: [{ label: "Account", href: "/client/profile" }],
    hasUnreadNotifications: true,
  })

  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ")
  const headerTitle = profile.businessName || fullName || "My Profile"
  const headerSubtitle = profile.businessName
    ? fullName
      ? `Owned by ${fullName}`
      : ""
    : "No business on file"

  const noBusinessYet = !businessId && !businessLoading

  // Field styling flips between editable and read-only per tab.
  const businessField = editing.business ? controlClass : readOnlyClass
  const businessSelect = editing.business ? selectClass : readOnlySelectClass
  const personalField = editing.personal ? controlClass : readOnlyClass

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-2">
      {loading ? (
        <PageSkeleton type="profile" />
      ) : (
        <>
          {/* Header: avatar + name + subtitle */}
          <div className="flex items-center gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-forest-900 text-sm font-semibold text-white">
              {getInitial(headerTitle)}
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">{headerTitle}</h1>
              {headerSubtitle && <p className="text-sm text-muted-foreground">{headerSubtitle}</p>}
            </div>
          </div>

          <ProfileTabs tabs={TABS} activeTab={activeTab} onChange={changeTab} />

          {saveMessage && (
            <div
              role={saveMessage.type === "error" ? "alert" : "status"}
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

          {/* ---------------- Business Information tab ---------------- */}
          {activeTab === "business" && (
            <form
              ref={(node) => {
                formRefs.current.business = node
              }}
              onSubmit={handleSaveSection("business")}
              id="panel-business"
              role="tabpanel"
              aria-labelledby="tab-business"
              className="rounded-xl border border-border bg-card p-6 shadow-sm"
            >
              <SectionHeader
                title="Business Information"
                description="Details of the business your firm provides services for."
                isEditing={editing.business}
                onEdit={() => startEditing("business")}
                editLabel={noBusinessYet ? "Add Business" : "Edit"}
              />

              {noBusinessYet && (
                <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 text-sm text-muted-foreground">
                  You haven't added a business yet. Click "Add Business", fill this in, and save.
                </div>
              )}

              <FieldGroup className="gap-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="businessName">Business Name</FieldLabel>
                    <Input
                      id="businessName"
                      name="businessName"
                      value={profile.businessName}
                      onChange={updateProfileField}
                      disabled={!editing.business}
                      className={businessField}
                      aria-invalid={Boolean(fieldErrors.businessName)}
                    />
                    {fieldErrors.businessName && (
                      <FieldDescription className="text-red-600">
                        {fieldErrors.businessName}
                      </FieldDescription>
                    )}
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="businessType">Type of Business</FieldLabel>
                    <select
                      id="businessType"
                      name="businessType"
                      value={profile.businessType}
                      onChange={updateProfileField}
                      disabled={!editing.business}
                      className={businessSelect}
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
                    <FieldLabel htmlFor="tin">TIN Number</FieldLabel>
                    <Input
                      id="tin"
                      name="tin"
                      inputMode="numeric"
                      placeholder="123-456-789-000"
                      maxLength={15}
                      value={profile.tin}
                      onChange={updateProfileField}
                      disabled={!editing.business}
                      className={businessField}
                      aria-invalid={Boolean(fieldErrors.tin)}
                    />
                    {(editing.business || fieldErrors.tin) && (
                      <FieldDescription className={fieldErrors.tin ? "text-red-600" : undefined}>
                        {fieldErrors.tin || "12 digits, e.g. 123-456-789-000."}
                      </FieldDescription>
                    )}
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="industry">Industry</FieldLabel>
                    <select
                      id="industry"
                      name="industry"
                      value={profile.industry}
                      onChange={updateProfileField}
                      disabled={!editing.business}
                      className={businessSelect}
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
                  <div className="flex">
                    <span className="inline-flex h-8 shrink-0 items-center rounded-l-lg border border-r-0 border-input bg-muted px-3 text-sm font-medium text-muted-foreground">
                      +63
                    </span>
                    {/* No maxLength on purpose: the browser would block the 11th
                        keystroke before onChange fires, so the "too many digits"
                        warning could never appear. */}
                    <Input
                      id="contactNumber"
                      name="contactNumber"
                      type="tel"
                      inputMode="numeric"
                      placeholder="9XX XXX XXXX"
                      value={profile.contactNumber}
                      onChange={updateProfileField}
                      disabled={!editing.business}
                      className={cn(businessField, "rounded-l-none")}
                      aria-invalid={Boolean(fieldErrors.contactNumber)}
                    />
                  </div>
                  {fieldErrors.contactNumber && (
                    <FieldDescription className="text-red-600">
                      {fieldErrors.contactNumber}
                    </FieldDescription>
                  )}
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="houseNo">House/Bldg./Unit No.</FieldLabel>
                    <Input
                      id="houseNo"
                      name="houseNo"
                      value={profile.houseNo}
                      onChange={updateProfileField}
                      disabled={!editing.business}
                      className={businessField}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="streetName">Street Name</FieldLabel>
                    <Input
                      id="streetName"
                      name="streetName"
                      value={profile.streetName}
                      onChange={updateProfileField}
                      disabled={!editing.business}
                      className={businessField}
                    />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="barangay">Barangay</FieldLabel>
                    <Input
                      id="barangay"
                      name="barangay"
                      value={profile.barangay}
                      onChange={updateProfileField}
                      disabled={!editing.business}
                      className={businessField}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="district">District</FieldLabel>
                    <Input
                      id="district"
                      name="district"
                      value={profile.district}
                      onChange={updateProfileField}
                      disabled={!editing.business}
                      className={businessField}
                    />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="city">City / Municipality</FieldLabel>
                    <Input
                      id="city"
                      name="city"
                      value={profile.city}
                      onChange={updateProfileField}
                      disabled={!editing.business}
                      className={businessField}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="zipCode">ZIP Code</FieldLabel>
                    <Input
                      id="zipCode"
                      name="zipCode"
                      inputMode="numeric"
                      maxLength={4}
                      value={profile.zipCode}
                      onChange={updateProfileField}
                      disabled={!editing.business}
                      className={businessField}
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

              {editing.business && (
                <SectionActions
                  isSaving={isSaving}
                  canSave={hasBusinessChanges}
                  onCancel={() => cancelEditing("business")}
                />
              )}
            </form>
          )}

          {/* ---------------- Personal Information tab ---------------- */}
          {activeTab === "personal" && (
            <form
              ref={(node) => {
                formRefs.current.personal = node
              }}
              onSubmit={handleSaveSection("personal")}
              id="panel-personal"
              role="tabpanel"
              aria-labelledby="tab-personal"
              className="rounded-xl border border-border bg-card p-6 shadow-sm"
            >
              <SectionHeader
                title="Personal Information"
                description="Your name on file with the firm. Birthdate and email are locked."
                isEditing={editing.personal}
                onEdit={() => startEditing("personal")}
              />

              <FieldGroup className="gap-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="firstName">First Name</FieldLabel>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={profile.firstName}
                      onChange={updateProfileField}
                      disabled={!editing.personal}
                      className={personalField}
                      aria-invalid={Boolean(fieldErrors.firstName)}
                    />
                    {fieldErrors.firstName && (
                      <FieldDescription className="text-red-600">
                        {fieldErrors.firstName}
                      </FieldDescription>
                    )}
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="middleName">Middle Name</FieldLabel>
                    <Input
                      id="middleName"
                      name="middleName"
                      value={profile.middleName}
                      onChange={updateProfileField}
                      disabled={!editing.personal}
                      className={personalField}
                      aria-invalid={Boolean(fieldErrors.middleName)}
                    />
                    {fieldErrors.middleName && (
                      <FieldDescription className="text-red-600">
                        {fieldErrors.middleName}
                      </FieldDescription>
                    )}
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={profile.lastName}
                      onChange={updateProfileField}
                      disabled={!editing.personal}
                      className={personalField}
                      aria-invalid={Boolean(fieldErrors.lastName)}
                    />
                    {fieldErrors.lastName && (
                      <FieldDescription className="text-red-600">
                        {fieldErrors.lastName}
                      </FieldDescription>
                    )}
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="birthDate" className="flex items-center gap-1.5">
                      Birthdate
                      <Lock className="size-3 text-muted-foreground" aria-hidden="true" />
                    </FieldLabel>
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

                {/* Email stays locked: it's the OTP-verified login identity. */}
                <Field>
                  <FieldLabel htmlFor="email" className="flex items-center gap-1.5">
                    Email Address
                    <Lock className="size-3 text-muted-foreground" aria-hidden="true" />
                  </FieldLabel>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={profile.email}
                    readOnly
                    disabled
                    className={readOnlyClass}
                  />
                  <FieldDescription>
                    Your email is verified and can't be changed here. Contact your firm or support
                    if it needs to be updated.
                  </FieldDescription>
                </Field>
              </FieldGroup>

              {editing.personal && (
                <SectionActions
                  isSaving={isSaving}
                  canSave={hasPersonalChanges}
                  onCancel={() => cancelEditing("personal")}
                />
              )}
            </form>
          )}
        </>
      )}

      <ConfirmationModal
        open={confirmSection !== null}
        icon={FileEdit}
        title={
          confirmSection === "business" && !businessId ? "Add Business?" : "Change Information?"
        }
        description={
          confirmSection === "business"
            ? businessId
              ? "Are you sure you want to change your business information?"
              : "Add this business to your account?"
            : "Are you sure you want to change your personal information?"
        }
        confirmLabel="Yes"
        isConfirming={isSaving}
        onCancel={() => setConfirmSection(null)}
        onConfirm={confirmSectionChange}
      />
    </div>
  )
}