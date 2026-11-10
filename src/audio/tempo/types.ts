export interface AudioBufferLike {
  length: number
  sampleRate: number
  numberOfChannels: number
  duration: number
  getChannelData(channel: number): Float32Array
}

export interface TempoResult {
  bpm: number
  confidence: number
  offset: number
  analyzedSeconds: number
}

export interface OnsetFunction {
  values: Float32Array
  frameRate: number
}

export interface OnsetOptions {
  windowSize: number
  hopSize: number
}

export interface TempoEstimateOptions {
  minBpm: number
  maxBpm: number
  bpmStep: number
}

export interface AnalysisOptions extends TempoEstimateOptions {
  maxSeconds: number
}
