export function progressIndicatorClass(pct: number): string {
  if (pct >= 80) return 'bg-destructive'
  if (pct >= 60) return 'bg-yellow-500'
  return ''
}
