import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import RegMilestone from "./RegMilestone";

export function OtpForm({
  className,
  ...props
}) {
  return (
    <form className={cn("flex flex-col gap-6", className)} {...props}>
      <RegMilestone currentStep={3} />

      <FieldGroup>
        <div className="flex flex-col gap-1 text-center">
          <h1 className="text-3xl font-bold">
            Verify Your Identity
          </h1>

          <p className="text-sm text-muted-foreground">
            We sent a 6-digit code to
            <span className="font-medium">
              {" "}
              a****a.f*****@gmail.com
            </span>
          </p>
        </div>

        <Field>
          <label className="text-sm font-medium">
            Enter the 6-Digit Code Here
          </label>

          <div className="mt-4 flex justify-center gap-3">
            {[...Array(6)].map((_, index) => (
              <Input
                key={index}
                maxLength={1}
                className="h-14 w-14 text-center text-xl font-bold"
              />
            ))}
          </div>
        </Field>

        <Field>
          <div className="mt-4 flex gap-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
            >
              Back
            </Button>

            <Button
              type="submit"
              className="flex-1 bg-emerald-500 hover:bg-emerald-600"
            >
              Register
            </Button>
          </div>
        </Field>

        <div className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <a
            href="#"
            className="font-medium text-emerald-600 hover:underline"
          >
            Log In
          </a>
        </div>

        <div className="text-center text-xs text-muted-foreground">
          Secured by Accentra
        </div>
      </FieldGroup>
    </form>
  );
}