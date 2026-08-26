import { useEffect, useRef, useState } from 'react'
import { api, type DomainsResponse } from '@/lib/api'

const POLL_INTERVAL_MS = 30000

// Domains change slowly, so a longer poll interval than status is fine.
export function useDomains() {
  const [data, setData] = useState<DomainsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const timer = useRef<number | null>(null)

  async function refresh() {
    try {
      const result = await api.domains()
      setData(result)
      setError(null)
    } catch (err) {
      setError((err as Error).message || 'Failed to fetch domains')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    timer.current = window.setInterval(refresh, POLL_INTERVAL_MS)
    return () => {
      if (timer.current != null) window.clearInterval(timer.current)
    }
  }, [])

  return { data, loading, error, refresh }
}
