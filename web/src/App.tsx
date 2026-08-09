import { useEffect, useRef, useState } from 'react'
import { useTheme } from 'next-themes'
import { RefreshCw, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useStatus } from '@/hooks/useStatus'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { OverviewSection } from '@/components/OverviewSection'
import { OracleSection } from '@/components/OracleSection'
import { Sidebar, type SectionKey } from '@/components/Sidebar'
import { api } from '@/lib/api'
import { timeAgo } from '@/lib/time'

function LoadingSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading dashboard">
      <div className="flex items-center justify-end mb-2 gap-2 flex-wrap">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-8 w-16 rounded-md" />
      </div>
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
          <CardContent className="space-y-3">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-24" />
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Skeleton className="h-7 w-20 rounded-lg" />
            <Skeleton className="h-7 w-16 rounded-lg" />
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
  const { data, lastUpdated, error, responseMs, refresh } = useStatus()
  const [, forceTick] = useState(0)
  const [version, setVersion] = useState<{ commit: string | null; date: string | null } | null>(null)
  const { theme, setTheme } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const hamburgerRef = useRef<HTMLButtonElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

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

  // Keyboard shortcuts: Alt+1 → Overview, Alt+2 → VPS
  useEffect(() => {
    function handleShortcut(e: KeyboardEvent) {
      if (!e.altKey) return
      if (e.key === '1') { setSection('overview'); setSidebarOpen(false) }
      if (e.key === '2') { setSection('oracle'); setSidebarOpen(false) }
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

  // Close sidebar on Escape key
  useEffect(() => {
    if (!sidebarOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sidebarOpen])

  // Focus management: focus close button when sidebar opens, restore to hamburger when it closes
  useEffect(() => {
    if (sidebarOpen) {
      closeButtonRef.current?.focus()
    } else {
      hamburgerRef.current?.focus()
    }
  }, [sidebarOpen])

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Hamburger button — mobile only */}
      <button
        ref={hamburgerRef}
        type="button"
        onClick={() => setSidebarOpen((o) => !o)}
        className="fixed top-4 left-4 z-[60] p-2 rounded-md bg-card border shadow-md md:hidden"
        aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
      >
        {sidebarOpen ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
      </button>

      <Sidebar
        section={section}
        onSectionChange={setSection}
        theme={theme}
        onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        version={version}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        ref={closeButtonRef}
      />

      <main
        id="main-content"
        className="flex-1 p-4 md:p-8 max-w-5xl"
        aria-hidden={sidebarOpen}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded"
        >
          Skip to main content
        </a>
        {!data ? (
          <LoadingSkeleton />
        ) : (
          <>
            <div className="flex items-center justify-end mb-2 gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Updated {timeAgo(lastUpdated)}</span>
              {responseMs != null && (
                <span className="text-xs text-muted-foreground" title="API response time">
                  {responseMs}ms
                </span>
              )}
              <Button
                type="button"
                size="default"
                variant="ghost"
                onClick={refresh}
                className="text-muted-foreground"
                aria-label="Refresh status"
              >
                <RefreshCw className="size-3" aria-hidden="true" />
                Refresh
              </Button>
              {error && (
                <span className="text-xs text-destructive" title={error}>
                  ⚠ Stale — poll failed
                </span>
              )}
            </div>
            <ErrorBoundary key={section} sectionLabel={section === 'overview' ? 'Overview' : 'VPS'}>
              {section === 'overview' && <OverviewSection data={data} />}
              {section === 'oracle' && <OracleSection oracle={data.oracle} refresh={refresh} />}
            </ErrorBoundary>
          </>
        )}
      </main>
    </div>
  )
}

export default App
