import { useEffect, useRef, useState } from 'react'
import { api, type StatusResponse } from '@/lib/api'

const POLL_INTERVAL_MS = 5000

export function useStatus() {
  const [data, setData] = useState<StatusResponse | null>(null)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const timer = useRef<number | null>(null)

  async function refresh() {
    try {
      const result = await api.status()
      setData(result)
      setLastUpdated(Date.now())
      setError(null)
    } catch (err) {
      setError((err as Error).message || 'Failed to fetch status')
      // transient fetch error, next poll will retry
    }
  }

  useEffect(() => {
    refresh()
    timer.current = window.setInterval(refresh, POLL_INTERVAL_MS)
    return () => {
      if (timer.current) window.clearInterval(timer.current)
    }
  }, [])

  return { data, lastUpdated, error, refresh }
}
