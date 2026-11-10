import { describe, expect, it } from 'vitest'
import { getBeatPeriod, getBeatPhase } from './beat'

describe('getBeatPeriod', () => {
  it('returns seconds per beat', () => {
    expect(getBeatPeriod(120)).toBeCloseTo(0.5, 10)
    expect(getBeatPeriod(60)).toBeCloseTo(1, 10)
    expect(getBeatPeriod(240)).toBeCloseTo(0.25, 10)
  })

  it('returns zero for invalid tempo', () => {
    expect(getBeatPeriod(0)).toBe(0)
    expect(getBeatPeriod(-10)).toBe(0)
    expect(getBeatPeriod(Number.NaN)).toBe(0)
  })
})

describe('getBeatPhase', () => {
  it('starts at zero and wraps once per beat', () => {
    expect(getBeatPhase(0, 120)).toBeCloseTo(0, 10)
    expect(getBeatPhase(0.25, 120)).toBeCloseTo(0.5, 10)
    expect(getBeatPhase(0.5, 120)).toBeCloseTo(0, 10)
  })

  it('honors the beat offset', () => {
    expect(getBeatPhase(0.1, 120, 0.1)).toBeCloseTo(0, 10)
    expect(getBeatPhase(0.2, 120, 0.1)).toBeCloseTo(0.2, 10)
  })

  it('wraps negative times into the range', () => {
    const phase = getBeatPhase(-0.25, 120)

    expect(phase).toBeCloseTo(0.5, 10)
    expect(phase).toBeGreaterThanOrEqual(0)
    expect(phase).toBeLessThan(1)
  })

  it('returns zero for invalid tempo or time', () => {
    expect(getBeatPhase(1, 0)).toBe(0)
    expect(getBeatPhase(Number.NaN, 120)).toBeCloseTo(0, 10)
  })
})
