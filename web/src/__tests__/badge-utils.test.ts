import { describe, it, expect } from 'vitest'
import { resourceBadgeInfo, certBadgeVariant } from '@/lib/badge-utils'

describe('resourceBadgeInfo', () => {
  it('returns null when both inputs are null', () => {
    expect(resourceBadgeInfo(null, null)).toBeNull()
  })

  it('returns null when both values are below 60', () => {
    expect(resourceBadgeInfo(30, 45)).toBeNull()
  })

  it('returns destructive when CPU >= 80', () => {
    expect(resourceBadgeInfo(80, 30)).toEqual({
      variant: 'destructive',
      label: 'CPU high',
    })
  })

  it('returns destructive with combined label when both >= 80', () => {
    expect(resourceBadgeInfo(90, 85)).toEqual({
      variant: 'destructive',
      label: 'CPU+MEM high',
    })
  })

  it('returns secondary when MEM is between 60 and 79', () => {
    expect(resourceBadgeInfo(30, 65)).toEqual({
      variant: 'secondary',
      label: 'MEM elevated',
    })
  })
})

describe('certBadgeVariant', () => {
  it('returns destructive when daysRemaining is undefined', () => {
    expect(certBadgeVariant()).toBe('destructive')
  })

  it('returns destructive when daysRemaining < 14', () => {
    expect(certBadgeVariant(10)).toBe('destructive')
  })

  it('returns secondary when daysRemaining is between 14 and 29', () => {
    expect(certBadgeVariant(20)).toBe('secondary')
  })

  it('returns outline when daysRemaining >= 30', () => {
    expect(certBadgeVariant(45)).toBe('outline')
  })
})
