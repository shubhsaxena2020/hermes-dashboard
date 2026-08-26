import { useEffect, useRef, useState } from 'react'

// Generic JSON fetch hook with polling + error/loading state. Used by the
// service panels (Git, Files, Backups, Databases) to talk to their endpoints.
export function useJson<T>(fetcher: () => Promise<T>, intervalMs = 30000) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const timer = useRef<number | null>(null)

  async function refresh() {
    try {
      const result = await fetcher()
      setData(result)
      setError(null)
    } catch (err) {
      setError((err as Error).message || 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    timer.current = window.setInterval(refresh, intervalMs)
    return () => {
      if (timer.current != null) window.clearInterval(timer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { data, error, loading, refresh }
}
