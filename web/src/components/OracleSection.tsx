import { useState } from 'react'
import { Loader2, Play } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { HardwarePanel } from '@/components/HardwarePanel'
import { ContainerTable } from '@/components/ContainerTable'
import { api, type StatusResponse } from '@/lib/api'

export function OracleSection({ oracle, refresh }: { oracle: StatusResponse['oracle']; refresh: () => void }) {
  const containerUp = oracle.containers.filter((c) => c.up).length
  const containerTotal = oracle.containers.length
  const downContainers = oracle.containers.filter((c) => !c.up)
  const downControllable = downContainers.filter((c) => oracle.controllable.includes(c.name))
  const [startingAll, setStartingAll] = useState(false)

  async function handleStartAll() {
    if (downControllable.length === 0) return
    setStartingAll(true)
    let started = 0
    let failed = 0
    for (const c of downControllable) {
      try {
        await api.oracleContainerAction(c.name, 'start')
        started++
      } catch {
        failed++
      }
    }
    setStartingAll(false)
    if (failed === 0) {
      toast.success(`Started ${started} container${started !== 1 ? 's' : ''}`)
    } else {
      toast.error(`${failed} container${failed !== 1 ? 's' : ''} failed to start`, {
        description: `${started} started successfully`,
      })
    }
    refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="text-xl font-semibold">VPS</h2>
        <Badge>always on</Badge>
        <Badge title={`${containerUp} of ${containerTotal} containers running`}>
          {containerUp}/{containerTotal} up
        </Badge>
        {downControllable.length > 0 && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs gap-1"
            disabled={startingAll}
            onClick={handleStartAll}
            aria-label={`Start all ${downControllable.length} stopped container${downControllable.length !== 1 ? 's' : ''}`}
          >
            {startingAll
              ? <Loader2 className="size-3 animate-spin motion-reduce:animate-none" aria-hidden="true" />
              : <Play className="size-3" aria-hidden="true" />}
            Start all ({downControllable.length})
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hardware</CardTitle>
        </CardHeader>
        <CardContent>
          <HardwarePanel usage={oracle.usage} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Infrastructure</CardTitle>
        </CardHeader>
        <CardContent>
          <ContainerTable
            containers={oracle.containers}
            controllable={oracle.controllable}
            viewable={oracle.viewable}
            onAction={(name, action) => api.oracleContainerAction(name, action).then(() => refresh())}
            onLogs={(name) => api.oracleContainerLogs(name).then((r) => r.logs)}
          />
        </CardContent>
      </Card>
    </div>
  )
}
