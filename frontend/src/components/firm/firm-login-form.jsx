import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { CircleAlert, Eye, EyeOff } from "lucide-react"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input";

import { useNavigate } from "react-router-dom";

import { signinToPortal } from "@/services/authService";
import { getHome } from "@/config/roles";
import { AdminForgotPasswordModal } from "@/components/firm/admin-forgot-password-modal";
import { getZodFieldErrors } from "@/lib/form-validation"
import { loginFormSchema } from "@/schemas/loginSchema"

export function FirmLoginForm({
  className,
  ...props
}) {
    const [errors, setErrors] = useState({})
  const [loginError, setLoginError] = useState("")
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

    const navigate = useNavigate(); 

    const handleSubmit = async (event) => {
      event.preventDefault()

      const formData = new FormData(event.currentTarget)
      const email = formData.get("email")?.toString().trim() ?? ""
      const password = formData.get("password")?.toString() ?? ""

      const newErrors = getZodFieldErrors(loginFormSchema, { email, password })
      setErrors(newErrors)
      setLoginError("")
      if (newErrors.email || newErrors.password) return

      try {
        const result = await signinToPortal("firm", email, password)
        navigate(getHome(result.role))
      } catch (error) {
        setLoginError(error.message)
      }
    }

  if (isForgotPasswordOpen) {
    return (
      <AdminForgotPasswordModal
        onClose={() => setIsForgotPasswordOpen(false)}
      />
    )
  }

  return (
    <form onSubmit={handleSubmit} className={cn("flex flex-col gap-6", className)} {...props}> {/* this is the form element that wraps the entire login form, applying flexbox layout and spacing between child elements */}
    
      <FieldGroup> {/* this component groups related form fields together, providing a semantic structure and styling for the form */}
      
        <div className="flex flex-col items-center">
          <h1 className="text-2xl font-bold">Welcome Back!</h1>
        </div>

        <Field> {/* this component represents the emailform field */}
          <FieldLabel htmlFor="email" className="gap-0">
            Email<span className=" text-red-500">*</span></FieldLabel>
          <Input 
          id="email" 
          name="email"
          type="email" 
          placeholder="m@example.com" 
          className={cn(errors.email &&  "border-red-500 focus-visible:ring-red-500")}
          />

          {errors.email && (
            <p className="text-sm p-0 text-red-500">Email is required.</p>
          )}
        </Field>


        <Field> {/* this component represents the password form field */}
          <div className="flex items-center">
           
            <FieldLabel htmlFor="password" className="gap-0 mb-0.5">
              Password<span className=" text-red-500">*</span>
            </FieldLabel>
            <button
              type="button"
              onClick={() => setIsForgotPasswordOpen(true)}
              className="ml-auto mb-0.5 cursor-pointer text-sm text-emerald-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
            >
              Forgot your password?
            </button>
          </div>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              className={cn(
                "pr-10",
                errors.password && "border-red-500 focus-visible:ring-red-500"
              )}
            />

            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#02353C]"
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </Field>

        {loginError && (
          <div
            role="alert"
            className="flex items-center gap-1.5 text-sm text-red-500"
          >
            <CircleAlert aria-hidden="true" className="size-4 shrink-0" />
            <p>{loginError}</p>
          </div>
        )}

        <Field> {/* this component represents the submit button and the sign-up link */}
          <Button type="submit"
          className="h-12 w-3/4 max-w-sm self-center rounded-lg bg-forest-900 text-lg text-white transition-all hover:bg-[#18a16f] focus-visible:ring-2 focus-visible:ring-emerald-500"
          >Login</Button>

          <FieldDescription className="text-center">
            Don&apos;t have an account?{" "}
            <a href="#" className="underline underline-offset-4 text-navy-900 transition-colors hover:text-emerald-700!">
              Sign up
            </a>
          </FieldDescription>
        </Field>

      </FieldGroup>
    </form>
  );
}
