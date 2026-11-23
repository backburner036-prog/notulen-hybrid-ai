// Notulen — offline-first meeting minutes, Web/Chrome.
// Hybrid inference via Firebase AI Logic (JS SDK v12.5.0+):
//   getAI(app, { backend: new GoogleAIBackend() })
//   getGenerativeModel(ai, { mode: InferenceMode.PREFER_ON_DEVICE })
//   model.initializeDeviceModel(progress => …)   // on a user gesture, before generateContent
//   model.generateContent(prompt | [prompt, imagePart])
//   result.response.inferenceSource  // "ON_DEVICE" | "IN_CLOUD" (JS SDK v12.5.0+)
// Docs: https://firebase.google.com/docs/ai-logic/hybrid/web/get-started
// On-device = Chrome 139+ desktop, Prompt API (Gemini Nano), flag:
//   chrome://flags/#prompt-api-for-gemini-nano-multimodal-input
//
// No Firebase config? The app runs in DEMO MODE: Chrome's Prompt API
// (LanguageModel) directly, or a local extractive fallback when no model
// is present — so anyone can try it with zero setup. The Firebase AI Logic
// path is the primary path and runs as soon as a config is saved (Setup
// section in the page, or firebase-config.js). No API keys are ever embedded
// in this repo: the Gemini API key stays server-side behind the Firebase
// AI Logic proxy service, protected by App Check.

import { initializeApp } from "firebase/app";
import { getAI, getGenerativeModel, GoogleAIBackend, InferenceMode } from "firebase/ai";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";
import { firebaseConfig as bundledConfig } from "./firebase-config.js";

const $ = (id) => document.getElementById(id);
const els = {
  notes: $("notes"), imgInput: $("imgInput"), imgPreview: $("imgPreview"),
  mode: $("mode"), simulateOffline: $("simulateOffline"),
  btnGenerate: $("btnGenerate"), status: $("status"), hint: $("hint"),
  output: $("output"), rawOut: $("rawOut"), actionsRow: $("actionsRow"),
  btnDownload: $("btnDownload"), btnCopy: $("btnCopy"),
  btnSample: $("btnSample"), btnClear: $("btnClear"),
  history: $("history"), btnClearHistory: $("btnClearHistory"),
  pillDevice: $("pillDevice"), pillNet: $("pillNet"), pillBackend: $("pillBackend"), pillMode: $("pillMode"),
  cfgInput: $("cfgInput"), btnSaveCfg: $("btnSaveCfg"), btnClearCfg: $("btnClearCfg"),
};

const HISTORY_KEY = "notulen-history-v1";
const CONFIG_KEY = "notulen-firebase-config-v1";
const SAMPLE_NOTES = `Weekly sync — 23 Nov 2026
Ana: landing page launch by Friday, needs design sign-off from Budi first.
Budi: mockups ready Wednesday, will share the Figma link in the group.
Dedi: budget $500 approved for ads, invoice due 30 Nov.
Ana: onboarding email sequence — decided to cut it from 5 emails to 3.
Open question: do we run the promo in December or wait until January?
TODO Rina: confirm the webinar date with the speaker by tomorrow.
Budi will draft the launch announcement once mockups are approved.`;

// ---------------------------------------------------------------- config ---
function loadConfig() {
  try {
    const saved = localStorage.getItem(CONFIG_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* corrupted saved config -> fall through to bundled */ }
  return bundledConfig && bundledConfig.apiKey ? bundledConfig : null;
}

const config = loadConfig();
let firebaseApp = null;
let ai = null;
let modelCache = {};

function firebaseReady() { return !!ai; }

function initFirebase() {
  if (!config) return false;
  try {
    firebaseApp = initializeApp(config);
    // App Check: the Firebase console's AI Logic guided workflow enforces
    // App Check automatically. For local development, register a debug
    // token in the console (see README) and set self.FIREBASE_APPCHECK_DEBUG_TOKEN.
    // A reCAPTCHA Enterprise site key can be added to the config as
    // appCheckSiteKey; without it we skip client App Check init and the
    // server-side enforcement (if any) reports a clear error at call time.
    if (config.appCheckSiteKey) {
      if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
        self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
      }
      initializeAppCheck(firebaseApp, {
        provider: new ReCaptchaEnterpriseProvider(config.appCheckSiteKey),
        isTokenAutoRefreshEnabled: true,
      });
    }
    ai = getAI(firebaseApp, { backend: new GoogleAIBackend() });
    return true;
  } catch (err) {
    console.warn("Firebase init failed, falling back to demo mode:", err);
    return false;
  }
}

