const MODEL_CACHE_KEY = "GeminiModelsCache";
const MODEL_CACHE_DATE_KEY = "GeminiModelsCacheDate";
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const DEFAULTS = {
  textModel: "gemini-1.5-flash-latest",
  ttsModel: "gemini-tts-1.0-preview",
  voiceName: "Kore"
};

const textModelSelect = document.getElementById("textModelSelect");
const ttsModelSelect  = document.getElementById("ttsModelSelect");
const voiceSelect     = document.getElementById("voiceSelect");
const apiKeyField     = document.getElementById("apiKey");
const statusDiv       = document.getElementById("status");
const settingsForm    = document.getElementById("settingsForm");

function status(msg, isErr) {
  statusDiv.textContent = msg;
  statusDiv.style.color = isErr ? "#cb2730" : "#29826e";
}
function clearStatus() { statusDiv.textContent = ""; }

// Fetch Gemini models, cache daily
async function getModelList(apiKey) {
  return new Promise(async (resolve, reject) => {
    const today = (new Date()).toISOString().slice(0, 10);
    chrome.storage.local.get([MODEL_CACHE_KEY, MODEL_CACHE_DATE_KEY], async (res) => {
      if (res[MODEL_CACHE_KEY] && res[MODEL_CACHE_DATE_KEY] === today) {
        resolve(res[MODEL_CACHE_KEY]);
        return;
      }
      status("Fetching available models…");
      try {
        const url = `${GEMINI_API_BASE}/models?key=${apiKey}`;
        const resp = await fetch(url);
        const data = await resp.json();
        if (!data.models) throw new Error(data.error?.message || "No models found");
        chrome.storage.local.set({ [MODEL_CACHE_KEY]: data.models, [MODEL_CACHE_DATE_KEY]: today });
        resolve(data.models);
      } catch (err) {
        status("Model list fetch error: " + err.message, true);
        reject(err);
      }
    });
  });
}

// Fill <select> using <option>
function fillSelectors(models, selected) {
  // Text and TTS
  textModelSelect.innerHTML = "";
  ttsModelSelect.innerHTML  = "";
  let voicesSet = new Set();

  models.forEach(m => {
    if (m.supportedGenerationMethods?.includes("generateContent")) {
      const value = m.name.split("/").pop();
      const label = m.displayName || value;
      if (!value.includes("tts")) {
        const opt = document.createElement('option');
        opt.value = value;
        opt.textContent = label;
        if (value === selected.textModel) opt.selected = true;
        textModelSelect.appendChild(opt);
      } else {
        const opt = document.createElement('option');
        opt.value = value;
        opt.textContent = label;
        if (value === selected.ttsModel) opt.selected = true;
        ttsModelSelect.appendChild(opt);
      }
    }
    // Dynamically collect voices from all TTS models in API response
    if (m.supportedCapabilities && Array.isArray(m.supportedCapabilities.ttsVoices)) {
      m.supportedCapabilities.ttsVoices.forEach(v => voicesSet.add(v.voiceName));
    }
  });

  // Fallback to hardcoded voices only if API returned none
  if (voicesSet.size === 0) {
    ["Kore", "Puck", "Wren", "Orion", "Eden", "Nova", "Rhea", "Atlas", "Breeze", "River", "Sage", "Indigo"].forEach(v => voicesSet.add(v));
  }
  voiceSelect.innerHTML = "";
  voicesSet.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = v;
    if (v === selected.voiceName) opt.selected = true;
    voiceSelect.appendChild(opt);
  });

  // Set values after items are attached
  textModelSelect.value = selected.textModel;
  ttsModelSelect.value = selected.ttsModel;
  voiceSelect.value = selected.voiceName;
}

function loadSettings() {
  chrome.storage.sync.get(
    ["apiKey", "textModel", "ttsModel", "voiceName"],
    (items) => {
      if (items.apiKey) apiKeyField.value = items.apiKey;
      items.textModel  = items.textModel || DEFAULTS.textModel;
      items.ttsModel   = items.ttsModel || DEFAULTS.ttsModel;
      items.voiceName  = items.voiceName || DEFAULTS.voiceName;

      if (items.apiKey) {
        getModelList(items.apiKey)
          .then(models => fillSelectors(models, items))
          .catch(() => fillSelectors([], items));
      }
    }
  );
}

// Re-fetch if API key changes
apiKeyField.addEventListener("change", async e => {
  const key = apiKeyField.value.trim();
  if (!key) return;
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

document.addEventListener("DOMContentLoaded", loadSettings);
