export function AuthLayout({ children }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">

      {/* Left Side */}
      <div className="flex flex-col items-center justify-center bg-linear-to-br from-navy-900 via-forest-900 to-emerald-500">
        <div className="w-fit">
          <h1 className="m-8 text-5xl font-bold text-white">
            Accounting Made Simple
          </h1>

          <p className="m-8 text-lg text-white">
            Accentra bridges the gap between accounting firms and their clients.
            A centralized platform for managing your accounting services,
            client documents, and BIR compliance in one place.
          </p>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex flex-col gap-4 p-6 md:p-10">

        {/* Logo */}
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <span>A</span>
            </div>

            Accentra
          </a>
        </div>

        {/* Form */}
        <div className="flex flex-1 items-center justify-center">
          <div className="w-lg rounded-xl border bg-white p-8 drop-shadow-2xl">
            
            {children}

          </div>
        </div>

      </div>

    </div>
  )
}