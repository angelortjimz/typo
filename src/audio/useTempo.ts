import { useCallback, useState } from 'react'
import type { AudioSnapshot } from './AudioEngine'
import { TEMPO_CONSTANTS, type TempoResult } from './tempo'

export type TempoMode = 'auto' | 'manual'
export type TempoSource = 'detected' | 'manual' | 'default'

export interface TempoState {
  detected: TempoResult | null
  mode: TempoMode
  manualBpm: number
  effectiveBpm: number
  source: TempoSource
  confidence: number | null
  isAnalyzing: boolean
  isReady: boolean
}

const READY_STATUSES = ['ready', 'playing', 'paused', 'ended'] as const

function clampManualBpm(value: number): number {
  const rounded = Number.isFinite(value) ? Math.round(value) : TEMPO_CONSTANTS.defaultBpm
  return Math.min(
    TEMPO_CONSTANTS.manualBpmMax,
    Math.max(TEMPO_CONSTANTS.manualBpmMin, rounded),
  )
}

function resolveEffective(
  mode: TempoMode,
  detected: TempoResult | null,
  manualBpm: number,
): { effectiveBpm: number; source: TempoSource } {
  if (mode === 'manual') {
    return { effectiveBpm: manualBpm, source: 'manual' }
  }
  if (detected) {
    return { effectiveBpm: detected.bpm, source: 'detected' }
  }
  return { effectiveBpm: manualBpm, source: 'default' }
}

export function useTempo(snapshot: AudioSnapshot) {
  const [mode, setModeState] = useState<TempoMode>('auto')
  const [manualBpm, setManualBpmState] = useState<number>(TEMPO_CONSTANTS.defaultBpm)

  const detected = snapshot.tempo
  const { effectiveBpm, source } = resolveEffective(mode, detected, manualBpm)

  const setMode = useCallback((nextMode: TempoMode) => {
    setModeState(nextMode)
  }, [])

  const setManualBpm = useCallback((value: number) => {
    setManualBpmState(clampManualBpm(value))
  }, [])

  return {
    tempo: {
      detected,
      mode,
      manualBpm,
      effectiveBpm,
      source,
      confidence: detected?.confidence ?? null,
      isAnalyzing: snapshot.status === 'loading',
      isReady: READY_STATUSES.some((status) => status === snapshot.status),
    },
    setMode,
    setManualBpm,
  }
}
