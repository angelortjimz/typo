import { TEMPO_CONSTANTS } from './constants'
import type { OnsetFunction, TempoEstimateOptions, TempoResult } from './types'

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

function computeAutocorrelation(values: Float32Array, maxLag: number): Float32Array {
  const length = values.length
  const result = new Float32Array(maxLag + 1)

  for (let lag = 0; lag <= maxLag; lag += 1) {
    let sum = 0
    for (let index = 0; index + lag < length; index += 1) {
      sum += values[index] * values[index + lag]
    }
    result[lag] = sum / (length - lag)
  }

  return result
}

function sampleAutocorrelation(autocorrelation: Float32Array, lag: number): number {
  const clamped = Math.max(0, Math.min(autocorrelation.length - 1, lag))
  const lower = Math.floor(clamped)
  const upper = Math.min(autocorrelation.length - 1, lower + 1)
  const blend = clamped - lower

  return autocorrelation[lower] * (1 - blend) + autocorrelation[upper] * blend
}

/**
 * Estimates tempo from an onset detection function using normalized
 * autocorrelation. Octave errors are resolved toward a musical range when the
 * evidence is close, and the beat offset is found by aligning the onset energy
 * with the chosen beat grid.
 */
export function estimateTempo(
  onset: OnsetFunction,
  options: Partial<TempoEstimateOptions> = {},
): TempoResult | null {
  const { values, frameRate } = onset
  const minBpm = options.minBpm ?? TEMPO_CONSTANTS.minBpm
  const maxBpm = options.maxBpm ?? TEMPO_CONSTANTS.maxBpm
  const bpmStep = Math.max(0.1, options.bpmStep ?? TEMPO_CONSTANTS.bpmStep)

  if (values.length < 8 || !(frameRate > 0) || !(maxBpm > minBpm) || !(bpmStep > 0)) {
    return null
  }

  let mean = 0
  for (const value of values) {
    mean += value
  }
  mean /= values.length

  let maxAbs = 0
  for (const value of values) {
    maxAbs = Math.max(maxAbs, Math.abs(value - mean))
  }
  if (!(maxAbs > 0)) {
    return null
  }

  const centered = new Float32Array(values.length)
  for (let index = 0; index < values.length; index += 1) {
    centered[index] = (values[index] - mean) / maxAbs
  }

  const candidates: number[] = []
  for (let bpm = minBpm; bpm <= maxBpm; bpm += bpmStep) {
    candidates.push(bpm)
  }
  if (candidates.length === 0) {
    return null
  }

  const maxLag = Math.min(values.length - 1, Math.ceil((frameRate * 60) / minBpm))
  if (maxLag < 1) {
    return null
  }

  const autocorrelation = computeAutocorrelation(centered, maxLag)
  const zeroLag = autocorrelation[0]
  if (!(zeroLag > 0)) {
    return null
  }

  const scores = candidates.map(
    (bpm) => sampleAutocorrelation(autocorrelation, (frameRate * 60) / bpm) / zeroLag,
  )

  let bestIndex = 0
  for (let index = 1; index < scores.length; index += 1) {
    if (scores[index] > scores[bestIndex]) {
      bestIndex = index
    }
  }

  let bestBpm = candidates[bestIndex]

  if (bestBpm < TEMPO_CONSTANTS.preferredMinBpm) {
    // A lock below the preferred range is almost always a half-time reading of
    // a faster track. Double it before the phase search so the reported tempo
    // and the beat offset describe the same period.
    bestBpm *= 2
  } else if (bestBpm > TEMPO_CONSTANTS.preferredMaxBpm) {
    const halved = bestBpm / 2
    const halvedIndex = candidates.findIndex((bpm) => Math.abs(bpm - halved) < bpmStep / 2)
    if (
      halvedIndex >= 0 &&
      scores[halvedIndex] >= scores[bestIndex] * TEMPO_CONSTANTS.octaveScoreTolerance
    ) {
      bestBpm = candidates[halvedIndex]
      bestIndex = halvedIndex
    }
  }

  const periodFrames = (frameRate * 60) / bestBpm
  const period = Math.max(1, Math.round(periodFrames))
  let bestPhase = 0
  let bestPhaseScore = Number.NEGATIVE_INFINITY

  for (let phase = 0; phase < period; phase += 1) {
    let phaseScore = 0
    for (let index = phase; index < centered.length; index += period) {
      phaseScore += centered[index]
    }
    if (phaseScore > bestPhaseScore) {
      bestPhaseScore = phaseScore
      bestPhase = phase
    }
  }

  return {
    bpm: Math.round(bestBpm * 10) / 10,
    confidence: clamp01(scores[bestIndex]),
    offset: bestPhase / frameRate,
    analyzedSeconds: values.length / frameRate,
  }
}
