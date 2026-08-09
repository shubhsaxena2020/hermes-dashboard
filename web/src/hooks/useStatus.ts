import { useEffect, useRef, useState } from 'react'
import { api, type StatusResponse } from '@/lib/api'

const POLL_INTERVAL_MS = 5000

export function useStatus() {
  const [data, setData] = useState<StatusResponse | null>(null)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [responseMs, setResponseMs] = useState<number | null>(null)
  const timer = useRef<number | null>(null)

  async function refresh() {
    const start = performance.now()
    try {
      const result = await api.status()
      const elapsed = Math.round(performance.now() - start)
      setData(result)
      setLastUpdated(Date.now())
      setError(null)
      setResponseMs(elapsed)
    } catch (err) {
      setError((err as Error).message || 'Failed to fetch status')
      // transient fetch error, next poll will retry
    }
  }

  useEffect(() => {
    refresh()
    timer.current = window.setInterval(refresh, POLL_INTERVAL_MS)

    function handleVisibility() {
      if (document.hidden) {
        // Tab hidden — pause polling to save bandwidth
        if (timer.current != null) {
          window.clearInterval(timer.current)
          timer.current = null
        }
      } else {
        // Tab visible again — refresh immediately and resume polling
        refresh()
        if (timer.current == null) {
          timer.current = window.setInterval(refresh, POLL_INTERVAL_MS)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      if (timer.current != null) window.clearInterval(timer.current)
    }
  }, [])

  return { data, lastUpdated, error, responseMs, refresh }
}
