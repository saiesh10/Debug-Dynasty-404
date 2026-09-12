# DivyangSetu

**The right to a pension shouldn't require a middleman.**

DivyangSetu is a browser-based accessibility platform that lets citizens with disabilities and low-literacy citizens independently discover and apply for Indian disability welfare schemes — through gesture, voice, or a document scan, whichever matches how they can actually interact with a screen.

No app install. No backend. No citizen ID data ever leaves the device.

---

## The Problem

India's disability welfare system legally entitles 2.68 crore citizens to pensions, assistive devices, and concessions — but every existing digital pathway to claim them assumes the applicant can read, hear, speak, and use a screen unaided.

Deaf and mute citizens have no channel into a voice-first or text-first portal. 300+ million functionally low-literacy citizens can't parse scheme jargon. The result: ₹1.5 lakh crore+ in welfare funds sits unclaimed, and a system meant to remove dependency quietly reintroduces it — you need someone else to apply on your behalf.

Voice assistants for illiterate citizens exist. Aadhaar OCR auto-fill exists. Sign-language dictionaries exist. None of them talk to each other, and none of them include a deaf/mute citizen in the actual application flow.

DivyangSetu closes that specific gap — everything else here is in service of routing every citizen to a channel they can use unaided, with the gesture pathway as the piece that didn't exist before.

---

## What It Does

| Mode | Who it's for | How it works |
|---|---|---|
| **Gesture Navigation** | Deaf/mute citizens | Live webcam hand-gesture recognition drives all navigation (home, confirm, back, explore schemes, emergency). No typing, reading, or hearing required. When the flow needs citizen data, gesture navigation hands off into the document scanner automatically — it doesn't require separate typed input. |
| **Voice Copilot** | Illiterate / low-literacy citizens | Natural Hindi/English speech in, plain-language spoken answers out. Falls back to a text input if microphone access is denied or recognition confidence is low. |
| **Document Scanner** | Everyone | Show an Aadhaar/UDID card to the camera; on-device OCR extracts identifying fields and classifies the document type. Below a confidence threshold, a manual correction step confirms fields with the citizen before proceeding — a deliberate human-in-the-loop check, not a shortcut. |
| **Accessibility Layer** | Visually/motor-impaired citizens | Screen-reader announcements on every state change, and single-key navigation for citizens who can't use a mouse/touch reliably. |
| **Scheme Matching + Application** | Everyone | Extracted citizen data is matched against real scheme eligibility rules, reviewed on a confirm screen, and exported as a filled, downloadable application PDF. |
| **Emergency Help** | Everyone | Reachable from any screen via gesture, voice, or a persistent visible button — never gated behind a single input mode. |
| **Multi-Lingual Support (i18n)** | Nationwide accessibility | Full UI available in English + 8 major Indian languages (Hindi, Bengali, Marathi, Telugu, Tamil, Gujarati, Kannada, Punjabi), covering every major script family in active government use. Language packs load lazily per screen; a missing translation falls back to English automatically rather than showing blank text. |

---

## Why This Is Different From Existing Tools

Voice-first scheme assistants, Aadhaar OCR auto-fill, and sign-language dictionaries already exist individually. We're not claiming to invent any of them.

What doesn't exist today is a single platform that routes a citizen to whichever channel matches their actual disability — and specifically, a deaf/mute citizen has had **no channel at all** into any government scheme platform until now.

The gesture pathway, and its handoff into the scanner for identification, is the genuinely new piece.

---

## Architecture

Full data-flow diagram: [`docs/architecture.md`](docs/architecture.md)

