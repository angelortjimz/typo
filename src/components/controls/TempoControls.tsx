import { useId } from 'react'
import { canScaleBpm, isLowConfidence, scaleBpm, TEMPO_CONSTANTS } from '../../audio/tempo'
import type { TempoMode, TempoState } from '../../audio/useTempo'
import { OptionButtons } from './OptionButtons'

interface TempoControlsProps {
  tempo: TempoState
  onModeChange: (mode: TempoMode) => void
  onManualBpmChange: (value: number) => void
}

interface TempoReadout {
  value: string
  approximate: boolean
}

function readoutFor(tempo: TempoState): TempoReadout {
  if (tempo.isAnalyzing) {
    return { value: '…', approximate: false }
  }
  if (!tempo.isReady || tempo.source === 'default') {
    return { value: '—', approximate: false }
  }

  return {
    value: `${Math.round(tempo.effectiveBpm)} BPM`,
    approximate: tempo.source === 'detected' && isLowConfidence(tempo.confidence),
  }
}

export function TempoControls({ tempo, onModeChange, onManualBpmChange }: TempoControlsProps) {
  const inputId = useId()
  const readout = readoutFor(tempo)
  const hasTempo = tempo.isReady && tempo.source !== 'default'
  const canHalve = hasTempo && canScaleBpm(tempo.effectiveBpm, 0.5)
  const canDouble = hasTempo && canScaleBpm(tempo.effectiveBpm, 2)

  const handleScale = (factor: number) => {
    onModeChange('manual')
    onManualBpmChange(scaleBpm(tempo.effectiveBpm, factor))
  }

  return (
    <div>
      <div className="tempo-readout">
        <span className="tempo-value-group">
          <button
            type="button"
            className="tempo-scale-button"
            aria-label="Halve tempo"
            disabled={!canHalve}
            onClick={() => handleScale(0.5)}
          >
            ÷2
          </button>
          <span className="tempo-value" aria-live="polite">
            {readout.approximate && (
              <span className="tempo-approx" aria-hidden="true">
                ≈
              </span>
            )}
            {readout.value}
            {readout.approximate && (
              <span className="visually-hidden"> approximate, low confidence</span>
            )}
          </span>
          <button
            type="button"
            className="tempo-scale-button"
            aria-label="Double tempo"
            disabled={!canDouble}
            onClick={() => handleScale(2)}
          >
            ×2
          </button>
        </span>
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
          disabled={tempo.mode !== 'manual' || !tempo.isReady}
          onChange={(event) => {
            const value = event.currentTarget.valueAsNumber
            if (Number.isFinite(value)) {
              onManualBpmChange(value)
            }
          }}
        />
      </div>

      <p className="control-hint">
        Tempo is estimated from the loaded track; uncertain estimates are marked ≈. Switch to Manual
        to enter your own BPM.
      </p>
    </div>
  )
}
