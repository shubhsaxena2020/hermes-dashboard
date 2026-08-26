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

export interface TrafficUsage {
  /** Bytes used this period, or null when the host reports no figure. */
  usedBytes?: number | null
  /** Bytes limit for the period, or null for "Unlimited". */
  limitBytes?: number | null
  /** Human label for when the counter resets (e.g. "Resets Sep 1"). */
  resetLabel?: string | null
}

export interface DomainSslInfo {
  issuer?: string | null
  validTo?: string | null
  daysRemaining?: number | null
  error?: string | null
}

export interface DomainInfo {
  domain: string
  /** The container/app that backs this domain, if known. */
  service?: string | null
  reachable: boolean
  httpStatus?: number | null
  ssl?: DomainSslInfo | null
}

export interface DomainsResponse {
  domains: DomainInfo[]
}

export interface SubscriptionInfo {
  planName?: string | null
  renewalDate?: string | null
  systemIp?: string | null
  phpVersion?: string | null
  osLabel?: string | null
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
  /** Optional — present only when the host reports bandwidth stats. */
  traffic?: TrafficUsage | null
  /** Optional — subscription/plan summary for the right rail. */
  subscription?: SubscriptionInfo | null
}

async function req<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, opts)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(body.error || `Request failed (${res.status})`)
  }
  return body as T
}

// When VITE_MOCK=1 we serve a deterministic dataset so the UI can be rendered
// and visually verified without a live backend. Keep the import dynamic-free
// so tree-shaking drops it from production builds (VITE_MOCK is undefined there).
const USE_MOCK = import.meta.env.VITE_MOCK === '1'

export const api = {
  status: () =>
    USE_MOCK
      ? import('@/lib/mock-data').then((m) => m.mockStatus as StatusResponse)
      : req<StatusResponse>('/api/status'),

  oracleContainerAction: (name: string, action: string) =>
    req<{ ok: true }>(`/api/oracle/containers/${name}/${action}`, { method: 'POST' }),
  oracleContainerLogs: (name: string) => req<{ logs: string[] }>(`/api/oracle/containers/${name}/logs`),

  version: () => req<{ commit: string | null; date: string | null }>('/api/version'),

  domains: () =>
    USE_MOCK
      ? import('@/lib/mock-data').then((m) => m.mockDomains as DomainsResponse)
      : req<DomainsResponse>('/api/domains'),
}
