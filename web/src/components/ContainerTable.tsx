import { Fragment, useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, Check, Copy, Container, Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { ContainerInfo } from '@/lib/api'
import { progressIndicatorClass } from '@/lib/color-threshold'
import { resourceBadgeInfo } from '@/lib/badge-utils'
import { parseCpuPercent, parseMemPercent } from '@/lib/container-utils'

type SortKey = 'name' | 'status' | 'cpu' | 'mem'
const SORT_OPTIONS: { key: SortKey; label: string; defaultAsc: boolean }[] = [
  { key: 'name', label: 'Name', defaultAsc: true },
  { key: 'status', label: 'Status', defaultAsc: true },
  { key: 'cpu', label: 'CPU', defaultAsc: false },
  { key: 'mem', label: 'MEM', defaultAsc: false },
]

interface Props {
  containers: ContainerInfo[]
  controllable: string[]
  viewable?: string[] // omit to allow viewing logs for every container
  onAction: (name: string, action: 'start' | 'stop' | 'restart') => Promise<void>
  onLogs: (name: string) => Promise<string[]>
}

// Docker's `stats --format` output parsing -- see lib/container-utils.ts
// (parseCpuPercent, parseMemPercent extracted there for testability)

export function ContainerTable({ containers, controllable, viewable, onAction, onLogs }: Props) {
  const [openLogs, setOpenLogs] = useState<Record<string, string[] | 'loading'>>({})
  const [pending, setPending] = useState<Record<string, boolean>>({})
  const [confirmTarget, setConfirmTarget] = useState<{ name: string; action: 'stop' | 'restart' } | null>(null)
  const [logFilter, setLogFilter] = useState<Record<string, string>>({})
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortAsc, setSortAsc] = useState(true)
  const [nameFilter, setNameFilter] = useState('')
  const [autoRefresh, setAutoRefresh] = useState<Record<string, boolean>>({})
  const [copiedLogs, setCopiedLogs] = useState<Record<string, boolean>>({})

  // Stable ref so the auto-refresh useEffect doesn't re-run when the parent
  // passes a new inline callback on every render (App → OracleSection → here).
  const onLogsRef = useRef(onLogs)
  onLogsRef.current = onLogs

  // Poll logs every 15 s for containers with auto-refresh enabled.
  useEffect(() => {
    const active = Object.entries(autoRefresh).filter(([, on]) => on).map(([name]) => name)
    if (active.length === 0) return
    const id = setInterval(async () => {
      for (const name of active) {
        try {
          const logs = await onLogsRef.current(name)
          setOpenLogs((prev) => {
            if (!prev[name]) return prev // closed in the meantime
            return { ...prev, [name]: logs }
          })
        } catch {
          // Silently ignore — next interval will retry
        }
      }
    }, 15_000)
    return () => clearInterval(id)
  }, [autoRefresh])

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc((a) => !a)
    } else {
      setSortKey(key)
      setSortAsc(SORT_OPTIONS.find((o) => o.key === key)?.defaultAsc ?? true)
    }
  }

  const filtered = nameFilter
    ? containers.filter((c) => c.name.toLowerCase().includes(nameFilter.toLowerCase()))
    : containers

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0
    switch (sortKey) {
      case 'name':
        cmp = a.name.localeCompare(b.name)
        break
      case 'status':
        cmp = (a.up ? 0 : 1) - (b.up ? 0 : 1)
        break
      case 'cpu':
        cmp = (parseCpuPercent(b.cpu) ?? 0) - (parseCpuPercent(a.cpu) ?? 0)
        break
      case 'mem':
        cmp = (parseMemPercent(b.mem) ?? 0) - (parseMemPercent(a.mem) ?? 0)
        break
    }
    return sortAsc ? cmp : -cmp
  })

  async function runAction(name: string, action: 'start' | 'stop' | 'restart') {
    setPending((p) => ({ ...p, [name]: true }))
    try {
      await onAction(name, action)
      toast.success(`${name}: ${action} succeeded`)
    } catch (err) {
      toast.error(`${name}: ${action} failed`, { description: (err as Error).message })
    } finally {
      setPending((p) => ({ ...p, [name]: false }))
    }
  }

  async function toggleLogs(name: string) {
    if (openLogs[name]) {
      setOpenLogs((o) => {
        const next = { ...o }
        delete next[name]
        return next
      })
      setAutoRefresh((a) => {
        if (!a[name]) return a
        const next = { ...a }
        delete next[name]
        return next
      })
      return
    }
    setOpenLogs((o) => ({ ...o, [name]: 'loading' }))
    try {
      const logs = await onLogs(name)
      setOpenLogs((o) => ({ ...o, [name]: logs }))
    } catch (err) {
      setOpenLogs((o) => ({ ...o, [name]: [`Failed to load logs: ${(err as Error).message}`] }))
    }
  }

  async function copyLogs(name: string, lines: string[]) {
    try {
      await navigator.clipboard.writeText(lines.join('\n'))
      setCopiedLogs((c) => ({ ...c, [name]: true }))
      setTimeout(() => setCopiedLogs((c) => ({ ...c, [name]: false })), 2000)
    } catch {
      toast.error('Copy failed', {
        description: 'Clipboard API is not available in this context.',
      })
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="relative max-w-xs">
          <Input
            placeholder="Filter containers…"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') setNameFilter('') }}
            className="h-7 text-xs pr-7"
            aria-label="Filter containers by name"
          />
          {nameFilter && (
            <button
              type="button"
              onClick={() => setNameFilter('')}
              aria-label="Clear filter"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
            >
              ×
            </button>
          )}
        </div>
        {nameFilter && (
          <span className="text-xs text-muted-foreground">
            {sorted.length} of {containers.length}
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        <span className="text-xs text-muted-foreground mr-1">Sort:</span>
        {SORT_OPTIONS.map((opt) => (
          <Button
            key={opt.key}
            type="button"
            size="sm"
            variant={sortKey === opt.key ? 'secondary' : 'ghost'}
            className="h-6 px-2 text-xs"
            aria-pressed={sortKey === opt.key}
            aria-label={`Sort by ${opt.label}, ${sortKey === opt.key ? (sortAsc ? 'ascending' : 'descending') : 'default order'}`}
            onClick={() => toggleSort(opt.key)}
          >
            {opt.label}
            {sortKey === opt.key && (
              sortAsc
                ? <ArrowUp className="size-3 ml-1" aria-hidden="true" />
                : <ArrowDown className="size-3 ml-1" aria-hidden="true" />
            )}
          </Button>
        ))}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Container</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right hidden sm:table-cell">CPU</TableHead>
            <TableHead className="text-right hidden sm:table-cell">MEM</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((c) => {
            const canControl = controllable.includes(c.name)
            const canView = !viewable || viewable.includes(c.name)
            const isPending = pending[c.name]
            const logState = openLogs[c.name]
            const filter = logFilter[c.name] || ''
            const filteredLines =
              Array.isArray(logState) && filter
                ? logState.filter((line) => line.toLowerCase().includes(filter.toLowerCase()))
                : logState
            const cpuPct = parseCpuPercent(c.cpu)
            const memPct = parseMemPercent(c.mem)
            const badgeInfo = resourceBadgeInfo(cpuPct, memPct)
            return (
              <Fragment key={c.name}>
                <TableRow>
                  <TableCell>
                    <div className="font-medium flex items-center gap-2">
                      {c.name}
                      {badgeInfo && (
                        <Badge variant={badgeInfo.variant} className="text-[10px] px-1.5 py-0">
                          {badgeInfo.label}
                        </Badge>
                      )}
                    </div>
                    {/* Mobile-only resource summary — CPU/MEM columns are hidden below sm */}
                    <div className="text-xs text-muted-foreground sm:hidden mt-0.5">
                      {cpuPct != null && `CPU ${cpuPct}%`}
                      {cpuPct != null && memPct != null && ' · '}
                      {memPct != null && `MEM ${memPct}%`}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1.5" aria-label={c.up ? 'Running' : 'Stopped'}>
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${c.up ? 'bg-green-500' : 'bg-red-500'}`}
                        aria-hidden="true"
                      />
                      <span className={c.up ? 'text-green-500' : 'text-red-500'}>{c.status}</span>
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-sm hidden sm:table-cell">
                    {cpuPct != null ? (
                      <div className="flex items-center justify-end gap-2">
                        <span>{cpuPct}%</span>
                        <div className="w-16 h-1 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${progressIndicatorClass(cpuPct) || 'bg-primary'}`}
                            style={{ width: `${Math.min(cpuPct, 100)}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">{c.cpu || '—'}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-sm hidden sm:table-cell">
                    {memPct != null ? (
                      <div className="flex items-center justify-end gap-2">
                        <span>{memPct}%</span>
                        <div className="w-16 h-1 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${progressIndicatorClass(memPct) || 'bg-primary'}`}
                            style={{ width: `${Math.min(memPct, 100)}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">{c.mem || '—'}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right whitespace-normal">
                    <div className="flex flex-wrap justify-end gap-1.5">
                    {canControl && !c.up && (
                      <Button size="default" variant="default" disabled={isPending} onClick={() => runAction(c.name, 'start')}>
                        {isPending ? <Loader2 className="size-3 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : 'Start'}
                      </Button>
                    )}
                    {canControl && c.up && (
                      <>
                        <Button
                          size="default"
                          variant="destructive"
                          disabled={isPending}
                          onClick={() => setConfirmTarget({ name: c.name, action: 'stop' })}
                        >
                          {isPending ? <Loader2 className="size-3 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : 'Stop'}
                        </Button>
                        <Button
                          size="default"
                          variant="secondary"
                          disabled={isPending}
                          onClick={() => setConfirmTarget({ name: c.name, action: 'restart' })}
                        >
                          {isPending ? <Loader2 className="size-3 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : 'Restart'}
                        </Button>
                      </>
                    )}
                    {canView && (
                      <Button size="default" variant="outline" onClick={() => toggleLogs(c.name)}>
                        {logState ? 'Hide logs' : 'Logs'}
                      </Button>
                    )}
                    </div>
                  </TableCell>
                </TableRow>
                {logState && (
                  <TableRow>
                    <TableCell colSpan={5} className="p-0">
                      <div className="m-2 space-y-2">
                        {Array.isArray(logState) && (
                          <div className="flex items-center gap-2">
                            <Input
                              placeholder="Filter log lines…"
                              aria-label="Filter log lines"
                              value={filter}
                              onChange={(e) => setLogFilter((f) => ({ ...f, [c.name]: e.target.value }))}
                              onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                  if (logFilter[c.name]) {
                                    setLogFilter((f) => ({ ...f, [c.name]: '' }))
                                  } else {
                                    toggleLogs(c.name)
                                  }
                                }
                              }}
                              className="h-7 text-xs max-w-xs"
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant={autoRefresh[c.name] ? 'default' : 'outline'}
                              className="h-7 px-2 text-xs gap-1"
                              aria-pressed={!!autoRefresh[c.name]}
                              aria-label={autoRefresh[c.name] ? 'Stop auto-refreshing logs' : 'Auto-refresh logs every 15 seconds'}
                              onClick={() => setAutoRefresh((a) => ({ ...a, [c.name]: !a[c.name] }))}
                            >
                              <RefreshCw className={`size-3 ${autoRefresh[c.name] ? 'animate-spin motion-reduce:animate-none' : ''}`} aria-hidden="true" />
                              {autoRefresh[c.name] ? 'Live' : 'Auto'}
                            </Button>
                            {Array.isArray(filteredLines) && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs gap-1"
                                aria-label={copiedLogs[c.name] ? 'Copied log lines to clipboard' : 'Copy log lines to clipboard'}
                                onClick={() => copyLogs(c.name, filteredLines as string[])}
                                disabled={copiedLogs[c.name]}
                              >
                                {copiedLogs[c.name]
                                  ? <Check className="size-3" aria-hidden="true" />
                                  : <Copy className="size-3" aria-hidden="true" />}
                                {copiedLogs[c.name] ? 'Copied!' : 'Copy'}
                              </Button>
                            )}
                            {Array.isArray(logState) && (
                              <span className="text-xs text-muted-foreground">
                                {filter
                                  ? `${filteredLines.length} of ${logState.length} lines`
                                  : `${logState.length} lines`}
                              </span>
                            )}
                          </div>
                        )}
                        <pre role="log" aria-label="Container logs" className="bg-muted/50 text-xs p-3 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-md">
                          {logState === 'loading'
                            ? <span className="flex items-center gap-1.5 text-muted-foreground"><Loader2 className="size-3 animate-spin motion-reduce:animate-none" aria-hidden="true" /> Loading…</span>
                            : (filteredLines as string[]).join('\n') || (filter ? '(no matching lines)' : '(no output)')}
                        </pre>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            )
          })}
          {sorted.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="py-10">
                <div className="flex flex-col items-center justify-center text-center" role="status">
                  <Container className="size-10 text-muted-foreground/50 mb-3" aria-hidden="true" />
                  {nameFilter ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        No containers match &ldquo;{nameFilter}&rdquo;
                      </p>
                      <button
                        type="button"
                        onClick={() => setNameFilter('')}
                        className="text-xs text-primary hover:underline mt-2"
                      >
                        Clear filter
                      </button>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No containers found
                    </p>
                  )}
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <AlertDialog open={!!confirmTarget} onOpenChange={(open) => !open && setConfirmTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmTarget?.action === 'stop' ? 'Stop' : 'Restart'} {confirmTarget?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will {confirmTarget?.action} the container immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmTarget) runAction(confirmTarget.name, confirmTarget.action)
                setConfirmTarget(null)
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
