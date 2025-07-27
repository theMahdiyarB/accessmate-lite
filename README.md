# AccessMate Lite – AI Summary-&-Speak Chrome Extension

> **Turn any highlighted text into a short, same-language audio summary with one click.**  
> Powered entirely by Google Gemini models (Flash & Flash-Preview-TTS).  
> No backend, no build tools — just a tiny Manifest V3 extension.

---
### Video Demo:
[![Watch the video](http://img.youtube.com/vi/OgvYC-DtTTk/0.jpg)](https://youtu.be/OgvYC-DtTTk)
---

## 📖 Project Overview

**AccessMate Lite** is a privacy-focused, open-source Chrome extension that helps users quickly understand and listen to web content in their preferred language. At its core, the extension uses state-of-the-art AI from Google Gemini to summarize selected text or entire pages and read the result aloud using high-quality voices. Designed for accessibility and everyday productivity, AccessMate Lite empowers people who prefer listening over reading, who want to digest web content quickly, or who benefit from assistive technologies.

The project is built to be as transparent, lightweight, and user-controlled as possible. All logic runs on the user's device, with no hidden data collection or server dependencies. The only third-party service is the Google Gemini API, which is accessed directly from the browser and requires the user’s own API key. This not only respects user privacy, but also lets users fully control their own usage and quotas.

---

## ✨ Features

| Capability                   | Details                                                                                                   |
|------------------------------|-----------------------------------------------------------------------------------------------------------|
| **Multilingual summariser**  | Uses **Gemini Flash** to condense the selection (≤ 80 words) while preserving the original language.      |
| **Voice output**             | Reads the summary aloud using any Gemini TTS voice—selectable, live-fetched from the API, with WAV output.|
| **Full page/selection modes**| Summarize and/or read either highlighted text or the whole page, all in one click.                        |
| **Material/Chrome-style UI** | Clean, modern interface with automatic dark/light mode—no frameworks, pure HTML+CSS.                      |
| **Privacy-first**            | All requests go directly from the browser to Google; no third-party servers or storage.                   |
| **One-file build**           | Only 4 source files – `manifest.json`, `popup.html`, `popup.js`, and `settings.html` (+ optional icon).   |
| **Free-tier-friendly**       | Works with Google AI Studio API keys (with Generative Language + Audio scopes).                           |

---

## 🖇️ Project Structure

```
accessmate-lite/
├── manifest.json # Chrome Manifest V3
├── popup.html # User popup (Material style, modern CSS)
├── popup.js # All popup logic
├── settings.html # Settings UI (Material-like, with real-time voice/model fetch)
├── settings.js # Settings logic (API key, models, voices)
└── icon128.png # (Optional) toolbar icon
```

---

## 📂 File-by-File Explanation

- **`manifest.json`**: This is the main configuration file for the Chrome extension. It declares the extension’s name, version, permissions, entry points (popups and settings), and its compatibility with Manifest V3. Keeping the manifest minimal and well-structured is essential for Chrome Store approval and user trust.

- **`popup.html`**: The user interface shown when clicking the extension icon. It presents four main action buttons—summarizing or reading either the selection or the whole page—along with a styled output area for results or errors, and a settings gear button. All HTML is designed to be Material/Chrome-like using only CSS.

- **`popup.js`**: Contains all the logic for user interactions in the popup. It detects selected text, communicates with the Gemini API for summaries and TTS, manages the output display, and handles error reporting. It fetches and uses the user’s saved preferences (like API key and preferred voice/model) to ensure personalized operation.

- **`settings.html`**: A dedicated settings page for entering the Google Gemini API key, choosing the preferred text and TTS models, and picking a voice. The HTML here mirrors Google’s clean design philosophy and helps make configuration easy, even for non-technical users.

- **`settings.js`**: The brains behind the settings page. It loads/saves options using Chrome's extension storage and calls the Gemini API to fetch the full list of available models and voices, caching these for daily freshness. The script also validates user input and shows helpful feedback.

- **`icon128.png`**: The toolbar icon shown in Chrome’s extension bar. This file is optional, but provides a professional, recognizable look for the extension.

*Note:* You may also find support files (e.g., `release.sh` and `bump-version.js`) in the repository for automating releases and version bumps. These are used by the developer to ensure each release is tagged, versioned, and zipped correctly.

---

## 💡 Design Choices and Rationale

- **Manifest V3**: By using the latest extension platform, AccessMate Lite benefits from enhanced security, background efficiency (service workers), and better compliance with Google’s policies. This was chosen even though MV3 introduces stricter permissions and some migration headaches, because it is the only future-proof choice for Chrome extensions.

- **No Frameworks/Build Tools**: All code is written in plain HTML, CSS, and JS for maximum transparency and ease of inspection. This minimizes dependencies and surface area for bugs or vulnerabilities, but required more manual UI work (especially for Material-like styling and dark mode support).

- **Direct-to-API, User-Provided Keys**: Rather than proxying requests through a backend (which would be easier for free-tier limitations or abuse control), we require users to generate and manage their own API keys. This shifts responsibility to the user, but massively increases privacy and keeps running costs zero.

- **Dynamic Model/Voice Fetching**: Instead of hardcoding supported models or voices, the settings page fetches the latest from the Gemini API and caches daily. This means users always have access to new Google features and prevents maintenance drift, at the cost of a slight delay when first loading settings.

- **Accessibility**: Keyboard navigation, clear focus indicators, and ARIA labels are included wherever possible. The UI’s color contrast is tuned for both light and dark themes, based on the user’s system preference.

- **Automated Release Workflow**: Scripts like `release.sh` and `bump-version.js` ensure that main branch releases are consistent, versioned, zipped, and documented in the changelog. This prevents human error, encourages semantic versioning, and keeps release notes consistent.

- **Error Handling**: Instead of silent failures or disruptive popups, all errors (from quota issues to invalid keys) are shown directly in the output area, so the user always knows what went wrong and can recover.

---

## 🔧 Installation

1. **Get an API key**  
   - Log in to **[Google AI Studio](https://aistudio.google.com)** → **API keys** → *Create key*  
   - Enable *Generative Language* **and** *Audio* scopes.

2. **Load the extension**

   - Visit `chrome://extensions`
   - Enable **Developer mode**
   - Click **Load unpacked** → select the `accessmate-lite` folder.

3. **Configure your API key**

   - Click the settings icon (⚙️) in the popup, or visit the extension's options page.
   - Paste your key and select your preferred models and TTS voice.

---

## 🚀 Usage

1. Navigate to any web page.  
2. **Highlight** the paragraph(s) you want summarised, or use the "whole page" options.  
3. Click the **AccessMate Lite** toolbar icon.  
4. Choose your preferred action:
    - **Summarise & Read Selection**
    - **Read Selection (no summary)**
    - **Summarise & Read Page**
    - **Read Page (no summary)**
5. A concise summary (in the original language) will appear in the popup and be spoken aloud.

<details>
<summary>Keyboard shortcut (optional)</summary>

You can bind a custom shortcut:

1. Go to `chrome://extensions/shortcuts`  
2. Find **AccessMate Lite** → *Activate the extension* → set e.g. `Ctrl+Shift+L`  
3. Highlight text and press the shortcut instead of clicking the icon.

</details>

---

## ⚙️ Configuration

| Setting              | Where                             | Default                        | Notes                                                  |
|----------------------|-----------------------------------|--------------------------------|--------------------------------------------------------|
| **API Key**          | Settings page                     | —                              | Required. Keep secret—treat like any API token.        |
| **Text Model**       | Settings page                     | Latest Flash model             | Selectable from live Gemini models.                    |
| **TTS Model**        | Settings page                     | Latest Gemini TTS model        | Selectable from live Gemini models.                    |
| **Voice**            | Settings page                     | All available Gemini voices    | Dynamically fetched from the API for up-to-date list.  |
| **Max input length** | Internally (settings.js/popup.js) | 4,000 chars                    | Trim/raise to suit quota & latency.                    |

---

## 🛠️ Development Notes

- **No bundler** — plain HTML, CSS, and JavaScript, Manifest V3.
- All UI is built with accessible, responsive Material/Chrome-style design.
- Voice and model selectors update automatically from the Google API (no hardcoding).
- All errors, warnings, and API issues are shown in the popup's output area.
- Free tier: ~60 requests/min and generous daily quota (subject to change).
- To debug, open the popup → **⋮ > Inspect** and check the **Network** panel for calls to `…/generateContent`.

---

## 🩺 Troubleshooting

| Symptom                                | Likely Cause                                | Fix                                                                       |
|----------------------------------------|---------------------------------------------|----------------------------------------------------------------------------|
| *“Error – see console”* + status **403** | API key lacks *Audio* scope                 | Regenerate key in AI Studio with both scopes checked.                     |
| Status **429**                         | Free-tier quota exhausted                   | Wait 60 s or upgrade billing project.                                     |
| No sound but summary appears           | Browser tab muted OR audio device busy      | Unmute site / close other audio apps.                                     |
| “Highlight some text first” alert      | Selection string empty (frames, PDFs, etc.) | Copy/paste text into a plain page (extension can’t access embedded PDFs).  |
| Empty model/voice dropdowns            | API key invalid, or API/network error       | Re-enter key, check network, and try again.                               |

---

## 🟢 Improvements & Recent Updates

- **Dynamic voice & model lists:** Voices and models are now always up to date with Google's API (no more hardcoded values).
- **Four action modes:** Summarise/read either highlighted text or the entire page, with or without summarization.
- **Material/Chrome UI:** Completely redesigned for a clean, Chrome-like user experience, supporting light/dark mode.
- **API error feedback:** Errors are clearly shown in the popup, with user-friendly messages and troubleshooting hints.
- **Accessibility:** Keyboard navigation and labels for all interactive elements.
- **Settings persistency:** All options (API key, model, TTS, voice) are saved and restored automatically.

---

## 🌱 Future Development

- **Spinner/Loading state:** Add visual feedback (spinner or progress bar) when summarizing or fetching audio.
- **Voice preview:** Let users preview voices in the settings page before choosing.
- **Language detection/auto-selection:** Show language of text and automatically select best-matching TTS voice.
- **Better error styling:** Color errors in the output box for instant visibility.
- **Friendly voice/model names:** Show user-friendly names and descriptions for voices/models where available.
- **Release automation:** Auto-zip and release a new version on every main branch update.
- **Enhanced accessibility:** Add more ARIA attributes and improve screen reader experience.
- **Bug report/feedback link:** Quick link in popup/settings for feedback or bug reports.

---

## 📝 License

[MIT](LICENSE)

---

### ⭐ Give it a try, fork it, and help build a more accessible web!
#### Special Thanks to [David J. Malan](https://github.com/dmalan) & [CS50](https://cs50.harvard.edu)