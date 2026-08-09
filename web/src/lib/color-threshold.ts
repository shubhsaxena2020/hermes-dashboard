/** TLS certificate expiry thresholds (days). */
export const TLS_CRITICAL_DAYS = 14
export const TLS_EXPIRING_SOON_DAYS = 30

export function progressIndicatorClass(pct: number): string {
  if (pct >= 80) return 'bg-destructive'
  if (pct >= 60) return 'bg-yellow-500'
  return ''
}
