import { Progress } from '@/components/ui/progress'
import type { HardwareUsage } from '@/lib/api'

function progressIndicatorClass(pct: number): string {
  if (pct >= 80) return 'bg-destructive'
  if (pct >= 60) return 'bg-yellow-500'
  return ''
}

export function HardwarePanel({ usage }: { usage?: HardwareUsage | null }) {
  const cpuPct = usage?.cpuUsagePct ?? 0
  const memPct = usage?.memTotalMb ? Math.round(((usage.memUsedMb ?? 0) / usage.memTotalMb) * 100) : 0
  const diskPct = usage?.diskPct ? Number(usage.diskPct.replace('%', '')) : 0

  return (
    <div className="space-y-4">
      {usage ? (
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">CPU ({usage.cpus ?? '?'} cores)</span>
              <span className="tabular-nums">
                {usage.cpuUsagePct != null ? `${cpuPct}%` : '—'}
              </span>
            </div>
            {usage.cpuUsagePct != null && (
              <Progress value={cpuPct} indicatorClassName={progressIndicatorClass(cpuPct)} />
            )}
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Memory</span>
              <span className="tabular-nums">
                {usage.memUsedMb ?? '?'} / {usage.memTotalMb ?? '?'} MB ({memPct}%)
              </span>
            </div>
            <Progress value={memPct} indicatorClassName={progressIndicatorClass(memPct)} />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Disk</span>
              <span className="tabular-nums">
                {usage.diskUsed ?? '?'} / {usage.diskTotal ?? '?'} ({usage.diskPct ?? '?'})
              </span>
            </div>
            <Progress value={diskPct} indicatorClassName={progressIndicatorClass(diskPct)} />
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Live usage unavailable.</p>
      )}
    </div>
  )
}
