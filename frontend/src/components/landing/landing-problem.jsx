import { Landing3DLogo } from "./landing-3d-logo"
import { landingContainer, problemItems } from "./landing-data"

export function LandingProblem() {
  return (
    <section
      className="relative isolate overflow-hidden border-b border-[#dce9e5] bg-[#f2f7f4] py-20 sm:py-24 lg:py-28"
      aria-labelledby="problem-heading"
    >
      <div
        className={`${landingContainer} relative z-10 grid gap-10 xl:grid-cols-[.72fr_1.15fr_1fr] xl:items-center xl:gap-6`}
      >
        <div className="relative flex min-h-[15rem] items-center justify-center sm:min-h-[18rem] lg:min-h-[21rem]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 size-[15rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#02353C]/[.12] blur-2xl sm:size-[18rem] lg:size-[19rem]"
          />
          <Landing3DLogo className="left-0 top-1/2 h-[15rem] w-[15rem] opacity-60 sm:h-[18rem] sm:w-[18rem] sm:opacity-70 xl:h-[16rem] xl:w-[16rem] xl:opacity-85 2xl:h-[19rem] 2xl:w-[19rem] 2xl:opacity-90" />
        </div>

        <div data-landing-reveal data-reveal-order="0" className="landing-reveal">
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[#0b916a]">
            The day-to-day reality
          </p>
          <h2
            id="problem-heading"
            className="mt-4 max-w-[680px] text-4xl font-semibold leading-[1.08] tracking-[-0.045em] text-[#02353C] sm:text-5xl lg:text-[3.5rem]"
          >
            Accounting work gets harder when everything is scattered.
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-3 sm:gap-6">
          {problemItems.map((item, index) => (
            <div
              key={item.title}
              data-landing-reveal
              data-reveal-order={index + 1}
              className="landing-reveal border-l-2 border-[#9bcdbf] pl-4 sm:pl-5"
            >
              <p className="font-semibold text-[#164d4a]">{item.title}</p>
              <p className="mt-2 text-[0.9375rem] leading-6 text-[#47706a]">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
