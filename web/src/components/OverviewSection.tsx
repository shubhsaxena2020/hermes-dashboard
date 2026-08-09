import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { BadgeVariant, HardwareUsage, StatusResponse } from '@/lib/api'
import { progressIndicatorClass } from '@/lib/color-threshold'
import { ExternalLink } from 'lucide-react'

function certBadgeVariant(daysRemaining?: number): BadgeVariant {
  if (daysRemaining == null) return 'destructive'
  if (daysRemaining < 14) return 'destructive'
  if (daysRemaining < 30) return 'secondary'
  return 'outline'
}

function HealthRow({ label, pct, detail }: { label: string; pct: number; detail: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums">{detail}</span>
      </div>
      <Progress value={pct} indicatorClassName={progressIndicatorClass(pct)} />
    </div>
  )
}

function SystemHealth({ usage }: { usage: HardwareUsage | null }) {
  if (!usage) return <p className="text-sm text-muted-foreground">Usage unavailable.</p>
  const cpuPct = usage.cpuUsagePct ?? 0
  const memPct = usage.memTotalMb ? Math.round(((usage.memUsedMb ?? 0) / usage.memTotalMb) * 100) : 0
  const diskPct = usage.diskPct ? Number(usage.diskPct.replace('%', '')) : 0
  return (
    <div className="space-y-3">
      {usage.cpuUsagePct != null && (
        <HealthRow label={`CPU (${usage.cpus ?? '?'} cores)`} pct={cpuPct} detail={`${cpuPct}%`} />
      )}
      <HealthRow label="Memory" pct={memPct} detail={`${usage.memUsedMb ?? '?'} / ${usage.memTotalMb ?? '?'} MB`} />
      <HealthRow label="Disk" pct={diskPct} detail={`${usage.diskUsed ?? '?'} / ${usage.diskTotal ?? '?'}`} />
    </div>
  )
}

export function OverviewSection({ data }: { data: StatusResponse }) {
  const oracleUp = data.oracle.containers.filter((c) => c.up).length
  const oracleTotal = data.oracle.containers.length

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">VPS</CardTitle>
            <Badge>always on</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {oracleUp}/{oracleTotal} containers up
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">System health</CardTitle>
          </CardHeader>
          <CardContent>
            <SystemHealth usage={data.oracle.usage} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick links</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <a className={buttonVariants({ variant: "outline", size: "sm" })} href="https://portainer.shubhbuilds.com" target="_blank" rel="noreferrer">
              Portainer<ExternalLink className="ml-1.5 size-3" aria-hidden="true" />
            </a>
            <a className={buttonVariants({ variant: "outline", size: "sm" })} href="https://monitor.shubhbuilds.com" target="_blank" rel="noreferrer">
              Netdata<ExternalLink className="ml-1.5 size-3" aria-hidden="true" />
            </a>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">TLS certificates</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              {(data.tls || []).map((cert) => (
                <div key={cert.domain} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2">
                  <dt className="truncate text-muted-foreground">{cert.domain.replace('.shubhbuilds.com', '')}</dt>
                  <dd>
                    <Badge variant={cert.error ? 'destructive' : certBadgeVariant(cert.daysRemaining)}>
                      {cert.error ? 'error' : `${cert.daysRemaining}d`}
                    </Badge>
                  </dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Estimated cost</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                VPS ({data.costs?.main.machineType ?? '?'}, always on)
              </span>
              <span>{data.costs?.main.monthlyEstimate != null ? `~$${data.costs.main.monthlyEstimate}/mo` : '—'}</span>
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              Approximate on-demand list pricing, not a billing-accurate figure.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
