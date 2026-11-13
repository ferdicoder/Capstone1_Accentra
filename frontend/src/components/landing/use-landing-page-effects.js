import { useEffect } from "react"

// Turns on scroll snapping for the landing page and fades each page in as it
// scrolls into view. Snapping is removed when the page unmounts so it never
// affects the rest of the app.
export function useLandingPageEffects() {
  useEffect(() => {
    const root = document.documentElement
    root.classList.add("landing-snap")

    const items = document.querySelectorAll("[data-reveal]")
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    if (reduced || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-visible"))
      return () => root.classList.remove("landing-snap")
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add("is-visible")
          observer.unobserve(entry.target)
        })
      },
      { threshold: 0.2 },
    )
    items.forEach((el) => observer.observe(el))

    return () => {
      observer.disconnect()
      root.classList.remove("landing-snap")
    }
  }, [])
}