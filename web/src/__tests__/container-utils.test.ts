import { describe, it, expect } from 'vitest'
import { parseCpuPercent, parseMemBytes, parseMemPercent, MEM_UNIT_BYTES } from '@/lib/container-utils'

describe('parseCpuPercent', () => {
  it('parses a valid CPU percentage string', () => {
    expect(parseCpuPercent('27.19%')).toBe(27.19)
  })

  it('parses zero', () => {
    expect(parseCpuPercent('0.00%')).toBe(0)
  })

  it('parses a large value', () => {
    expect(parseCpuPercent('150.5%')).toBe(150.5)
  })

  it('returns null for undefined', () => {
    expect(parseCpuPercent(undefined)).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(parseCpuPercent('')).toBeNull()
  })

  it('returns null for non-numeric string', () => {
    expect(parseCpuPercent('abc')).toBeNull()
  })

  it('returns null for a string that starts with non-numeric chars', () => {
    expect(parseCpuPercent('abc12')).toBeNull()
  })
})

describe('MEM_UNIT_BYTES', () => {
  it('maps all expected units correctly', () => {
    expect(MEM_UNIT_BYTES.B).toBe(1)
    expect(MEM_UNIT_BYTES.KiB).toBe(1024)
    expect(MEM_UNIT_BYTES.MiB).toBe(1024 ** 2)
    expect(MEM_UNIT_BYTES.GiB).toBe(1024 ** 3)
    expect(MEM_UNIT_BYTES.TiB).toBe(1024 ** 4)
  })
})

describe('parseMemBytes', () => {
  it('parses bytes', () => {
    expect(parseMemBytes('1024B')).toBe(1024)
  })

  it('parses KiB with leading zeros', () => {
    expect(parseMemBytes('001.5KiB')).toBe(1.5 * 1024)
  })

  it('parses MiB', () => {
    expect(parseMemBytes('256MiB')).toBe(256 * 1024 ** 2)
  })

  it('parses GiB', () => {
    expect(parseMemBytes('3.42GiB')).toBe(3.42 * 1024 ** 3)
  })

  it('parses TiB', () => {
    expect(parseMemBytes('1TiB')).toBe(1024 ** 4)
  })

  it('trims whitespace before matching', () => {
    expect(parseMemBytes('  100MiB ')).toBe(100 * 1024 ** 2)
  })

  it('parses a fractional value', () => {
    expect(parseMemBytes('0.25GiB')).toBe(0.25 * 1024 ** 3)
  })

  it('returns null for a bare number without a unit', () => {
    expect(parseMemBytes('100')).toBeNull()
  })

  it('returns null for an unsupported unit', () => {
    expect(parseMemBytes('100KB')).toBeNull()
  })

  it('returns null for garbage input', () => {
    expect(parseMemBytes('not-a-size')).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(parseMemBytes('')).toBeNull()
  })
})

describe('parseMemPercent', () => {
  it('parses a typical Docker stats mem string', () => {
    expect(parseMemPercent('3.42GiB / 7.75GiB')).toBeCloseTo((3.42 * 1024 ** 3) / (7.75 * 1024 ** 3) * 100, 5)
  })

  it('parses MiB/MiB format', () => {
    expect(parseMemPercent('512MiB / 2048MiB')).toBeCloseTo(25, 5)
  })

  it('parses 100% usage', () => {
    expect(parseMemPercent('4GiB / 4GiB')).toBeCloseTo(100, 5)
  })

  it('returns null for undefined', () => {
    expect(parseMemPercent(undefined)).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(parseMemPercent('')).toBeNull()
  })

  it('returns null when there is no slash separator', () => {
    expect(parseMemPercent('3.42GiB')).toBeNull()
  })

  it('returns null when the used part is invalid', () => {
    expect(parseMemPercent('abc / 4GiB')).toBeNull()
  })

  it('returns null when the total is zero or missing', () => {
    expect(parseMemPercent('3.42GiB / 0B')).toBeNull()
  })
})