// ------------------------------------------------------------- status pills ---
async function refreshPills() {
  // Network
  const setNet = () => {
    els.pillNet.className = "pill " + (navigator.onLine ? "ok" : "warn");
    els.pillNet.innerHTML = `Network: <b>${navigator.onLine ? "online" : "offline"}</b>`;
  };
  setNet();
  window.addEventListener("online", setNet);
  window.addEventListener("offline", setNet);

  // On-device model (Chrome Prompt API)
  let device = "unavailable";
  try {
    if ("LanguageModel" in window && window.LanguageModel?.availability) {
      device = String(await window.LanguageModel.availability());
    }
  } catch { device = "unknown"; }
  const cls = device === "available" ? "ok" : device === "downloading" || device === "downloadable" ? "warn" : "bad";
  els.pillDevice.className = "pill " + cls;
  els.pillDevice.innerHTML = `On-device model: <b>${device}</b>`;

  // Backend
  if (firebaseReady()) {
    els.pillBackend.className = "pill ok";
    els.pillBackend.innerHTML = `Backend: <b>Firebase AI Logic (hybrid)</b>`;
  } else {
    els.pillBackend.className = "pill warn";
    els.pillBackend.innerHTML = `Backend: <b>Demo mode — no Firebase config</b>`;
  }
  els.pillMode.innerHTML = `Mode: <b>${els.mode.value}</b>`;
}

// ------------------------------------------------------------------ prompt ---
const MINUTES_SCHEMA_HINT = `Respond with JSON ONLY, no markdown fences, matching this shape:
{"summary": "2-4 sentence summary",
 "decisions": ["decision 1", "decision 2"],
 "actionItems": [{"task": "…", "owner": "name or null", "due": "date or null"}],
 "openQuestions": ["question 1"]}`;

function buildPrompt(notesText, hasImage) {
  return `You turn messy meeting notes into structured minutes.\n${MINUTES_SCHEMA_HINT}\n\n` +
    (hasImage
      ? "The attached photo shows whiteboard or handwritten meeting notes. Read it together with the text below.\n\n"
      : "") +
    `MEETING NOTES:\n${notesText || "(no text — use the photo only)"}`;
}

// ------------------------------------------------------- Firebase AI Logic ---
function getModel(modeName) {
  if (!modelCache[modeName]) {
    modelCache[modeName] = getGenerativeModel(ai, { mode: InferenceMode[modeName] });
  }
  return modelCache[modeName];
}

async function fileToGenerativePart(file) {
  const base64 = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(",")[1]);
    reader.readAsDataURL(file);
  });
  return { type: "inlineData", inlineData: { data: base64, mimeType: file.type } };
}

async function runFirebase(notesText, imageFile, modeName, onProgress) {
  const model = getModel(modeName);
  // Must be called on/after a user gesture and before generateContent.
  await model.initializeDeviceModel((val) => onProgress(`Downloading on-device model: ${Math.round(val * 10000) / 100}%`));
  const prompt = buildPrompt(notesText, !!imageFile);
  const parts = imageFile ? [prompt, await fileToGenerativePart(imageFile)] : prompt;
  const result = await model.generateContent(parts);
  const response = result.response;
  const rawSource = response.inferenceSource || response.inference_source || "unknown";
  const source = String(rawSource).toUpperCase().includes("DEVICE") ? "ON_DEVICE"
    : String(rawSource).toUpperCase().includes("CLOUD") ? "IN_CLOUD" : "unknown";
  return { text: response.text(), source, via: "firebase" };
}

