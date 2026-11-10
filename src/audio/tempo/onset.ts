import { createHannWindow, fftInPlace } from './fft'
import type { OnsetFunction, OnsetOptions } from './types'

/**
 * Computes a spectral-flux onset detection function: the sum of positive
 * magnitude differences between consecutive windowed FFT frames. The input is
 * expected to be mono and already at the intended analysis sample rate.
 */
export function computeOnsetFunction(
  samples: Float32Array,
  sampleRate: number,
  options: OnsetOptions,
): OnsetFunction {
  const windowSize = Math.max(2, Math.floor(options.windowSize))
  const hopSize = Math.max(1, Math.floor(options.hopSize))
  const frameCount = Math.max(0, Math.floor((samples.length - windowSize) / hopSize) + 1)
  const values = new Float32Array(frameCount)
  const frameRate = sampleRate / hopSize

  if (frameCount === 0 || !(frameRate > 0)) {
    return { values, frameRate }
  }

  const window = createHannWindow(windowSize)
  const real = new Float32Array(windowSize)
  const imaginary = new Float32Array(windowSize)
  const half = windowSize / 2
  const previous = new Float32Array(half)
  const current = new Float32Array(half)

  for (let frame = 0; frame < frameCount; frame += 1) {
    const start = frame * hopSize

    for (let index = 0; index < windowSize; index += 1) {
      real[index] = samples[start + index] * window[index]
      imaginary[index] = 0
    }

    fftInPlace(real, imaginary)

    let flux = 0
    for (let bin = 0; bin < half; bin += 1) {
      const magnitude = Math.sqrt(real[bin] * real[bin] + imaginary[bin] * imaginary[bin])
      const difference = magnitude - previous[bin]
      if (difference > 0) {
        flux += difference
      }
      current[bin] = magnitude
    }

    previous.set(current)
    values[frame] = flux
  }

  return { values, frameRate }
}
