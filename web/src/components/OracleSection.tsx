import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { HardwarePanel } from '@/components/HardwarePanel'
import { ContainerTable } from '@/components/ContainerTable'
import { api, type StatusResponse } from '@/lib/api'

export function OracleSection({ oracle, refresh }: { oracle: StatusResponse['oracle']; refresh: () => void }) {
  const containerUp = oracle.containers.filter((c) => c.up).length
  const containerTotal = oracle.containers.length

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold">VPS</h2>
        <Badge>always on</Badge>
        <Badge title={`${containerUp} of ${containerTotal} containers running`}>
          {containerUp}/{containerTotal} up
        </Badge>
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
