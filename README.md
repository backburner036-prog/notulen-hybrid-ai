# Notulen — meeting minutes, on-device first

> Built for **#BuildHybridAI 2026** — $30,000 hackathon by Google/Firebase on Devpost.
> Paste messy meeting notes (or a whiteboard photo) and get structured minutes:
> summary, decisions, action items with owner + due date, open questions.

**The hybrid idea:** the people who need minutes most — teachers, field teams,
community organizers, anyone on flaky Wi-Fi — are exactly the people cloud-only
AI fails. Notulen runs the summary **on-device with Gemini Nano** when the model
is available (seconds, free, private, works offline) and **falls back to cloud
Gemini** when it isn't — through one Firebase AI Logic SDK, one call, with a
badge on every answer that honestly says where it ran.

## How hybrid inference is used

Single model instance, `InferenceMode` does the routing (Firebase AI Logic
JS SDK v12.5.0+, docs: https://firebase.google.com/docs/ai-logic/hybrid/web/get-started):

```js
import { getAI, getGenerativeModel, GoogleAIBackend, InferenceMode } from "firebase/ai";

const ai = getAI(firebaseApp, { backend: new GoogleAIBackend() });
const model = getGenerativeModel(ai, { mode: InferenceMode.PREFER_ON_DEVICE });

// on a user gesture, before generateContent:
await model.initializeDeviceModel((progress) => showDownload(progress));

const result = await model.generateContent([prompt, imagePart]);
result.response.inferenceSource; // "ON_DEVICE" | "IN_CLOUD"
```

- **Modes (user-selectable in the UI):** `PREFER_ON_DEVICE` (default),
  `PREFER_IN_CLOUD`, `ONLY_ON_DEVICE`, `ONLY_IN_CLOUD`. A "Simulate offline"
  checkbox forces `ONLY_ON_DEVICE` so judges can watch the offline path.
- **On-device:** Chrome 139+ desktop, Prompt API (Gemini Nano). Single-turn
  text generation, text or text+image (JPEG/PNG), structured JSON output.
- **Cloud fallback:** Gemini Developer API backend (free tier), default cloud
  model `gemini-3.5-flash-lite` (JS SDK v13.0.0+). The Gemini API key stays
  server-side behind the Firebase AI Logic proxy — it is never embedded in
  this repo. App Check is enforced by the console's AI Logic guided workflow;
  debug tokens are accepted for local development (see Setup).
- **Honest badge:** every result shows `ON-DEVICE · Gemini Nano` or
  `IN-CLOUD · Gemini` read from `response.inferenceSource`, plus latency and
  cost ($0.00 on-device).
- **Structured output:** the prompt requires JSON matching
  `{summary, decisions[], actionItems[{task, owner, due}], openQuestions[]}`;
  the app parses, validates, and renders it as minutes (with a Markdown export).

### Demo mode (no Firebase project needed)

Without a config the app still runs end-to-end so anyone can try it:

1. Chrome's on-device Prompt API (`LanguageModel`) directly, or
2. a local extractive fallback when no model is present (clearly labeled
   `LOCAL FALLBACK · no model`).

Photo input in demo mode is text-only — multimodal input runs through the
Firebase AI Logic path. The Firebase path is the primary path and activates
as soon as a config is saved.

## Run it

```bash
# any static server; the app is zero-build, no bundler
python3 -m http.server 8000
# open http://localhost:8000 in Chrome 139+ (desktop)
```

On-device checklist (Chrome):

1. `chrome://settings/help` — update to Chrome 139+.
2. Enable `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input`, restart.
3. DevTools console: `await LanguageModel.availability()` → `available`
   (if `downloadable`, run `await LanguageModel.create()` once to download).

## Setup — Firebase AI Logic (free Spark plan, ~2 minutes)

1. https://console.firebase.google.com/ → create a project (Spark = free).
2. AI Services → AI Logic → Get started → choose **Gemini Developer API**
   (free tier, no billing). The workflow sets up the APIs and enforces App Check.
3. Register the web app, copy its `firebaseConfig`.
4. Paste it in the app's **Setup** section (stored only in your browser's
   localStorage) or edit `firebase-config.js`.
5. Local dev + App Check: run on localhost, copy the debug token from the
   browser console, register it at console → Security → App Check → Apps →
   Manage debug tokens. (Rules: "debug tokens are accepted in submissions".)
6. Optional: add `appCheckSiteKey` (reCAPTCHA Enterprise) to the config.

Optional Firebase Hosting deploy once a project exists:

```bash
npm install -g firebase-tools   # or npx firebase-tools
firebase login
firebase use --add              # pick your project
firebase deploy --only hosting
```

## Test the hybrid routing (for judges)

| Scenario | Expected badge |
|---|---|
| Chrome 139+, Nano downloaded, `PREFER_ON_DEVICE` | `ON-DEVICE · Gemini Nano` |
| Same, but go offline / check "Simulate offline" | `ON-DEVICE · Gemini Nano` |
| Nano unavailable (other browser, model not downloaded), `PREFER_ON_DEVICE` + Firebase config | `IN-CLOUD · Gemini` |
| `ONLY_ON_DEVICE` without Nano | Clear error, no silent cloud call |
| No config at all | Demo mode — Prompt API or labeled local fallback |

## Project structure

```
index.html          UI + import map (firebase 13.4.0 via gstatic CDN)
app.js              all logic: Firebase hybrid path, demo mode, render, history
firebase-config.js  placeholder config (null) + setup instructions
firebase.json       Firebase Hosting config
package.json        firebase dep (local dev / type-checking only)
SUBMISSION.md       Devpost submission text (title, description, links)
DEMO-SCRIPT.md      3-minute demo video script + shot list
VERDICT-R9.md       eligibility / KYC / tax review of the Official Rules
```

History is stored in `localStorage` on the device. No analytics, no tracking,
no data leaves the device on the on-device path.

## Known limitations (honest)

- On-device inference is single-turn text generation only (no multi-turn chat,
  no tools/function calling, no audio/video/PDF input) — per Firebase docs.
  Those fall back to the cloud model automatically under `PREFER_*` modes.
- On-device needs Chrome 139+ desktop + the Prompt API flag + a one-time
  model download (storage space required).
- Firestore/Auth/Remote Config are not wired in v1 — history is local-only.
  They are the natural next step (cloud sync + per-user minutes).

## License

MIT — see [LICENSE](LICENSE).
