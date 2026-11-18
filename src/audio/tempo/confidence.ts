import { TEMPO_CONSTANTS } from './constants'

/**
 * Reports whether a detected tempo is too uncertain to present as an exact
 * value. Missing or invalid confidence is not flagged.
 */
export function isLowConfidence(confidence: number | null): boolean {
  return (
    confidence !== null &&
    Number.isFinite(confidence) &&
    confidence < TEMPO_CONSTANTS.lowConfidenceThreshold
  )
}
