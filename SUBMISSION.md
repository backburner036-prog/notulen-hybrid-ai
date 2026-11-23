# Devpost submission text — Notulen (Web/Chrome)
# #BuildHybridAI 2026 — https://firebasehybridaihackathon.devpost.com/
# Copy the sections below into the Devpost "Enter a Submission" form.
# Status: DRAFT — repo + video links to be filled in after push + recording.

## Title
Notulen — meeting minutes, on-device first

## Tagline (short)
Messy notes or a whiteboard photo in, structured minutes out — Gemini Nano on-device first, cloud Gemini fallback, one Firebase AI Logic SDK.

## Platform
Web (Chrome) — Best Web/Chrome App category. (Android/iOS via the same
Firebase AI Logic hybrid SDK are future work; the web app is the v1.)

## Description (paste into Devpost)

### Inspiration
The people who need meeting minutes most — teachers, field teams, community
organizers, anyone on flaky Wi-Fi — are exactly the people cloud-only AI
fails. A notes app that only works with a good connection and a paid API key
is useless in a village school or a basement meeting room. On-device models
fix that, but they aren't on every device. So: use both.

### What it does
Notulen turns raw meeting notes — pasted text, or a photo of a whiteboard /
handwritten notes — into structured minutes in seconds: a summary, decisions,
action items with owner and due date, and open questions. Results can be
downloaded as Markdown and are saved in on-device history.

### How we built it (Firebase AI Logic)
One Firebase AI Logic hybrid model instance does all the routing:

- `getAI(app, { backend: new GoogleAIBackend() })` with the Gemini Developer
  API backend (free tier, no billing).
- `getGenerativeModel(ai, { mode: InferenceMode.PREFER_ON_DEVICE })` — the
  user can switch between all four modes (PREFER_ON_DEVICE, PREFER_IN_CLOUD,
  ONLY_ON_DEVICE, ONLY_IN_CLOUD), and a "Simulate offline" checkbox forces
  the on-device path so the offline story is demonstrable.
- `model.initializeDeviceModel()` runs on the Generate click (user gesture,
  as Chrome requires), with live download progress.
- Text + image (JPEG/PNG) input goes through `generateContent([prompt,
  imagePart])`; the prompt requires a strict JSON shape
  `{summary, decisions[], actionItems[{task, owner, due}], openQuestions[]}`,
  which the app parses, validates, and renders.
- Every answer carries an honest badge read from
  `response.inferenceSource`: "ON-DEVICE · Gemini Nano" or "IN-CLOUD ·
  Gemini", plus latency and cost ($0.00 on-device).
- App Check is enforced via the console's AI Logic guided workflow; debug
  tokens are used for local development, as the Rules allow. The Gemini API
  key stays server-side behind the Firebase AI Logic proxy and is never in
  the repo.
- Without a Firebase config the app still runs in demo mode (Chrome Prompt
  API directly, or a clearly-labeled local extractive fallback), so judges
  can try it with zero setup; the Firebase path activates as soon as a
  config is pasted in the Setup section.

### Challenges we ran into
- The on-device model only supports single-turn text generation — no chat,
  no tools — so the whole feature had to be designed as one structured
  single-turn call, with the cloud as fallback for anything heavier.
- `initializeDeviceModel()` must run on a user gesture, which shaped the UX
  around an explicit Generate click with download progress.
- Making the routing visible and honest (never pretending a cloud answer
  was local) — the inferenceSource badge is a first-class UI element, not
  a debug log.

### What we learned
Hybrid inference isn't a fallback hack — it's the product. The interesting
design decision is per-request routing with a visible, honest label, and
treating "offline" as a normal mode instead of an error state.

### What's next
Firestore cloud sync + Auth (minutes follow the user), Remote Config for
model/prompt tuning without a release, and the same hybrid SDK on Android
(Gemini Nano via ML Kit Prompt API) and iOS (Apple Foundation Models).

## Built with
Firebase AI Logic (Hybrid Inference SDK), Gemini Nano (on-device, Chrome
Prompt API), Gemini (cloud, Gemini Developer API), Firebase App Check,
JavaScript (zero-build, ES modules), HTML/CSS.

## Links (fill in)
- Code repository: https://github.com/backburner036-prog/notulen-hybrid-ai
- Demo video (YouTube, <= 3 min, English): TBD — record per DEMO-SCRIPT.md
- Live demo / hosted app: TBD — Firebase Hosting after project setup

## Try it (testing instructions for judges)
1. `python3 -m http.server 8000` in the repo, open http://localhost:8000 in
   Chrome 139+ desktop.
2. Enable chrome://flags/#prompt-api-for-gemini-nano-multimodal-input,
   restart Chrome, then in DevTools run `await LanguageModel.availability()`
   (run `await LanguageModel.create()` once if it says `downloadable`).
3. Click "Load sample notes" → "Generate minutes". Expect the ON-DEVICE
   badge. Check "Simulate offline" and generate again — still on-device.
4. For the cloud path: add a Firebase config in the Setup section (2-minute
   free setup, see README), reload, pick PREFER_ON_DEVICE in a browser
   without Nano — expect the IN-CLOUD badge. No config needed to try the
   demo mode.
