
/************ CONFIG *****************/
const GEMINI_KEY      = "YOUR_REAL_GEMINI_KEY";         // get it from https://aistudio.google.com/apikey

// Model selectors (populated at runtime)
let SUMMARY_MODEL = localStorage.getItem('SUMMARY_MODEL') || "gemini-2.5-flash-lite";
let TTS_MODEL = localStorage.getItem('TTS_MODEL') || "gemini-2.5-flash-preview-tts";


// Add model and voice selectors to UI
const VOICES = [
  "Kore", "Puck", "Wren", "Orion", "Eden", "Nova", "Rhea", "Atlas", "Breeze", "River", "Sage", "Indigo"
];
let VOICE_NAME = localStorage.getItem('VOICE_NAME') || "Kore";

function addModelSelectors() {
  const container = document.getElementById('modelVoiceSelectors');
  container.style.marginBottom = '8px';
  container.innerHTML = `
    <label>Text Model: <select id="textModelSelect"></select></label>
    <label style="margin-left:10px;">TTS Model: <select id="ttsModelSelect"></select></label>
    <label style="margin-left:10px;">Voice: <select id="voiceSelect"></select></label>
  `;

  // Populate voice selector
  const voiceSel = container.querySelector('#voiceSelect');
  VOICES.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = v;
    if (v === VOICE_NAME) opt.selected = true;
    voiceSel.appendChild(opt);
  });
  voiceSel.addEventListener('change', e => {
    VOICE_NAME = e.target.value;
    localStorage.setItem('VOICE_NAME', VOICE_NAME);
  });
}

addModelSelectors();

// Fetch and cache models (cache per day)
async function getGeminiModels() {
  const cacheKey = 'GEMINI_MODELS_CACHE';
  const cacheDateKey = 'GEMINI_MODELS_CACHE_DATE';
  const today = new Date().toISOString().slice(0,10);
  if (localStorage.getItem(cacheKey) && localStorage.getItem(cacheDateKey) === today) {
    return JSON.parse(localStorage.getItem(cacheKey));
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_KEY}`;
  const r = await fetch(url);
  const j = await r.json();
  localStorage.setItem(cacheKey, JSON.stringify(j.models));
  localStorage.setItem(cacheDateKey, today);
  return j.models;
}

function populateModelSelectors(models) {
  const textSel = document.getElementById('textModelSelect');
  const ttsSel = document.getElementById('ttsModelSelect');
  textSel.innerHTML = '';
  ttsSel.innerHTML = '';
  models.filter(m => m.supportedGenerationMethods?.includes('generateContent')).forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.name.split('/').pop();
    opt.textContent = m.displayName || opt.value;
    if (opt.value === SUMMARY_MODEL) opt.selected = true;
    textSel.appendChild(opt);
  });
  models.filter(m => m.supportedGenerationMethods?.includes('generateContent') && m.name.includes('tts')).forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.name.split('/').pop();
    opt.textContent = m.displayName || opt.value;
    if (opt.value === TTS_MODEL) opt.selected = true;
    ttsSel.appendChild(opt);
  });
}

// On change, update model and cache
function setupModelSelectorEvents() {
  document.getElementById('textModelSelect').addEventListener('change', e => {
    SUMMARY_MODEL = e.target.value;
    localStorage.setItem('SUMMARY_MODEL', SUMMARY_MODEL);
  });
  document.getElementById('ttsModelSelect').addEventListener('change', e => {
    TTS_MODEL = e.target.value;
    localStorage.setItem('TTS_MODEL', TTS_MODEL);
  });
}

// Initialize model selectors
getGeminiModels().then(models => {
  populateModelSelectors(models);
  setupModelSelectorEvents();
});


/************ UI hooks **************/
const out = document.getElementById("out");

document.getElementById("selSumSpeak").onclick  = () => run("selection", true);
document.getElementById("selSpeak").onclick     = () => run("selection", false);
document.getElementById("pageSumSpeak").onclick = () => run("page",       true);
document.getElementById("pageSpeak").onclick    = () => run("page",       false);

/**
 * mode: "selection" | "page"
 * doSummary: boolean
 */
async function run(mode, doSummary){
  out.value = "Working…";
  try{
    // 1️⃣  Grab text
    const raw = await grabText(mode);
    if(!raw){ alert(`No text found for ${mode}`); out.value=""; return; }

    // 2️⃣  Optional summary
    const content = doSummary ? await geminiSummary(trimInput(raw)) : trimInput(raw);

    // 3️⃣  Speak
    out.value = content;
    const wavB64 = await geminiTTS(content);
    playWav(wavB64);

  }catch(err){
    console.error(err);
    alert("Error – see console");
    out.value = "";
  }
}

/************ Helpers **************/

// Get either highlighted text or full page text
function grabText(mode){
  return new Promise((resolve, reject)=>{
    chrome.tabs.query({active:true,currentWindow:true},([tab])=>{
      if(!tab) return reject("No active tab");
      const fn = mode==="selection"
        ? () => window.getSelection().toString()
        : () => document.body.innerText || document.documentElement.innerText;
      chrome.scripting.executeScript({target:{tabId:tab.id},func:fn},([r])=>{
        if(chrome.runtime.lastError) return reject(chrome.runtime.lastError);
        resolve((r?.result || "").trim());
      });
    });
  });
}

// Keep Gemini input small enough for latency/quota
const MAX_CHARS = 4000; // adjust as you like
const trimInput = txt => txt.length > MAX_CHARS ? txt.slice(0,MAX_CHARS) : txt;

/************ GET HIGHLIGHTED TEXT ***/
function grabSelection() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({active: true, currentWindow: true}, tabs => {
      const tab = tabs[0];
      if (!tab) return reject("No active tab");

      chrome.scripting.executeScript(
        { target: {tabId: tab.id}, func: () => window.getSelection().toString() },
        results => {
          if (chrome.runtime.lastError) return reject(chrome.runtime.lastError);
          resolve(results?.[0]?.result || "");
        }
      );
    });
  });
}

/************ SUMMARISE **************/
async function geminiSummary(text) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${SUMMARY_MODEL}:generateContent?key=${GEMINI_KEY}`;
  const body = {
    contents: [{parts: [{text: `Summarise in SAME language (≤80 words):\n\n${text}` }]}],
    generationConfig: { maxOutputTokens: 80 }   // 🚀 limit output
  };
  const r = await fetch(url, {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body)});
  const j = await r.json();
  console.log(j); // Debug Gemini summary API response
  return j.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
}

