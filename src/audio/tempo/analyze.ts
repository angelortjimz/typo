import { TEMPO_CONSTANTS } from './constants'
import { estimateTempo } from './estimate'
import { computeOnsetFunction } from './onset'
import type { AnalysisOptions, AudioBufferLike, TempoResult } from './types'

function mixAndDownsample(
  channelData: Float32Array[],
  startSample: number,
  endSample: number,
  factor: number,
): Float32Array {
  const length = Math.max(0, Math.floor((endSample - startSample) / factor))
  const output = new Float32Array(length)
  const channelCount = channelData.length

  for (let index = 0; index < length; index += 1) {
    const blockStart = startSample + index * factor
    let sum = 0

    for (let offset = 0; offset < factor; offset += 1) {
      const sampleIndex = blockStart + offset
      for (let channel = 0; channel < channelCount; channel += 1) {
        sum += channelData[channel][sampleIndex] ?? 0
      }
    }

    output[index] = sum / (factor * channelCount)
  }

  return output
}

/**
 * Analyzes a decoded audio buffer and returns a tempo estimate. The analysis is
 * bounded to a representative window and downsamples on the fly so loading a
 * track stays responsive.
 */
export function analyzeAudioBuffer(
  buffer: AudioBufferLike,
  options: Partial<AnalysisOptions> = {},
): TempoResult | null {
  const sampleRate = buffer.sampleRate
  const duration = buffer.duration

  if (
    !(sampleRate > 0) ||
    !(duration > 0) ||
    !(buffer.length > 0) ||
    buffer.numberOfChannels <= 0
  ) {
    return null
  }

  const channelData = Array.from({ length: buffer.numberOfChannels }, (_, channel) =>
    buffer.getChannelData(channel),
  )
  const availableLength = channelData.reduce(
    (minimum, data) => Math.min(minimum, data.length),
    Number.POSITIVE_INFINITY,
  )

  const maxSeconds = Math.max(
    0,
    Math.min(duration, options.maxSeconds ?? TEMPO_CONSTANTS.maxAnalysisSeconds),
  )
  const endSample = Math.min(
    buffer.length,
    Math.floor(availableLength),
    Math.floor(maxSeconds * sampleRate),
  )
  if (endSample <= 0) {
    return null
  }

  const factor = Math.max(1, Math.round(sampleRate / TEMPO_CONSTANTS.targetAnalysisRate))
  const analysisRate = sampleRate / factor
  const samples = mixAndDownsample(channelData, 0, endSample, factor)

  if (samples.length < TEMPO_CONSTANTS.windowSize) {
    return null
  }

  const onset = computeOnsetFunction(samples, analysisRate, {
    windowSize: TEMPO_CONSTANTS.windowSize,
    hopSize: TEMPO_CONSTANTS.hopSize,
  })

  return estimateTempo(onset, {
    minBpm: options.minBpm,
    maxBpm: options.maxBpm,
    bpmStep: options.bpmStep,
  })
}
