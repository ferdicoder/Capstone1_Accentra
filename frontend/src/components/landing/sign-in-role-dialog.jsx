import { ArrowRight } from "lucide-react"
import { Link } from "react-router-dom"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { workspaceOptions } from "./landing-data"

export function SignInRoleDialog({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-slot="sign-in-role-dialog"
        className="max-w-[36rem] gap-0 overflow-hidden p-0"
      >
        <div className="bg-[#02353C] px-5 py-4 text-white sm:px-6 sm:py-5">
          <DialogHeader>
            <DialogTitle className="text-xl text-white sm:text-2xl">Welcome to Accentra</DialogTitle>
            <DialogDescription className="mt-1 text-sm text-white/70 sm:text-[15px]">
              Choose the workspace you want to sign in to.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-4 px-5 py-5 sm:px-6 sm:py-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {workspaceOptions.map(({ key, label, description, cta, href, icon: Icon }) => (
              <Link
                key={key}
                to={href}
                onClick={() => onOpenChange(false)}
                className="group flex min-h-[170px] cursor-pointer flex-col rounded-2xl border border-[#dce9e5] bg-white p-4 text-left transition duration-200 hover:-translate-y-1 hover:border-[#8bcdb9] hover:bg-[#f7fcf9] hover:shadow-lg hover:shadow-[#0b6554]/[.08] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#02353C] sm:min-h-[210px] sm:p-5"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-[#e0f8ee] text-[#07956b] transition duration-200 group-hover:bg-[#d0f5e6] sm:size-11">
                  <Icon className="size-5 sm:size-6" aria-hidden="true" />
                </span>
                <span className="mt-4 text-lg font-semibold text-[#02353C] sm:mt-5 sm:text-xl">
                  {label}
                </span>
                <span className="mt-1.5 text-[13px] leading-5 text-[#47706a] sm:mt-2 sm:text-[15px] sm:leading-6">
                  {description}
                </span>
                <span className="mt-auto inline-flex items-center pt-3 text-xs font-semibold text-[#0b916a] sm:pt-5 sm:text-sm">
                  {cta}
                  <ArrowRight
                    className="ml-1.5 size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            ))}
          </div>

          <p className="text-center text-sm text-[#47706a]">
            Don&apos;t have an account?{" "}
            <Link
              to="/client/signup"
              onClick={() => onOpenChange(false)}
              className="cursor-pointer font-semibold text-[#02353C] underline decoration-[#8bcdb9] underline-offset-4 transition hover:text-[#0b916a] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#02353C]"
            >
              Get Started
            </Link>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
