export interface ContainerInfo {
  name: string
  status: string
  up: boolean
  cpu?: string
  mem?: string
}

export interface HardwareUsage {
  cpus: number | null
  cpuUsagePct: number | null
  memTotalMb: number | null
  memUsedMb: number | null
  diskTotal: string | null
  diskUsed: string | null
  diskPct: string | null
  uptimeSeconds: number | null
}

export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline'

export interface TlsCertStatus {
  domain: string
  issuer?: string
  validTo?: string
  daysRemaining?: number
  error?: string
}

export interface CostEstimate {
  machineType: string | null
  monthlyEstimate: number | null
  alwaysOn?: boolean
  running?: boolean
  note?: string
}

export interface StatusResponse {
  oracle: {
    containers: ContainerInfo[]
    controllable: string[]
    viewable: string[]
    usage: HardwareUsage | null
  }
  tls: TlsCertStatus[]
  costs: { main: CostEstimate }
}

async function req<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, opts)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(body.error || `Request failed (${res.status})`)
  }
  return body as T
}

export const api = {
  status: () => req<StatusResponse>('/api/status'),

  oracleContainerAction: (name: string, action: string) =>
    req<{ ok: true }>(`/api/oracle/containers/${name}/${action}`, { method: 'POST' }),
  oracleContainerLogs: (name: string) => req<{ logs: string[] }>(`/api/oracle/containers/${name}/logs`),

  version: () => req<{ commit: string | null; date: string | null }>('/api/version'),
}
