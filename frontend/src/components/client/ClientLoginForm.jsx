import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

import { signinUser } from "../../services/authService";
import { useNavigate } from "react-router-dom";

export function ClientLoginForm({
  className,
  ...props
}) {
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [credentialsError, setCredentialsError] = useState("");

    const navigate = useNavigate(); 

    const handleSubmit = async (event) => {
      event.preventDefault()

      const email = event.target.email.value
      const password = event.target.password.value

      const newErrors = {
        email: !email,
        password: !password,
      } 
      setErrors(newErrors)
      setCredentialsError("")
      if (newErrors.email || newErrors.password) return

      setIsSubmitting(true)

      try {
        const user = await signinUser(email, password);

        if (user.error) {
          setCredentialsError("The email or password you entered is incorrect.")
          return
        }

        navigate(`/${user.role}/dashboard`);
      } catch (err) {
        console.error(err)
        setCredentialsError("Invalid Credentials. Please try again.")
      } finally {
        setIsSubmitting(false)
      }
    }
    
  return (
    <form onSubmit={handleSubmit} className={cn("flex flex-col gap-6", className)} {...props}> {/* this is the form element that wraps the entire login form, applying flexbox layout and spacing between child elements */}
    
      <FieldGroup> {/* this component groups related form fields together, providing a semantic structure and styling for the form */}
      
        <div className="flex flex-col items-center"> {/* this div centers the welcome message and description text */}
          <h1 className="text-2xl font-bold">Welcome Back!</h1>
          <p className="text-xs text-balance text-muted-foreground alig">
            Please enter your details
          </p>
        </div>

        <Field> {/* this component represents the emailform field */}
          <FieldLabel htmlFor="email" className="gap-0">
            Email<span className=" text-red-500">*</span></FieldLabel>
          <Input 
          id="email" 
          type="email" 
          placeholder="m@example.com" 
          disabled={isSubmitting}
          className={cn((errors.email || credentialsError) &&  "border-red-500 focus-visible:ring-red-500")}
          onChange={() => credentialsError && setCredentialsError("")}
          />

          {errors.email && (
            <p className="text-sm p-0 text-red-500">Email is required.</p>
          )}

          {credentialsError && (
            <p className="flex items-center gap-1.5 text-sm text-red-500">
              <svg
                className="size-4 shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
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
        </Field>


        <Field> {/* this component represents the password form field */}
          <div className="flex items-center">
           
            <FieldLabel htmlFor="password" className="gap-0 mb-0.5">
              Password<span className=" text-red-500">*</span>
            </FieldLabel>
            <a href="#" className="ml-auto mb-0.5 text-sm underline-offset-4 text-emerald-700 hover:underline">
              Forgot your password?
            </a>
          </div>
          <Input 
          id="password" 
          type="password" 
          disabled={isSubmitting}
          className={cn((errors.password || credentialsError) && "border-red-500 focus-visible:ring-red-500")}
          onChange={() => credentialsError && setCredentialsError("")}
          />
          {errors.password && (
            <p className="text-sm text-red-500">Password is required.</p>
          )}
        </Field>

        <Field> {/* this component represents the submit button and the sign-up link */}
          <Button 
          type="submit"
          disabled={isSubmitting}
          className="
          mt-4
          w-full
          h-14
          rounded-2xl
          bg-linear-to-r
          from-[#0F3443]
          to-[#10B981]
          text-white
          hover:opacity-90
          transition-all
          focus-visible:ring-2
          focus-visible:ring-emerald-500
          disabled:opacity-70
          disabled:cursor-not-allowed
          "
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="size-5 animate-spin" />
                Logging in...
              </span>
            ) : (
              "Login"
            )}
          </Button>

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