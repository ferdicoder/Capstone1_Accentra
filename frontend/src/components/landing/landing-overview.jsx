import { features, landingContainer, ui } from "./landing-data"

export function LandingOverview() {
  return (
    <section
      id="features"
      className="flex min-h-[calc(100svh-4.5rem)] snap-start items-center bg-white py-14 sm:py-16"
      aria-labelledby="overview-heading"
    >
      <div className={`${landingContainer} w-full`}>
        <div data-reveal className="landing-reveal max-w-2xl">
          <h2
            id="overview-heading"
            className={`${ui.h2} text-[#02353C]`}
          >
            Our Services
          </h2>
          <p className={`mt-4 ${ui.lead} text-[#3D5F5A]`}>
            Reliable support for business registration and tax filing to help
            you manage essential business requirements.
          </p>
        </div>

        <ul
          data-reveal
          style={{ "--reveal-delay": "150ms" }}
          className="landing-reveal mt-8 grid gap-6 lg:grid-cols-2 lg:gap-8"
        >
          {features.map(({ title, description, startingPrice, image }) => (
            <li
              key={title}
              className="group overflow-hidden rounded-2xl border border-[#DCE9E5] bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#02353C]/10"
            >
              <div className="aspect-[16/9] overflow-hidden bg-[#F2F7F4]">
                <img
                  src={image}
                  alt={title}
                  loading="lazy"
                  decoding="async"
                  className="size-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </div>
              <div className="p-5 sm:p-6">
                <h3 className="text-lg font-semibold text-[#02353C]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#3D5F5A]">
                  {description}
                </p>
                <p className="mt-3 text-sm font-semibold text-[#047857]">
                  Starting price: ₱{startingPrice.toLocaleString("en-PH")}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}