import { useState } from "react";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field";

import { Input } from "@/components/ui/input";

export function RegisterFirmInfo({
  className,
  ...props
}) {
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();

    const form = e.target;

    const newErrors = {
      businessName: !form.businessName.value,
      businessType: !form.businessType.value,
      tin: !form.tin.value,
      industry: !form.industry.value,
      email: !form.email.value,
      address: !form.address.value,
    };

    setErrors(newErrors);

    if (!Object.values(newErrors).includes(true)) {
      console.log("Firm Info Submitted");
    }
  };
  
  return (
    <div className="min-h-screen flex">
      {/* LEFT PANEL */}

      <div
        className="
        hidden
        lg:flex
        w-[50%]
        flex-col
        justify-between
        px-14
        py-14
        text-white
        bg-gradient-to-br
        from-[#0F3443]
        via-[#0F4D3C]
        to-[#10B981]
      "
      >
        <div>
          {/* LOGO */}

          <div className="mb-24">
            <h2 className="text-4xl font-bold">
              Accentra
            </h2>

            <p className="uppercase tracking-[3px] text-[#7EE6B3] text-sm">
              Practice Management
            </p>
          </div>

          {/* HERO TEXT */}

          <div className="max-w-lg">
            <h1 className="text-6xl font-bold leading-tight">
              Accounting made
              <br />
              <span className="text-[#8CF2C5]">
                clear & simple.
              </span>
            </h1>

            <p className="mt-8 text-lg text-white/85 leading-8">
              Accentra bridges the gap between accounting firms and
              their clients through a centralized platform for
              managing accounting services, client documents,
              and BIR compliance all in one place.
            </p>

            <div className="mt-12 space-y-5">
              {[
                "Real-time engagement tracking",
                "Organized document submission & review",
                "Instant notifications on every update",
                "Transparent billing & payment tracking",
                "Compliance monitoring & deadline alerts",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-4"
                >
                  <div className="h-10 w-10 rounded-md bg-white/10 backdrop-blur flex items-center justify-center">
                    ✓
                  </div>

                  <span className="text-lg">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FOOTER */}

        <p className="text-sm text-white/80">
          © 2025 Accentra · Accounting Practice Management
          System
          <br />
          Capstone Project · BS Information Technology
        </p>
      </div>

      {/* RIGHT PANEL */}

      <div className="flex-1 bg-[#F6F7F8] flex items-center justify-center p-8">
        <div
          className="
          w-full
          max-w-[700px]
          rounded-[32px]
          bg-white
          shadow-xl
          p-10
        "
        >
          {/* STEP INDICATOR */}

          <div className="flex items-center justify-center gap-4 mb-12">
            <Step active number="1" label="Account" />

            <div className="h-[2px] w-12 bg-gray-300" />

            <Step active number="2" label="Firm Info" />

            <div className="h-[2px] w-12 bg-gray-200" />

            <Step number="3" label="OTP Verification" />
          </div>

          {/* FORM */}

          <form
            onSubmit={handleSubmit}
            className={cn("flex flex-col gap-6", className)}
            {...props}
          >
            <FieldGroup>
              <div>
                <h2 className="text-4xl font-bold text-slate-900">
                  Firm Information
                </h2>

                <p className="mt-2 text-muted-foreground">
                  Enter your Business Information
                </p>
              </div>

              {/* ROW 1 */}

              <div className="grid md:grid-cols-2 gap-5 mt-6">
                <Field>
                  <FieldLabel>
                    Business Name
                    <span className="text-red-500">*</span>
                  </FieldLabel>

                  <Input
                    name="businessName"
                    placeholder="Santos Retail Trading"
                    className={cn(
                      errors.businessName &&
                        "border-red-500",  "h-11 rounded-xl px-3"                  )}
                  />
                </Field>

                <Field>
                  <FieldLabel>
                    Type of Business
                    <span className="text-red-500">*</span>
                  </FieldLabel>

                  <select
                    name="businessType"
                    className="
                      h-11
                      w-full
                      rounded-xl
                      border
                      border-input
                      bg-background
                      px-3
                    "
                  >
                    <option value="">
                      Select type of Business
                    </option>
                    <option>Sole Proprietorship</option>
                    <option>Partnership</option>
                    <option>Corporation</option>
                  </select>
                </Field>
              </div>

              {/* ROW 2 */}

              <div className="grid md:grid-cols-2 gap-5">
                <Field>
                  <FieldLabel>
                    TIN Number
                    <span className="text-red-500">*</span>
                  </FieldLabel>

                  <Input
                    name="tin"
                    placeholder="123-456-789-000"
                    className="h-11 rounded-xl px-3"
                  />
                </Field>

                <Field>
                  <FieldLabel>
                    Industry
                    <span className="text-red-500">*</span>
                  </FieldLabel>

                  <select
                    name="industry"
                    className="
                      h-11
                      w-full
                      rounded-xl
                      border
                      border-input
                      bg-background
                      px-3
                    "
                  >
                    <option value="">
                      Select Industry
                    </option>

                    <option>Retail</option>
                    <option>Technology</option>
                    <option>Manufacturing</option>
                    <option>Healthcare</option>
                  </select>
                </Field>
              </div>

              {/* EMAIL */}

              <Field>
                <FieldLabel>
                  Email Address
                  <span className="text-red-500">*</span>
                </FieldLabel>

                <Input
                  name="email"
                  type="email"
                  placeholder="you@company.com"
                  className="h-11 rounded-xl px-3"
                />
              </Field>

              {/* ADDRESS */}

              <Field>
                <FieldLabel>
                  Address
                  <span className="text-red-500">*</span>
                </FieldLabel>

                <Input
                  name="address"
                  placeholder="12 Mercado St. Sta Ana Manila 1009"
                  className="h-11 rounded-xl px-3"
                />
              </Field>

              {/* BUTTONS */}

              <div className="grid grid-cols-2 gap-5 pt-4">
                <Button
                  type="button"
                  className="
                  h-14
                  rounded-2xl
                  bg-gradient-to-r
                  from-[#0F3443]
                  to-[#10B981]
                  text-white
                "
                >
                  Back
                </Button>

                <Button
                  type="submit"
                  className="
                  h-14
                  rounded-2xl
                  bg-[#35C38A]
                  hover:bg-[#2DB37E]
                  text-white
                "
                >
                  Continue
                </Button>
              </div>

              <FieldDescription className="text-center pt-2">
                Already have an account?{" "}
                <a
                  href="#"
                  className="text-emerald-700 underline"
                >
                  Log In
                </a>
              </FieldDescription>

              <div className="flex items-center gap-4 pt-4">
                <div className="h-px flex-1 bg-gray-200" />

                <span className="text-sm text-gray-400">
                  Secured by Accentra
                </span>

                <div className="h-px flex-1 bg-gray-200" />
              </div>
            </FieldGroup>
          </form>
        </div>
      </div>
    </div>
  );
}

/* STEP COMPONENT */

function Step({
  number,
  label,
  active = false,
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "h-10 w-10 rounded-full border-2 flex items-center justify-center text-sm font-semibold",
          active
            ? "border-emerald-500 text-emerald-600"
            : "border-gray-300 text-gray-400"
        )}
      >
        {number}
      </div>

      <span
        className={cn(
          "font-medium",
          active
            ? "text-slate-900"
            : "text-gray-400"
        )}
      >
        {label}
      </span>
    </div>
  );
}