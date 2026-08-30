import { useEffect, useRef } from "react"
import { useOutletContext } from "react-router-dom"

export function usePageMeta(meta) {
  const { setPageMeta } = useOutletContext()

  // Keep the latest meta (including any inline handlers/actions) available
  // to the effect without making them part of the dependency array — new
  // function/array literals are created on every render regardless of
  // whether their *content* actually changed, so comparing by reference
  // would re-fire this effect (and call setPageMeta) on every render.
  const metaRef = useRef(meta)
  metaRef.current = meta

  // Serialize only the parts that are safe to deep-compare (plain data).
  // This is what actually decides whether the effect re-runs.
  const breadcrumbsKey = JSON.stringify(meta.breadcrumbs ?? [])

  useEffect(() => {
    setPageMeta(metaRef.current)
    return () => setPageMeta({})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setPageMeta, meta.title, breadcrumbsKey, meta.hasUnreadNotifications])
}