import { features, landingContainer } from "./landing-data"

export function LandingFeatures() {
  return (
    <section
      id="features"
      className="bg-[#f2f7f4] py-20 sm:py-24 lg:py-28"
      aria-labelledby="features-heading"
    >
      <div className={landingContainer}>
        <div className="grid gap-6 lg:grid-cols-[1fr_.65fr] lg:items-end lg:gap-16">
          <div data-landing-reveal data-reveal-order="0" className="landing-reveal">
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[#0b916a]">
              A focused toolkit
            </p>
            <h2
              id="features-heading"
              className="mt-4 max-w-[860px] text-4xl font-semibold leading-[1.08] tracking-[-0.045em] text-[#02353C] sm:text-5xl"
            >
              The work stays connected, wherever it starts.
            </h2>
          </div>
          <p
            data-landing-reveal
            data-reveal-order="1"
            className="landing-reveal max-w-[480px] text-base leading-7 text-[#47706a] sm:text-[1.0625rem] lg:justify-self-end"
          >
            Purposeful tools for the parts of an engagement that need clarity
            most, from the first request to the final deliverable.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3 lg:gap-5">
          {features.map(({ icon: Icon, title, description }, index) => (
            <article
              key={title}
              data-landing-reveal
              data-reveal-order={index + 2}
              className="landing-reveal landing-hoverable min-h-[220px] rounded-2xl border border-[#dce9e5] bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#8bcdb9] hover:shadow-xl hover:shadow-[#0b6554]/[.08] sm:p-7"
            >
              <div className="flex size-11 items-center justify-center rounded-xl bg-[#e0f8ee] text-[#07956b]">
                <Icon className="size-5" aria-hidden="true" />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-[#02353C]">
                {title}
              </h3>
              <p className="mt-2.5 text-[0.9375rem] leading-6 text-[#47706a]">
                {description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
