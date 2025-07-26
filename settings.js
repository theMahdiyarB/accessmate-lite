// --- Constants and Defaults ---
const MODEL_CACHE_KEY = "GeminiModelsCache"; // Key for cached models
const MODEL_CACHE_DATE_KEY = "GeminiModelsCacheDate"; // Key for cache date
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta"; // Gemini API base URL
const DEFAULTS = {
  textModel: "gemini-1.5-flash-latest", // Default text model
  ttsModel: "gemini-tts-1.0-preview",   // Default TTS model
  voiceName: "Kore"                     // Default voice
};

// --- DOM Elements ---
const textModelSelect = document.getElementById("textModelSelect"); // Text model selector
const ttsModelSelect  = document.getElementById("ttsModelSelect");  // TTS model selector
const voiceSelect     = document.getElementById("voiceSelect");     // Voice selector
const apiKeyField     = document.getElementById("apiKey");          // API key input
const statusDiv       = document.getElementById("status");          // Status message div
const settingsForm    = document.getElementById("settingsForm");    // Settings form

// --- Status Message Helpers ---
function status(msg, isErr) {
  statusDiv.textContent = msg;
  statusDiv.style.color = isErr ? "#cb2730" : "#29826e";
}
function clearStatus() { statusDiv.textContent = ""; }

// --- Fetch Gemini models, cache daily ---
// Returns a list of available Gemini models, caching results for the current day
async function getModelList(apiKey) {
  return new Promise(async (resolve, reject) => {
    const today = (new Date()).toISOString().slice(0, 10);
    chrome.storage.local.get([MODEL_CACHE_KEY, MODEL_CACHE_DATE_KEY], async (res) => {
      if (res[MODEL_CACHE_KEY] && res[MODEL_CACHE_DATE_KEY] === today) {
        // Use cached models if available and up-to-date
        resolve(res[MODEL_CACHE_KEY]);
        return;
      }
      status("Fetching available models…");
      try {
        const url = `${GEMINI_API_BASE}/models?key=${apiKey}`;
        const resp = await fetch(url);
        const data = await resp.json();
        if (!data.models) throw new Error(data.error?.message || "No models found");
        // Cache models and date
        chrome.storage.local.set({ [MODEL_CACHE_KEY]: data.models, [MODEL_CACHE_DATE_KEY]: today });
        resolve(data.models);
      } catch (err) {
        status("Model list fetch error: " + err.message, true);
        reject(err);
      }
    });
  });
}

// --- Fill <select> elements with model and voice options ---
// Populates the selectors for text model, TTS model, and voice
function fillSelectors(models, selected) {
  // Clear previous options
  textModelSelect.innerHTML = "";
  ttsModelSelect.innerHTML  = "";
  let voicesSet = new Set();

  // Populate model selectors
  models.forEach(m => {
    if (m.supportedGenerationMethods?.includes("generateContent")) {
      const value = m.name.split("/").pop();
      const label = m.displayName || value;
      if (!value.includes("tts")) {
        // Text model option
        const opt = document.createElement('option');
        opt.value = value;
        opt.textContent = label;
        if (value === selected.textModel) opt.selected = true;
        textModelSelect.appendChild(opt);
      } else {
        // TTS model option
        const opt = document.createElement('option');
        opt.value = value;
        opt.textContent = label;
        if (value === selected.ttsModel) opt.selected = true;
        ttsModelSelect.appendChild(opt);
      }
    }
    // Collect voices from TTS models in API response
    if (m.supportedCapabilities && Array.isArray(m.supportedCapabilities.ttsVoices)) {
      m.supportedCapabilities.ttsVoices.forEach(v => voicesSet.add(v.voiceName));
    }
  });

  // Fallback to hardcoded voices if API returned none
  if (voicesSet.size === 0) {
    ["Kore", "Puck", "Wren", "Orion", "Eden", "Nova", "Rhea", "Atlas", "Breeze", "River", "Sage", "Indigo"].forEach(v => voicesSet.add(v));
  }
  // Populate voice selector
  voiceSelect.innerHTML = "";
  voicesSet.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = v;
    if (v === selected.voiceName) opt.selected = true;
    voiceSelect.appendChild(opt);
  });

  // Set selector values after options are attached
  textModelSelect.value = selected.textModel;
  ttsModelSelect.value = selected.ttsModel;
  voiceSelect.value = selected.voiceName;
}

// --- Load settings from chrome.storage and populate selectors ---
function loadSettings() {
  chrome.storage.sync.get(
    ["apiKey", "textModel", "ttsModel", "voiceName"],
    (items) => {
      // Fill fields with saved or default values
      if (items.apiKey) apiKeyField.value = items.apiKey;
      items.textModel  = items.textModel || DEFAULTS.textModel;
      items.ttsModel   = items.ttsModel || DEFAULTS.ttsModel;
      items.voiceName  = items.voiceName || DEFAULTS.voiceName;

      // Fetch models and fill selectors if API key is present
      if (items.apiKey) {
        getModelList(items.apiKey)
          .then(models => fillSelectors(models, items))
          .catch(() => fillSelectors([], items));
      }
    }
  );
}

// --- Re-fetch models if API key changes ---
apiKeyField.addEventListener("change", async e => {
  const key = apiKeyField.value.trim();
  if (!key) return;
  // Clear model cache and fetch fresh list
  chrome.storage.local.remove([MODEL_CACHE_KEY, MODEL_CACHE_DATE_KEY], () => {
    getModelList(key)
      .then(models => {
        fillSelectors(models, {
          textModel: textModelSelect.value,
          ttsModel: ttsModelSelect.value,
          voiceName: voiceSelect.value
        });
      });
  });
});

// --- Save settings on form submit ---
settingsForm.onsubmit = function (e) {
  e.preventDefault();
  chrome.storage.sync.set({
    apiKey: apiKeyField.value.trim(),
    textModel: textModelSelect.value,
    ttsModel: ttsModelSelect.value,
    voiceName: voiceSelect.value
  }, () => {
    status("Settings saved!");
    setTimeout(clearStatus, 1500);
  });
};

// --- Initialize settings UI on page load ---
document.addEventListener("DOMContentLoaded", loadSettings);
