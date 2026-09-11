# DivyangSetu

## Problem

People with disabilities in India often struggle to find welfare schemes they already qualify for. Forms, portals, and navigation patterns assume a single way of interacting with a screen.

## What It Does

DivyangSetu is an on-device helper that:

- Lets a citizen choose **gesture**, **voice**, or **document scan** as the way in
- Reads an identity document with the camera (or an uploaded photo) and OCR
- Asks for confirmation when extracted fields are uncertain
- Matches confirmed details against a local catalogue of disability welfare schemes
- Builds a filled **application PDF** for the citizen to keep
- Offers a persistent **Emergency help** screen, with spoken instructions on entry
- Stores draft identity data in `localStorage` until the user chooses **Clear my data**

Gesture mode understands exactly five poses:

| Gesture | Meaning | Action |
| --- | --- | --- |
| Open palm | Namaste / Home / Help | Go home |
| Thumbs up | Confirm / Yes | Same primary action as Space |
| Thumbs down | Reject / No / Back | Same back action as the one-key back key |
| Peace sign (V) | Explore schemes | Open the document scanner |
| Closed fist | Emergency SOS / Help desk | Open Emergency help from anywhere in gesture mode |

Nothing is submitted to a live government API in this build.

## Tech Stack

- React 19 + Vite
- `jspdf` for application PDFs
- `tesseract.js` for on-device OCR
- `@mediapipe/tasks-vision` HandLandmarker for static hand poses
- Web Speech API for speech-to-text and text-to-speech

## Running Locally

```bash
cd divyang-setu
npm install
npm run dev
```

Open the printed URL on **`http://localhost:…`** (the Vite config binds `server.host` to `localhost`). Camera and microphone APIs require a [secure context](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts): `localhost` or HTTPS. If you open the app over a LAN IP (`http://192.168.…`), `getUserMedia` will fail with `SecurityError`.

Allow camera and microphone in the browser site settings if prompted. Chrome is the most reliable for this demo.

```bash
npm test
npm run build
```

## Architecture

See [docs/architecture.md](docs/architecture.md) for the implemented data flow.

## Known Limitations

- Gesture poses are classified from HandLandmarker landmarks, not a full gesture-video model. Accuracy drops in **low light**, with motion blur, or when only part of the hand is visible. A pose must be held about **500ms** before it fires.
- OCR field guesses below **70%** confidence always require manual confirmation. Even high-confidence scans can misread similar characters.
- There is **no live government eligibility API**. Matching uses a static `src/data/schemes.json` file.
- Emergency contacts are a **static list** (national helpline, 112, 181, 1098), not location-aware dispatch.
- Speech recognition quality varies by browser and accent; typed commands use the same intent parser as a fallback.
- One-key navigation treats Space as the screen’s primary action and any other non-modifier key as Back, except while typing in a field.
- Camera errors are classified by `err.name` (`NotAllowedError`, `NotFoundError`, `NotReadableError`, `SecurityError`). Transient failures show **Try camera again** before offering button navigation.

## Team

Built as a DivyangSetu accessibility prototype. Identity details stay on the citizen’s device.
