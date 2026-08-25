import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { CreditCard, HardDrive, Activity, Server, ShieldCheck } from 'lucide-react'
import type { StatusResponse } from '@/lib/api'
import { formatBytes, formatDate, usagePair, parseSizeToBytes, parsePercent } from '@/lib/format'
import { progressIndicatorClass } from '@/lib/color-threshold'

function ResourceRow({
  icon: Icon,
  label,
  used,
  limit,
  pct,
  unlimited,
}: {
  icon: typeof HardDrive
  label: string
  used: string
  limit: string
  pct: number | null
  unlimited: boolean
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 text-muted-foreground">
          <Icon className="size-4 text-brand" aria-hidden="true" />
          {label}
        </span>
        <span className="tabular-nums text-foreground font-medium">
          {unlimited ? `${used} · ${limit}` : `${used} / ${limit}`}
        </span>
      </div>
      {unlimited ? (
        <div className="h-1.5 w-full rounded-full bg-muted" />
      ) : (
        <Progress value={pct ?? 0} indicatorClassName={progressIndicatorClass(pct ?? 0)} />
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground font-medium">{value}</span>
    </div>
  )
}

export function RightRail({ data }: { data: StatusResponse }) {
  const usage = data.oracle.usage
  const subscription = data.subscription
  const traffic = data.traffic

  const diskUsed = parseSizeToBytes(usage?.diskUsed)
  const diskTotal = parseSizeToBytes(usage?.diskTotal)
  const diskPct = parsePercent(usage?.diskPct)

  const trafficPair = traffic
    ? usagePair(traffic.usedBytes, traffic.limitBytes)
    : { used: '—', limit: 'Unlimited', pct: null, unlimited: true }
  const trafficPct = traffic
    ? traffic.limitBytes
      ? Math.min(100, trafficPair.pct ?? 0)
      : null
    : null

  return (
    <aside className="w-full lg:w-[300px] shrink-0 space-y-4" aria-label="Subscription and usage">
      <Card>
        <CardHeader className="flex flex-row items-center gap-2 space-y-0">
          <CreditCard className="size-4 text-brand" aria-hidden="true" />
          <CardTitle className="text-base">Subscription</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5">
          <div className="text-lg font-semibold text-foreground">
            {subscription?.planName ?? 'Web Host'}
          </div>
          <div className="space-y-1.5">
            {subscription?.renewalDate && (
              <InfoRow label="Renews" value={formatDate(subscription.renewalDate)} />
            )}
            {subscription?.systemIp && <InfoRow label="System IP" value={subscription.systemIp} />}
            {subscription?.phpVersion && <InfoRow label="PHP" value={subscription.phpVersion} />}
            {subscription?.osLabel && <InfoRow label="OS" value={subscription.osLabel} />}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2 space-y-0">
          <Server className="size-4 text-brand" aria-hidden="true" />
          <CardTitle className="text-base">Resource usage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ResourceRow
            icon={HardDrive}
            label="Disk space"
            used={diskUsed != null ? formatBytes(diskUsed) : (usage?.diskUsed ?? '—')}
            limit={diskTotal != null ? formatBytes(diskTotal) : (usage?.diskTotal ?? '—')}
            pct={diskPct}
            unlimited={diskTotal == null}
          />
          <ResourceRow
            icon={Activity}
            label="Traffic"
            used={trafficPair.used}
            limit={trafficPair.limit}
            pct={trafficPct}
            unlimited={trafficPair.unlimited}
          />
          {usage?.cpuUsagePct != null && (
            <ResourceRow
              icon={Server}
              label="CPU"
              used={`${usage.cpuUsagePct}%`}
              limit="100%"
              pct={Math.min(100, usage.cpuUsagePct)}
              unlimited={false}
            />
          )}
          {usage?.memTotalMb != null && (
            <ResourceRow
              icon={ShieldCheck}
              label="Memory"
              used={`${usage.memUsedMb ?? 0} ${usage.memUsedMb != null ? 'MB' : ''}`}
              limit={`${usage.memTotalMb} MB`}
              pct={Math.round(((usage.memUsedMb ?? 0) / usage.memTotalMb) * 100)}
              unlimited={false}
            />
          )}
        </CardContent>
      </Card>
    </aside>
  )
}
