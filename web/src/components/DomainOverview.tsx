import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Globe, ShieldCheck, ExternalLink } from 'lucide-react'
import type { DomainInfo, StatusResponse } from '@/lib/api'
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

function QuickActions({ domain, onNavigate }: { domain: string; onNavigate: (k: SectionKey) => void }) {
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
            aria-label={`${action.label} for ${domain}`}
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
  domains,
  onNavigate,
}: {
  data: StatusResponse
  domains: DomainInfo[]
  onNavigate: (key: SectionKey) => void
}) {
  const certs = data.tls ?? []

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

      {/* Empty state when no domains are reported by the backend. */}
      {domains.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
            <div className="size-12 rounded-full bg-brand/10 flex items-center justify-center">
              <Globe className="size-6 text-brand" aria-hidden="true" />
            </div>
            <div className="text-base font-medium text-foreground">No domains yet</div>
            <p className="max-w-sm text-sm text-muted-foreground">
              Add a domain or install an SSL certificate and it will appear here
              with its hosting quick-actions.
            </p>
          </CardContent>
        </Card>
      )}

      {/* A per-domain card, each with its own quick-action row (Plesk-style). */}
      {domains.map((d) => {
        const ssl = d.ssl
        const days = ssl?.daysRemaining
        const sslError = !!ssl?.error
        const statusVariant = !d.reachable
          ? 'destructive'
          : sslError || (days != null && days < 14)
            ? 'destructive'
            : 'default'
        const statusLabel = !d.reachable
          ? 'Unreachable'
          : sslError
            ? 'SSL error'
            : days != null && days < 14
              ? 'Expiring'
              : 'Active'
        return (
        <Card key={d.domain}>
          <CardContent className="flex items-center justify-between gap-4 py-4 border-b border-border">
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-10 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
                <Globe className="size-5 text-brand" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold text-foreground truncate">{d.domain}</span>
                  <a
                    href={`https://${d.domain}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-brand hover:underline shrink-0"
                    aria-label={`Visit ${d.domain} in a new tab`}
                  >
                    Visit
                    <ExternalLink className="size-3" aria-hidden="true" />
                  </a>
                </div>
                <div className="text-xs text-muted-foreground">
                  {d.service ?? 'Web Hosting'} · {data.oracle.usage?.cpus ?? '?'} vCPU
                  {d.ssl && !d.ssl.error && (
                    <span className="ml-1 inline-flex items-center gap-1">
                      · <ShieldCheck className="size-3" aria-hidden="true" />
                      {d.ssl.issuer} · {d.ssl.daysRemaining ?? '?'}d
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Badge
              variant={statusVariant}
              className={statusVariant === 'default' ? 'bg-chart-2/15 text-chart-2 border-chart-2/30' : ''}
            >
              {statusLabel}
            </Badge>
          </CardContent>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Quick actions for {d.domain}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <QuickActions domain={d.domain} onNavigate={onNavigate} />
          </CardContent>
        </Card>
        )
      })}

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
