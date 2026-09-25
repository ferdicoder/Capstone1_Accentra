import { landingContainer, workflow } from "./landing-data"

export function LandingWorkflow() {
  return (
    <section
      id="workflow"
      className="py-20 sm:py-24 lg:py-28"
      aria-labelledby="workflow-heading"
    >
      <div className={landingContainer}>
        <div className="grid gap-6 lg:grid-cols-[1fr_.62fr] lg:items-end lg:gap-16">
          <div data-landing-reveal data-reveal-order="0" className="landing-reveal">
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[#0b916a]">
              How it works
            </p>
            <h2
              id="workflow-heading"
              className="mt-4 max-w-[860px] text-4xl font-semibold leading-[1.08] tracking-[-0.045em] text-[#02353C] sm:text-5xl"
            >
              A steady path from request to completion.
            </h2>
          </div>
          <p
            data-landing-reveal
            data-reveal-order="1"
            className="landing-reveal max-w-[470px] text-base leading-7 text-[#47706a] sm:text-[1.0625rem] lg:justify-self-end"
          >
            The same shared workflow keeps clients and teams aligned as an
            engagement moves forward.
          </p>
        </div>

        <div className="relative mt-14 lg:mt-20">
          <div
            aria-hidden="true"
            data-landing-workflow-progress
            className="landing-workflow-line absolute bottom-8 left-5 top-8 w-px bg-[#c9dfd8] md:bottom-auto md:left-10 md:right-10 md:top-5 md:h-px md:w-auto"
          >
            <span className="landing-workflow-progress absolute inset-0 bg-[#10B981]" />
          </div>

          <ol className="relative grid gap-9 md:grid-cols-5 md:gap-4 lg:gap-6">
            {workflow.map(({ number, title, description }, index) => (
              <li
                key={number}
                data-landing-reveal
                data-reveal-order={index + 2}
                className="landing-reveal relative pl-12 md:pl-0 md:text-center"
              >
                <div className="absolute left-0 top-0 flex size-10 items-center justify-center rounded-full border border-[#b6d8cf] bg-[#fbfcfa] text-sm font-semibold text-[#0b916a] shadow-sm md:relative md:mx-auto md:flex">
                  {number}
                </div>
                <h3 className="mt-4 text-base font-semibold text-[#02353C] md:mt-6 md:text-lg">
                  {title}
                </h3>
                <p className="mt-2 max-w-[260px] text-[0.9375rem] leading-6 text-[#47706a] md:mx-auto">
                  {description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
