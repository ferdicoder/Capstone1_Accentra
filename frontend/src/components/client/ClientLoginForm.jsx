
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"

import { signinToPortal } from "../../services/authService"
import { getHome } from "@/config/roles"
import { getZodFieldErrors } from "@/lib/form-validation"
import { loginFormSchema } from "@/schemas/loginSchema"

export function ClientLoginForm({
  className,
  ...props
}) {
    const [errors, setErrors] = useState({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [credentialsError, setCredentialsError] = useState("")
    const [showPassword, setShowPassword] = useState(false)

    const navigate = useNavigate()

    const handleSubmit = async (event) => {
      event.preventDefault()

      const formData = new FormData(event.currentTarget)
      const email = formData.get("email")?.toString() ?? ""
      const password = formData.get("password")?.toString() ?? ""

      const newErrors = getZodFieldErrors(loginFormSchema, { email, password })
      setErrors(newErrors)
      setCredentialsError("")
      if (newErrors.email || newErrors.password) return

      setIsSubmitting(true)

      try {
        const { role } = await signinToPortal("client", email, password)
        navigate(getHome(role))
      } catch (err) {
        setCredentialsError(err.message)
      } finally {
        setIsSubmitting(false)
      }
    }

  return (
    <form onSubmit={handleSubmit} className={cn("flex flex-col gap-6", className)} {...props}>

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
            disabled={isSubmitting}
            className={cn(
              (errors.email || credentialsError) && "border-red-500 focus-visible:ring-red-500"
            )}
            onChange={() => credentialsError && setCredentialsError("")}
          />

          {errors.email && (
            <p className="text-sm p-0 text-red-500">Email is required.</p>
          )}
        </Field>

        {/* Password Field */}
        <Field>
          <div className="flex items-center">

            <FieldLabel htmlFor="password" className="gap-0 mb-0.5">
              Password<span className="text-red-500">*</span>
            </FieldLabel>

            <a
              href="#"
              className="ml-auto mb-0.5 text-sm underline-offset-4 text-emerald-700 hover:underline"
            >
              Forgot your password?
            </a>
          </div>

          {/* Password Input with Visibility Toggle */}
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              disabled={isSubmitting}
              className={cn(
                "pr-10",
                (errors.password || credentialsError) && "border-red-500 focus-visible:ring-red-500"
              )}
              onChange={() => credentialsError && setCredentialsError("")}
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

        {/* Credentials Error */}
        {credentialsError && (
          <p role="alert" className="flex items-center gap-1.5 text-sm text-red-500">
            <svg
              className="size-4 shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            {credentialsError}
          </p>
        )}

        {/* Submit Button and Sign-up Link */}
        <Field>
          <div className="flex justify-center">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="
                h-12
                w-3/4
                max-w-sm
                self-center
                rounded-lg
                bg-forest-900
                text-lg
                text-white
                hover:bg-[#18a16f]
                transition-all
                focus-visible:ring-2
                focus-visible:ring-emerald-500
                disabled:opacity-70
                disabled:cursor-not-allowed
              "
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
        </Field>

      </FieldGroup>
    </form>
  )
}
