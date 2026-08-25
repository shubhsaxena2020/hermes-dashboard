// Small, dependency-free formatters for the Plesk-style panels.

const KB = 1024
const MB = KB * 1024
const GB = MB * 1024
const TB = GB * 1024

/** Format a byte count into a short human string (e.g. 31.0 GB). */
export function formatBytes(bytes: number): string {
  if (bytes >= TB) return `${(bytes / TB).toFixed(2)} TB`
  if (bytes >= GB) return `${(bytes / GB).toFixed(1)} GB`
  if (bytes >= MB) return `${(bytes / MB).toFixed(0)} MB`
  if (bytes >= KB) return `${(bytes / KB).toFixed(0)} KB`
  return `${bytes} B`
}

/**
 * Parse a Docker `df`-style size string ("78G", "1.4T", "512M") into bytes.
 * Returns null when it can't be parsed.
 */
export function parseSizeToBytes(value?: string | null): number | null {
  if (!value) return null
  const m = value.trim().match(/^([\d.]+)\s*([BKMGT]?)i?B?$/i)
  if (!m) return null
  const n = Number(m[1])
  if (Number.isNaN(n)) return null
  const unit = m[2].toUpperCase()
  const mult = unit === 'T' ? TB : unit === 'G' ? GB : unit === 'M' ? MB : unit === 'K' ? KB : 1
  return Math.round(n * mult)
}

/** Parse a percentage string ("40%") into a number; null if absent. */
export function parsePercent(value?: string | null): number | null {
  if (!value) return null
  const n = Number(String(value).replace('%', '').trim())
  return Number.isNaN(n) ? null : n
}

/** "2026-09-01" -> "Sep 1, 2026". Falls back to the raw string on parse error. */
export function formatDate(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/**
 * Format a used/limit pair. `limitBytes === null` (or 0) means Unlimited.
 * Returns { used, limit, pct, unlimited }.
 */
export function usagePair(
  usedBytes: number | null | undefined,
  limitBytes: number | null | undefined,
): { used: string; limit: string; pct: number | null; unlimited: boolean } {
  const unlimited = limitBytes == null || limitBytes === 0
  const used = usedBytes != null ? formatBytes(usedBytes) : '—'
  const limit = unlimited ? 'Unlimited' : formatBytes(limitBytes as number)
  const pct = usedBytes != null && !unlimited && (limitBytes as number) > 0
    ? Math.min(100, Math.round((usedBytes / (limitBytes as number)) * 100))
    : null
  return { used, limit, pct, unlimited }
}
