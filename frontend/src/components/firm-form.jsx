import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import RegMilestone from "./RegMilestone";

export function FirmForm({
  className,
  ...props
}) {
  return (
    <form className={cn("flex flex-col gap-6", className)} {...props}>
      <RegMilestone currentStep={2} />

      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">
            Firm Information
          </h1>

          <p className="text-sm text-muted-foreground">
            Enter your Business Information
          </p>
        </div>

        {/* Row 1 */}
        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="business-name">
              Business Name
            </FieldLabel>

            <Input
              id="business-name"
              placeholder="Santos Retail Trading"
              className="bg-background"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="business-type">
              Type of Business
            </FieldLabel>

            <select
              id="business-type"
              className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
            >
              <option>Select Type of Business</option>
              <option>Sole Proprietorship</option>
              <option>Partnership</option>
              <option>Corporation</option>
              <option>Cooperative</option>
            </select>
          </Field>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="tin">
              TIN Number
            </FieldLabel>

            <Input
              id="tin"
              placeholder="123-456-789-000"
              className="bg-background"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="industry">
              Industry
            </FieldLabel>

            <select
              id="industry"
              className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
            >
              <option>Select Industry</option>
              <option>Accounting</option>
              <option>Retail</option>
              <option>Manufacturing</option>
              <option>Services</option>
            </select>
          </Field>
        </div>

        {/* Email */}
        <Field>
          <FieldLabel htmlFor="email">
            Email Address
          </FieldLabel>

          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            className="bg-background"
          />
        </Field>

        {/* Address */}
        <Field>
          <FieldLabel htmlFor="address">
            Address
          </FieldLabel>

          <Input
            id="address"
            placeholder="12 Mercado St. Sta Ana Manila"
            className="bg-background"
          />
        </Field>

        {/* Buttons */}
        <Field>
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
            >
              Back
            </Button>

            <Button
              type="button"
              className="flex-1 bg-emerald-500 hover:bg-emerald-600"
            >
              Continue
            </Button>
          </div>
        </Field>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <a href="#" className="font-medium underline">
            Log In
          </a>
        </p>

        <p className="text-center text-xs text-muted-foreground">
          Secured by Accentra
        </p>
      </FieldGroup>
    </form>
  );
}