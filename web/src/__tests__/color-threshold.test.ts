import { describe, it, expect } from 'vitest'
import { progressIndicatorClass, responseTimeClass, diskUsageWarning } from '@/lib/color-threshold'

describe('progressIndicatorClass', () => {
  it('returns empty string for low usage', () => {
    expect(progressIndicatorClass(0)).toBe('')
    expect(progressIndicatorClass(30)).toBe('')
    expect(progressIndicatorClass(59)).toBe('')
  })

  it('returns yellow for elevated usage', () => {
    expect(progressIndicatorClass(60)).toBe('bg-yellow-500')
    expect(progressIndicatorClass(70)).toBe('bg-yellow-500')
    expect(progressIndicatorClass(79)).toBe('bg-yellow-500')
  })

  it('returns destructive for high usage', () => {
    expect(progressIndicatorClass(80)).toBe('bg-destructive')
    expect(progressIndicatorClass(90)).toBe('bg-destructive')
    expect(progressIndicatorClass(100)).toBe('bg-destructive')
  })
})

describe('responseTimeClass', () => {
  it('returns green for fast responses (<200ms)', () => {
    expect(responseTimeClass(0)).toBe('text-green-500')
    expect(responseTimeClass(50)).toBe('text-green-500')
    expect(responseTimeClass(199)).toBe('text-green-500')
  })

  it('returns yellow for moderate responses (200-499ms)', () => {
    expect(responseTimeClass(200)).toBe('text-yellow-500')
    expect(responseTimeClass(350)).toBe('text-yellow-500')
    expect(responseTimeClass(499)).toBe('text-yellow-500')
  })

  it('returns red for slow responses (≥500ms)', () => {
    expect(responseTimeClass(500)).toBe('text-red-500')
    expect(responseTimeClass(750)).toBe('text-red-500')
    expect(responseTimeClass(1000)).toBe('text-red-500')
  })
})

describe('diskUsageWarning', () => {
  it('returns null for low disk usage', () => {
    expect(diskUsageWarning(0)).toBeNull()
    expect(diskUsageWarning(50)).toBeNull()
    expect(diskUsageWarning(79)).toBeNull()
  })

  it('returns high-usage warning at 80%', () => {
    expect(diskUsageWarning(80)).toBe('Disk usage is high — consider freeing space')
  })

  it('returns high-usage warning between 80% and 94%', () => {
    expect(diskUsageWarning(85)).toBe('Disk usage is high — consider freeing space')
    expect(diskUsageWarning(94)).toBe('Disk usage is high — consider freeing space')
  })

  it('returns critical warning at 95%', () => {
    expect(diskUsageWarning(95)).toBe('Disk critically full — immediate action required')
  })

  it('returns critical warning above 95%', () => {
    expect(diskUsageWarning(99)).toBe('Disk critically full — immediate action required')
    expect(diskUsageWarning(100)).toBe('Disk critically full — immediate action required')
  })
})
