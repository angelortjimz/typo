# Milestone 5 Implementation and Verification

## Release Hardening

> Make the focused release dependable, understandable, and maintainable.

**Source:** `docs/roadmap.md`, Milestone 5  
**Completed:** 2026-11-03  
**Environment:** Windows 11, Node.js 24.21.0, pnpm 12.6.0, Vite 8.3.5, Chrome 156.0.8078.74 (headless)

---

## 1. Scope

### Included

- Audio file validation and separated load/playback error messages
- Keyboard access and visible focus review
- Reduced-motion handling for non-essential interface motion
- pnpm, development, testing, and production-build documentation
- Honest browser and export limitation documentation
- Production build and browser smoke tests, including full-track MP4 export and cancellation
- Changelog and roadmap updates

### Excluded

- Envelope, gain, or character-shuffle tuning against varied music (Milestone 3 items remain open)
- New audio formats, export formats, playback features, or visualization modes
- Component-test or browser-automation dependencies

---

## 2. Changes

| File | Change |
| --- | --- |
| `src/audio/validation.ts` | New pure validator for empty files and files that are neither `audio/*` nor a known audio extension |
| `src/audio/validation.test.ts` | New coverage for accepted types, extension fallback, empty files, and unsupported files |
| `src/audio/AudioEngine.ts` | Validate before decoding; keep decoding independent of the autoplay gesture; add dedicated messages for empty, unsupported, decode, Web Audio, and blocked-playback failures; bound `resume()` so blocked autoplay reports an error and leaves the loaded track retryable |
| `src/styles.css` | Removed the `outline: none` override on the character-pool input; added `prefers-reduced-motion: reduce` handling for the transport transition |
| `src/components/controls/ColorControls.tsx` | Unique accessible names for palette remove buttons |
| `src/components/controls/SliderControl.tsx` | Exposes `aria-valuetext` so units reach assistive technology |
| `public/favicon.svg`, `index.html` | Local favicon, removing the only browser console error |
| `package.json` | Added `pnpm preview` |
| `README.md` | Setup, commands, browser support, export/audio limitations, privacy, accessibility, and verification notes |
| `CHANGELOG.md` | Unreleased entries for the hardening work |

---

## 3. Automated verification

| Check | Command | Result |
| --- | --- | --- |
| Unit tests | `pnpm test` | 12 files, 74 tests passed |
| Type check | `pnpm typecheck` | Passed with no diagnostics |
| Lint | `pnpm lint` | Passed with no diagnostics |
| Production build | `pnpm build` | Passed; `dist/assets/index-*.js` 263.21 kB (81.99 kB gzip), CSS 13.33 kB (3.16 kB gzip) |

---

## 4. Browser smoke matrix

Run against the production build served by `pnpm preview`, using a headless Chrome session driven through the DevTools protocol.

| Area | Check | Result |
| --- | --- | --- |
| Boot | Document title, heading, canvas, control counts | Passed; 998×790 canvas, 26 composition controls, 6 transport controls, no alerts |
| Fonts | Bundled catalog loaded before interaction | Passed for IBM Plex Mono and Caveat |
| Upload validation | Drop an empty `.wav` | Passed; “This file is empty…” |
| Upload validation | Drop a `.txt` file | Passed; “That file does not look like audio…” |
| Track load | Drop a generated 2-second WAV | Passed; track name shown, duration `0:02`, Play enabled, no error |
| Playback | Play | Passed; button changed to Pause, elapsed time advanced, 2,402 non-background canvas pixels |
| Pause | Pause | Passed; button changed to Resume, time held |
| Autoplay restriction | Play without user activation and without the test autoplay override | Passed; dedicated blocked-playback message, Play remains available, canvas stays empty |
| Export | Full-track MP4 export | Passed; status reported the downloaded file, 206,457 bytes with an `ftyp` header |
| Export cancel | Start export, then cancel | Passed; controls unlocked, status returned to the idle message, no second download |
| Keyboard focus | Programmatic focus | Inconclusive by design; Chrome does not promote script focus to `:focus-visible` |
| Keyboard focus | Tab and Shift+Tab to the character-pool input | Passed; `:focus-visible` matched with a 2px solid outline |
| Reduced motion | Emulated `prefers-reduced-motion: reduce` | Passed; transport transition duration `0s` |
| Resize | 900×700 at device scale factor 2 | Passed; 630×590 CSS size, 1260×1180 backing store, no horizontal overflow |
| Console | Runtime, console, and network errors | None |

---

## 5. Residual manual checks

These cannot be validated meaningfully from a headless run and remain a maintainer responsibility before a public release:

- Listen to quiet, loud, sparse, and bass-heavy tracks through real speakers and confirm the response feels musical. This overlaps the two open Milestone 3 items.
- Confirm volume control behavior on a real output device.
- Keep a real backgrounded window during playback and export, then confirm the tab restores cleanly.
- Confirm drag-over feedback and the file picker with a real pointer.
- Confirm export playback and audio synchronization in the downloaded MP4.

---

## 6. Known limitations

The documented limitations live in [`README.md`](../README.md): Chromium-first support, browser-dependent decoding, in-memory decoding of whole files, real-time MP4 export that requires a visible tab, MP4-only output, and session-local configuration.
