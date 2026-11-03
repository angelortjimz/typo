# Typographic Spectrum

A client-only, audio-reactive typographic canvas. Frequency maps to columns across the x axis and amplitude moves each column's character vertically, so the spectrum reads as a crest of letters and symbols rather than bars or lines.

Nothing is uploaded. Audio is decoded and played locally through the Web Audio API, and the artwork is drawn with Canvas 2D.

## Requirements

- Node.js `^20.19.0 || >=22.12.0`
- pnpm 12.6.0, pinned by the `packageManager` field in `package.json`

`corepack enable` is the simplest way to get the pinned pnpm version. Use pnpm only: do not run npm or commit a `package-lock.json`.

## Setup

```sh
pnpm install
pnpm dev
```

Open the local URL printed by Vite. Choose an audio file or drop one anywhere on the workspace.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the Vite development server with hot reload |
| `pnpm build` | Type-check and build the production bundle into `dist/` |
| `pnpm preview` | Serve the production build locally (run `pnpm build` first) |
| `pnpm typecheck` | Run the strict TypeScript project build without emitting |
| `pnpm lint` | Lint the project with ESLint |
| `pnpm test` | Run the Vitest suite once |
| `pnpm format` | Format `src` and the Vite/ESLint configuration with Prettier |

## Using the app

1. Choose or drop a local audio file.
2. Press Play. The canvas stays blank until the track produces audible energy.
3. Tune the composition in the side panel. Controls stay visible; Generate randomizes the visual configuration and Reset restores the defaults.
4. In Chromium, export the full track to MP4 with the original audio.

## Browser support

Desktop Chromium (Chrome or Edge) is the supported and verified target. The release smoke tests run against Chrome. Playback may work in other modern browsers, but that is not part of the verified release matrix.

MP4 export additionally requires:

- Canvas `captureStream`
- `MediaRecorder` with H.264 video and AAC audio
- `AudioContext.createMediaStreamDestination`

When those are unavailable, the app keeps playback working and explains that export is unsupported instead of producing an invalid file.

## Audio and export limitations

- Audio is local-only. There is no upload, streaming URL, microphone, playlist, account, or cloud storage.
- The whole file is decoded into memory before playback. Very long tracks use more memory and take longer to load.
- Decoder support depends on the browser. MP3 and WAV are the most reliable; AAC, FLAC, OGG, Opus, and WebM support varies.
- Export is real-time: a five-minute track takes about five minutes to record. Keep the tab visible and unfrozen; background throttling can interrupt capture.
- MP4 is the only export format. There is no WebM, GIF, or image-sequence fallback.
- Export renders at canvas size, 720p, or 1080p. A canvas smaller than the chosen resolution is upscaled.
- The exported file contains the original track audio. It does not capture microphone input.
- Visual configuration is session-local. There are no presets, saved profiles, or `localStorage` settings.

## Privacy

No audio leaves the browser and there is no analytics or backend. Fonts are bundled through `@fontsource`; after the page assets load, the app makes no network requests.

## Accessibility

- Controls are native inputs and buttons with labels, visible focus rings, pressed states on option groups, and alert/status roles for errors and export feedback.
- `prefers-reduced-motion: reduce` removes non-essential interface transitions. The audio-reactive artwork keeps running because it is the content; silence and decay already resolve to a still background.
- The canvas is decorative and hidden from assistive technology; all actions are available from the controls.

## Project structure

```text
src/audio/      Web Audio engine, playback helpers, file validation
src/visual/     Spectrum mapping, envelopes, crest layout, seeded styling, fonts
src/export/     MP4 capability detection, exporter, canvas capture
src/components/ React interface and controls
docs/           Roadmap and implementation/verification notes
```

## Verification

`pnpm test` covers the pure spectrum, envelope, layout, deterministic shuffle, style assignment, generation, playback, and export helpers. Browser behavior is verified with the smoke matrix in [`docs/milestone-5-implementation.md`](docs/milestone-5-implementation.md). See [`docs/roadmap.md`](docs/roadmap.md) for scope and milestone status.