/************ GEMINI TTS *********/
async function geminiTTS(text) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent?key=${GEMINI_KEY}`;
  const body = {
    contents: [{parts: [{text}]}],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE_NAME } }
      }
    }
  };
  const r = await fetch(url, {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body)});
  const j = await r.json();
  console.log(j); // Debug Gemini TTS API response
  const pcmB64 = j.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!pcmB64) throw new Error("No audio returned");
  return pcmToWavBase64(pcmB64);  // convert to WAV for easy playback
}

/************ PCM → WAV **************/
function pcmToWavBase64(pcmB64, sampleRate = 24000) {
  const pcm = atob(pcmB64);               // binary string
  const pcmLen = pcm.length;
  const buffer = new ArrayBuffer(44 + pcmLen);
  const dv = new DataView(buffer);

  /* WAV header */
  const writeStr = (offs, str) => [...str].forEach((c,i)=>dv.setUint8(offs+i,c.charCodeAt(0)));
  writeStr(0,"RIFF");
  dv.setUint32(4, 36 + pcmLen, true);
  writeStr(8,"WAVEfmt ");
  dv.setUint32(16,16,true);        // fmt chunk size
  dv.setUint16(20,1,true);         // PCM
  dv.setUint16(22,1,true);         // mono
  dv.setUint32(24,sampleRate,true);
  dv.setUint32(28,sampleRate*2,true);
  dv.setUint16(32,2,true);         // block align
  dv.setUint16(34,16,true);        // bits per sample
  writeStr(36,"data");
  dv.setUint32(40,pcmLen,true);

  /* copy PCM */
  for(let i=0;i<pcmLen;i++) dv.setUint8(44+i, pcm.charCodeAt(i));

  /* to base64 */
  const bytes = new Uint8Array(buffer);
  let bin = "";
  bytes.forEach(b => bin += String.fromCharCode(b));
  return btoa(bin);
}

/************ PLAY WAV ***************/
function playWav(wavB64){
  const audio = new Audio(`data:audio/wav;base64,${wavB64}`);
  audio.play();
}
