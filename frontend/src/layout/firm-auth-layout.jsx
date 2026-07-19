export function FirmAuthLayout({ children }) {
  return (
    <div className="min-h-svh bg-linear-to-br from-navy-900 via-forest-900 to-emerald-500">
      {/* Header */}
      <header className="flex items-center px-6 py-6 md:px-10">
        <a href="#" className="flex items-center gap-2 text-white">
          <div className="flex size-8 items-center justify-center rounded-md border border-white">
            <span className="font-bold">A</span>
          </div>

          <span className="text-lg font-semibold">Accentra</span>
        </a>
      </header>

      {/* Main Content */}
      <main className="flex min-h-[calc(100svh-80px)] items-center justify-center px-6 pb-6 md:px-10 md:pb-10">
        <div className="w-full max-w-lg rounded-xl bg-white p-8 shadow-2xl">
          {children}
        </div>
      </main>
    </div>
  );
}