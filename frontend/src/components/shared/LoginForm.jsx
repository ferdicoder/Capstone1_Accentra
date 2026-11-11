import { useState } from "react"
import { cn } from "@/lib/utils"
import { blockClipboard } from "@/lib/block-clipboard"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Loader2, Eye, EyeOff, CircleAlert } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"

import { signinToPortal } from "@/services/authService"
import { getHome } from "@/config/roles"
import { getZodFieldErrors } from "@/lib/form-validation"
import { loginFormSchema } from "@/schemas/loginSchema"

export function LoginForm({
  portal,
  className,
  onForgotPassword,
  showSignup = false,
  ...props
}) {
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loginError, setLoginError] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const navigate = useNavigate()

  const handleSubmit = async (event) => {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const email = formData.get("email")?.toString().trim() ?? ""
    const password = formData.get("password")?.toString() ?? ""

    const newErrors = getZodFieldErrors(loginFormSchema, {
      email,
      password,
    })

    setErrors(newErrors)
    setLoginError("")

    if (newErrors.email || newErrors.password) return

    setIsSubmitting(true)

    try {
      const result = await signinToPortal(portal, email, password)
      navigate(getHome(result.role))
    } catch (error) {
      setLoginError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const clearLoginError = () => {
    if (loginError) setLoginError("")
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center">
          <h1 className="text-2xl font-bold">Welcome Back!</h1>
        </div>

        {/* Email Field */}
        <Field>
          <FieldLabel htmlFor="email" className="gap-0">
            Email<span className="text-red-500">*</span>
          </FieldLabel>

          <Input
            id="email"
            name="email"
            type="email"
            placeholder="m@example.com"
            autoComplete="email"
            disabled={isSubmitting}
            className={cn(
              (errors.email || loginError) &&
                "border-red-500 focus-visible:ring-red-500"
            )}
            onChange={clearLoginError}
          />

          {errors.email && (
            <p className="text-sm text-red-500">Email is required.</p>
          )}
        </Field>

        {/* Password Field */}
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password" className="mb-0.5 gap-0">
              Password<span className="text-red-500">*</span>
            </FieldLabel>

            {onForgotPassword && (
              <button
                type="button"
                onClick={onForgotPassword}
                disabled={isSubmitting}
                className="ml-auto mb-0.5 cursor-pointer text-sm text-emerald-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Forgot your password?
              </button>
            )}
          </div>

          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              disabled={isSubmitting}
              {...blockClipboard}
              className={cn(
                "pr-10",
                (errors.password || loginError) &&
                  "border-red-500 focus-visible:ring-red-500"
              )}
              onChange={clearLoginError}
            />

            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              disabled={isSubmitting}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#02353C] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>

          {errors.password && (
            <p className="text-sm text-red-500">Password is required.</p>
          )}
        </Field>

        {/* Authentication Error */}
        {loginError && (
          <div
            role="alert"
            className="flex items-center gap-1.5 text-sm text-red-500"
          >
            <CircleAlert
              aria-hidden="true"
              className="size-4 shrink-0"
            />
            <p>{loginError}</p>
          </div>
        )}

        {/* Submit Button and Optional Sign-up Link */}
        <Field>
          <div className="flex justify-center">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-12 w-3/4 max-w-sm self-center rounded-lg bg-forest-900 text-lg text-white transition-all hover:bg-[#18a16f] focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Logging in...
                </span>
              ) : (
                "Log In"
              )}
            </Button>
          </div>

          {showSignup && (
            <FieldDescription className="text-center">
              Don&apos;t have an account?{" "}
              <Link
                to="/client/signup"
                state={{ clientAuthSlide: true }}
                className="underline underline-offset-4 text-navy-900 transition-colors hover:text-emerald-700!"
              >
                Sign up
              </Link>
            </FieldDescription>
          )}
        </Field>
      </FieldGroup>
    </form>
  )
}