import { GalleryVerticalEnd } from "lucide-react"

import { SignupForm } from "@/components/signup-form"

export default function SignupPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <span>A</span>
            </div>
            Accentra
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <SignupForm className={'shadow-md rounded-md p-4 w-100'}/>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center bg-linear-to-br from-navy-900 via-forest-900 to-emerald-500">
        <div className="w-fit">
          <h1 className="text-5xl font-bold text-white mb-4">Accounting Made Simple</h1>
          <p className="text-lg text-white">
            Accentra bridges the gap between their accounting firms and their clients  <br />
            a centralized platform for managing you accounting service, client documents, and BIR Compliance <br />
            in one place. 
          </p>
          <div>
          </div>
        </div>
      </div>
    </div>
  )
}
