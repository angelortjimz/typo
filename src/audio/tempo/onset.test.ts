import { describe, expect, it } from 'vitest'
import { computeOnsetFunction } from './onset'

function impulseTrain(sampleRate: number, durationSeconds: number, bpm: number): Float32Array {
  const length = Math.floor(durationSeconds * sampleRate)
  const samples = new Float32Array(length)
  const interval = Math.round((60 / bpm) * sampleRate)

  for (let index = 0; index < length; index += interval) {
    samples[index] = 1
  }

  return samples
}

const OPTIONS = { windowSize: 1_024, hopSize: 256 } as const

describe('computeOnsetFunction', () => {
  it('returns an empty function for input shorter than one window', () => {
    const onset = computeOnsetFunction(new Float32Array(10), 22_050, OPTIONS)

    expect(onset.values.length).toBe(0)
    expect(onset.frameRate).toBeCloseTo(22_050 / 256, 6)
  })

  it('is silent for a silent signal', () => {
    const onset = computeOnsetFunction(new Float32Array(22_050), 22_050, OPTIONS)

    expect(onset.values.length).toBeGreaterThan(0)
    expect(Array.from(onset.values).every((value) => value === 0)).toBe(true)
  })

  it('produces an onset peak near every impulse', () => {
    const sampleRate = 22_050
    const samples = impulseTrain(sampleRate, 2, 120)
    const onset = computeOnsetFunction(samples, sampleRate, OPTIONS)
    const sorted = Array.from(onset.values).sort((a, b) => a - b)
    const median = sorted[Math.floor(sorted.length / 2)] ?? 0
    const expectedFrames = [0.5, 1.0, 1.5].map((seconds) =>
      Math.floor((seconds * sampleRate) / OPTIONS.hopSize),
    )

    for (const frame of expectedFrames) {
      const start = Math.max(0, frame - 4)
      const end = Math.min(onset.values.length, frame + 5)
      const localMax = Math.max(...onset.values.slice(start, end))

      expect(localMax).toBeGreaterThan(median * 3)
    }
  })

  it('responds to a louder onset more strongly than a quieter one', () => {
    const sampleRate = 22_050
    const quiet = new Float32Array(sampleRate)
    const loud = new Float32Array(sampleRate)
    quiet[2_000] = 0.2
    loud[2_000] = 1

    const quietOnset = computeOnsetFunction(quiet, sampleRate, OPTIONS)
    const loudOnset = computeOnsetFunction(loud, sampleRate, OPTIONS)
    const quietMax = Math.max(...quietOnset.values)
    const loudMax = Math.max(...loudOnset.values)

    expect(loudMax).toBeGreaterThan(quietMax)
  })
})
