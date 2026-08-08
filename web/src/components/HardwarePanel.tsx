import { Progress } from '@/components/ui/progress'
import type { HardwareUsage } from '@/lib/api'

export function HardwarePanel({ usage }: { usage?: HardwareUsage | null }) {
  const memPct = usage?.memTotalMb ? Math.round(((usage.memUsedMb ?? 0) / usage.memTotalMb) * 100) : 0
  const diskPct = usage?.diskPct ? Number(usage.diskPct.replace('%', '')) : 0

  return (
    <div className="space-y-4">
      {usage ? (
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">CPU cores: {usage.cpus ?? '?'}</div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Memory</span>
              <span>
                {usage.memUsedMb ?? '?'} / {usage.memTotalMb ?? '?'} MB
              </span>
            </div>
            <Progress value={memPct} />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Disk</span>
              <span>
                {usage.diskUsed ?? '?'} / {usage.diskTotal ?? '?'} ({usage.diskPct ?? '?'})
              </span>
            </div>
            <Progress value={diskPct} />
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Live usage unavailable.</p>
      )}
    </div>
  )
}
