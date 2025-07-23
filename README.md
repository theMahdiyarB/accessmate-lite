# AccessMate Lite – AI Summary-&-Speak Chrome Extension

> **Turn any highlighted text into a short, same-language audio summary with one click.**  
> Powered entirely by Google Gemini 2.5 (Flash & Flash-Preview-TTS).  
> No backend, no build tools — just a tiny Manifest V3 extension.

---

## ✨ Features

| Capability              | Details                                                                                      |
|-------------------------|----------------------------------------------------------------------------------------------|
| **Multilingual summariser** | Uses **gemini-2.5-flash** to condense the selection (≤ 80 words) while preserving the original language. |
| **Voice output**        | Streams the summary back as a ready-to-play 16-bit WAV from **gemini-2.5-flash-preview-TTS** (default voice **Kore**). |
| **Privacy-first**       | All requests go directly from the browser to Google; no third-party servers or storage.     |
| **One-file build**      | 4 source files – `manifest.json`, `popup.html`, `popup.js`, plus an optional icon.          |
| **Free-tier-friendly**  | Works with Google AI Studio API keys that include *Generative Language* + *Audio* scopes.   |

---

## 🖇️ Project Structure

```
accessmate-lite/
├── manifest.json        # Chrome Manifest V3
├── popup.html           # Minimal UI
├── popup.js             # All extension logic
└── icon128.png          # (Optional) toolbar icon
```

---

## 🔧 Installation

1. **Get an API key**  
   - Log in to **[Google AI Studio](https://aistudio.google.com)** → **API keys** → *Create key*  
   - Enable *Generative Language* **and** *Audio* scopes.

2. **Clone / download** the repo and open `popup.js`.  
   Replace:

```js
const GEMINI_KEY = "YOUR_REAL_KEY_HERE";
```

3. **Load the extension**

   - Visit `chrome://extensions`
   - Enable **Developer mode**
   - Click **Load unpacked** → select the `accessmate-lite` folder.

---

## 🚀 Usage

1. Navigate to any web page.  
2. **Highlight** the paragraph(s) you want summarised.  
3. Click the **AccessMate Lite** toolbar icon → **Summarise & Speak**.  
4. A concise summary appears in the popup and is spoken aloud.

<details>
<summary>Keyboard shortcut (optional)</summary>

You can bind a custom shortcut:

1. Go to `chrome://extensions/shortcuts`  
2. Find **AccessMate Lite** → *Activate the extension* → set e.g. `Ctrl+Shift+L`  
3. Highlight text and press the shortcut instead of clicking the icon.

</details>

---

## ⚙️ Configuration

| Setting              | Where                             | Default                        | Notes                                                   |
|----------------------|-----------------------------------|--------------------------------|---------------------------------------------------------|
| **`GEMINI_KEY`**     | `popup.js`                        | —                              | Required. Keep secret — treat like any API token.       |
| **`SUMMARY_MODEL`**  | `popup.js`                        | `gemini-2.5-flash`             | Any Gemini text model ID works.                         |
| **`TTS_MODEL`**      | `popup.js`                        | `gemini-2.5-flash-preview-tts` | Must be a Gemini TTS model.                             |
| **`VOICE_NAME`**     | `popup.js`                        | `Kore`                         | Other demo voices: `Puck`, `Wren`, … (see Google docs). |
| **Max input length** | `popup.js` (`raw.slice(0, 2048)`) | 2,048 chars                    | Trim or raise to suit quota & latency.                  |

---

## 🛠️ Development Notes

- **No bundler** — plain ES modules + Manifest V3.  
- Playback uses a `data:audio/wav;base64,…` URL; browsers stream it instantly (< 200 ms typical).  
- To debug, open the popup → **⋮ > Inspect** and check the **Network** panel for calls to `…/generateContent`.  
- Free tier: ~60 requests/min and generous daily quota (subject to change).

---

## 📜 Roadmap

- [ ] **Inline balloon UI** (summary appears near selection, no popup).  
- [ ] **Streaming audio** once Google makes streaming TTS GA.  
- [ ] **Voice chooser** in popup (dropdown populated from available voices).  
- [ ] **Safari / Edge** versions (same code, different manifests).  

---

## 🩺 Troubleshooting

| Symptom                                | Likely Cause                                | Fix                                                                       |
|----------------------------------------|---------------------------------------------|----------------------------------------------------------------------------|
| *“Error – see console”* + status **403** | API key lacks *Audio* scope                 | Regenerate key in AI Studio with both scopes checked.                     |
| Status **429**                         | Free-tier quota exhausted                   | Wait 60 s or upgrade billing project.                                     |
| No sound but summary appears           | Browser tab muted OR audio device busy      | Unmute site / close other audio apps.                                     |
| “Highlight some text first” alert      | Selection string empty (frames, PDFs, etc.) | Copy/paste text into a plain page (extension can’t access embedded PDFs). |

---

## 📝 License

[MIT](LICENSE)

---

### ⭐ Give it a try, fork it, and build the web you can listen to!