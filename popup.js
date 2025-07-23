/************ CONFIG *****************/
const GEMINI_KEY      = "YOUR_REAL_KEY_HERE";
const SUMMARY_MODEL   = "gemini-2.5-flash-lite";        // or any text model you prefer
const TTS_MODEL       = "gemini-2.5-flash-preview-tts"; // single-speaker TTS
const VOICE_NAME      = "Kore";                         // other demo voices: Puck, Wren …

/************ UI HOOKS ***************/
const btn = document.getElementById("go");
const out = document.getElementById("out");
btn.onclick = handleClick;

/************ MAIN FLOW **************/
async function handleClick() {
  out.value = "";
  btn.disabled = true; btn.textContent = "Working…";
  try {

    let raw = await grabSelection();
    const text = raw.slice(0, 2048);       // 🚀 cap to ~2 k chars
    if (!text) { alert("Highlight some text first."); return; }

    const summary = await geminiSummary(text);
    out.value = summary;

    const audioB64 = await geminiTTS(summary);
    playWav(audioB64);
  } catch (err) {
    console.error(err);
    alert("Error – see console");
  } finally {
    btn.disabled = false; btn.textContent = "Summarise & Speak";
  }
}

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
  return j.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
}

/************ NEW: GEMINI TTS *********/
async function geminiTTS(text) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent?key=${GEMINI_KEY}`;
  const body = {
    model: TTS_MODEL,
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
