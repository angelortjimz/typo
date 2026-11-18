import { describe, expect, it } from 'vitest'
import { canScaleBpm, clampManualBpm, scaleBpm } from './scale'

describe('clampManualBpm', () => {
  it('rounds and clamps to the manual range', () => {
    expect(clampManualBpm(124.4)).toBe(124)
    expect(clampManualBpm(20)).toBe(40)
    expect(clampManualBpm(300)).toBe(300)
    expect(clampManualBpm(900)).toBe(500)
  })

  it('falls back to the default for invalid input', () => {
    expect(clampManualBpm(Number.NaN)).toBe(120)
    expect(clampManualBpm(Number.POSITIVE_INFINITY)).toBe(120)
  })
})

describe('scaleBpm', () => {
  it('doubles and halves the tempo', () => {
    expect(scaleBpm(62, 2)).toBe(124)
    expect(scaleBpm(124, 0.5)).toBe(62)
  })

  it('clamps the scaled value to the manual range', () => {
    expect(scaleBpm(62, 0.5)).toBe(40)
    expect(scaleBpm(200, 2)).toBe(400)
    expect(scaleBpm(300, 2)).toBe(500)
    expect(scaleBpm(260, 2)).toBe(500)
  })

  it('handles invalid input', () => {
    expect(scaleBpm(Number.NaN, 2)).toBe(120)
    expect(scaleBpm(120, Number.NaN)).toBe(120)
  })
})

describe('canScaleBpm', () => {
  it('allows octave corrections that stay in range', () => {
    expect(canScaleBpm(62, 2)).toBe(true)
    expect(canScaleBpm(80, 0.5)).toBe(true)
    expect(canScaleBpm(120, 2)).toBe(true)
    expect(canScaleBpm(200, 2)).toBe(true)
    expect(canScaleBpm(250, 2)).toBe(true)
  })

  it('rejects octave corrections that would clamp', () => {
    expect(canScaleBpm(62, 0.5)).toBe(false)
    expect(canScaleBpm(260, 2)).toBe(false)
  })

  it('rejects invalid input', () => {
    expect(canScaleBpm(Number.NaN, 2)).toBe(false)
    expect(canScaleBpm(120, 0)).toBe(false)
    expect(canScaleBpm(120, Number.POSITIVE_INFINITY)).toBe(false)
  })
})