// -------------------------------------------------------------- demo mode ---
async function runDemo(notesText, hasImage, onProgress) {
  onProgress("Demo mode: trying Chrome on-device Prompt API (LanguageModel)…");
  if ("LanguageModel" in window && window.LanguageModel?.create) {
    try {
      const availability = await window.LanguageModel.availability();
      if (availability === "available" || availability === "downloading" || availability === "downloadable") {
        const session = await window.LanguageModel.create();
        const text = await session.prompt(buildPrompt(notesText, false));
        session.destroy?.();
        return { text, source: "ON_DEVICE", via: "demo-prompt-api" };
      }
    } catch (err) {
      console.warn("Prompt API failed, using local fallback:", err);
    }
  }
  if (hasImage) {
    onProgress("Demo mode: photo input needs the Firebase AI Logic path (multimodal). Using text only + local fallback.");
  }
  return { text: JSON.stringify(localFallback(notesText), null, 2), source: "LOCAL", via: "demo-local-fallback" };
}

// Local extractive fallback — no model at all. Honest, offline, zero-cost.
// Only used when neither Firebase nor the on-device model is available.
function localFallback(notesText) {
  const lines = notesText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const sentences = notesText.replace(/\s+/g, " ").split(/(?<=[.!?])\s+/).filter((s) => s.length > 10);
  const decisions = lines.filter((l) => /decid|agreed|approved|cut it|will (use|go with)/i.test(l));
  const actionItems = lines
    .filter((l) => /TODO|action|will\b|needs to|should|by (tomorrow|monday|tuesday|wednesday|thursday|friday|\d)/i.test(l))
    .slice(0, 8)
    .map((l) => {
      const m = l.match(/^([A-Z][a-z]+)[:\-]\s*(.*)$/);
      const due = (l.match(/by\s+([A-Za-z0-9 ]+?)([.,]|$)/i) || [])[1] || null;
      return { task: m ? m[2] : l, owner: m ? m[1] : null, due: due?.trim() || null };
    });
  const openQuestions = lines.filter((l) => l.endsWith("?"));
  return {
    summary: sentences.slice(0, 3).join(" ") || "No summary could be extracted from the notes.",
    decisions: decisions.slice(0, 6),
    actionItems,
    openQuestions,
  };
}

// ------------------------------------------------------------ parse + render ---
function extractJson(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) throw new Error("Model did not return JSON.");
  return JSON.parse(text.slice(start, end + 1));
}

