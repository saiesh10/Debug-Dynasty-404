# DivyangSetu architecture

This document describes the **implemented** flow in this repository, not the original planning sketch.

## 1. Entry modes

`ModePicker` is the home screen. It offers three equivalent ways in:

| Mode | Screen | What actually happens |
| --- | --- | --- |
| Gesture | `GestureNavigator` plus a session overlay | Live camera + MediaPipe `HandLandmarker`. Five poses (see below). A PiP camera stays active on later screens so a closed fist can still open Emergency help. |
| Voice | `VoiceAssistant` | Web Speech STT. `parseVoiceIntent()` maps “explore schemes” / “emergency” / “go home”. Typed fallback uses the **same** parser. |
| Scanner | `DocumentScanner` | `getUserMedia` preview, capture to canvas, optional file upload, Tesseract OCR. |

All three modes can also reach **Emergency help** (header button, voice intent, or closed fist in gesture mode).

### Gesture set

Classification lives in `classifyGesture.js` (pure function, unit-tested). A pose must hold for `STABLE_GESTURE_MS` (500) before it fires.

| id | Gesture | Action |
| --- | --- | --- |
| `open_palm` | Open palm | Home |
| `thumbs_up` | Thumbs up | `runPrimaryAction()` (same registry as Space) |
| `thumbs_down` | Thumbs down | `runBackAction()` (same registry as the one-key back key) |
| `peace_sign` | Peace sign (V) | Document scanner (explore schemes) |
| `closed_fist` | Closed fist | Emergency screen from any gesture-mode screen |

`GESTURE_CATALOG` in `gestureCatalog.js` is the single source of wording for the in-app guide, overlay labels, and spoken/visual feedback.

## 2. Explore schemes always means the scanner

The architecture rule is: discovering schemes is not a fake list behind a button. Gesture peace sign and voice “explore schemes” both `navigateTo('scanner')`. Matching happens only after the citizen confirms extracted identity data.

```
Mode / intent / pose
        │
        ▼
 DocumentScanner ──OCR──► fieldExtractor
        │                      │
        │              confidence < 70%
        │                      │
        ▼                      ▼
  CitizenContext ◄── ManualCorrectionForm
        │
        ▼
 ConfirmDetailsScreen
        │
        ▼
 matchSchemes(citizenData, schemes.json)
        │
        ▼
 SchemesScreen ──► ApplicationReviewScreen ──► SubmittedScreen
                                                      │
                                                      ▼
                                           generateApplicationPDF → save
```

## 3. Camera access

`CameraProvider` owns a shared `getUserMedia` stream. Failures are classified in `describeCameraError()` by `err.name`:

- `NotAllowedError` — permission denied (retry + site-settings copy)
- `NotFoundError` — no camera; button fallback offered immediately
- `NotReadableError` — camera busy; retry first, no immediate fallback
- `SecurityError` — origin is not a secure context; logs `window.location.origin`
- anything else — show `err.name` and `err.message` in the UI

The Vite dev server binds `server.host` to `localhost` so camera APIs run in a secure context. Opening the app on a raw LAN IP over HTTP will fail.

## 4. On-device data

`CitizenProvider` keeps `citizenData`, `matchedSchemes`, and `selectedScheme`. `useLocalCitizenData` persists that snapshot to `localStorage` (`divyang-setu:citizen-v1`) and rehydrates on load. **Clear my data** wipes context and **removes** the storage key (it does not leave an empty JSON blob).

OCR, matching, and PDF generation all run in the browser. There is no backend.

## 5. Matching

`matchSchemes()` derives age from date of birth and state from the address string. Schemes that require an age or a specific state are skipped when that fact is missing, so partial records match **fewer** schemes rather than crashing or assuming eligibility. Income is applied only when the citizen record includes it.

## 6. One-key navigation

`OneKeyNavProvider` is a small action registry. Each screen registers a primary callback with `usePrimaryAction`. Space and thumbs-up run that callback. Any other non-modifier key and thumbs-down run the registered back action, or a per-screen default. Keystrokes inside text fields are left alone so OCR correction and voice typing still work.

## 7. Emergency

`EmergencyHelpScreen` is a real route, reachable from:

- the always-visible header **Emergency help** button
- voice intent `"emergency"`
- gesture `closed_fist` from any screen while gesture mode is active

On entry it speaks the helpline instructions through `useTextToSpeech`.