```text
                         Mode Picker
                              │
             ┌────────────────┼────────────────┐
             ▼                ▼                ▼
      Gesture Mode       Voice Mode       Scanner Mode
      (+ handoff into    (+ text          (+ manual
       scanner when      fallback)         correction)
       ID data needed)
             └────────────────┼────────────────┘
                              ▼
              ScreenReaderAnnouncer
                    + OneKeyNavProvider
                              ▼
                      CitizenContext
                              ▼
                  ConfirmDetailsScreen
                              ▼
                       matchEngine.js
                              ▼
                 ApplicationReviewScreen
                              ▼
          generateApplicationPDF → SubmittedScreen

     EmergencyHelpScreen — reachable from any screen,
     via gesture, voice, or a persistent button
Why no backend

Gesture detection, OCR, voice, and scheme matching all run entirely client-side.

That's not a limitation we're excusing — it means no citizen's ID photo, voice, or camera feed is ever transmitted anywhere.

For a disability/welfare application handling identity documents, that's a genuine design choice, not a corner cut.

Tech Stack
React + Vite — app shell and build tooling
Tailwind CSS — styling, kept consistent for WCAG AAA contrast
@mediapipe/tasks-vision — real-time hand landmark detection for gesture navigation
tesseract.js (with local eng + hin trained data) — on-device OCR
Web Speech API (SpeechRecognition + SpeechSynthesis) — voice input/output, no external API
jspdf + html2canvas — generates the filled, downloadable application document
dompurify — sanitizes extracted/spoken text before it's rendered
Vitest — unit tests for the core logic modules
ESLint — code quality
react-i18next + i18next — multi-lingual UI (9 languages), with i18next-browser-languagedetector for auto-detecting a citizen's browser language on first visit
Noto Sans (per-script subsets) — self-hosted fonts for Devanagari, Bengali, Telugu, Tamil, Gujarati, Kannada, and Gurmukhi, loaded only for the active language
Project Structure
divyang-setu/
├── docs/
│   └── architecture.md        # full data-flow diagram
├── public/
│   ├── tessdata/              # eng.traineddata, hin.traineddata
│   ├── fonts/                 # self-hosted Noto Sans script subsets
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── components/
│   │   ├── application/       # ApplicationReviewScreen, SubmittedScreen, PDF export
│   │   ├── common/             # CameraErrorPanel, OneKeyNavProvider,
│   │   │                        # ScreenReaderAnnouncer, LanguageSwitcher
│   │   ├── confirm/            # ConfirmDetailsScreen — unifies gesture/voice/scanner output
│   │   ├── emergency/          # EmergencyHelpScreen
│   │   ├── gesture/            # gesture detection, classification, navigation state machine
│   │   ├── mode-picker/
│   │   ├── scanner/            # OCR, document classification, manual correction fallback
│   │   ├── schemes/            # matching engine + results screen
│   │   └── voice/              # STT/TTS, intent parsing, text fallback
│   ├── context/                # CameraContext, CitizenContext, NavigationContext
│   ├── i18n/                   # i18n.js config, speechLangMap.js, fontMap.js
│   ├── locales/                # en/, hi/, bn/, mr/, te/, ta/, gu/, kn/, pa/
│   │                            # per-namespace JSON
│   ├── data/schemes.json
│   ├── hooks/useLocalCitizenData.js
│   └── utils/
├── tests/                      # unit tests for all core logic modules
├── eslint.config.js
├── index.html
├── package.json
├── vite.config.js
├── eng.traineddata
├── hin.traineddata
├── .gitignore
├── README.md
└── package-lock.json
Getting Started
Prerequisites
Node.js 18+
A browser with camera/microphone support (Chrome recommended — best MediaPipe/WASM/Web Speech API support)
IMPORTANT: A good quality camera is required to scan documents. The Document Scanner's OCR accuracy depends directly on camera resolution, focus, and lighting. A low-quality or low-light webcam will produce blurry or misread ID scans. For best results, use a device with a clear, well-focused, well-lit camera when scanning Aadhaar/UDID cards.
Setup
git clone https://github.com/<your-username>/divyang-setu.git
cd divyang-setu
npm install

Trained data: eng.traineddata and hin.traineddata live in public/tessdata/ and are committed to the repo, so OCR works locally during a live demo without depending on a CDN at runtime.

Run locally
npm run dev

Opens at http://localhost:5173 (default Vite port).

Grant camera and microphone permissions when prompted — gesture and voice modes need them.

Run tests
npm run test
Lint
npm run lint
Production build
npm run build
npm run preview

Note: script names above match a standard Vite + Vitest scaffold. If your package.json uses different script names, use those instead.

Deployment

Deployed with Vercel, connected directly to this GitHub repo — every push to the master branch auto-deploys.

Live demo: [add your deployed URL here]

Before relying on the deployed link during judging, test it in an incognito window on a separate device to confirm camera/mic permission prompts and MediaPipe/WASM loading behave correctly on a completely fresh environment.

Known Limitations

Being upfront about these rather than hiding them:

Gesture set is a defined core set (home, confirm, back, explore schemes, emergency) — accuracy depends on lighting and camera quality; low-light/no-camera fallback is manual button navigation.
OCR confidence on angled or poorly lit ID photos varies — below a confidence threshold, the flow requires manual field confirmation rather than silently guessing. This is intentional, not a shortcut.
"Submission" generates a completed, downloadable application PDF rather than transmitting to a live government API — there is no public API for these schemes to submit to in a hackathon timeframe. ApplicationReviewScreen states this plainly to the user.
Emergency contacts are a curated static list, not location-based routing — a real deployment would route by district.
Scheme database covers a representative subset of schemes, not the full national list, to keep matching logic testable within the build window.
Multi-lingual UI covers English + 8 major Indian languages. Voice input (STT) accuracy varies by language and browser — Hindi and English currently have the most reliable browser support; other languages fall back to text input automatically if recognition is unavailable or low-confidence.
Camera quality dependency: document scanning relies on the device's camera to read ID cards accurately. A good quality camera is required to scan documents reliably — low-resolution, low-light, or shaky/out-of-focus webcams reduce OCR readability and increase misreads. This is a hardware constraint, not a bug in the extraction logic.
Team — Debug Dynasty 404
Name	Role
Saiesh Upardekar	Project Developer (Leader)
Sayyam Argekar	Research + PPT
Reshab Dessai	Project Manager
License

MIT — see LICENSE