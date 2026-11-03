import { describe, expect, it } from 'vitest'
import { describeAudioFileIssue } from './validation'

function file(name: string, type: string, size = 1_024) {
  return { name, type, size }
}

describe('describeAudioFileIssue', () => {
  it('accepts files the browser labels as audio', () => {
    expect(describeAudioFileIssue(file('track.mp3', 'audio/mpeg'))).toBeNull()
    expect(describeAudioFileIssue(file('recording', 'audio/wav'))).toBeNull()
  })

  it('accepts known audio extensions when the browser omits the type', () => {
    expect(describeAudioFileIssue(file('track.FLAC', ''))).toBeNull()
    expect(describeAudioFileIssue(file('voice.ogg', 'application/octet-stream'))).toBeNull()
    expect(describeAudioFileIssue(file('clip.m4a', ''))).toBeNull()
  })

  it('rejects empty files', () => {
    expect(describeAudioFileIssue(file('empty.wav', 'audio/wav', 0))).toMatchObject({
      kind: 'empty',
    })
    expect(describeAudioFileIssue(file('empty.mp3', 'audio/mpeg', 0))).toMatchObject({
      kind: 'empty',
    })
  })

  it('rejects files that are neither audio nor a known audio extension', () => {
    expect(describeAudioFileIssue(file('notes.txt', 'text/plain'))).toMatchObject({
      kind: 'unsupported',
    })
    expect(describeAudioFileIssue(file('video.mp4', 'video/mp4'))).toMatchObject({
      kind: 'unsupported',
    })
    expect(describeAudioFileIssue(file('no-extension', ''))).toMatchObject({
      kind: 'unsupported',
    })
  })
})
