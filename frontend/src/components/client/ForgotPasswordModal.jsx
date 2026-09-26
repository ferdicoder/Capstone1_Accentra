import { useState } from "react"
import { X, Loader2, ShieldCheck } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

// import { requestPasswordResetOtp, verifyPasswordResetOtp, resetPassword } from "@/services/authService"

const passwordRequirements = [
  { key: "lowercase", label: "At least one lowercase letter", test: (pw) => /[a-z]/.test(pw) },
  { key: "uppercase", label: "At least one uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { key: "number", label: "At least one number", test: (pw) => /[0-9]/.test(pw) },
  { key: "minLength", label: "Minimum 8 characters", test: (pw) => pw.length >= 8 },
]

function isPasswordValid(password) {
  return passwordRequirements.every((req) => req.test(password))
}

// Same pattern SignupPage.jsx uses — requires a proper "name@domain.tld"
// shape, so something like "user@wras" (no dot/TLD) is rejected.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/

// Philippine mobile numbers: 11 digits total (e.g. 09123456789), shown with
// a fixed +63 prefix so the user only ever types the local 11-digit number.
const PH_PHONE_LENGTH = 11

const OTP_LENGTH = 6

const RESET_STEPS = {
  CHOOSE_METHOD: "choose-method",
  VERIFY_OTP: "verify-otp",
  NEW_PASSWORD: "new-password",
  SUCCESS: "success",
}

const initialResetState = {
  step: RESET_STEPS.CHOOSE_METHOD,
  method: "email", // "email" | "phone"
  contact: "",
  otp: "",
  resetToken: "",
  newPassword: "",
  confirmPassword: "",
  error: "",
  isSubmitting: false,
}

/**
 * Self-contained forgot-password flow: choose email/phone -> enter OTP ->
 * set new password -> success. Used from ClientProfilePage's Security tab
 * (and can be reused anywhere else — e.g. ClientLoginForm — by importing
 * this same component).
 */
export function ForgotPasswordModal({ open, onClose }) {
  const [reset, setReset] = useState(initialResetState)

  if (!open) return null

  const updateReset = (patch) => setReset((current) => ({ ...current, ...patch }))

  const handleClose = () => {
    setReset(initialResetState)
    onClose()
  }

  // Switching between Email/Phone clears both the contact field AND any
  // leftover error from the previous method — otherwise a stale error
  // (e.g. "Enter a valid mobile number") stays frozen on screen even
  // after the person has moved to a different tab entirely.
  const handleSelectMethod = (method) => {
    updateReset({ method, contact: "", error: "" })
  }

  // Email: no sanitization needed, validated on submit.
  // Phone: strip anything that isn't a digit as the user types (letters
  // can't appear at all), and hard-cap at 11 digits — same pattern as
  // SignupPage.jsx's contactNumber/zipCode sanitization.
  // Either way, typing again clears any previous error so it doesn't
  // linger once the person starts correcting their input.
  const handleContactChange = (event) => {
    const rawValue = event.target.value
    if (reset.method === "phone") {
      const digitsOnly = rawValue.replace(/\D/g, "").slice(0, PH_PHONE_LENGTH)
      updateReset({ contact: digitsOnly, error: "" })
      return
    }
    updateReset({ contact: rawValue, error: "" })
  }

  const handleSendOtp = async (event) => {
    event.preventDefault()
    updateReset({ error: "" })

    const contact = reset.contact.trim()

    if (!contact) {
      updateReset({ error: reset.method === "email" ? "Enter your email address." : "Enter your mobile number." })
      return
    }

    if (reset.method === "email" && !EMAIL_PATTERN.test(contact)) {
      updateReset({ error: "Enter a valid email address, e.g. example@gmail.com." })
      return
    }

    if (reset.method === "phone" && contact.length !== PH_PHONE_LENGTH) {
      updateReset({ error: "Enter a valid mobile number." })
      return
    }

    updateReset({ isSubmitting: true })
    try {
      // Send the full +63-prefixed number to the backend, e.g. "+639123456789".
      // const result = await requestPasswordResetOtp({
      //   method: reset.method,
      //   contact: reset.method === "phone" ? `+63${contact}` : contact,
      // })
      // if (result.error) {
      //   updateReset({ error: result.error, isSubmitting: false })
      //   return
      // }
      updateReset({ isSubmitting: false, step: RESET_STEPS.VERIFY_OTP })
    } catch (err) {
      console.error(err)
      updateReset({ error: "Failed to send code. Please try again.", isSubmitting: false })
    }
  }

  const handleVerifyOtp = async (event) => {
    event.preventDefault()
    updateReset({ error: "" })

    if (reset.otp.trim().length !== OTP_LENGTH) {
      updateReset({ error: `Enter the ${OTP_LENGTH}-digit code.` })
      return
    }

    updateReset({ isSubmitting: true })
    try {
      // const result = await verifyPasswordResetOtp({ method: reset.method, contact: reset.contact.trim(), otp: reset.otp.trim() })
      // if (result.error) {
      //   updateReset({ error: result.error, isSubmitting: false })
      //   return
      // }
      // updateReset({ resetToken: result.resetToken, isSubmitting: false, step: RESET_STEPS.NEW_PASSWORD })
      updateReset({ isSubmitting: false, step: RESET_STEPS.NEW_PASSWORD })
    } catch (err) {
      console.error(err)
      updateReset({ error: "Invalid or expired code.", isSubmitting: false })
    }
  }

  const handleResendOtp = async () => {
    updateReset({ error: "", isSubmitting: true })
    try {
      // const result = await requestPasswordResetOtp({ method: reset.method, contact: reset.contact.trim() })
      // if (result.error) {
      //   updateReset({ error: result.error, isSubmitting: false })
      //   return
      // }
      updateReset({ isSubmitting: false })
    } catch (err) {
      console.error(err)
      updateReset({ error: "Failed to resend code.", isSubmitting: false })
    }
  }

  const handleResetPassword = async (event) => {
    event.preventDefault()
    updateReset({ error: "" })

    if (!isPasswordValid(reset.newPassword)) {
      updateReset({ error: "Your password doesn't meet all requirements below." })
      return
    }
    if (reset.newPassword !== reset.confirmPassword) {
      updateReset({ error: "Passwords do not match." })
      return
    }

    updateReset({ isSubmitting: true })
    try {
      // const result = await resetPassword({ resetToken: reset.resetToken, newPassword: reset.newPassword })
      // if (result.error) {
      //   updateReset({ error: result.error, isSubmitting: false })
      //   return
      // }
      updateReset({ isSubmitting: false, step: RESET_STEPS.SUCCESS })
    } catch (err) {
      console.error(err)
      updateReset({ error: "Failed to reset password. Please try again.", isSubmitting: false })
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl ring-1 ring-black/5"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Reset your password</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {reset.step === RESET_STEPS.CHOOSE_METHOD && "We'll send a verification code to confirm it's you."}
              {reset.step === RESET_STEPS.VERIFY_OTP && `Enter the code we sent to your ${reset.method === "email" ? "email" : "phone"}.`}
              {reset.step === RESET_STEPS.NEW_PASSWORD && "Choose a new password for your account."}
              {reset.step === RESET_STEPS.SUCCESS && "You're all set."}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {reset.error && (
          <p className="mb-4 flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            <svg className="size-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            {reset.error}
          </p>
        )}

        {/* Step 1: choose email or phone */}
        {reset.step === RESET_STEPS.CHOOSE_METHOD && (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-5">
            <FieldGroup className="gap-2">
              <FieldLabel>Send code via</FieldLabel>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleSelectMethod("email")}
                  className={cn(
                    "rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors",
                    reset.method === "email"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                      : "border-input text-muted-foreground hover:bg-muted"
                  )}
                >
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectMethod("phone")}
                  className={cn(
                    "rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors",
                    reset.method === "phone"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                      : "border-input text-muted-foreground hover:bg-muted"
                  )}
                >
                  Phone number
                </button>
              </div>
            </FieldGroup>

            <Field>
              <FieldLabel htmlFor="resetContact">
                {reset.method === "email" ? "Email address" : "Mobile number"}
              </FieldLabel>

              {reset.method === "phone" ? (
                <div className="flex items-stretch overflow-hidden rounded-lg border border-input bg-background focus-within:ring-3 focus-within:ring-ring/50">
                  <span className="flex select-none items-center border-r border-input bg-muted px-3 text-sm font-medium text-muted-foreground">
                    +63
                  </span>
                  <Input
                    id="resetContact"
                    type="tel"
                    inputMode="numeric"
                    maxLength={PH_PHONE_LENGTH}
                    placeholder="9123456789"
                    value={reset.contact}
                    onChange={handleContactChange}
                    disabled={reset.isSubmitting}
                    className="rounded-none border-0 focus-visible:ring-0"
                  />
                </div>
              ) : (
                <Input
                  id="resetContact"
                  type="email"
                  placeholder="m@example.com"
                  value={reset.contact}
                  onChange={handleContactChange}
                  disabled={reset.isSubmitting}
                />
              )}

              {reset.method === "phone" && (
                <FieldDescription>
                  Enter your number.
                </FieldDescription>
              )}
            </Field>

            <Button
              type="submit"
              disabled={reset.isSubmitting}
              className="h-12 w-full rounded-2xl bg-linear-to-r from-[#0F3443] to-[#10B981] text-white hover:opacity-90 disabled:opacity-70"
            >
              {reset.isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="size-5 animate-spin" />
                  Sending code...
                </span>
              ) : (
                "Send code"
              )}
            </Button>
          </form>
        )}

        {/* Step 2: enter OTP */}
        {reset.step === RESET_STEPS.VERIFY_OTP && (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5">
            <Field>
              <FieldLabel htmlFor="resetOtp">Verification code</FieldLabel>
              <Input
                id="resetOtp"
                inputMode="numeric"
                maxLength={OTP_LENGTH}
                placeholder="••••••"
                value={reset.otp}
                onChange={(e) => updateReset({ otp: e.target.value.replace(/\D/g, ""), error: "" })}
                disabled={reset.isSubmitting}
                className="text-center text-lg tracking-[0.5em]"
              />
              <FieldDescription>
                Sent to {reset.method === "phone" && reset.contact ? `+63${reset.contact}` : reset.contact || (reset.method === "email" ? "your email" : "your phone")}.{" "}
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={reset.isSubmitting}
                  className="font-medium text-emerald-700 underline underline-offset-4 hover:text-emerald-800"
                >
                  Resend code
                </button>
              </FieldDescription>
            </Field>

            <Button
              type="submit"
              disabled={reset.isSubmitting}
              className="h-12 w-full rounded-2xl bg-linear-to-r from-[#0F3443] to-[#10B981] text-white hover:opacity-90 disabled:opacity-70"
            >
              {reset.isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="size-5 animate-spin" />
                  Verifying...
                </span>
              ) : (
                "Verify code"
              )}
            </Button>
          </form>
        )}

        {/* Step 3: set new password */}
        {reset.step === RESET_STEPS.NEW_PASSWORD && (
          <form onSubmit={handleResetPassword} className="flex flex-col gap-5">
            <Field>
              <FieldLabel htmlFor="resetNewPassword">New Password</FieldLabel>
              <Input
                id="resetNewPassword"
                type="password"
                value={reset.newPassword}
                onChange={(e) => updateReset({ newPassword: e.target.value, error: "" })}
                disabled={reset.isSubmitting}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="resetConfirmPassword">Confirm New Password</FieldLabel>
              <Input
                id="resetConfirmPassword"
                type="password"
                value={reset.confirmPassword}
                onChange={(e) => updateReset({ confirmPassword: e.target.value, error: "" })}
                disabled={reset.isSubmitting}
              />
            </Field>

            <div>
              <p className="mb-1.5 text-center text-sm font-bold">PASSWORD MUST CONTAIN:</p>
              <ul className="flex flex-col gap-1">
                {passwordRequirements.map((req) => {
                  const met = req.test(reset.newPassword)
                  return (
                    <li
                      key={req.key}
                      className={cn(
                        "flex items-center gap-2 text-sm",
                        met ? "text-emerald-600" : "text-red-600"
                      )}
                    >
                      <span className="w-4 shrink-0 text-center font-bold">{met ? "✔" : "✖"}</span>
                      {req.label}
                    </li>
                  )
                })}
              </ul>
            </div>

            <Button
              type="submit"
              disabled={reset.isSubmitting}
              className="h-12 w-full rounded-2xl bg-linear-to-r from-[#0F3443] to-[#10B981] text-white hover:opacity-90 disabled:opacity-70"
            >
              {reset.isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="size-5 animate-spin" />
                  Updating password...
                </span>
              ) : (
                "Reset password"
              )}
            </Button>
          </form>
        )}

        {/* Step 4: success */}
        {reset.step === RESET_STEPS.SUCCESS && (
          <div className="flex flex-col items-center gap-4 py-2 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-emerald-50">
              <ShieldCheck className="size-7 text-emerald-600" />
            </div>
            <p className="text-sm text-muted-foreground">
              Your password has been reset. You can now log in with your new password.
            </p>
            <Button
              onClick={handleClose}
              className="h-12 w-full rounded-2xl bg-linear-to-r from-[#0F3443] to-[#10B981] text-white hover:opacity-90"
            >
              Done
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}