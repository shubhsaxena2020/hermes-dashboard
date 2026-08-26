import type { StatusResponse } from '@/lib/api'

// Deterministic mock so the dashboard can be rendered and visually verified
// without a live backend (used with VITE_MOCK=1). Mirrors the real
// StatusResponse shape from src/lib/api.ts.
export const mockStatus: StatusResponse = {
  oracle: {
    containers: [
      { name: 'caddy', status: 'Up 42 days', up: true, cpu: '2.10%', mem: '84MiB / 7680MiB' },
      { name: 'portainer', status: 'Up 42 days', up: true, cpu: '1.40%', mem: '32MiB / 7680MiB' },
      { name: 'netdata', status: 'Up 42 days', up: true, cpu: '8.90%', mem: '210MiB / 7680MiB' },
      { name: 'postgres', status: 'Up 42 days', up: true, cpu: '3.20%', mem: '512MiB / 7680MiB' },
      { name: 'firecrawl-api-1', status: 'Up 12 days', up: true, cpu: '14.60%', mem: '1380MiB / 7680MiB' },
      { name: 'firecrawl-redis-1', status: 'Up 12 days', up: true, cpu: '0.80%', mem: '96MiB / 7680MiB' },
      { name: 'firecrawl-rabbitmq-1', status: 'Up 12 days', up: true, cpu: '1.10%', mem: '180MiB / 7680MiB' },
      { name: 'firecrawl-data-worker-1', status: 'Up 12 days', up: true, cpu: '22.40%', mem: '940MiB / 7680MiB' },
      { name: 'firecrawl-searxng-1-1', status: 'Up 12 days', up: true, cpu: '5.10%', mem: '240MiB / 7680MiB' },
      { name: 'firecrawl-staging-db-1', status: 'Up 12 days', up: true, cpu: '2.70%', mem: '420MiB / 7680MiB' },
      { name: 'paperclip', status: 'Up 3 days', up: true, cpu: '0.40%', mem: '48MiB / 7680MiB' },
      { name: '9router', status: 'Exited (0) 2 days ago', up: false },
    ],
    controllable: [
      'caddy',
      'paperclip',
      '9router',
      'firecrawl-data-worker-1',
      'firecrawl-staging-db-1',
    ],
    viewable: [
      'caddy',
      'portainer',
      'netdata',
      'postgres',
      'firecrawl-api-1',
      'firecrawl-data-worker-1',
      'paperclip',
      '9router',
    ],
    usage: {
      cpus: 4,
      cpuUsagePct: 38,
      memTotalMb: 7680,
      memUsedMb: 4912,
      diskTotal: '78G',
      diskUsed: '31G',
      diskPct: '40%',
      uptimeSeconds: 3672000,
    },
  },
  tls: [
    { domain: 'shubhbuilds.com', issuer: 'Let\'s Encrypt R3', validTo: '2026-10-15T00:00:00Z', daysRemaining: 51 },
    { domain: 'control.shubhbuilds.com', issuer: 'Let\'s Encrypt R3', validTo: '2026-09-22T00:00:00Z', daysRemaining: 28 },
    { domain: 'leads.shubhbuilds.com', issuer: 'Let\'s Encrypt R3', validTo: '2026-08-30T00:00:00Z', daysRemaining: 5 },
    { domain: 'portainer.shubhbuilds.com', issuer: 'Let\'s Encrypt R3', validTo: '2026-12-01T00:00:00Z', daysRemaining: 98 },
    { domain: 'monitor.shubhbuilds.com', issuer: 'Let\'s Encrypt R3', validTo: '2026-11-10T00:00:00Z', daysRemaining: 77 },
    { domain: 'firecrawl.shubhbuilds.com', issuer: 'Let\'s Encrypt R3', validTo: '2026-07-02T00:00:00Z', daysRemaining: undefined, error: 'certificate expired' },
  ],
  costs: {
    main: {
      machineType: 'Oracle VM.Standard.E2.1.Micro (Always Free)',
      monthlyEstimate: 0,
      alwaysOn: true,
    },
  },
  traffic: {
    usedBytes: 142 * 1024 ** 3,
    limitBytes: null, // null => Unlimited
    resetLabel: 'Resets Sep 1',
  },
  subscription: {
    planName: 'Web Host Pro',
    renewalDate: '2026-09-01',
    systemIp: '152.67.211.40',
    phpVersion: '8.3',
    osLabel: 'Ubuntu 22.04 LTS',
  },
}

import type { DomainsResponse } from '@/lib/api'

// Mirrors the real /api/domains shape (src/domains.js).
export const mockDomains: DomainsResponse = {
  domains: [
    { domain: 'shubhbuilds.com', service: 'vps-control', reachable: true, httpStatus: 200, ssl: { issuer: "Let's Encrypt R3", validTo: '2026-10-15T00:00:00Z', daysRemaining: 51 } },
    { domain: 'control.shubhbuilds.com', service: 'vps-control', reachable: true, httpStatus: 200, ssl: { issuer: "Let's Encrypt R3", validTo: '2026-09-22T00:00:00Z', daysRemaining: 28 } },
    { domain: 'leads.shubhbuilds.com', service: null, reachable: true, httpStatus: 200, ssl: { issuer: "Let's Encrypt R3", validTo: '2026-08-30T00:00:00Z', daysRemaining: 5 } },
    { domain: 'portainer.shubhbuilds.com', service: 'portainer', reachable: true, httpStatus: 200, ssl: { issuer: "Let's Encrypt R3", validTo: '2026-12-01T00:00:00Z', daysRemaining: 98 } },
    { domain: 'monitor.shubhbuilds.com', service: 'netdata', reachable: true, httpStatus: 200, ssl: { issuer: "Let's Encrypt R3", validTo: '2026-11-10T00:00:00Z', daysRemaining: 77 } },
    { domain: 'firecrawl.shubhbuilds.com', service: 'firecrawl', reachable: false, httpStatus: null, ssl: { issuer: "Let's Encrypt R3", validTo: '2026-07-02T00:00:00Z', daysRemaining: undefined, error: 'certificate expired' } },
  ],
}
