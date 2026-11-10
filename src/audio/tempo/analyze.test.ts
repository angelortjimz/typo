import { describe, expect, it } from 'vitest'
import { analyzeAudioBuffer } from './analyze'
import type { AudioBufferLike } from './types'

function impulseTrain(sampleRate: number, durationSeconds: number, bpm: number): Float32Array {
  const length = Math.floor(durationSeconds * sampleRate)
  const samples = new Float32Array(length)
  const interval = Math.round((60 / bpm) * sampleRate)

  for (let index = 0; index < length; index += interval) {
    samples[index] = 1
  }

  return samples
}

function fakeBuffer(
  samples: Float32Array,
  sampleRate: number,
  numberOfChannels = 1,
): AudioBufferLike {
  return {
    length: samples.length,
    sampleRate,
    numberOfChannels,
    duration: samples.length / sampleRate,
    getChannelData: (channel) => {
      if (channel >= numberOfChannels) {
        throw new RangeError('channel out of range')
      }
      return samples
    },
  }
}

function createRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296
  }
}

function musicalSignal(
  sampleRate: number,
  durationSeconds: number,
  bpm: number,
): Float32Array {
  const length = Math.floor(durationSeconds * sampleRate)
  const samples = new Float32Array(length)
  const random = createRandom(42)
  const beatInterval = 60 / bpm

  for (let beat = 0; beat * beatInterval < durationSeconds; beat += 1) {
    const beatStart = Math.floor(beat * beatInterval * sampleRate)

    const kickSamples = Math.floor(0.12 * sampleRate)
    for (let index = 0; index < kickSamples && beatStart + index < length; index += 1) {
      const time = index / sampleRate
      samples[beatStart + index] +=
        Math.sin(2 * Math.PI * 55 * time) * Math.exp(-time * 30) * 0.9
    }

    const offbeatStart = Math.floor((beat + 0.5) * beatInterval * sampleRate)
    const snareSamples = Math.floor(0.05 * sampleRate)
    for (let index = 0; index < snareSamples && offbeatStart + index < length; index += 1) {
      const time = index / sampleRate
      samples[offbeatStart + index] +=
        (random() * 2 - 1) * Math.exp(-time * 60) * 0.3
    }
  }

  for (let index = 0; index < length; index += 1) {
    const time = index / sampleRate
    samples[index] += Math.sin(2 * Math.PI * 80 * time) * 0.15
  }

  return samples
}

describe('analyzeAudioBuffer', () => {
  it('estimates a 120 BPM pulse train', () => {
    const sampleRate = 22_050
    const result = analyzeAudioBuffer(fakeBuffer(impulseTrain(sampleRate, 12, 120), sampleRate))

    expect(result).not.toBeNull()
    expect(result?.bpm).toBeGreaterThanOrEqual(118)
    expect(result?.bpm).toBeLessThanOrEqual(122)
    expect(result?.confidence).toBeGreaterThan(0.5)
    expect(result?.analyzedSeconds).toBeGreaterThan(10)
  })

  it('downmixes stereo channels', () => {
    const sampleRate = 22_050
    const left = impulseTrain(sampleRate, 10, 120)
    const right = new Float32Array(left.length)
    const buffer: AudioBufferLike = {
      length: left.length,
      sampleRate,
      numberOfChannels: 2,
      duration: left.length / sampleRate,
      getChannelData: (channel) => (channel === 0 ? left : right),
    }

    const result = analyzeAudioBuffer(buffer)

    expect(result?.bpm).toBeGreaterThanOrEqual(118)
    expect(result?.bpm).toBeLessThanOrEqual(122)
  })

  it('estimates a musical signal with kicks and offbeats', () => {
    const sampleRate = 22_050
    const result = analyzeAudioBuffer(
      fakeBuffer(musicalSignal(sampleRate, 12, 128), sampleRate),
    )

    expect(result?.bpm).toBeGreaterThanOrEqual(126)
    expect(result?.bpm).toBeLessThanOrEqual(130)
    expect(result?.confidence).toBeGreaterThan(0.4)
  })

  it('reports low confidence for ambient audio without a beat', () => {
    const sampleRate = 22_050
    const length = sampleRate * 8
    const ambient = new Float32Array(length)
    for (let index = 0; index < length; index += 1) {
      const time = index / sampleRate
      ambient[index] =
        Math.sin(2 * Math.PI * 220 * time) * 0.2 +
        Math.sin(2 * Math.PI * 330 * time) * 0.1
    }

    const result = analyzeAudioBuffer(fakeBuffer(ambient, sampleRate))

    expect(result?.confidence ?? 1).toBeLessThan(0.35)
  })

  it('returns null for silence', () => {
    const sampleRate = 22_050
    const result = analyzeAudioBuffer(fakeBuffer(new Float32Array(sampleRate * 5), sampleRate))

    expect(result).toBeNull()
  })

  it('returns null for a buffer shorter than one analysis window', () => {
    const sampleRate = 22_050
    const result = analyzeAudioBuffer(fakeBuffer(new Float32Array(100), sampleRate))

    expect(result).toBeNull()
  })

  it('returns null for invalid buffer metadata', () => {
    expect(
      analyzeAudioBuffer({
        length: 0,
        sampleRate: 0,
        numberOfChannels: 0,
        duration: 0,
        getChannelData: () => new Float32Array(0),
      }),
    ).toBeNull()
  })
})
