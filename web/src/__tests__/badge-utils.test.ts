import { describe, it, expect } from 'vitest'
import { resourceBadgeInfo, certBadgeVariant, tlsSummaryBadge } from '@/lib/badge-utils'
import type { TlsCertStatus } from '@/lib/api'

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

describe('tlsSummaryBadge', () => {
  it('returns null for an empty cert array', () => {
    expect(tlsSummaryBadge([])).toBeNull()
  })

  it('returns outline when all certs are healthy', () => {
    const certs: TlsCertStatus[] = [
      { domain: 'a.example.com', daysRemaining: 60 },
      { domain: 'b.example.com', daysRemaining: 45 },
    ]
    expect(tlsSummaryBadge(certs)).toEqual({
      variant: 'outline',
      label: '2/2 OK',
    })
  })

  it('returns destructive when a cert has an error', () => {
    const certs: TlsCertStatus[] = [
      { domain: 'a.example.com', daysRemaining: 60 },
      { domain: 'b.example.com', error: 'connection refused' },
    ]
    expect(tlsSummaryBadge(certs)).toEqual({
      variant: 'destructive',
      label: '1 error',
    })
  })

  it('returns plural "errors" label when multiple certs fail', () => {
    const certs: TlsCertStatus[] = [
      { domain: 'a.example.com', error: 'timeout' },
      { domain: 'b.example.com', error: 'expired' },
      { domain: 'c.example.com', daysRemaining: 60 },
    ]
    expect(tlsSummaryBadge(certs)).toEqual({
      variant: 'destructive',
      label: '2 errors',
    })
  })

  it('returns secondary with expiring label when certs are expiring soon', () => {
    const certs: TlsCertStatus[] = [
      { domain: 'a.example.com', daysRemaining: 60 },
      { domain: 'b.example.com', daysRemaining: 10 },
    ]
    expect(tlsSummaryBadge(certs)).toEqual({
      variant: 'secondary',
      label: '1 OK · 1 expiring',
    })
  })
})
