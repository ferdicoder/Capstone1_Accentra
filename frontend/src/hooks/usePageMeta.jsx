import { useEffect, useRef } from "react"
import { useOutletContext } from "react-router-dom"

export function usePageMeta(meta) {
  const { setPageMeta } = useOutletContext()
  const metaRef = useRef(meta)
  metaRef.current = meta

  const breadcrumbsKey = JSON.stringify(meta.breadcrumbs ?? [])

  useEffect(() => {
    setPageMeta(metaRef.current)
    return () => setPageMeta({})
  }, [setPageMeta, meta.title, breadcrumbsKey, meta.hasUnreadNotifications])
}