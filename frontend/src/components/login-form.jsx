import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {useState} from "react"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function LoginForm({
  className,
  ...props
}) {
    const [errors, setErrors] = useState({})

    const handleSubmit = (event) => {
      event.preventDefault()

      const email= event.target.email.value
      const password = event.target.password.value

      const newErrors = {
        email: !email,
        password: !password,
      }

      setErrors(newErrors)
      if (!newErrors.email && !newErrors.password) {
        console.log("Login Successful:")
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
            <a href="#" className="ml-auto mb-0.5 text-sm underline-offset-4 text-emerald-700 hover:underline">
              Forgot your password?
            </a>
          </div>
          <Input 
          id="password" 
          type="password" 
          className={cn(errors.password && "border-red-500 focus-visible:ring-red-500")}
          />
          {errors.password && (
            <p className="text-sm text-red-500">Password is required.</p>
          )}
        </Field>

        <Field> {/* this component represents the submit button and the sign-up link */}
          <Button type="submit"
          className="
          mt-4
          w-full
          h-10
          rounded-xl
          bg-emerald-700
          hover:bg-forest-900
          text-white
          transition-colors
          focus-visible:ring-2
          focus-visible:ring-emerald-500
          "
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
