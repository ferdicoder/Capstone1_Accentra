import darkLogo from "@/assets/Logo1.svg"

const previewNav = ["Overview", "Engagements", "Documents", "Services", "Team"]
const previewMetrics = [
  ["Documents", "12"],
  ["Tasks", "08"],
  ["Updates", "04"],
]

export function LandingProductPreview() {
  return (
    <figure
      role="img"
      aria-label="Accentra engagement workspace showing documents, tasks, updates, and workflow progress"
      className="group relative mx-auto w-full max-w-[800px]"
    >
      <div
        aria-hidden="true"
        className="absolute -inset-8 rounded-[2.5rem] bg-emerald-300/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="relative overflow-hidden rounded-[1.25rem] border border-white/15 bg-[#092f35] shadow-2xl shadow-[#001d23]/45 transition duration-500 ease-out group-hover:-translate-y-1 group-hover:shadow-[#001d23]/60"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <img src={darkLogo} alt="" className="h-7 w-auto shrink-0" />
            <span className="truncate text-xs font-semibold text-white/80 sm:text-sm">
              Engagement workspace
            </span>
          </div>
          <span className="shrink-0 rounded-full bg-emerald-400/15 px-2.5 py-1 text-[10px] font-medium text-emerald-300">
            Live
          </span>
        </div>

        <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-3 p-4 sm:grid-cols-[148px_minmax(0,1fr)] sm:gap-6 sm:p-7">
          <div className="space-y-1.5 border-r border-white/10 pr-3 sm:space-y-2 sm:pr-5">
            {previewNav.map((item, index) => (
              <div
                key={item}
                className={`rounded-lg px-2.5 py-2 text-[10px] sm:px-3 sm:text-[11px] ${
                  index === 1
                    ? "bg-emerald-400/15 font-semibold text-emerald-300"
                    : "text-white/45"
                }`}
              >
                {item}
              </div>
            ))}
          </div>

          <div className="min-w-0 space-y-5 sm:space-y-6">
            <div>
              <p className="text-[10px] text-white/45 sm:text-[11px]">
                Current engagement
              </p>
              <div className="mt-1 flex items-center justify-between gap-3">
                <p className="truncate text-sm font-semibold text-white sm:text-base">
                  Annual tax filing
                </p>
                <span className="shrink-0 text-[10px] text-emerald-300 sm:text-[11px]">
                  In progress
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {previewMetrics.map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-white/10 bg-white/[.05] p-2.5 sm:p-3.5"
                >
                  <p className="text-[9px] text-white/40 sm:text-[10px]">
                    {label}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-white sm:text-xl">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[.04] p-3.5 sm:p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="text-[10px] font-medium text-white/70 sm:text-[11px]">
                  Engagement workflow
                </span>
                <span className="shrink-0 text-[9px] text-white/35 sm:text-[10px]">
                  3 of 5 complete
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {[0, 1, 2, 3, 4].map((step) => (
                  <div key={step} className="flex flex-1 items-center gap-1.5">
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                        step <= 2
                          ? "bg-emerald-300"
                          : "border border-white/25"
                      }`}
                    />
                    {step < 4 && (
                      <span
                        className={`h-px flex-1 ${
                          step < 2 ? "bg-emerald-300/70" : "bg-white/15"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-3 flex justify-between text-[8px] text-white/35 sm:text-[9px]">
                <span>Collection</span>
                <span>Approval</span>
                <span>Payment</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <figcaption className="sr-only">
        A connected view of an Accentra accounting engagement.
      </figcaption>
    </figure>
  )
}
