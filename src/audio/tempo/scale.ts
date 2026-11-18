import { TEMPO_CONSTANTS } from './constants'

export function clampManualBpm(value: number): number {
  const rounded = Number.isFinite(value) ? Math.round(value) : TEMPO_CONSTANTS.defaultBpm
  return Math.min(TEMPO_CONSTANTS.manualBpmMax, Math.max(TEMPO_CONSTANTS.manualBpmMin, rounded))
}

export function scaleBpm(value: number, factor: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(factor)) {
    return clampManualBpm(TEMPO_CONSTANTS.defaultBpm)
  }

  return clampManualBpm(value * factor)
}

/**
 * Reports whether an octave correction stays inside the manual BPM range.
 * Scaling at the edges would otherwise clamp to a tempo that is not an octave
 * of the current value.
 */
export function canScaleBpm(value: number, factor: number): boolean {
  if (!Number.isFinite(value) || !Number.isFinite(factor) || factor <= 0) {
    return false
  }

  const scaled = value * factor
  return scaled >= TEMPO_CONSTANTS.manualBpmMin && scaled <= TEMPO_CONSTANTS.manualBpmMax
}
