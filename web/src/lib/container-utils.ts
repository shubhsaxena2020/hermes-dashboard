// Docker's `stats --format` output, e.g. "27.19%" and "3.42GiB / 7.75GiB" --
// parsed client-side purely to flag containers worth a second look.

export function parseCpuPercent(cpu?: string): number | null {
  if (!cpu) return null
  const n = parseFloat(cpu)
  return Number.isNaN(n) ? null : n
}

export const MEM_UNIT_BYTES: Record<string, number> = { B: 1, KiB: 1024, MiB: 1024 ** 2, GiB: 1024 ** 3, TiB: 1024 ** 4 }

export function parseMemBytes(part: string): number | null {
  const m = part.trim().match(/^([\d.]+)\s*(B|KiB|MiB|GiB|TiB)$/)
  if (!m) return null
  return parseFloat(m[1]) * MEM_UNIT_BYTES[m[2]]
}

// mem is "<used> / <total-host-memory>" -- there's no per-container limit set
// on these containers, so this is really "% of host RAM," which is still a
// useful signal for "this one container is eating the box."
export function parseMemPercent(mem?: string): number | null {
  if (!mem) return null
  const [usedStr, totalStr] = mem.split('/')
  if (!usedStr || !totalStr) return null
  const used = parseMemBytes(usedStr)
  const total = parseMemBytes(totalStr)
  if (used == null || !total) return null
  return (used / total) * 100
}
