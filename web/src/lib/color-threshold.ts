/** TLS certificate expiry thresholds (days). */
export const TLS_CRITICAL_DAYS = 14
export const TLS_EXPIRING_SOON_DAYS = 30

export function progressIndicatorClass(pct: number): string {
  if (pct >= 80) return 'bg-destructive'
  if (pct >= 60) return 'bg-yellow-500'
  return ''
}

/** Color class for API response time text. */
export function responseTimeClass(ms: number): string {
  if (ms >= 500) return 'text-red-500'
  if (ms >= 200) return 'text-yellow-500'
  return 'text-green-500'
}

/**
 * Returns a warning message when disk usage is critically high, or null
 * when usage is within acceptable limits.
 *
 * Thresholds mirror `progressIndicatorClass` (80% = destructive) so the
 * banner and the progress-bar colour stay consistent.
 */
export function diskUsageWarning(pct: number): string | null {
  if (pct >= 95) return 'Disk critically full — immediate action required'
  if (pct >= 80) return 'Disk usage is high — consider freeing space'
  return null
}
