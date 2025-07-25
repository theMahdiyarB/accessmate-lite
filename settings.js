// Store/retrieve settings from chrome.storage.sync

document.addEventListener("DOMContentLoaded", () => {
  const apiKey = document.getElementById("apiKey");
  const textModel = document.getElementById("textModel");
  const ttsModel = document.getElementById("ttsModel");
  const voiceName = document.getElementById("voiceName");
  const form = document.getElementById("settingsForm");
  const status = document.getElementById("status");

  // Load saved settings
  chrome.storage.sync.get(
    ["apiKey", "textModel", "ttsModel", "voiceName"],
    (items) => {
      if (items.apiKey) apiKey.value = items.apiKey;
      if (items.textModel) textModel.value = items.textModel;
      if (items.ttsModel) ttsModel.value = items.ttsModel;
      if (items.voiceName) voiceName.value = items.voiceName;
    }
  );

  // Save settings
  form.onsubmit = (e) => {
    e.preventDefault();
    chrome.storage.sync.set({
      apiKey: apiKey.value.trim(),
      textModel: textModel.value.trim(),
      ttsModel: ttsModel.value.trim(),
      voiceName: voiceName.value.trim(),
    }, () => {
      status.textContent = "Settings saved!";
      setTimeout(() => status.textContent = "", 1500);
    });
  };
});
