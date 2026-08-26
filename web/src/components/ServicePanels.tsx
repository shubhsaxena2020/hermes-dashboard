import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useState } from 'react'
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
  ScrollText,
  User,
  CreditCard,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useJson } from '@/hooks/useJson'
import { certBadgeVariant } from '@/lib/badge-utils'
import { Progress } from '@/components/ui/progress'
import { progressIndicatorClass } from '@/lib/color-threshold'
import { formatBytes, parseSizeToBytes, parsePercent, formatDate } from '@/lib/format'
import type { StatusResponse } from '@/lib/api'

function PanelShell({
  title,
  icon,
  onRefresh,
  loading = false,
  error = null,
  children,
}: {
  title: string
  icon: React.ReactNode
  onRefresh: () => void
  loading?: boolean
  error?: string | null
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
      <CardContent>
        {loading ? <Loading /> : error ? <ErrorNote msg={error} /> : children}
      </CardContent>
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

export function SslPanel() {
  const { data, loading, error, refresh } = useJson<{ certs: StatusResponse['tls'] }>(api.ssl)
  const certs = data?.certs ?? []
  return (
    <PanelShell
      title="SSL/TLS Certificates"
      icon={<ShieldCheck className="size-4 text-brand" aria-hidden="true" />}
      onRefresh={refresh}
      loading={loading}
      error={error}
    >
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

export function SecurityPanel({ data }: { data: StatusResponse }) {
  const certs = data.tls ?? []
  const expired = certs.filter((c) => c.error || (c.daysRemaining != null && c.daysRemaining < 0))
  const expiring = certs.filter((c) => !c.error && c.daysRemaining != null && c.daysRemaining >= 0 && c.daysRemaining < 14)
  const healthy = certs.filter((c) => !c.error && c.daysRemaining != null && c.daysRemaining >= 14)

  const rows: { label: string; detail: string; tone: 'ok' | 'warn' | 'bad' }[] = [
    {
      label: 'Valid certificates',
      detail: healthy.length ? `${healthy.length} certificate${healthy.length !== 1 ? 's' : ''} valid for 14+ days` : 'None',
      tone: healthy.length ? 'ok' : 'warn',
    },
    {
      label: 'Expiring soon',
      detail: expiring.length ? `${expiring.length} certificate${expiring.length !== 1 ? 's' : ''} expiring within 14 days` : 'None',
      tone: expiring.length ? 'warn' : 'ok',
    },
    {
      label: 'Expired / error',
      detail: expired.length ? `${expired.length} certificate${expired.length !== 1 ? 's' : ''} expired or failing` : 'None',
      tone: expired.length ? 'bad' : 'ok',
    },
  ]

  return (
    <PanelShell title="Security" icon={<ShieldCheck className="size-4 text-brand" aria-hidden="true" />} onRefresh={() => {}}>
      <ul className="space-y-2.5">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center justify-between gap-3">
            <span className="text-sm text-foreground">{r.label}</span>
            <span
              className={
                r.tone === 'bad'
                  ? 'text-xs font-medium text-destructive'
                  : r.tone === 'warn'
                    ? 'text-xs font-medium text-amber-600 dark:text-amber-400'
                    : 'text-xs font-medium text-chart-2'
              }
            >
              {r.detail}
            </span>
          </li>
        ))}
      </ul>
      {expired.length > 0 && (
        <div className="mt-3 space-y-1">
          {expired.map((c) => (
            <div key={c.domain} className="text-xs text-muted-foreground">
              {c.domain}: {c.error ? c.error : 'expired'}
            </div>
          ))}
        </div>
      )}
    </PanelShell>
  )
}

export function LogsPanel({ data }: { data: StatusResponse }) {
  const viewable = data.oracle.viewable ?? []
  const stateByName = Object.fromEntries((data.oracle.containers ?? []).map((c) => [c.name, c]))
  const [selected, setSelected] = useState<string | null>(viewable[0] ?? null)
  const [logs, setLogs] = useState<string[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function load(name: string) {
    setSelected(name)
    setLoading(true)
    setErr(null)
    try {
      const res = await api.oracleContainerLogs(name)
      setLogs(res.logs)
    } catch (e) {
      setErr((e as Error).message || 'Failed to load logs')
      setLogs(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <ScrollText className="size-4 text-brand" aria-hidden="true" />
          Logs
        </CardTitle>
        {selected && (
          <Button type="button" size="sm" variant="ghost" className="text-muted-foreground" onClick={() => load(selected)} aria-label="Refresh logs">
            <RefreshCw className="size-3.5" aria-hidden="true" />
            Refresh
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[200px_1fr]">
          <ul className="space-y-1">
            {viewable.map((name) => {
              const up = stateByName[name]?.up
              return (
                <li key={name}>
                  <button
                    type="button"
                    onClick={() => load(name)}
                    className={`flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left text-sm ${
                      selected === name ? 'bg-accent font-medium text-foreground' : 'text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    <span className="truncate">{name}</span>
                    <span className={`size-2 shrink-0 rounded-full ${up ? 'bg-chart-2' : 'bg-destructive'}`} aria-hidden="true" />
                  </button>
                </li>
              )
            })}
            {viewable.length === 0 && <li className="text-sm text-muted-foreground">No viewable containers.</li>}
          </ul>
          <div className="min-w-0">
            {loading ? (
              <Loading />
            ) : err ? (
              <ErrorNote msg={err} />
            ) : logs ? (
              <pre className="max-h-80 overflow-auto rounded-md bg-muted/60 p-3 text-xs leading-relaxed text-foreground">
                {logs.length ? logs.join('\n') : 'No log output.'}
              </pre>
            ) : (
              <p className="text-sm text-muted-foreground">Select a container to view its logs.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground font-medium text-right truncate">{value}</span>
    </div>
  )
}

export function ProfilePanel({ data }: { data: StatusResponse }) {
  const sub = data.subscription
  const uptime = data.oracle.usage?.uptimeSeconds
  const uptimeLabel =
    uptime != null
      ? (() => {
          const d = Math.floor(uptime / 86400)
          const h = Math.floor((uptime % 86400) / 3600)
          return `${d}d ${h}h`
        })()
      : null
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 space-y-0">
        <User className="size-4 text-brand" aria-hidden="true" />
        <CardTitle className="text-base">Profile &amp; System</CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-border">
        <InfoRow label="Plan" value={sub?.planName ?? 'Web Host'} />
        {sub?.systemIp && <InfoRow label="System IP" value={sub.systemIp} />}
        {sub?.osLabel && <InfoRow label="Operating system" value={sub.osLabel} />}
        {sub?.phpVersion && <InfoRow label="PHP version" value={sub.phpVersion} />}
        {uptimeLabel && (
          <div className="flex items-center justify-between gap-3 py-2 text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Clock className="size-4 text-brand" aria-hidden="true" />
              Server uptime
            </span>
            <span className="text-foreground font-medium tabular-nums">{uptimeLabel}</span>
          </div>
        )}
        <p className="pt-3 text-xs text-muted-foreground">
          These values are reported by the host. Account-level settings (password, 2FA) are managed
          by your provider.
        </p>
      </CardContent>
    </Card>
  )
}

export function SubscriptionPanel({ data }: { data: StatusResponse }) {
  const sub = data.subscription
  const cost = data.costs?.main
  const estimate = cost?.monthlyEstimate
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 space-y-0">
        <CreditCard className="size-4 text-brand" aria-hidden="true" />
        <CardTitle className="text-base">Subscription</CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-border">
        <div className="pb-3">
          <div className="text-lg font-semibold text-foreground">{sub?.planName ?? 'Web Host'}</div>
          {cost?.machineType && (
            <div className="text-sm text-muted-foreground">{cost.machineType}</div>
          )}
        </div>
        {sub?.renewalDate && <InfoRow label="Renews" value={formatDate(sub.renewalDate)} />}
        {sub?.systemIp && <InfoRow label="System IP" value={sub.systemIp} />}
        {sub?.phpVersion && <InfoRow label="PHP" value={sub.phpVersion} />}
        {sub?.osLabel && <InfoRow label="OS" value={sub.osLabel} />}
        {estimate != null && (
          <InfoRow label="Monthly estimate" value={`$${estimate.toFixed(2)}`} />
        )}
        {cost?.note && <p className="pt-3 text-xs text-muted-foreground">{cost.note}</p>}
      </CardContent>
    </Card>
  )
}