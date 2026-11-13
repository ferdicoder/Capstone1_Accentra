import { landingContainer, workflow } from "./landing-data"

export function LandingProcess() {
  return (
    <section
      id="workflow"
      className="snap-start bg-[#F2F7F4] py-12 sm:py-14"
      aria-labelledby="process-heading"
    >
      <div className={`${landingContainer} mx-auto w-full`}>
        <div
          data-reveal
          className="landing-reveal mx-auto max-w-3xl text-center"
        >
          <p className="text-xs font-semibold tracking-[0.14em] text-[#047857]">
            SIMPLE AND CONVENIENT
          </p>
          <h2
            id="process-heading"
            className="mt-2 text-[clamp(2.5rem,5vw,3.5rem)] font-semibold leading-[1.08] tracking-[-0.025em] text-balance text-[#02353C]"
          >
            How It Works
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-[#3D5F5A] sm:text-lg">
            Getting started with JOBAL&apos;s accounting services is simple.
            Follow these steps to manage your service requests with Accentra.
          </p>
        </div>

        <div className="mt-8 overflow-x-auto pb-2 lg:overflow-visible lg:pb-0">
          <ol className="grid min-w-[1050px] grid-cols-5 gap-3 lg:min-w-0">
            {workflow.map(({ number, title, description }) => (
              <li key={number} className="min-w-0">
                <article
                  tabIndex={0}
                  className="group h-full min-h-40 rounded-2xl border border-[#DCE9E5] bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(15,35,30,0.12)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#047857] sm:p-5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#E6F7EF] text-sm font-semibold tabular-nums text-[#047857]">
                      {number}
                    </span>
                  </div>
                  <h3 className="mt-4 text-base font-semibold leading-snug text-[#02353C]">
                    {title}
                  </h3>
                  <p
                    className="mt-0 max-h-0 overflow-hidden text-sm leading-6 text-[#3D5F5A] opacity-0 transition-[max-height,opacity,margin] duration-200 group-hover:mt-3 group-hover:max-h-60 group-hover:opacity-100 group-focus-within:mt-3 group-focus-within:max-h-60 group-focus-within:opacity-100 [@media(hover:none)]:mt-3 [@media(hover:none)]:max-h-60 [@media(hover:none)]:opacity-100"
                  >
                    {description}
                  </p>
                </article>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
