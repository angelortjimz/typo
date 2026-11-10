import { useId } from 'react'
import { TEMPO_CONSTANTS } from '../../audio/tempo'
import type { TempoMode, TempoState } from '../../audio/useTempo'
import { OptionButtons } from './OptionButtons'

interface TempoControlsProps {
  tempo: TempoState
  onModeChange: (mode: TempoMode) => void
  onManualBpmChange: (value: number) => void
}

function confidenceLabel(confidence: number): string {
  if (confidence >= 0.66) {
    return 'High confidence'
  }
  if (confidence >= 0.33) {
    return 'Medium confidence'
  }
  return 'Low confidence'
}

function readoutFor(tempo: TempoState): { value: string; detail: string } {
  if (tempo.isAnalyzing) {
    return { value: '…', detail: 'Analyzing tempo' }
  }
  if (!tempo.isReady) {
    return { value: '—', detail: 'No track loaded' }
  }

  const bpm = `${Math.round(tempo.effectiveBpm)} BPM`
  if (tempo.source === 'detected' && tempo.confidence !== null) {
    return { value: bpm, detail: `Detected · ${confidenceLabel(tempo.confidence)}` }
  }
  if (tempo.source === 'manual') {
    return { value: bpm, detail: 'Manual' }
  }
  return { value: bpm, detail: 'Default · no tempo detected' }
}

export function TempoControls({
  tempo,
  onModeChange,
  onManualBpmChange,
}: TempoControlsProps) {
  const inputId = useId()
  const readout = readoutFor(tempo)

  return (
    <div>
      <div className="tempo-readout" aria-live="polite">
        <span className="tempo-value">{readout.value}</span>
        <span className="tempo-source">{readout.detail}</span>
      </div>

      <OptionButtons
        label="Source"
        value={tempo.mode}
        options={[
          { value: 'auto', label: 'Auto' },
          { value: 'manual', label: 'Manual' },
        ]}
        onChange={onModeChange}
      />

      <div className="tempo-manual">
        <label htmlFor={inputId}>BPM</label>
        <input
          id={inputId}
          type="number"
          min={TEMPO_CONSTANTS.manualBpmMin}
          max={TEMPO_CONSTANTS.manualBpmMax}
          step={1}
          value={tempo.manualBpm}
          disabled={tempo.mode !== 'manual'}
          onChange={(event) => {
            const value = event.currentTarget.valueAsNumber
            if (Number.isFinite(value)) {
              onManualBpmChange(value)
            }
          }}
        />
      </div>

      <p className="control-hint">
        Tempo is estimated from the loaded track. Switch to Manual to enter your own BPM.
      </p>
    </div>
  )
}
