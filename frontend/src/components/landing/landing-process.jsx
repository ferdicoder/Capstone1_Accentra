import { landingContainer, workflow } from "./landing-data"

// Picks up step-1.*, step-2.*, ... from ./steps. Missing files are fine.
const stepImages = import.meta.glob("./step-*.{jpg,jpeg,png,webp}", {
  eager: true,
  import: "default",
})

const getStepImage = (number) => {
  const key = Object.keys(stepImages).find((path) =>
    path.includes(`step-${Number(number)}.`),
  )
  return key ? stepImages[key] : null
}

export function LandingProcess() {
  return (
    <section
      id="workflow"
      className="flex min-h-[calc(100svh-4.5rem)] snap-start items-center bg-[#F2F7F4] py-10"
      aria-labelledby="process-heading"
    >
      <div className={`${landingContainer} w-full`}>
        <div data-reveal className="landing-reveal">
          <h2
            id="process-heading"
            className="max-w-[760px] text-[clamp(1.75rem,3vw,2.5rem)] font-semibold leading-[1.12] tracking-[-0.025em] text-balance text-[#02353C]"
          >
            Four steps from request to completion.
          </h2>

          <ol className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {workflow.map(({ number, tag, title, description }) => {
              const image = getStepImage(number)
              return (
                <li
                  key={number}
                  className="group overflow-hidden rounded-2xl border border-[#DCE9E5] bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#02353C]/10"
                >
                  <div className="relative h-44 overflow-hidden bg-gradient-to-br from-[#02353C] to-[#0A4B52] lg:h-56">
                    {image ? (
                      <img
                        src={image}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="size-full object-cover object-top"
                      />
                    ) : (
                      <span
                        aria-hidden="true"
                        className="absolute inset-0 flex items-center justify-center text-6xl font-semibold text-white/15"
                      >
                        {number}
                      </span>
                    )}
                    <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#047857] shadow-sm">
                      {number} · {tag}
                    </span>
                  </div>

                  <div className="p-5">
                    <h3 className="text-base font-semibold leading-snug text-[#02353C]">
                      {title}
                    </h3>
                    <p className="mt-2 text-sm leading-5 text-[#3D5F5A]">
                      {description}
                    </p>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      </div>
    </section>
  )
}