import { describe, expect, it } from 'vitest'
import { estimateTempo } from './estimate'
import type { OnsetFunction } from './types'

function periodicOnset(
  frameRate: number,
  bpm: number,
  durationSeconds: number,
): OnsetFunction {
  const length = Math.floor(durationSeconds * frameRate)
  const values = new Float32Array(length)
  const periodFrames = (frameRate * 60) / bpm
  const beatCount = Math.floor((durationSeconds * bpm) / 60)

  for (let beat = 0; beat < beatCount; beat += 1) {
    const center = beat * periodFrames
    for (let offset = -2; offset <= 2; offset += 1) {
      const index = Math.round(center + offset)
      if (index >= 0 && index < length) {
        const weight = Math.exp(-(offset * offset) / 2)
        values[index] = Math.max(values[index], weight)
      }
    }
  }

  return { values, frameRate }
}

describe('estimateTempo', () => {
  it.each([90, 120, 140, 174])('estimates a clear %i BPM pulse train', (bpm) => {
    const result = estimateTempo(periodicOnset(86.13, bpm, 12))

    expect(result).not.toBeNull()
    expect(result?.bpm).toBeGreaterThanOrEqual(bpm - 2)
    expect(result?.bpm).toBeLessThanOrEqual(bpm + 2)
    expect(result?.confidence).toBeGreaterThan(0.5)
  })

  it('keeps a slow 60 BPM pulse train instead of doubling it', () => {
    const result = estimateTempo(periodicOnset(86.13, 60, 12))

    expect(result?.bpm).toBeGreaterThanOrEqual(58)
    expect(result?.bpm).toBeLessThanOrEqual(62)
  })

  it('returns null for a flat onset function', () => {
    const onset: OnsetFunction = {
      values: new Float32Array(200).fill(1),
      frameRate: 86.13,
    }

    expect(estimateTempo(onset)).toBeNull()
  })

  it('returns null for very short input', () => {
    expect(estimateTempo({ values: new Float32Array(4), frameRate: 86.13 })).toBeNull()
  })

  it('finds a beat offset that aligns with the onsets', () => {
    const frameRate = 86.13
    const onset = periodicOnset(frameRate, 120, 8)
    const result = estimateTempo(onset)

    expect(result?.offset).toBeGreaterThanOrEqual(0)
    expect(result?.offset).toBeLessThan(60 / (result?.bpm ?? 120))
  })
})
