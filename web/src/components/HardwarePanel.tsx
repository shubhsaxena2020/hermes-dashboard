import { Progress } from '@/components/ui/progress'
import type { HardwareUsage } from '@/lib/api'
import { progressIndicatorClass, diskUsageWarning } from '@/lib/color-threshold'

export function HardwarePanel({ usage }: { usage?: HardwareUsage | null }) {
  const cpuPct = usage?.cpuUsagePct ?? 0
  const memPct = usage?.memTotalMb ? Math.round(((usage.memUsedMb ?? 0) / usage.memTotalMb) * 100) : 0
  const diskPct = usage?.diskPct ? Number(usage.diskPct.replace('%', '')) : 0

  const diskWarning = diskUsageWarning(diskPct)

  return (
    <div className="space-y-4">
      {usage ? (
        <div className="space-y-3">
          {diskWarning && (
            <div
              role="alert"
              className={`rounded-md border px-3 py-2 text-xs font-medium ${
                diskPct >= 95
                  ? 'border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400'
                  : 'border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400'
              }`}
            >
              {diskWarning}
            </div>
          )}
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
          {usage.loadAvg && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Load average</span>
              <span className="tabular-nums">
                {usage.loadAvg.one} · {usage.loadAvg.five} · {usage.loadAvg.fifteen}
                <span className="text-muted-foreground"> (1m/5m/15m)</span>
              </span>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Live usage unavailable.</p>
      )}
    </div>
  )
}
