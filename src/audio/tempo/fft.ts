export function createHannWindow(size: number): Float32Array {
  const window = new Float32Array(Math.max(0, size))
  if (size <= 1) {
    if (size === 1) {
      window[0] = 1
    }
    return window
  }

  for (let index = 0; index < size; index += 1) {
    window[index] = 0.5 * (1 - Math.cos((2 * Math.PI * index) / (size - 1)))
  }

  return window
}

/**
 * In-place iterative radix-2 Cooley-Tukey FFT. Both arrays must have the same
 * power-of-two length. The transform is unnormalized.
 */
export function fftInPlace(real: Float32Array, imaginary: Float32Array): void {
  const size = real.length
  if (size < 2 || (size & (size - 1)) !== 0) {
    throw new Error('FFT size must be a power of two greater than one.')
  }
  if (imaginary.length !== size) {
    throw new Error('FFT real and imaginary arrays must match in length.')
  }

  for (let i = 1, j = 0; i < size; i += 1) {
    let bit = size >> 1
    for (; (j & bit) !== 0; bit >>= 1) {
      j ^= bit
    }
    j ^= bit

    if (i < j) {
      const tempReal = real[i]
      real[i] = real[j]
      real[j] = tempReal
      const tempImaginary = imaginary[i]
      imaginary[i] = imaginary[j]
      imaginary[j] = tempImaginary
    }
  }

  for (let length = 2; length <= size; length <<= 1) {
    const angle = (-2 * Math.PI) / length
    const stepReal = Math.cos(angle)
    const stepImaginary = Math.sin(angle)
    const half = length >> 1

    for (let start = 0; start < size; start += length) {
      let wReal = 1
      let wImaginary = 0

      for (let offset = 0; offset < half; offset += 1) {
        const even = start + offset
        const odd = even + half
        const oddReal = real[odd] * wReal - imaginary[odd] * wImaginary
        const oddImaginary = real[odd] * wImaginary + imaginary[odd] * wReal

        real[odd] = real[even] - oddReal
        imaginary[odd] = imaginary[even] - oddImaginary
        real[even] += oddReal
        imaginary[even] += oddImaginary

        const nextWReal = wReal * stepReal - wImaginary * stepImaginary
        wImaginary = wReal * stepImaginary + wImaginary * stepReal
        wReal = nextWReal
      }
    }
  }
}
