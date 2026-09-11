# DivyangSetu architecture

This document describes the **implemented** flow in this repository, not the original planning sketch.

## 1. Entry modes

`ModePicker` is the home screen. It offers three equivalent ways in:

| Mode | Screen | What actually happens |
| --- | --- | --- |
| Gesture | `GestureNavigator` | Live camera + MediaPipe `HandLandmarker`. Open palm opens the **real scanner**. Fist goes home. Pointing finger opens emergency help. |
| Voice | `VoiceAssistant` | Web Speech STT. `parseVoiceIntent()` maps “explore schemes” / “emergency” / “go home”. Typed fallback uses the **same** parser. |
| Scanner | `DocumentScanner` | `getUserMedia` preview, capture to canvas, optional file upload, Tesseract OCR. |

All three modes can also reach **Emergency help** (header button, voice intent, or the pointing pose).

## 2. Explore schemes always means the scanner

The architecture rule is: discovering schemes is not a fake list behind a button. Gesture “explore” and voice “explore schemes” both `navigateTo('scanner')`. Matching happens only after the citizen confirms extracted identity data.

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

## 3. On-device data

`CitizenProvider` keeps `citizenData`, `matchedSchemes`, and `selectedScheme`. `useLocalCitizenData` helpers persist that snapshot to `localStorage` (`divyang-setu:citizen-v1`) and rehydrate on load. **Clear my data** (home, footer, emergency) wipes context and storage.

OCR, matching, and PDF generation all run in the browser. There is no backend.

## 4. Matching

`matchSchemes()` derives age from date of birth and state from the address string. Schemes that require an age or a specific state are skipped when that fact is missing, so partial records match **fewer** schemes rather than crashing or assuming eligibility. Income is applied only when the citizen record includes it.

## 5. One-key navigation

`OneKeyNavProvider` is a small action registry. Each screen registers a primary callback with `usePrimaryAction`. Space runs that callback. Any other non-modifier key runs the registered back action, or a per-screen default (home / previous step). Keystrokes inside text fields are left alone so OCR correction and voice typing still work.

## 6. Emergency

`EmergencyHelpScreen` is a real route, reachable from:

- the always-visible header **Emergency help** button
- voice intent `"emergency"`
- gesture pose `point`

On entry it speaks the helpline instructions through `useTextToSpeech`.
