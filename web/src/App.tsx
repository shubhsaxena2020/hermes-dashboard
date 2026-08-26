import { useEffect, useRef, useState } from 'react'
import { useTheme } from 'next-themes'
import { RefreshCw, Menu, X, WifiOff, Bell, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useStatus } from '@/hooks/useStatus'
import { SectionRenderer } from '@/components/SectionRenderer'
import { RightRail } from '@/components/RightRail'
import { Sidebar } from '@/components/Sidebar'
import { api } from '@/lib/api'
import { timeAgo } from '@/lib/time'
import { responseTimeClass } from '@/lib/color-threshold'
import { NAV_BY_KEY, type SectionKey } from '@/lib/nav'

function LoadingSkeleton() {
  return (
    <div className="space-y-5" role="status" aria-label="Loading dashboard">
      <Skeleton className="h-7 w-40" />
      <Skeleton className="h-20 w-full rounded-lg" />
      <Skeleton className="h-40 w-full rounded-lg" />
      <Skeleton className="h-48 w-full rounded-lg" />
    </div>
  )
}

function App() {
  const [section, setSection] = useState<SectionKey>('domains')
  const [focusDomain, setFocusDomain] = useState<string | null>(null)
  const { data, lastUpdated, error, responseMs, refresh } = useStatus()
  const [, forceTick] = useState(0)
  const [version, setVersion] = useState<{ commit: string | null; date: string | null } | null>(null)
  const { theme, setTheme } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const hamburgerRef = useRef<HTMLButtonElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // Re-render every second so the "updated Xs ago" note stays live; pause when
  // the tab is hidden to save CPU.
  useEffect(() => {
    let id: number | null = null
    function start() { id = window.setInterval(() => forceTick((n) => n + 1), 1000) }
    function stop() { if (id != null) { window.clearInterval(id); id = null } }
    function onVisibility() { if (document.hidden) stop(); else start() }
    start()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      stop()
    }
  }, [])

  // Version never changes during a session — fetch once.
  useEffect(() => {
    api.version().then(setVersion).catch(() => setVersion(null))
  }, [])

  // Keyboard shortcuts: Alt+1 → Domains, Alt+2 → Server
  useEffect(() => {
    function handleShortcut(e: KeyboardEvent) {
      if (!e.altKey) return
      if (e.key === '1') { setSection('domains'); setSidebarOpen(false) }
      if (e.key === '2') { setSection('server'); setSidebarOpen(false) }
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

  // Close sidebar on Escape.
  useEffect(() => {
    if (!sidebarOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSidebarOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sidebarOpen])

  // Tab-title reflects the active section + connection health.
  useEffect(() => {
    const label = NAV_BY_KEY[section]?.label ?? 'Hosting'
    document.title = `${label}${error ? ' ⚠' : ''} — Hosting Panel`
  }, [section, error])

  // Focus management for the mobile sidebar.
  useEffect(() => {
    if (sidebarOpen) closeButtonRef.current?.focus()
    else hamburgerRef.current?.focus()
  }, [sidebarOpen])

  const sectionLabel = NAV_BY_KEY[section]?.label ?? 'Hosting'

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <button
        ref={hamburgerRef}
        type="button"
        onClick={() => setSidebarOpen((o) => !o)}
        className="fixed top-3 left-3 z-[60] flex size-9 items-center justify-center rounded-md bg-sidebar text-sidebar-foreground shadow-md md:hidden"
        aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
        aria-hidden={sidebarOpen || undefined}
        tabIndex={sidebarOpen ? -1 : 0}
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
        downCount={data?.oracle.containers.filter((c) => !c.up).length ?? 0}
        ref={closeButtonRef}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card px-4 md:px-6">
          <div className="hidden md:block text-sm font-medium text-muted-foreground">
            {sectionLabel}
          </div>
          <div className="relative ml-auto hidden sm:block w-56">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              type="search"
              placeholder="Search"
              aria-label="Search"
              className="h-9 pl-8 rounded-full bg-muted/60 border-transparent focus-visible:bg-background"
            />
          </div>
          <span
            className={`size-2.5 rounded-full ${error ? 'bg-destructive' : 'bg-chart-2'}`}
            role="img"
            aria-label={error ? 'Disconnected' : 'Connected'}
            title={error ? `Disconnected: ${error}` : 'Backend reachable'}
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="text-muted-foreground"
            aria-label="Notifications"
          >
            <Bell className="size-4" aria-hidden="true" />
          </Button>
        </header>

        <main
          id="main-content"
          className="flex-1 px-4 py-5 md:px-6 md:py-6"
          inert={sidebarOpen || undefined}
        >
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded"
          >
            Skip to main content
          </a>

          {error && (
            <div
              className="mb-4 flex items-center gap-2 rounded-md border border-chart-4/50 bg-chart-4/10 px-4 py-3 text-sm text-chart-4 dark:text-chart-4"
              role="alert"
            >
              <WifiOff className="size-4 shrink-0" aria-hidden="true" />
              <span>Connection lost — showing stale data. Will retry automatically.</span>
            </div>
          )}

          {!data ? (
            <LoadingSkeleton />
          ) : (
            <div className="mx-auto flex max-w-[1400px] flex-col gap-6 lg:flex-row lg:items-start">
              <div className="min-w-0 flex-1">
                <div className="mb-4 flex items-center justify-end gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground">Updated {timeAgo(lastUpdated)}</span>
                  {responseMs != null && (
                    <span
                      className={`text-xs font-medium tabular-nums ${responseTimeClass(responseMs)}`}
                      title={`API response time: ${responseMs}ms`}
                    >
                      {responseMs}ms
                    </span>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={refresh}
                    className="text-muted-foreground"
                    aria-label="Refresh status"
                  >
                    <RefreshCw className="size-3.5" aria-hidden="true" />
                    Refresh
                  </Button>
                </div>
                <SectionRenderer
                  section={section}
                  data={data}
                  focusDomain={focusDomain}
                  onNavigate={(key, domain) => {
                    setSection(key)
                    setFocusDomain(domain ?? null)
                  }}
                />
              </div>

              <RightRail data={data} />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default App
