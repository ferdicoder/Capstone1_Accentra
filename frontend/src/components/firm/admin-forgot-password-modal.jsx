import { Fragment, useCallback, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Check, Eye, EyeOff, Loader2, ShieldCheck, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DialogFooter,
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { authStore } from "@/store/authStore"
import { supabase } from "@/config/supabase"
import { isPasswordValid, passwordRequirements } from "@/lib/passwordRequirements"
import {
  PASSWORD_RECOVERY_OTP_LENGTH,
  requestPasswordRecovery,
  updateRecoveredPassword,
  verifyPasswordRecoveryOtp,
  getPasswordReuseMessage,
} from "@/services/authService"

// Same shape the app already uses for its OTP step (see
// components/client/ForgotPasswordModal.jsx) and Supabase Auth's email OTP.
const OTP_LENGTH = PASSWORD_RECOVERY_OTP_LENGTH

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/

const RECOVERY_STEPS = {
  EMAIL: "email",
  OTP: "otp",
  PASSWORD: "password",
  SUCCESS: "success",
}

// Visible progress order for the three input steps.
const STEP_ORDER = [RECOVERY_STEPS.EMAIL, RECOVERY_STEPS.OTP, RECOVERY_STEPS.PASSWORD]
const STEP_LABELS = ["Email", "Code", "Password"]

/** Shared input styling so every field matches the rest of the auth screens. */
const controlClass = "w-full bg-background"

/**
 * Numeric one-time-password input.
 *
 * Six single-character boxes that behave like one field: typing advances,
 * backspace walks backwards, and a pasted (or autofilled) code is spread
 * across the boxes.
 */
function OtpCodeInput({ value, onChange, length, disabled = false, invalid = false, describedBy }) {
  const inputRefs = useRef([])

  const focusAt = (index) => {
    const element = inputRefs.current[index]
    if (element) element.focus()
  }

  const spreadInto = (digits, startIndex) => {
    const next = [...value]
    let cursor = startIndex
    for (const digit of digits) {
      if (cursor >= length) break
      next[cursor] = digit
      cursor += 1
    }
    onChange(next)
    focusAt(Math.min(cursor, length - 1))
  }

  const handleChange = (index, event) => {
    const typed = (event.target.value ?? "").replace(/\D/g, "")
    if (!typed) {
      const next = [...value]
      next[index] = ""
      onChange(next)
      return
    }

    // Typing over a digit that is already in the box replaces it. A code that
    // arrives in one go (autofill or paste) into an empty box is spread
    // across the boxes instead.
    if (value[index] && typed.length > 1) {
      const next = [...value]
      next[index] = typed[typed.length - 1]
      onChange(next)
      focusAt(Math.min(index + 1, length - 1))
      return
    }

    spreadInto(typed, index)
  }

  const handleKeyDown = (index, event) => {
    if (event.key === "Backspace") {
      if (value[index]) return
      event.preventDefault()
      const previous = Math.max(0, index - 1)
      const next = [...value]
      next[previous] = ""
      onChange(next)
      focusAt(previous)
      return
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault()
      focusAt(Math.max(0, index - 1))
      return
    }
    if (event.key === "ArrowRight") {
      event.preventDefault()
      focusAt(Math.min(length - 1, index + 1))
    }
  }

  const handlePaste = (index, event) => {
    event.preventDefault()
    const pasted = (event.clipboardData?.getData("text") ?? "").replace(/\D/g, "")
    if (!pasted) return
    spreadInto(pasted, index)
  }

  return (
    <div
      role="group"
      aria-label={`${length}-digit verification code`}
      aria-describedby={describedBy}
      className="flex w-full min-w-0 gap-2 overflow-visible px-1 py-1"
    >
      {value.map((digit, index) => (
        <Input
          key={index}
          ref={(element) => {
            inputRefs.current[index] = element
          }}
          value={digit}
          onChange={(event) => handleChange(index, event)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={(event) => handlePaste(index, event)}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          aria-label={`Digit ${index + 1}`}
          aria-invalid={invalid || undefined}
          disabled={disabled}
          className="h-11 min-w-0 flex-1 px-0 text-center text-lg font-semibold tabular-nums sm:text-xl"
        />
      ))}
    </div>
  )
}

/**
 * Admin password recovery.
 *
 * Guided three-step flow built on Supabase Auth's own recovery APIs:
 * request a code by email -> verify the numeric code -> set a new password.
 *
 * Every step is only advanced when the server confirms it, so the UI never
 * claims a reset happened that did not.
 */
export function AdminForgotPasswordModal({ onClose, floating = false }) {
  const navigate = useNavigate()

  const [step, setStep] = useState(RECOVERY_STEPS.EMAIL)
  const [email, setEmail] = useState("")
  const [code, setCode] = useState(() => Array(OTP_LENGTH).fill(""))
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState("")
  const [notice, setNotice] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const stepIndex = STEP_ORDER.indexOf(step)

  const resetState = useCallback(() => {
    setStep(RECOVERY_STEPS.EMAIL)
    setEmail("")
    setCode(Array(OTP_LENGTH).fill(""))
    setPassword("")
    setConfirmPassword("")
    setShowPassword(false)
    setErrors({})
    setFormError("")
    setNotice("")
    setIsSubmitting(false)
  }, [])

  const handleClose = useCallback(() => {
    resetState()
    onClose?.()
  }, [onClose, resetState])

  useEffect(() => {
    if (!floating) return undefined

    const handleKeyDown = (event) => {
      if (event.key === "Escape") handleClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [floating, handleClose])

  const goBackToSignIn = () => {
    handleClose()
    navigate("/firm/signin")
  }

  // ── Step 1: request the recovery code ─────────────────────────────────────
  const handleRequestCode = async (event) => {
    event.preventDefault()

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setErrors({ email: "Enter your email address." })
      return
    }
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setErrors({ email: "Enter a valid email address, e.g. admin@firm.ph." })
      return
    }

    setErrors({})
    setFormError("")
    setNotice("")
    setIsSubmitting(true)

    try {
      await requestPasswordRecovery({
        email: trimmedEmail,
        redirectTo: `${window.location.origin}/firm/signin`,
      })
      setEmail(trimmedEmail)
      setStep(RECOVERY_STEPS.OTP)
      // Deliberately does not reveal whether the address is registered.
      setNotice(
        `If an account exists for ${trimmedEmail}, we've sent a ${OTP_LENGTH}-digit code to it.`
      )
    } catch (err) {
      console.error("Password recovery request failed:", err?.message)
      setFormError(
        "We couldn't start the recovery process right now. Please try again in a moment."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResendCode = async () => {
    setFormError("")
    setNotice("")
    setIsSubmitting(true)

    try {
      await requestPasswordRecovery({
        email,
        redirectTo: `${window.location.origin}/firm/signin`,
      })
      setNotice(`If an account exists for ${email}, we've sent a new code to it.`)
    } catch (err) {
      console.error("Password recovery resend failed:", err?.message)
      setFormError("We couldn't resend the code right now. Please try again in a moment.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Step 2: verify the code ──────────────────────────────────────────────
  const handleVerifyCode = async (event) => {
    event.preventDefault()

    const token = code.join("")
    if (token.length !== OTP_LENGTH) {
      setErrors({ code: `Enter all ${OTP_LENGTH} digits of the code.` })
      return
    }

    setErrors({})
    setFormError("")
    setIsSubmitting(true)

    try {
      await verifyPasswordRecoveryOtp({ email, token })
      setStep(RECOVERY_STEPS.PASSWORD)
      setNotice("")
    } catch (err) {
      console.error("Password recovery code verification failed:", err?.message)
      setErrors({ code: "That code isn't valid or has expired. Check it and try again." })
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Step 3: set the new password ─────────────────────────────────────────
  const handleUpdatePassword = async (event) => {
    event.preventDefault()

    const nextErrors = {}

    if (!password) {
      nextErrors.password = "Enter a new password."
    } else if (!isPasswordValid(password)) {
      nextErrors.password = "Your password doesn't meet all the requirements below."
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = "Re-enter your new password."
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match."
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setFormError("")
    setIsSubmitting(true)

    try {
      await updateRecoveredPassword({ password })

      // The recovery session must not leave the user signed in — they have to
      // sign in with their new password.
      await supabase.auth.signOut()
      authStore.getState().clearAuth()

      setStep(RECOVERY_STEPS.SUCCESS)
    } catch (err) {
      console.error("Password update failed:", err?.message)
      setErrors((current) => ({
        ...current,
        password: getPasswordReuseMessage(err) ?? undefined,
      }))
      setFormError(
        getPasswordReuseMessage(err) ??
          "We couldn't update your password. Please try again."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const passwordChecks = passwordRequirements.map((requirement) => ({
    ...requirement,
    met: requirement.test(password),
  }))

  const title = {
    [RECOVERY_STEPS.EMAIL]: "Reset your password",
    [RECOVERY_STEPS.OTP]: "Enter your verification code",
    [RECOVERY_STEPS.PASSWORD]: "Choose a new password",
    [RECOVERY_STEPS.SUCCESS]: "Your password has been reset",
  }[step]

  const description = {
    [RECOVERY_STEPS.EMAIL]:
      "Enter the email address registered to your firm account and we'll send you a verification code.",
    [RECOVERY_STEPS.OTP]: `Enter the ${OTP_LENGTH}-digit code we emailed to ${email}.`,
    [RECOVERY_STEPS.PASSWORD]:
      "Your new password must meet the requirements listed below.",
    [RECOVERY_STEPS.SUCCESS]:
      "You can now sign in to Accentra with your new password.",
  }[step]

  const recoveryContent = (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
        {step !== RECOVERY_STEPS.SUCCESS && (
          <div
            className="border-b border-border pb-4"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Step {stepIndex + 1} of {STEP_ORDER.length}
              </span>
              <div className="flex flex-1 items-center justify-end gap-2">
                {STEP_ORDER.map((orderStep, index) => (
                  <Fragment key={orderStep}>
                    <span
                      aria-hidden="true"
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                        index < stepIndex && "border-forest-900 bg-forest-900 text-white",
                        index === stepIndex && "border-forest-900 text-forest-900",
                        index > stepIndex && "border-border text-muted-foreground"
                      )}
                    >
                      {index < stepIndex ? (
                        <Check className="size-3.5" />
                      ) : (
                        index + 1
                      )}
                    </span>
                    {index < STEP_ORDER.length - 1 && (
                      <span
                        aria-hidden="true"
                        className={cn(
                          "h-px flex-1 transition-colors",
                          index < stepIndex ? "bg-forest-900" : "bg-border"
                        )}
                      />
                    )}
                  </Fragment>
                ))}
              </div>
            </div>
            <p className="sr-only">
              Step {stepIndex + 1} of {STEP_ORDER.length}: {STEP_LABELS[stepIndex]}
            </p>
          </div>
        )}

        <div className="flex flex-col items-center text-center">
          <h1 id="recovery-title" className="text-2xl font-bold">{title}</h1>
          <p className="text-xs text-balance text-muted-foreground">{description}</p>
        </div>

        {step === RECOVERY_STEPS.EMAIL && (
          <form
            onSubmit={handleRequestCode}
            noValidate
            className={cn(
              "flex min-w-0 flex-1 flex-col gap-5 overflow-visible"
            )}
          >
            <FieldGroup className="flex-1">
              <Field data-invalid={Boolean(errors.email) || undefined}>
                <FieldLabel htmlFor="recovery-email">Email address</FieldLabel>
                <Input
                  id="recovery-email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="admin@firm.ph"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    if (errors.email) setErrors((current) => ({ ...current, email: undefined }))
                    if (formError) setFormError("")
                  }}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.email) || undefined}
                  className={cn(controlClass, errors.email && "border-destructive")}
                />
                <FieldError>{errors.email}</FieldError>
                <FieldDescription>
                  Use the email address associated with the firm account you want
                  to recover.
                </FieldDescription>
              </Field>
            </FieldGroup>

            {formError && (
              <p role="alert" className="text-sm text-destructive">
                {formError}
              </p>
            )}

            <DialogFooter className="mt-auto flex-row justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-forest-900 text-white hover:opacity-90"
              >
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                {isSubmitting ? "Sending…" : "Send code"}
              </Button>
            </DialogFooter>
          </form>
        )}

        {step === RECOVERY_STEPS.OTP && (
          <form
            onSubmit={handleVerifyCode}
            className={cn(
              "flex min-w-0 flex-1 flex-col gap-5 overflow-visible"
            )}
          >
            {notice && (
              <p
                role="status"
                className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 ring-1 ring-emerald-500/20 ring-inset"
              >
                {notice}
              </p>
            )}

            <FieldGroup>
              <Field data-invalid={Boolean(errors.code) || undefined}>
                <FieldLabel id="recovery-code-label">Verification code</FieldLabel>
                <OtpCodeInput
                  value={code}
                  onChange={(next) => {
                    setCode(next)
                    if (errors.code) setErrors((current) => ({ ...current, code: undefined }))
                    if (formError) setFormError("")
                  }}
                  length={OTP_LENGTH}
                  disabled={isSubmitting}
                  invalid={Boolean(errors.code)}
                  describedBy="recovery-code-hint"
                />
                <FieldDescription id="recovery-code-hint">
                  {OTP_LENGTH} digits, numbers only.
                </FieldDescription>
                <FieldError>{errors.code}</FieldError>
              </Field>
            </FieldGroup>

            {formError && (
              <p role="alert" className="text-sm text-destructive">
                {formError}
              </p>
            )}

            <DialogFooter className="mt-0 flex-row items-center justify-between gap-2">
              <Button
                type="button"
                variant="ghost"
                disabled={isSubmitting}
                onClick={() => {
                  setStep(RECOVERY_STEPS.EMAIL)
                  setErrors({})
                  setFormError("")
                  setNotice("")
                }}
                className="gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="size-4" />
                Back
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={handleResendCode}
                >
                  Resend code
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-forest-900 text-white hover:opacity-90"
                >
                  {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                  {isSubmitting ? "Verifying…" : "Verify code"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        )}

        {step === RECOVERY_STEPS.PASSWORD && (
          <form
            onSubmit={handleUpdatePassword}
            className={cn(
              "flex min-w-0 flex-1 flex-col gap-5 overflow-visible"
            )}
          >
            <FieldGroup>
              <Field data-invalid={Boolean(errors.password) || undefined}>
                <FieldLabel htmlFor="recovery-new-password">New password</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="recovery-new-password"
                    name="newPassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value)
                      if (errors.password)
                        setErrors((current) => ({ ...current, password: undefined }))
                      if (formError) setFormError("")
                    }}
                    disabled={isSubmitting}
                    aria-invalid={Boolean(errors.password) || undefined}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      size="icon-xs"
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="size-3.5" />
                      ) : (
                        <Eye className="size-3.5" />
                      )}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
                <FieldError>{errors.password}</FieldError>
              </Field>

              <Field data-invalid={Boolean(errors.confirmPassword) || undefined}>
                <FieldLabel htmlFor="recovery-confirm-password">
                  Confirm new password
                </FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="recovery-confirm-password"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value)
                      if (errors.confirmPassword)
                        setErrors((current) => ({ ...current, confirmPassword: undefined }))
                      if (formError) setFormError("")
                    }}
                    disabled={isSubmitting}
                    aria-invalid={Boolean(errors.confirmPassword) || undefined}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      size="icon-xs"
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="size-3.5" />
                      ) : (
                        <Eye className="size-3.5" />
                      )}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
                <FieldError>{errors.confirmPassword}</FieldError>
              </Field>
            </FieldGroup>

            <div className="rounded-lg bg-muted/40 p-3.5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground/70">
                Password must contain:
              </p>
              <ul className="flex flex-col gap-1.5">
                {passwordChecks.map((check) => (
                  <li
                    key={check.key}
                    className={cn(
                      "flex items-center gap-2 text-xs transition-colors",
                      check.met ? "text-emerald-700" : "text-muted-foreground"
                    )}
                  >
                    {check.met ? (
                      <Check className="size-3.5 shrink-0" />
                    ) : (
                      <X className="size-3.5 shrink-0" />
                    )}
                    {check.label}
                  </li>
                ))}
              </ul>
            </div>

            {formError && (
              <p role="alert" className="text-sm text-destructive">
                {formError}
              </p>
            )}

            <DialogFooter className="mt-0 flex-row items-center justify-between gap-2">
              <Button
                type="button"
                variant="ghost"
                disabled={isSubmitting}
                onClick={() => {
                  setStep(RECOVERY_STEPS.OTP)
                  setErrors({})
                  setFormError("")
                }}
                className="gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="size-4" />
                Back
              </Button>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-forest-900 text-white hover:opacity-90"
              >
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                {isSubmitting ? "Updating…" : "Update password"}
              </Button>
            </DialogFooter>
          </form>
        )}

        {step === RECOVERY_STEPS.SUCCESS && (
          <div
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-4 text-center"
            )}
          >
            <div className="flex size-14 items-center justify-center rounded-full bg-emerald-50">
              <ShieldCheck className="size-7 text-emerald-600" />
            </div>
            <p className="text-sm text-muted-foreground">
              Your password has been reset. You can now sign in with your new
              password.
            </p>
            <Button
              type="button"
              onClick={goBackToSignIn}
              className="w-full bg-forest-900 text-white hover:opacity-90"
            >
              Back to sign in
            </Button>
          </div>
        )}
    </div>
  )

  const form = (
    <div
      data-slot="admin-forgot-password-inline"
      className="mx-auto flex min-h-[min(26rem,calc(100svh-8rem))] w-full max-w-sm flex-col"
    >
      {recoveryContent}
    </div>
  )

  if (!floating) return form

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
      <button
        type="button"
        aria-label="Close password recovery"
        tabIndex={-1}
        onClick={handleClose}
        className="absolute inset-0 cursor-default bg-black/40 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="recovery-title"
        className="relative z-10 max-h-[calc(100dvh-2rem)] w-full max-w-sm overflow-y-auto rounded-xl bg-white p-8 text-foreground shadow-2xl"
      >
        {form}
      </div>
    </div>
  )
}
