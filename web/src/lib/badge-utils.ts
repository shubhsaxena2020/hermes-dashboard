import type { BadgeVariant, TlsCertStatus } from '@/lib/api'
import { TLS_CRITICAL_DAYS, TLS_EXPIRING_SOON_DAYS } from '@/lib/color-threshold'

// Resource-usage thresholds mirror progressIndicatorClass in color-threshold.ts
// (80% destructive, 60% warning) so both progress bars and badges use the same
// severity scale. Keep these in sync if either function's breakpoints change.
// Examines CPU and MEM independently — badge label names the stressed resource(s)
// so operators know which metric to investigate, even on mobile where the CPU/MEM
// columns are hidden.
export function resourceBadgeInfo(
  cpuPct: number | null,
  memPct: number | null,
): { variant: BadgeVariant; label: string } | null {
  const cpuHigh = cpuPct != null && cpuPct >= 80
  const memHigh = memPct != null && memPct >= 80
  const cpuElev = cpuPct != null && cpuPct >= 60
  const memElev = memPct != null && memPct >= 60

  if (cpuHigh || memHigh) {
    const parts = []
    if (cpuHigh) parts.push('CPU')
    if (memHigh) parts.push('MEM')
    return { variant: 'destructive', label: `${parts.join('+')} high` }
  }
  if (cpuElev || memElev) {
    const parts = []
    if (cpuElev) parts.push('CPU')
    if (memElev) parts.push('MEM')
    return { variant: 'secondary', label: `${parts.join('+')} elevated` }
  }
  return null
}

export function certBadgeVariant(daysRemaining?: number): BadgeVariant {
  if (daysRemaining == null) return 'destructive'
  if (daysRemaining < TLS_CRITICAL_DAYS) return 'destructive'
  if (daysRemaining < TLS_EXPIRING_SOON_DAYS) return 'secondary'
  return 'outline'
}

/**
 * Compute the TLS summary badge for an array of certificates.
 *
 * Returns null when the cert list is empty (nothing to show).
 * Otherwise returns a label and variant for the overview card header:
 *  - "N error(s)" with destructive variant when any cert has an error
 *  - "M OK · N expiring" with secondary variant when certs are expiring
 *  - "N/M OK" with outline variant when all certs are healthy
 */
export function tlsSummaryBadge(
  certs: TlsCertStatus[],
): { variant: BadgeVariant; label: string } | null {
  if (certs.length === 0) return null

  const errored = certs.filter((c) => c.error).length
  const expiringSoon = certs.filter(
    (c) => !c.error && (c.daysRemaining ?? Infinity) < TLS_EXPIRING_SOON_DAYS,
  ).length
  const healthy = certs.length - errored - expiringSoon

  const label =
    errored > 0
      ? `${errored} error${errored > 1 ? 's' : ''}`
      : expiringSoon > 0
        ? `${healthy} OK · ${expiringSoon} expiring`
        : `${healthy}/${certs.length} OK`
  const variant: BadgeVariant =
    errored > 0 ? 'destructive' : expiringSoon > 0 ? 'secondary' : 'outline'

  return { variant, label }
}
