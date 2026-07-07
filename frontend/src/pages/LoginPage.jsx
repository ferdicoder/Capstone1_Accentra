import { GalleryVerticalEnd } from "lucide-react"

import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
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
            <LoginForm className={'shadow-md p-4 w-90 rounded-md'}/>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center bg-muted">
        <div className="w-fit">
          <h1 className="text-5xl font-bold">Accounting Made Simple</h1>
          <p className="text-lg">
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
