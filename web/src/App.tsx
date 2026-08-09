import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useStatus } from '@/hooks/useStatus'
import { OverviewSection } from '@/components/OverviewSection'
import { OracleSection } from '@/components/OracleSection'
import { Sidebar, type SectionKey } from '@/components/Sidebar'
import { api } from '@/lib/api'

function timeAgo(ts: number | null) {
  if (!ts) return ''
  const secs = Math.round((Date.now() - ts) / 1000)
  return secs <= 1 ? 'just now' : `${secs}s ago`
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-7 w-24" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-32" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent className="space-x-4">
            <Skeleton className="inline-block h-4 w-16" />
            <Skeleton className="inline-block h-4 w-16" />
          </CardContent>
        </Card>
        <Card className="sm:col-span-2">
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-5 w-8 rounded-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="sm:col-span-2">
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-48" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function App() {
  const [section, setSection] = useState<SectionKey>('overview')
  const { data, lastUpdated, error, refresh } = useStatus()
  const [, forceTick] = useState(0)
  const [version, setVersion] = useState<{ commit: string | null; date: string | null } | null>(null)
  const { theme, setTheme } = useTheme()

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
      <Sidebar
        section={section}
        onSectionChange={setSection}
        theme={theme}
        onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        version={version}
      />

      <main className="flex-1 p-8 max-w-5xl">
        {!data ? (
          <LoadingSkeleton />
        ) : (
          <>
            <div className="flex items-center justify-end mb-2 gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Updated {timeAgo(lastUpdated)}</span>
              <Button
                size="default"
                variant="ghost"
                onClick={refresh}
                className="text-muted-foreground"
                aria-label="Refresh status"
              >
                <RefreshCw className="size-3" />
                Refresh
              </Button>
              {error && (
                <span className="text-xs text-destructive" title={error}>
                  ⚠ Stale — poll failed
                </span>
              )}
            </div>
            {section === 'overview' && <OverviewSection data={data} />}
            {section === 'oracle' && <OracleSection oracle={data.oracle} refresh={refresh} />}
          </>
        )}
      </main>
    </div>
  )
}

export default App
