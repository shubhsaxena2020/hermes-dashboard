import { describe, it, expect } from 'vitest'
import { formatUptime, timeAgo } from '@/lib/time'

describe('formatUptime', () => {
  it('returns em dash for null', () => {
    expect(formatUptime(null)).toBe('—')
  })

  it('returns em dash for negative values', () => {
    expect(formatUptime(-1)).toBe('—')
  })

  it('returns minutes only for < 1 hour', () => {
    expect(formatUptime(0)).toBe('0m')
    expect(formatUptime(59)).toBe('0m')
    expect(formatUptime(60)).toBe('1m')
  })

  it('returns hours and minutes for < 1 day', () => {
    expect(formatUptime(3600)).toBe('1h 0m')
    expect(formatUptime(3661)).toBe('1h 1m')
    expect(formatUptime(86399)).toBe('23h 59m')
  })

  it('returns days and hours for >= 1 day', () => {
    expect(formatUptime(86400)).toBe('1d 0h')
    expect(formatUptime(90000)).toBe('1d 1h')
    expect(formatUptime(172800)).toBe('2d 0h')
  })
})

describe('timeAgo', () => {
  it('returns empty string for null', () => {
    expect(timeAgo(null)).toBe('')
  })

  it('returns empty string for 0 (falsy epoch)', () => {
    expect(timeAgo(0)).toBe('')
  })

  it('returns "just now" for very recent timestamps', () => {
    const now = Date.now()
    expect(timeAgo(now)).toBe('just now')
    expect(timeAgo(now - 1000)).toBe('just now')
  })

  it('returns seconds ago for < 60s', () => {
    const now = Date.now()
    const fiveSecsAgo = now - 5 * 1000
    const result = timeAgo(fiveSecsAgo)
    expect(result).toMatch(/^\d+s ago$/)
  })

  it('returns minutes ago for < 60min', () => {
    const now = Date.now()
    const fiveMinAgo = now - 5 * 60 * 1000
    expect(timeAgo(fiveMinAgo)).toBe('5m ago')
  })

  it('returns hours ago for < 24h', () => {
    const now = Date.now()
    const threeHoursAgo = now - 3 * 60 * 60 * 1000
    expect(timeAgo(threeHoursAgo)).toBe('3h ago')
  })

  it('returns days ago for >= 24h', () => {
    const now = Date.now()
    const twoDaysAgo = now - 2 * 24 * 60 * 60 * 1000
    expect(timeAgo(twoDaysAgo)).toBe('2d ago')
  })
})