function normalizeMinutes(obj) {
  return {
    summary: typeof obj.summary === "string" ? obj.summary : "",
    decisions: Array.isArray(obj.decisions) ? obj.decisions.map(String) : [],
    actionItems: Array.isArray(obj.actionItems) ? obj.actionItems.map((a) => ({
      task: String(a?.task ?? a ?? ""), owner: a?.owner ?? null, due: a?.due ?? null,
    })) : [],
    openQuestions: Array.isArray(obj.openQuestions) ? obj.openQuestions.map(String) : [],
  };
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function renderMinutes(m, source, ms, via) {
  const badge = source === "ON_DEVICE"
    ? `<span class="badge device">ON-DEVICE · Gemini Nano</span>`
    : source === "IN_CLOUD"
      ? `<span class="badge cloud">IN-CLOUD · Gemini</span>`
      : `<span class="badge local">LOCAL FALLBACK · no model</span>`;
  const cost = source === "ON_DEVICE" ? "Cost: $0.00 — ran on this device, notes never left it."
    : source === "IN_CLOUD" ? "Cost: cloud free tier (Firebase AI Logic / Gemini Developer API)."
    : "Cost: $0.00 — extractive fallback, no model call.";
  const rows = m.actionItems.map((a) =>
    `<tr><td>${esc(a.task)}</td><td>${esc(a.owner ?? "—")}</td><td>${esc(a.due ?? "—")}</td></tr>`).join("");
  els.output.innerHTML = `
    <p>${badge}<span class="meta">${ms} ms · via ${esc(via)} · ${esc(cost)}</span></p>
    <h3>Summary</h3><p>${esc(m.summary) || "<span class='meta'>(empty)</span>"}</p>
    <h3>Decisions</h3>
    ${m.decisions.length ? `<ul>${m.decisions.map((d) => `<li>${esc(d)}</li>`).join("")}</ul>` : `<p class="meta">None recorded.</p>`}
    <h3>Action items</h3>
    ${m.actionItems.length ? `<table><tr><th>Task</th><th>Owner</th><th>Due</th></tr>${rows}</table>` : `<p class="meta">None recorded.</p>`}
    <h3>Open questions</h3>
    ${m.openQuestions.length ? `<ul>${m.openQuestions.map((q) => `<li>${esc(q)}</li>`).join("")}</ul>` : `<p class="meta">None recorded.</p>`}`;
}

function minutesToMarkdown(m, source, ms) {
  const lines = [`# Meeting minutes — Notulen`, ``, `Generated via ${source} in ${ms} ms.`, ``,
    `## Summary`, ``, m.summary || "_(empty)_", ``, `## Decisions`, ``];
  lines.push(...(m.decisions.length ? m.decisions.map((d) => `- ${d}`) : ["_(none)_"]), ``, `## Action items`, ``);
  lines.push(...(m.actionItems.length
    ? m.actionItems.map((a) => `- [ ] ${a.task}${a.owner ? ` — ${a.owner}` : ""}${a.due ? ` (due ${a.due})` : ""}`)
    : ["_(none)_"]), ``, `## Open questions`, ``);
  lines.push(...(m.openQuestions.length ? m.openQuestions.map((q) => `- ${q}`) : ["_(none)_"]), ``);
  return lines.join("\n");
}

// ------------------------------------------------------------------ history ---
function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; } catch { return []; }
}
function saveHistory(item) {
  const h = loadHistory();
  h.unshift(item);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, 20)));
}
function renderHistory() {
  const h = loadHistory();
  if (!h.length) { els.history.innerHTML = `<p class="meta">No saved minutes yet.</p>`; return; }
  els.history.innerHTML = h.map((item) => `
    <div class="history-item" data-id="${item.id}">
      <span>${esc(item.title)}</span>
      <small>${esc(item.source)} · ${new Date(item.ts).toLocaleString()}</small>
    </div>`).join("");
  els.history.querySelectorAll(".history-item").forEach((el) => {
    el.addEventListener("click", () => {
      const item = loadHistory().find((x) => x.id === el.dataset.id);
      if (!item) return;
      renderMinutes(item.minutes, item.source, item.ms, item.via);
      els.rawOut.textContent = JSON.stringify(item.minutes, null, 2);
      els.actionsRow.classList.remove("hidden");
      window._currentMinutes = item.minutes;
      window._currentSource = item.source;
      window._currentMs = item.ms;
    });
  });
}

