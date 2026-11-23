# Demo video script — Notulen (max 3:00, English)
# Record in Chrome 139+ desktop, 1080p, screen capture + voiceover.
# Show the app functioning on the platform it was built for (Web/Chrome).

## 0:00–0:20 — Hook (screen: landing view of the app)
"Meeting notes are a mess — and the people who need minutes most are the
ones with the worst Wi-Fi. Notulen fixes that: it summarizes on your device
first, and only uses the cloud when the device can't."

## 0:20–0:50 — On-device path (screen: sample notes → Generate)
- Click "Load sample notes". Point at the pills: "On-device model: available".
- Click "Generate minutes". Watch it answer in seconds.
- Point at the badge: "ON-DEVICE · Gemini Nano — the notes never left this
  laptop, and it cost zero dollars."

## 0:50–1:20 — Offline proof (screen: Simulate offline)
- Check "Simulate offline", generate again. Same on-device badge.
- "No connection, no problem. This is the whole point of hybrid."

## 1:20–1:50 — Photo input (screen: upload whiteboard photo)
- Upload a whiteboard photo (JPEG). Generate. Same structured minutes:
  summary, decisions, action items with owner and due date, open questions.
- Show Download .md working.

## 1:50–2:20 — Cloud fallback (screen: mode select / second browser)
- Switch mode to PREFER_IN_CLOUD, or show a browser without Nano:
  badge flips to "IN-CLOUD · Gemini". "One SDK, one call — Firebase AI
  Logic routes it. The badge always tells you honestly where it ran."
- Briefly show the code: getGenerativeModel with InferenceMode, the
  initializeDeviceModel call, response.inferenceSource.

## 2:20–2:45 — How it works (screen: README diagram / code)
- One sentence each: Firebase AI Logic hybrid SDK, Gemini Nano on-device,
  Gemini Developer API cloud fallback, App Check enforced, API key never
  in the repo.

## 2:45–3:00 — Close (screen: history + export)
- "Notulen: minutes that work where meetings actually happen — even
  offline." Show repo link on screen. End.

## Shot checklist
- [ ] On-device badge visible in at least 2 shots
- [ ] Offline checkbox shot
- [ ] Photo upload shot
- [ ] Cloud badge shot (or mode switch)
- [ ] Code snippet shot (app.js, getGenerativeModel + inferenceSource)
- [ ] Download .md shot
- [ ] No copyrighted music; voiceover in English
- [ ] Upload to YouTube as Public, paste link into Devpost + SUBMISSION.md
