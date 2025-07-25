/************ UI and Settings **************/
const out = document.getElementById("out");
const btns = [
  document.getElementById("selSumSpeak"),
  document.getElementById("selSpeak"),
  document.getElementById("pageSumSpeak"),
  document.getElementById("pageSpeak"),
];

// Settings loaded from chrome.storage.sync
let SETTINGS = {
  apiKey: "",
  textModel: "gemini-1.5-flash-latest",
  ttsModel: "gemini-tts-1.0-preview",
  voiceName: "Kore"
};

// Load settings before enabling buttons
document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.sync.get(
    ["apiKey", "textModel", "ttsModel", "voiceName"],
    (items) => {
      SETTINGS = Object.assign(SETTINGS, items);
      if (!SETTINGS.apiKey) {
        output("⚠️ Please set your API key in extension settings.");
        setButtonsEnabled(false);
      } else {
        setButtonsEnabled(true);
      }
    }
  );
  // Settings link
  const settingsLink = document.getElementById("settingsLink");
  if (settingsLink) {
    settingsLink.onclick = (e) => {
      e.preventDefault();
      chrome.runtime.openOptionsPage();
    };
  }
});

function setButtonsEnabled(enable) {
  btns.forEach(b => { if (b) b.disabled = !enable; });
}

/************ Button handlers **************/
if (btns[0]) btns[0].onclick  = () => run("selection", true);
if (btns[1]) btns[1].onclick  = () => run("selection", false);
if (btns[2]) btns[2].onclick  = () => run("page",       true);
if (btns[3]) btns[3].onclick  = () => run("page",       false);

/**
 * mode: "selection" | "page"
 * doSummary: boolean
 */
async function run(mode, doSummary){
  output("Working…");
  setButtonsEnabled(false);
  try{
    // 1️⃣  Grab text
    const raw = await grabText(mode);
    if(!raw){ output(`No text found for ${mode}.`); setButtonsEnabled(true); return; }

    // 2️⃣  Optional summary
    const content = doSummary ? await geminiSummary(trimInput(raw)) : trimInput(raw);

    // 3️⃣  Speak
    output(content);
    const wavB64 = await geminiTTS(content);
    playWav(wavB64);

  }catch(err){
    output("❌ Error:\n" + (err.message || err));
    console.error(err);
  } finally {
    setButtonsEnabled(true);
  }
}

/************ Helpers **************/
function output(msg) {
  out.value = msg;
}

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
const MAX_CHARS = 4000;
const trimInput = txt => txt.length > MAX_CHARS ? txt.slice(0,MAX_CHARS) : txt;

/************ GEMINI API: Summarise **************/
async function geminiSummary(text) {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${SETTINGS.textModel}:generateContent?key=${SETTINGS.apiKey}`;
    const body = {
      contents: [{parts: [{text: `Summarise in SAME language (≤80 words):\n\n${text}` }]}],
      generationConfig: { maxOutputTokens: 80 }
    };
    const r = await fetch(url, {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body)});
    const j = await r.json();
    if (j.error) throw new Error(`API error: ${j.error.message}`);
    return j.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
  } catch (err) {
    throw err;
  }
}

/************ GEMINI API: TTS **************/
async function geminiTTS(text) {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${SETTINGS.ttsModel}:generateContent?key=${SETTINGS.apiKey}`;
    const body = {
      contents: [{parts: [{text}]}],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: SETTINGS.voiceName } }
        }
      }
    };
    const r = await fetch(url, {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(body)});
    const j = await r.json();
    if (j.error) throw new Error(`API error: ${j.error.message}`);
    const pcmB64 = j.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!pcmB64) throw new Error("No audio returned");
    return pcmToWavBase64(pcmB64);
  } catch (err) {
    throw err;
  }
}

/************ PCM → WAV **************/
function pcmToWavBase64(pcmB64, sampleRate = 24000) {
  const pcm = atob(pcmB64);
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
