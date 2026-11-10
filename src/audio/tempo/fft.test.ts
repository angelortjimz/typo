import { describe, expect, it } from 'vitest'
import { createHannWindow, fftInPlace } from './fft'

function magnitudes(real: Float32Array, imaginary: Float32Array): number[] {
  return Array.from(real, (_, index) => Math.sqrt(real[index] ** 2 + imaginary[index] ** 2))
}

describe('createHannWindow', () => {
  it('tapers at both ends and is symmetric', () => {
    const size = 16
    const window = createHannWindow(size)

    expect(window[0]).toBe(0)
    expect(window[size - 1]).toBe(0)
    for (let index = 0; index < size; index += 1) {
      expect(window[index]).toBeCloseTo(window[size - 1 - index], 10)
    }
    expect(window[size / 2]).toBeGreaterThan(window[0])
  })

  it('handles degenerate sizes without invalid values', () => {
    expect(Array.from(createHannWindow(0))).toEqual([])
    expect(Array.from(createHannWindow(1))).toEqual([1])
  })
})

describe('fftInPlace', () => {
  it('produces a flat spectrum for a unit impulse at index zero', () => {
    const real = new Float32Array([1, 0, 0, 0, 0, 0, 0, 0])
    const imaginary = new Float32Array(8)

    fftInPlace(real, imaginary)

    for (const magnitude of magnitudes(real, imaginary)) {
      expect(magnitude).toBeCloseTo(1, 6)
    }
  })

  it('places a cosine at the expected bins', () => {
    const size = 8
    const bin = 1
    const real = new Float32Array(size)
    const imaginary = new Float32Array(size)

    for (let index = 0; index < size; index += 1) {
      real[index] = Math.cos((2 * Math.PI * bin * index) / size)
    }

    fftInPlace(real, imaginary)

    const spectrum = magnitudes(real, imaginary)
    expect(spectrum[bin]).toBeCloseTo(size / 2, 6)
    expect(spectrum[size - bin]).toBeCloseTo(size / 2, 6)
    for (let index = 0; index < size; index += 1) {
      if (index !== bin && index !== size - bin) {
        expect(spectrum[index]).toBeLessThan(0.0001)
      }
    }
  })

  it('rejects invalid sizes', () => {
    expect(() => fftInPlace(new Float32Array(3), new Float32Array(3))).toThrow()
    expect(() => fftInPlace(new Float32Array(4), new Float32Array(3))).toThrow()
  })
})
