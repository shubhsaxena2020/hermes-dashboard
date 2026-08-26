import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  GitBranch,
  GitCommitHorizontal,
  FolderTree,
  Database,
  Archive,
  ShieldCheck,
  RefreshCw,
  CircleAlert,
  Cpu,
  MemoryStick,
  HardDrive,
  Clock,
  ExternalLink,
  Activity,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useJson } from '@/hooks/useJson'
import { certBadgeVariant } from '@/lib/badge-utils'
import { Progress } from '@/components/ui/progress'
import { progressIndicatorClass } from '@/lib/color-threshold'
import { formatBytes, parseSizeToBytes, parsePercent } from '@/lib/format'
import type { StatusResponse } from '@/lib/api'

function PanelShell({
  title,
  icon,
  onRefresh,
  children,
}: {
  title: string
  icon: React.ReactNode
  onRefresh: () => void
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
        </CardTitle>
        <Button type="button" size="sm" variant="ghost" className="text-muted-foreground" onClick={onRefresh} aria-label={`Refresh ${title}`}>
          <RefreshCw className="size-3.5" aria-hidden="true" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function ErrorNote({ msg }: { msg: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
    >
      <CircleAlert className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
      <div>
        <div className="font-medium">Could not load</div>
        <div>{msg}</div>
      </div>
    </div>
  )
}

function Loading() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

export function GitPanel() {
  const { data, error, loading, refresh } = useJson(() => api.git())
  return (
    <PanelShell title="Git Repositories" icon={<GitBranch className="size-4 text-brand" aria-hidden="true" />} onRefresh={refresh}>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorNote msg={error} />
      ) : data && data.repos.length ? (
        <ul className="divide-y divide-border">
          {data.repos.map((r) => (
            <li key={r.path} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <div className="text-sm font-medium text-foreground truncate">{r.repo}</div>
                <div className="text-xs text-muted-foreground truncate">{r.remote ?? r.path}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {r.dirty > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {r.dirty} uncommitted
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  <GitCommitHorizontal className="size-3 mr-1" aria-hidden="true" />
                  {r.branch}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No git repositories found under the configured scan roots.</p>
      )}
    </PanelShell>
  )
}

export function FilesPanel() {
  const { data, error, loading, refresh } = useJson(() => api.files())
  return (
    <PanelShell title="File Manager" icon={<FolderTree className="size-4 text-brand" aria-hidden="true" />} onRefresh={refresh}>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorNote msg={error} />
      ) : data && data.entries.length ? (
        <>
          <p className="text-xs text-muted-foreground mb-2 truncate">Root: {data.root}</p>
          <ul className="divide-y divide-border">
            {data.entries.map((e) => (
              <li key={e.path} className="flex items-center justify-between gap-3 py-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <FolderTree className="size-4 text-muted-foreground shrink-0" aria-hidden="true" />
                  <span className="text-sm font-medium text-foreground truncate">{e.name}</span>
                </div>
                <span className="text-xs text-muted-foreground tabular-nums shrink-0">{e.size}</span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">No files found at {data?.root}.</p>
      )}
    </PanelShell>
  )
}

export function BackupPanel() {
  const { data, error, loading, refresh } = useJson(() => api.backups())
  return (
    <PanelShell title="Backup Manager" icon={<Archive className="size-4 text-brand" aria-hidden="true" />} onRefresh={refresh}>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorNote msg={error} />
      ) : data && data.backups.length ? (
        <>
          <p className="text-xs text-muted-foreground mb-2 truncate">Root: {data.root}</p>
          <ul className="divide-y divide-border">
            {data.backups.map((b) => (
              <li key={b.name} className="flex items-center justify-between gap-3 py-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <Archive className="size-4 text-muted-foreground shrink-0" aria-hidden="true" />
                  <span className="text-sm font-medium text-foreground truncate">{b.name}</span>
                </div>
                <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                  {(b.sizeBytes / 1024 / 1024).toFixed(1)} MB
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">No backups found at {data?.root}.</p>
      )}
    </PanelShell>
  )
}

export function DatabasesPanel() {
  const { data, error, loading, refresh } = useJson(() => api.databases())
  return (
    <PanelShell title="Databases" icon={<Database className="size-4 text-brand" aria-hidden="true" />} onRefresh={refresh}>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorNote msg={error} />
      ) : data && data.databases.length ? (
        <ul className="divide-y divide-border">
          {data.databases.map((d) => (
            <li key={d.name} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <div className="text-sm font-medium text-foreground truncate">{d.name}</div>
                <div className="text-xs text-muted-foreground truncate">{d.image}</div>
              </div>
              <Badge variant={d.up ? 'default' : 'destructive'} className={d.up ? 'bg-chart-2/15 text-chart-2 border-chart-2/30' : ''}>
                {d.up ? 'Running' : 'Stopped'}
              </Badge>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No database containers detected.</p>
      )}
    </PanelShell>
  )
}

export function StatisticsPanel({ data }: { data: StatusResponse }) {
  const usage = data.oracle.usage
  const external = 'https://monitor.shubhbuilds.com'
  const diskUsed = parseSizeToBytes(usage?.diskUsed)
  const diskTotal = parseSizeToBytes(usage?.diskTotal)
  const diskPct = parsePercent(usage?.diskPct)
  const memPct =
    usage?.memTotalMb != null
      ? Math.round(((usage.memUsedMb ?? 0) / usage.memTotalMb) * 100)
      : null
  const cpuPct = usage?.cpuUsagePct != null ? Math.min(100, usage.cpuUsagePct) : null

  const rows = [
    { icon: Cpu, label: 'CPU', pct: cpuPct, detail: usage?.cpuUsagePct != null ? `${usage.cpuUsagePct}%` : '—' },
    {
      icon: MemoryStick,
      label: 'Memory',
      pct: memPct,
      detail:
        usage?.memUsedMb != null && usage?.memTotalMb != null
          ? `${usage.memUsedMb} / ${usage.memTotalMb} MB`
          : '—',
    },
    {
      icon: HardDrive,
      label: 'Disk',
      pct: diskPct,
      detail:
        diskUsed != null && diskTotal != null
          ? `${formatBytes(diskUsed)} / ${formatBytes(diskTotal)}`
          : usage?.diskUsed ?? '—',
    },
  ]

  const uptimeLabel =
    usage?.uptimeSeconds != null
      ? (() => {
          const d = Math.floor(usage.uptimeSeconds / 86400)
          const h = Math.floor((usage.uptimeSeconds % 86400) / 3600)
          return `${d}d ${h}h`
        })()
      : '—'

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="size-4 text-brand" aria-hidden="true" />
          Statistics
        </CardTitle>
        <a
          href={external}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-brand hover:underline"
        >
          Open in Netdata
          <ExternalLink className="size-3" aria-hidden="true" />
        </a>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {rows.map((r) => (
            <div key={r.label} className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <r.icon className="size-4 text-brand" aria-hidden="true" />
                {r.label}
              </div>
              {r.pct != null ? (
                <Progress value={r.pct} indicatorClassName={progressIndicatorClass(r.pct)} />
              ) : (
                <div className="h-1.5 w-full rounded-full bg-muted" />
              )}
              <div className="text-xs tabular-nums text-foreground font-medium">{r.detail}</div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 border-t border-border pt-3 text-sm text-muted-foreground">
          <Clock className="size-4 text-brand" aria-hidden="true" />
          Uptime
          <span className="ml-auto text-foreground font-medium tabular-nums">{uptimeLabel}</span>
        </div>
      </CardContent>
    </Card>
  )
}

export function SslPanel({ data }: { data: StatusResponse }) {
  const certs = data.tls ?? []
  return (
    <PanelShell title="SSL/TLS Certificates" icon={<ShieldCheck className="size-4 text-brand" aria-hidden="true" />} onRefresh={() => {}}>
      {certs.length ? (
        <ul className="divide-y divide-border">
          {certs.map((cert) => {
            const expiryDate = cert.validTo ? new Date(cert.validTo) : null
            const expiryLabel = expiryDate
              ? expiryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : null
            return (
              <li key={cert.domain} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{cert.domain}</div>
                  {expiryLabel && <div className="text-xs text-muted-foreground">Expires {expiryLabel}</div>}
                </div>
                <Badge variant={cert.error ? 'destructive' : certBadgeVariant(cert.daysRemaining)}>
                  {cert.error ? 'error' : `${cert.daysRemaining ?? '?'}d`}
                </Badge>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No certificates reported.</p>
      )}
    </PanelShell>
  )
}