// ------------------------------------------------------------------ generate ---
async function onGenerate() {
  const notesText = els.notes.value.trim();
  const imageFile = els.imgInput.files?.[0] || null;
  if (!notesText && !imageFile) { els.status.textContent = "Paste some notes or attach a photo first."; return; }
  if (imageFile && !["image/jpeg", "image/png"].includes(imageFile.type)) {
    els.status.textContent = "On-device inference supports JPEG/PNG images only.";
    return;
  }
  let modeName = els.mode.value;
  if (els.simulateOffline) modeName = "ONLY_ON_DEVICE";
  els.pillMode.innerHTML = `Mode: <b>${modeName}</b>${els.simulateOffline ? " (simulated offline)" : ""}`;
  els.btnGenerate.disabled = true;
  els.status.textContent = "Starting…";
  const t0 = performance.now();
  try {
    let result;
    const onProgress = (msg) => { els.status.textContent = msg; };
    if (firebaseReady()) {
      onProgress("Firebase AI Logic: initializing on-device model…");
      result = await runFirebase(notesText, imageFile, modeName, onProgress);
    } else {
      result = await runDemo(notesText, !!imageFile, onProgress);
    }
    const ms = Math.round(performance.now() - t0);
    els.rawOut.textContent = result.text;
    let minutes;
    try {
      minutes = normalizeMinutes(extractJson(result.text));
    } catch {
      // Model returned prose instead of JSON — show it as the summary.
      minutes = { summary: result.text.slice(0, 2000), decisions: [], actionItems: [], openQuestions: [] };
    }
    renderMinutes(minutes, result.source, ms, result.via);
    els.actionsRow.classList.remove("hidden");
    window._currentMinutes = minutes;
    window._currentSource = result.source;
    window._currentMs = ms;
    const title = (minutes.summary || "Untitled minutes").split(/(?<=[.!?])\s+/)[0].slice(0, 80);
    saveHistory({ id: String(Date.now()), ts: Date.now(), title, minutes, source: result.source, ms, via: result.via });
    renderHistory();
    els.status.textContent = result.source === "ON_DEVICE"
      ? `Done in ${ms} ms — answered ON-DEVICE by Gemini Nano. Nothing left this device.`
      : result.source === "IN_CLOUD"
        ? `Done in ${ms} ms — device model unavailable, Firebase AI Logic fell back to IN-CLOUD Gemini.`
        : `Done in ${ms} ms — local fallback (no AI model available on this device).`;
  } catch (err) {
    els.status.textContent = `Failed: ${err.message || err}\nTip: ONLY_ON_DEVICE throws when Gemini Nano is not ready. Try PREFER_ON_DEVICE, or enable chrome://flags/#prompt-api-for-gemini-nano-multimodal-input and reload.`;
  } finally {
    els.btnGenerate.disabled = false;
  }
}

// --------------------------------------------------------------------- wire ---
els.btnGenerate.addEventListener("click", onGenerate);
els.mode.addEventListener("change", () => { els.pillMode.innerHTML = `Mode: <b>${els.mode.value}</b>`; });
els.btnSample.addEventListener("click", () => { els.notes.value = SAMPLE_NOTES; });
els.btnClear.addEventListener("click", () => {
  els.notes.value = ""; els.imgInput.value = ""; els.imgPreview.style.display = "none"; els.imgPreview.src = "";
  els.output.innerHTML = `<p class="meta">Nothing yet — generate minutes from your notes above.</p>`;
  els.rawOut.textContent = "(empty)"; els.actionsRow.classList.add("hidden"); els.status.textContent = "";
});
els.imgInput.addEventListener("change", () => {
  const f = els.imgInput.files?.[0];
  if (!f) { els.imgPreview.style.display = "none"; return; }
  els.imgPreview.src = URL.createObjectURL(f);
  els.imgPreview.style.display = "block";
});
els.btnDownload.addEventListener("click", () => {
  if (!window._currentMinutes) return;
  const md = minutesToMarkdown(window._currentMinutes, window._currentSource, window._currentMs);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([md], { type: "text/markdown" }));
  a.download = `notulen-minutes-${new Date().toISOString().slice(0, 10)}.md`;
  a.click();
  URL.revokeObjectURL(a.href);
});
els.btnCopy.addEventListener("click", async () => {
  if (!window._currentMinutes) return;
  await navigator.clipboard.writeText(JSON.stringify(window._currentMinutes, null, 2));
  els.status.textContent = "JSON copied to clipboard.";
});
els.btnClearHistory.addEventListener("click", () => {
  localStorage.removeItem(HISTORY_KEY); renderHistory();
});
els.btnSaveCfg.addEventListener("click", () => {
  try {
    const cfg = JSON.parse(els.cfgInput.value);
    if (!cfg.apiKey || !cfg.projectId) throw new Error("Config needs at least apiKey and projectId.");
    localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
    location.reload();
  } catch (err) { els.status.textContent = `Invalid config JSON: ${err.message}`; }
});
els.btnClearCfg.addEventListener("click", () => {
  localStorage.removeItem(CONFIG_KEY); location.reload();
});

// --------------------------------------------------------------------- boot ---
initFirebase();
refreshPills();
renderHistory();
if (config) {
  try { els.cfgInput.value = JSON.stringify(config, null, 2); } catch { /* ignore */ }
}
