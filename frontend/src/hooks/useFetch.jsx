import { useEffect, useState } from "react"

/**
 * @param {function} getQuery to use for every page to load primary data
 */

export default function useFetch(getQuery) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    async function loadData() {
      setLoading(true)
      setError(null)
      try {
        const { data, error } = await getQuery()
        if (!isMounted) return
        if (error) throw error
        setData(data)
      } catch (err) {
        if (isMounted) setError(err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [getQuery])

  return { data, loading, error }
}