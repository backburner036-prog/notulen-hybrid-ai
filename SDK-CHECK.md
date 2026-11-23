# SDK verification — firebase@13.4.0 (checked 23 Nov 2026, Node 24, npm)
# Method: `npm install firebase@13.4.0` in /tmp, then runtime import introspection
# of `firebase/ai` + reading `node_modules/@firebase/ai/dist/ai-public.d.ts`.

- `node --check app.js` + `node --check firebase-config.js` → SYNTAX-OK
- Exports present: `getAI`, `getGenerativeModel`, `GoogleAIBackend`,
  `InferenceMode`, `InferenceSource`, `GenerativeModel` (all functions/objects)
- `InferenceMode` = PREFER_ON_DEVICE / ONLY_ON_DEVICE / ONLY_IN_CLOUD /
  PREFER_IN_CLOUD (runtime values are lowercase: "prefer_on_device", …)
- `InferenceSource` = ON_DEVICE / IN_CLOUD (runtime values: "on_device" /
  "in_cloud") — app.js normalizes case-insensitively, so both match.
- `HybridParams`: only `mode` is required; `onDeviceParams` / `inCloudParams`
  optional → `getGenerativeModel(ai, { mode: InferenceMode[...] })` is valid.
- `initializeDeviceModel(onDownloadProgress?: (n: number) => void): Promise<void>`
- `generateContent(request: string | Array<string | Part>)` — text-only and
  [prompt, imagePart] calls both match.
- `response.inferenceSource?: InferenceSource` present in typings.
- HTTP smoke test: `python3 -m http.server` → index.html 200, app.js 200.
- Repo: https://github.com/backburner036-prog/notulen-hybrid-ai (public, MIT).

NOT verified in this VM (no browser): live end-to-end run in Chrome 139+
with Gemini Nano, cloud fallback with a real Firebase project, demo video.
See README "Test the hybrid routing" + DEMO-SCRIPT.md.
