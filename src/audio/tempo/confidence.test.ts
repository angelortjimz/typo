import { describe, expect, it } from 'vitest'
import { isLowConfidence } from './confidence'

describe('isLowConfidence', () => {
  it('flags confidence below the threshold', () => {
    expect(isLowConfidence(0)).toBe(true)
    expect(isLowConfidence(0.32)).toBe(true)
  })

  it('leaves the threshold and above unmarked', () => {
    expect(isLowConfidence(0.33)).toBe(false)
    expect(isLowConfidence(0.68)).toBe(false)
  })

  it('ignores missing or invalid confidence', () => {
    expect(isLowConfidence(null)).toBe(false)
    expect(isLowConfidence(Number.NaN)).toBe(false)
    expect(isLowConfidence(Number.POSITIVE_INFINITY)).toBe(false)
  })
})
