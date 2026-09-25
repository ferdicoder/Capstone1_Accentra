import { landingContainer, roles } from "./landing-data"

export function LandingRoles() {
  return (
    <section
      id="roles"
      className="relative overflow-hidden bg-[#02353C] py-20 text-white sm:py-24 lg:py-28"
      aria-labelledby="roles-heading"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.06)_1px,transparent_1px)] [background-size:56px_56px]"
      />
      <div className={`${landingContainer} relative`}>
        <div className="max-w-[860px]">
          <div data-landing-reveal data-reveal-order="0" className="landing-reveal">
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-emerald-300">
              One platform, three perspectives
            </p>
            <h2
              id="roles-heading"
              className="mt-4 text-4xl font-semibold leading-[1.08] tracking-[-0.045em] text-white sm:text-5xl"
            >
              Everyone sees the work that belongs to them.
            </h2>
          </div>
        </div>

        <div className="mt-12 grid gap-4 lg:mt-16 lg:grid-cols-3 lg:gap-5">
          {roles.map(({ label, title, description, icon: Icon, anchor }, index) => (
            <article
              key={label}
              id={anchor}
              data-landing-reveal
              data-reveal-order={index + 1}
              className="landing-reveal landing-hoverable rounded-2xl border border-white/15 bg-white/[.06] p-6 transition duration-300 hover:-translate-y-1 hover:border-emerald-300/50 hover:bg-white/[.09] hover:shadow-2xl hover:shadow-black/10 sm:p-7"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-300/15 text-emerald-300">
                  <Icon className="size-5" aria-hidden="true" />
                </div>
                <span className="text-xs font-semibold tracking-[0.16em] text-white/35">
                  0{index + 1}
                </span>
              </div>
              <p className="mt-8 text-xs font-semibold uppercase tracking-[0.15em] text-emerald-300">
                {label}
              </p>
              <h3 className="mt-3 text-xl font-semibold tracking-[-0.02em]">
                {title}
              </h3>
              <p className="mt-3 text-[0.9375rem] leading-6 text-white/65">
                {description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
