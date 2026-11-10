export function getBeatPeriod(bpm: number): number {
  if (!Number.isFinite(bpm) || bpm <= 0) {
    return 0
  }

  return 60 / bpm
}

/**
 * Returns the position within the current beat as a value from 0 (inclusive) to
 * 1 (exclusive). Negative times wrap into the same range.
 */
export function getBeatPhase(
  timeSeconds: number,
  bpm: number,
  offsetSeconds = 0,
): number {
  const period = getBeatPeriod(bpm)
  if (period <= 0) {
    return 0
  }

  const time = Number.isFinite(timeSeconds) ? timeSeconds : 0
  const offset = Number.isFinite(offsetSeconds) ? offsetSeconds : 0
  const phase = ((time - offset) / period) % 1
  return phase < 0 ? phase + 1 : phase
}
