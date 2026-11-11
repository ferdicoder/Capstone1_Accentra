import { Fragment, useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Check, Eye, EyeOff, Loader2, ShieldCheck, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { blockClipboard } from "@/lib/block-clipboard"
import { Button } from "@/components/ui/button"
import { DialogFooter } from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { OtpCodeInput } from "@/components/ui/otp-code-input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"

import { authStore } from "@/store/authStore"
import { supabase } from "@/config/supabase"
import { passwordRequirements } from "@/lib/passwordRequirements"
import {
  PASSWORD_RECOVERY_OTP_LENGTH,
  requestPasswordRecovery,
  updateRecoveredPassword,
  verifyPasswordRecoveryOtp,
  getPasswordReuseMessage,
} from "@/services/authService"
import {
  emailRecoverySchema,
  otpSchema,
  resetPasswordSchema,
} from "@/schemas/loginSchema"
import { getZodFieldErrors } from "@/lib/form-validation"

const OTP_LENGTH = PASSWORD_RECOVERY_OTP_LENGTH

const RECOVERY_STEPS = {
  EMAIL: "email",
  OTP: "otp",
  PASSWORD: "password",
  SUCCESS: "success",
}

const STEP_ORDER = [
  RECOVERY_STEPS.EMAIL,
  RECOVERY_STEPS.OTP,
  RECOVERY_STEPS.PASSWORD,
]

const STEP_LABELS = ["Email", "Code", "Password"]
const controlClass = "w-full bg-background"

export function ForgotPasswordModal({ onClose, floating = false }) {
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
    navigate("/client/signin")
  }

  const handleRequestCode = async (event) => {
    event.preventDefault()

    const trimmedEmail = email.trim()
    const validationErrors = getZodFieldErrors(emailRecoverySchema, {
      email: trimmedEmail,
    })

    if (Object.keys(validationErrors).length > 0) {
      setErrors({
        email:
          validationErrors.email === "Email is required."
            ? "Enter your email address."
            : "Enter a valid email address.",
      })
      return
    }

    setErrors({})
    setFormError("")
    setNotice("")
    setIsSubmitting(true)

    try {
      await requestPasswordRecovery({
        email: trimmedEmail,
        redirectTo: `${window.location.origin}/client/signin`,
      })

      setEmail(trimmedEmail)
      setStep(RECOVERY_STEPS.OTP)
      setNotice(
        `If an account exists for ${trimmedEmail}, we've sent a ${OTP_LENGTH}-digit code to it.`
      )
    } catch (err) {
      console.error("Client password recovery request failed:", err?.message)
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
        redirectTo: `${window.location.origin}/client/signin`,
      })

      setNotice(`If an account exists for ${email}, we've sent a new code to it.`)
    } catch (err) {
      console.error("Client password recovery resend failed:", err?.message)
      setFormError("We couldn't resend the code right now. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerifyCode = async (event) => {
    event.preventDefault()

    const token = code.join("")
    const validationErrors = getZodFieldErrors(otpSchema, { code: token })

    if (Object.keys(validationErrors).length > 0) {
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
      console.error("Client password recovery verification failed:", err?.message)
      setErrors({ code: "That code isn't valid or has expired. Check it and try again." })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdatePassword = async (event) => {
    event.preventDefault()

    const validationErrors = getZodFieldErrors(resetPasswordSchema, {
      newPassword: password,
      confirmPassword,
    })

    const nextErrors = {
      ...(validationErrors.newPassword
        ? {
            password: validationErrors.newPassword.replace(
              "Please enter a new password.",
              "Enter a new password."
            ),
          }
        : {}),
      ...(validationErrors.confirmPassword
        ? {
            confirmPassword: validationErrors.confirmPassword.replace(
              "Please confirm your new password.",
              "Re-enter your new password."
            ),
          }
        : {}),
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setFormError("")
    setIsSubmitting(true)

    try {
      await updateRecoveredPassword({ password })

      await supabase.auth.signOut()
      authStore.getState().clearAuth()

      setStep(RECOVERY_STEPS.SUCCESS)
    } catch (err) {
      console.error("Client password update failed:", err?.message)

      const reuseMessage = getPasswordReuseMessage(err)

      setErrors((current) => ({
        ...current,
        password: reuseMessage ?? undefined,
      }))

      setFormError(
        reuseMessage ?? "We couldn't update your password. Please try again."
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
      "Enter the email address registered to your client account and we'll send you a verification code.",
    [RECOVERY_STEPS.OTP]: `Enter the ${OTP_LENGTH}-digit code we emailed to ${email}.`,
    [RECOVERY_STEPS.PASSWORD]:
      "Your new password must meet the requirements listed below.",
    [RECOVERY_STEPS.SUCCESS]:
      "You can now sign in to Accentra with your new password.",
  }[step]

  const recoveryContent = (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      {step !== RECOVERY_STEPS.SUCCESS && (
        <div className="border-b border-border pb-4">
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
                    {index < stepIndex ? <Check className="size-3.5" /> : index + 1}
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
        <h1 id="recovery-title" className="text-2xl font-bold">
          {title}
        </h1>
        <p className="text-xs text-balance text-muted-foreground">
          {description}
        </p>
      </div>

      {step === RECOVERY_STEPS.EMAIL && (
        <form onSubmit={handleRequestCode} noValidate className="flex min-w-0 flex-1 flex-col gap-5">
          <FieldGroup className="flex-1">
            <Field data-invalid={Boolean(errors.email) || undefined}>
              <FieldLabel htmlFor="recovery-email">Email address</FieldLabel>
              <Input
                id="recovery-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="example@gmail.com"
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
                Use the email address associated with your client account.
              </FieldDescription>
            </Field>
          </FieldGroup>

          {formError && (
            <p role="alert" className="text-sm text-destructive">
              {formError}
            </p>
          )}

          <DialogFooter className="mt-auto flex-row justify-end gap-2">
            <Button type="button" variant="outline" disabled={isSubmitting} onClick={handleClose}>
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
        <form onSubmit={handleVerifyCode} className="flex min-w-0 flex-1 flex-col gap-5">
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
              <Button type="button" variant="outline" disabled={isSubmitting} onClick={handleResendCode}>
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
        <form onSubmit={handleUpdatePassword} className="flex min-w-0 flex-1 flex-col gap-5">
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
                    if (errors.password) setErrors((current) => ({ ...current, password: undefined }))
                    if (formError) setFormError("")
                  }}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.password) || undefined}
                  {...blockClipboard}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    type="button"
                    size="icon-xs"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
              <FieldError>{errors.password}</FieldError>
            </Field>

            <Field data-invalid={Boolean(errors.confirmPassword) || undefined}>
              <FieldLabel htmlFor="recovery-confirm-password">Confirm new password</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="recovery-confirm-password"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value)
                    if (errors.confirmPassword) setErrors((current) => ({ ...current, confirmPassword: undefined }))
                    if (formError) setFormError("")
                  }}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.confirmPassword) || undefined}
                  {...blockClipboard}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    type="button"
                    size="icon-xs"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
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
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-emerald-50">
            <ShieldCheck className="size-7 text-emerald-600" />
          </div>
          <p className="text-sm text-muted-foreground">
            Your password has been reset. You can now sign in with your new password.
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
      data-slot="client-forgot-password-inline"
      className="mx-auto flex min-h-[min(26rem,calc(100svh-8rem))] w-full max-w-sm flex-col"
    >
      {recoveryContent}
    </div>
  )

  if (!floating) return form

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
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