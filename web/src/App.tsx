import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { useStatus } from '@/hooks/useStatus'
import { OverviewSection } from '@/components/OverviewSection'
import { OracleSection } from '@/components/OracleSection'
import { api } from '@/lib/api'

const NAV_ITEMS = [
  { key: 'overview', label: 'Overview' },
  { key: 'oracle', label: 'VPS' },
] as const

type SectionKey = (typeof NAV_ITEMS)[number]['key']

function timeAgo(ts: number | null) {
  if (!ts) return ''
  const secs = Math.round((Date.now() - ts) / 1000)
  return secs <= 1 ? 'just now' : `${secs}s ago`
}

function App() {
  const [section, setSection] = useState<SectionKey>('overview')
  const { data, lastUpdated, refresh } = useStatus()
  const [, forceTick] = useState(0)
  const [version, setVersion] = useState<{ commit: string | null; date: string | null } | null>(null)

  // re-render every second so the "updated Xs ago" note stays live
  useEffect(() => {
    const id = window.setInterval(() => forceTick((n) => n + 1), 1000)
    return () => window.clearInterval(id)
  }, [])

  // Version never changes during a running session -- fetch once, not on
  // every 5s status poll.
  useEffect(() => {
    api.version().then(setVersion).catch(() => setVersion(null))
  }, [])

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <nav className="w-48 shrink-0 border-r bg-card py-5 sticky top-0 h-screen flex flex-col">
        <h1 className="px-5 text-sm font-semibold mb-5">VPS Control</h1>
        {NAV_ITEMS.map((item) => (
          <div
            key={item.key}
            onClick={() => setSection(item.key)}
            className={cn(
              'px-5 py-2 text-sm cursor-pointer border-l-2 border-transparent text-muted-foreground hover:bg-accent',
              section === item.key && 'border-primary text-foreground bg-accent',
            )}
          >
            {item.label}
          </div>
        ))}
        {version?.commit && (
          <div className="mt-auto px-5 text-xs text-muted-foreground" title={version.date || undefined}>
            {version.commit}
          </div>
        )}
      </nav>

      <main className="flex-1 p-8 max-w-5xl">
        {!data ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <>
            {section === 'overview' && (
              <div>
                <div className="flex justify-end mb-2">
                  <span className="text-xs text-muted-foreground">Updated {timeAgo(lastUpdated)}</span>
                </div>
                <OverviewSection data={data} />
              </div>
            )}
            {section === 'oracle' && <OracleSection oracle={data.oracle} refresh={refresh} />}
          </>
        )}
      </main>
    </div>
  )
}

export default App
