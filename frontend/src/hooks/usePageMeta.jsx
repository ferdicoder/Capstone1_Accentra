import { useEffect } from "react"
import { useOutletContext } from "react-router-dom"

export function usePageMeta(meta) {
  const { setPageMeta } = useOutletContext()

  useEffect(() => {
    setPageMeta(meta)
    return () => setPageMeta({})
  }, [
    setPageMeta,
    meta.title,
    meta.breadcrumbs,
    meta.actions,
    meta.hasUnreadNotifications,
    meta.onNotificationsClick,
    meta.onRequestServiceClick,
  ])
}
