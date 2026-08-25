import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Globe, ShieldCheck, ExternalLink } from 'lucide-react'
import type { StatusResponse } from '@/lib/api'
import { NAV_GROUPS, type SectionKey } from '@/lib/nav'
import { certBadgeVariant } from '@/lib/badge-utils'

// The quick actions shown per-domain in the overview, in the order Plesk lists
// them. Items with an `href` link out honestly; the rest route into the dashboard.
const QUICK_ACTIONS: { key: SectionKey; label: string; hint?: string }[] = [
  { key: 'backup', label: 'Backup Manager', hint: 'Schedule & restore' },
  { key: 'databases', label: 'Databases', hint: 'MySQL / MariaDB' },
  { key: 'git', label: 'Git', hint: 'Deploy from repo' },
  { key: 'ssl', label: 'SSL/TLS', hint: 'Install certificates' },
  { key: 'files', label: 'File Manager', hint: 'Browse files' },
  { key: 'mail', label: 'Mail', hint: 'Email accounts' },
]

function QuickActions({ onNavigate }: { onNavigate: (k: SectionKey) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
      {QUICK_ACTIONS.map((action) => {
        const item = NAV_GROUPS.flatMap((g) => g.items).find((i) => i.key === action.key)
        const Icon = item?.icon
        const external = item?.href
        return external ? (
          <a
            key={action.key}
            href={external}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 hover:bg-accent transition-colors"
          >
            {Icon && <Icon className="size-5 text-brand shrink-0" aria-hidden="true" />}
            <span className="min-w-0">
              <span className="block text-sm font-medium text-foreground truncate">{action.label}</span>
              <span className="block text-xs text-muted-foreground truncate">{action.hint}</span>
            </span>
            <ExternalLink className="size-3.5 text-muted-foreground ml-auto shrink-0" aria-hidden="true" />
          </a>
        ) : (
          <button
            key={action.key}
            type="button"
            onClick={() => onNavigate(action.key)}
            className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-left hover:bg-accent transition-colors"
          >
            {Icon && <Icon className="size-5 text-brand shrink-0" aria-hidden="true" />}
            <span className="min-w-0">
              <span className="block text-sm font-medium text-foreground truncate">{action.label}</span>
              <span className="block text-xs text-muted-foreground truncate">{action.hint}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

export function DomainOverview({
  data,
  onNavigate,
}: {
  data: StatusResponse
  onNavigate: (key: SectionKey) => void
}) {
  const certs = data.tls ?? []
  // One card per hosted domain (driven by the real TLS list from the backend).
  const domains = certs.length
    ? certs.map((c) => ({
        name: c.domain,
        expiresLabel: c.validTo
          ? new Date(c.validTo).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: undefined } as Intl.DateTimeFormatOptions)
          : null,
        daysRemaining: c.daysRemaining,
        error: !!c.error,
      }))
    : [{ name: 'example.com', expiresLabel: null, daysRemaining: undefined, error: false }]

  const upCount = data.oracle.containers.filter((c) => c.up).length
  const total = data.oracle.containers.length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Domains</h1>
          <p className="text-sm text-muted-foreground">
            Overview of your hosting subscriptions and services
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          {upCount}/{total} services up
        </Badge>
      </div>

      {/* A per-domain card, each with its own quick-action row (Plesk-style). */}
      {domains.map((d) => (
        <Card key={d.name}>
          <CardContent className="flex items-center justify-between gap-4 py-4 border-b border-border">
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-10 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
                <Globe className="size-5 text-brand" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="text-base font-semibold text-foreground truncate">{d.name}</div>
                <div className="text-xs text-muted-foreground">
                  {data.subscription?.planName ?? 'Web Hosting'} · {data.oracle.usage?.cpus ?? '?'} vCPU
                </div>
              </div>
            </div>
            <Badge
              variant={d.error ? 'destructive' : d.daysRemaining != null && d.daysRemaining < 14 ? 'destructive' : 'default'}
              className={d.error || (d.daysRemaining != null && d.daysRemaining < 14) ? '' : 'bg-chart-2/15 text-chart-2 border-chart-2/30'}
            >
              {d.error ? 'SSL error' : d.daysRemaining != null && d.daysRemaining < 14 ? 'Expiring' : 'Active'}
            </Badge>
          </CardContent>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Quick actions for {d.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <QuickActions onNavigate={onNavigate} />
          </CardContent>
        </Card>
      ))}

      {/* Full SSL / TLS certificate roster. */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="size-4 text-brand" aria-hidden="true" />
            SSL/TLS Certificates
          </CardTitle>
          <Badge variant="outline" className="text-xs">{certs.length} domains</Badge>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {certs.map((cert) => {
              const expiryDate = cert.validTo ? new Date(cert.validTo) : null
              const expiryLabel = expiryDate
                ? expiryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : null
              return (
                <li key={cert.domain} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{cert.domain}</div>
                    {expiryLabel && (
                      <div className="text-xs text-muted-foreground">Expires {expiryLabel}</div>
                    )}
                  </div>
                  <Badge variant={cert.error ? 'destructive' : certBadgeVariant(cert.daysRemaining)}>
                    {cert.error ? 'error' : `${cert.daysRemaining ?? '?'}d`}
                  </Badge>
                </li>
              )
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
