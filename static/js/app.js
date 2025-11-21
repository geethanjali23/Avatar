/* Neura AI Application Logic
   Features: Chat, Voice, Work Timer (Auto-Pause), Camera, Skeleton Drawing, Mood Detection
   Updated: Added Audio Notification when Camera turns on
*/

const ENDPOINT = "/ask";
const GREET_ENDPOINT = "/greet";

// ==========================================
// 0. DOM ELEMENTS & INJECTIONS
// ==========================================

// Existing Elements
const micBtn = document.getElementById("micBtn");
const camBtn = document.getElementById("camBtn");
const sendBtn = document.getElementById("sendBtn");
const inputEl = document.getElementById("input");
const chatEl = document.getElementById("chat");
const clearBtn = document.getElementById("clearBtn");
const holo = document.getElementById("holo");

// Camera & AI Elements
const cameraShell = document.getElementById("cameraShell");
const cameraFeed = document.getElementById("cameraFeed");
const poseCanvas = document.getElementById("poseCanvas");
const camStatus = document.getElementById("camStatus");
const cameraClose = document.getElementById("cameraClose");
const ctx = poseCanvas.getContext("2d");

// Timer Elements
const timerStart = document.getElementById("timerStart");
const timerSelect = document.getElementById("timerSelect");
const breakModal = document.getElementById("breakModal");
const breakClose = document.getElementById("breakClose");

// Settings Elements
const settingsBtn = document.getElementById("settingsBtn");
const settingsModal = document.getElementById("settingsModal");
const closeSettings = document.getElementById("closeSettings");
const autoToggle = document.getElementById("autoToggle");
const voiceToggle = document.getElementById("voiceToggle"); // NEW ELEMENT
const cameraToggle = document.getElementById("cameraToggle");

// --- DYNAMIC TIMER UI INJECTION ---
const timerContainer = document.createElement("div");
timerContainer.id = "activeTimerPanel";
timerContainer.style.display = "none";
timerContainer.style.marginTop = "15px";
timerContainer.style.textAlign = "center";
timerContainer.innerHTML = `
    <div id="timerDisplay" style="font-size: 28px; font-weight: 700; color: #00eaff; margin-bottom: 10px; font-family: 'Courier New', monospace;">00:00</div>
    <div style="display: flex; gap: 10px; justify-content: center;">
        <button id="timerPauseBtn" style="background: rgba(189, 0, 255, 0.3); border: 1px solid #bd00ff; color: white; padding: 8px 16px; border-radius: 20px; cursor: pointer; transition: all 0.3s;">Pause</button>
        <button id="timerStopBtn" style="background: rgba(255, 0, 85, 0.3); border: 1px solid #ff0055; color: white; padding: 8px 16px; border-radius: 20px; cursor: pointer; transition: all 0.3s;">Stop</button>
    </div>
    <div id="timerStatus" style="font-size: 12px; color: #aaa; margin-top: 8px; font-style: italic;">Ready</div>
`;
timerStart.parentNode.insertBefore(timerContainer, timerStart.nextSibling);

const timerDisplay = document.getElementById("timerDisplay");
const timerPauseBtn = document.getElementById("timerPauseBtn");
const timerStopBtn = document.getElementById("timerStopBtn");
const timerStatusLabel = document.getElementById("timerStatus");

// ==========================================
// 1. STATE VARIABLES
// ==========================================

let detector = null;
let moodModelsReady = false;
let cameraActive = false;
let currentMood = "neutral";

let analysisLoop = null;
let lastPostureWarning = 0; 
let lastMoodTime = 0;

let timerInterval = null;
let sessionTimeRemaining = 0; 
let isSessionActive = false;
let isSessionPaused = false;
let isManualPause = false;

// ==========================================
// 2. NOTIFICATION SYSTEM
// ==========================================

const style = document.createElement('style');
style.innerHTML = `
  .neura-toast {
    position: fixed; top: 20px; left: 50%; transform: translateX(-50%) translateY(-100px);
    background: rgba(0, 20, 40, 0.95); border: 1px solid #00eaff; color: #00eaff;
    padding: 12px 24px; border-radius: 50px; font-family: sans-serif; font-size: 14px;
    font-weight: 600; box-shadow: 0 0 20px rgba(0, 234, 255, 0.4); z-index: 2000;
    opacity: 0; transition: all 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55);
    display: flex; align-items: center; gap: 10px;
  }
  .neura-toast.active { transform: translateX(-50%) translateY(0); opacity: 1; }
`;
document.head.appendChild(style);

function showNotification(text) {
    const toast = document.createElement("div");
    toast.className = "neura-toast";
    toast.innerHTML = `<span>✨</span> ${text}`;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("active"));
    setTimeout(() => {
        toast.classList.remove("active");
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// ==========================================
// 3. TIMER LOGIC
// ==========================================

function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

function updateTimerUI() {
    timerDisplay.innerText = formatTime(sessionTimeRemaining);
    
    if (isSessionPaused) {
        timerDisplay.style.color = "#ffaa00";
        timerPauseBtn.innerText = "Resume";
        timerPauseBtn.style.background = "rgba(255, 170, 0, 0.3)";
        timerPauseBtn.style.borderColor = "#ffaa00";
    } else {
        timerDisplay.style.color = "#00eaff";
        timerPauseBtn.innerText = "Pause";
        timerPauseBtn.style.background = "rgba(189, 0, 255, 0.3)";
        timerPauseBtn.style.borderColor = "#bd00ff";
    }
}

timerStart.onclick = () => {
    const mins = parseFloat(timerSelect.value);
    if (!mins) return;

    clearInterval(timerInterval);
    sessionTimeRemaining = mins * 60;
    isSessionActive = true;
    isSessionPaused = false;
    isManualPause = false;

    timerStart.style.display = "none";
    timerSelect.style.display = "none";
    timerContainer.style.display = "block";
    timerStatusLabel.innerText = "Session Active";

    speak(`Workstation started for ${mins} minutes.`);
    showNotification(`Workstation Active: ${mins}m`);

    timerInterval = setInterval(() => {
        if (isSessionActive && !isSessionPaused && sessionTimeRemaining > 0) {
            sessionTimeRemaining--;
            updateTimerUI();
            if (sessionTimeRemaining <= 0) completeSession();
        }
    }, 1000);
    updateTimerUI();
};

timerPauseBtn.onclick = () => {
    if (isSessionPaused) {
        isManualPause = false;
        isSessionPaused = false;
        timerStatusLabel.innerText = "Resumed by user";
        speak("Resuming session.");
    } else {
        isManualPause = true;
        isSessionPaused = true;
        timerStatusLabel.innerText = "Paused by user";
    }
    updateTimerUI();
};

timerStopBtn.onclick = () => {
    clearInterval(timerInterval);
    isSessionActive = false;
    resetTimerUI();
    speak("Session cancelled.");
};

function completeSession() {
    clearInterval(timerInterval);
    isSessionActive = false;
    resetTimerUI();
    speak("Great work! Time for a break.");
    breakModal.style.display = "flex";
}

function resetTimerUI() {
    timerContainer.style.display = "none";
    timerStart.style.display = "inline-block";
    timerSelect.style.display = "inline-block";
}

breakClose.onclick = () => breakModal.style.display = "none";

// ==========================================
// 4. CAMERA & AI LOGIC
// ==========================================

async function enableCamera() {
    if (cameraActive) return;

    cameraShell.classList.add("visible");
    cameraShell.classList.add("expanded");
    camBtn.style.color = "#bd00ff"; 
    camBtn.style.boxShadow = "0 0 20px #bd00ff";
    cameraToggle.checked = true;

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        cameraFeed.srcObject = stream;

        cameraFeed.onloadeddata = async () => {
            poseCanvas.width = cameraFeed.videoWidth;
            poseCanvas.height = cameraFeed.videoHeight;
            cameraActive = true;
            
            // --- UPDATED NOTIFICATION HERE ---
            showNotification("System: Camera Online");
            speak("Camera is on. I am analyzing your posture.");

            await initAI();
            loopAnalysis();
        };
    } catch (e) {
        alert("Camera access denied.");
        disableCamera();
    }
}

function disableCamera() {
    cameraActive = false;
    cameraShell.classList.remove("visible");
    cameraShell.classList.remove("expanded");
    camBtn.style.color = "";
    camBtn.style.boxShadow = "";
    cameraToggle.checked = false; 
    
    showNotification("System: Camera Offline");
    speak("Camera disabled."); // Audio confirmation for off

    if (cameraFeed.srcObject) {
        cameraFeed.srcObject.getTracks().forEach(t => t.stop());
        cameraFeed.srcObject = null;
    }
    cancelAnimationFrame(analysisLoop);
    ctx.clearRect(0, 0, poseCanvas.width, poseCanvas.height);
}

async function initAI() {
    if (detector) return;
    camStatus.innerText = "Loading AI...";
    try {
        await tf.ready();
        detector = await poseDetection.createDetector(
            poseDetection.SupportedModels.MoveNet,
            { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
        );
        await faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights');
        await faceapi.nets.faceExpressionNet.loadFromUri('https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights');
        moodModelsReady = true;
        camStatus.innerText = "Active";
    } catch (e) {
        camStatus.innerText = "AI Failed";
    }
}

async function loopAnalysis() {
    if (!cameraActive) return;

    let personDetected = false;

    if (detector) {
        try {
            const poses = await detector.estimatePoses(cameraFeed);
            ctx.clearRect(0, 0, poseCanvas.width, poseCanvas.height);

            if (poses.length > 0) {
                const kp = poses[0].keypoints;
                const nose = kp.find(p => p.name === 'nose');
                
                if (nose && nose.score > 0.3) {
                    personDetected = true;
                    drawSkeleton(kp);
                    checkPosture(kp);
                }
            }
        } catch (e) {}
    }

    if (isSessionActive) {
        if (!personDetected && !isSessionPaused) {
            isSessionPaused = true;
            timerStatusLabel.innerText = "Paused: User Missing";
            timerStatusLabel.style.color = "#ff0055";
            showNotification("⏸️ User Away: Timer Paused");
            updateTimerUI();
        }
        else if (personDetected && isSessionPaused && !isManualPause) {
            isSessionPaused = false;
            timerStatusLabel.innerText = "Resumed: User Detected";
            timerStatusLabel.style.color = "#00ff00";
            showNotification("▶️ User Back: Timer Resumed");
            speak("Welcome back. Resuming timer.");
            updateTimerUI();
        }
    }

    const now = Date.now();
    if (moodModelsReady && (now - lastMoodTime > 2000)) {
        lastMoodTime = now;
        detectMood();
    }

    analysisLoop = requestAnimationFrame(loopAnalysis);
}

function drawSkeleton(kp) {
    const threshold = 0.3;
    const find = n => kp.find(p => p.name === n);
    const ls = find("left_shoulder");
    const rs = find("right_shoulder");
    const le = find("left_eye");
    const re = find("right_eye");

    ctx.lineWidth = 4;

    if (le && re && le.score > threshold && re.score > threshold) {
        ctx.strokeStyle = "#00eaff";
        ctx.beginPath(); ctx.moveTo(le.x, le.y); ctx.lineTo(re.x, re.y); ctx.stroke();
    }

    if (ls && rs && ls.score > threshold && rs.score > threshold) {
        const diff = Math.abs(ls.y - rs.y);
        ctx.strokeStyle = diff > 25 ? "#ff0055" : "#00ff00";
        ctx.beginPath(); ctx.moveTo(ls.x, ls.y); ctx.lineTo(rs.x, rs.y); ctx.stroke();
        ctx.fillStyle = "#fff";
        [ls, rs].forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, 2 * Math.PI); ctx.fill(); });
    }
}

function checkPosture(kp) {
    const ls = kp.find(p => p.name === "left_shoulder");
    const rs = kp.find(p => p.name === "right_shoulder");

    if (ls && rs && ls.score > 0.3 && rs.score > 0.3) {
        const diff = Math.abs(ls.y - rs.y);
        if (diff > 30) { 
            const now = Date.now();
            if (now - lastPostureWarning > 30000) {
                lastPostureWarning = now;
                camStatus.innerText = "⚠️ Sit Straight";
                camStatus.style.color = "red";
                speak("Please adjust your posture.");
                showNotification("⚠️ Posture Alert");
            }
        } else {
            camStatus.innerText = "✅ Good";
            camStatus.style.color = "#00ff00";
        }
    }
}

async function detectMood() {
    if (!cameraFeed.paused && !cameraFeed.ended) {
        const detections = await faceapi.detectSingleFace(cameraFeed, new faceapi.TinyFaceDetectorOptions()).withFaceExpressions();
        if (detections) {
            const ex = detections.expressions;
            const mood = Object.keys(ex).reduce((a, b) => ex[a] > ex[b] ? a : b);
            
            if (['sad', 'angry', 'fearful'].includes(mood) && currentMood !== mood) {
                currentMood = mood;
                speak(`You look ${mood}. Take a deep breath.`);
                showNotification(`Mood: ${mood}`);
            }
        }
    }
}

// ==========================================
// 5. CHAT & VOICE
// ==========================================

function appendBubble(who, text) {
    const el = document.createElement("div");
    el.className = "bubble " + (who === "you" ? "you" : "assistant");
    el.innerHTML = `<div class="meta">${who==="you"?"You":"Neura"}</div><div>${text}</div>`;
    chatEl.appendChild(el);
    chatEl.scrollTop = chatEl.scrollHeight;
}

function speak(text) {
    // NEW: Check if voice notifications are disabled
    if (voiceToggle && !voiceToggle.checked) return;

    if ('speechSynthesis' in window) {
        const utter = new SpeechSynthesisUtterance(text);
        utter.rate = 1.1;
        window.dispatchEvent(new Event("avatar-talking-start"));
        holo.style.boxShadow = "0 0 40px #00fff2, 0 0 70px rgba(255,0,255,0.5)";
        
        utter.onend = () => {
            window.dispatchEvent(new Event("avatar-talking-stop"));
            holo.style.boxShadow = "0 0 24px #00fff2, inset 0 0 40px rgba(0,255,255,0.7)";
            if (autoToggle && autoToggle.checked) startListening();
        };
        speechSynthesis.cancel();
        speechSynthesis.speak(utter);
    }
}

async function sendToServer(text) {
    try {
        const res = await fetch(ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: text })
        });
        const data = await res.json();
        appendBubble("assistant", data.reply);
        speak(data.reply);
    } catch (e) {
        appendBubble("assistant", "Server error.");
    }
}

function startListening() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
        const r = new SR();
        r.lang = "en-IN";
        r.onstart = () => { micBtn.style.color = "#00ff00"; micBtn.style.background = "rgba(0,255,0,0.2)"; };
        r.onend = () => { micBtn.style.color = ""; micBtn.style.background = ""; };
        r.onresult = (e) => {
            const t = e.results[0][0].transcript;
            appendBubble("you", t);
            sendToServer(t);
        };
        r.start();
    } else {
        alert("Mic not supported.");
    }
}

// ==========================================
// 6. INITIALIZATION & EVENTS
// ==========================================

sendBtn.addEventListener("click", () => {
    const t = inputEl.value.trim();
    if(t) { inputEl.value=""; appendBubble("you", t); sendToServer(t); }
});
inputEl.addEventListener("keydown", e => { if(e.key==="Enter") sendBtn.click(); });
micBtn.addEventListener("click", startListening);
clearBtn.addEventListener("click", () => chatEl.innerHTML = "");

// Camera & Settings Listeners
camBtn.addEventListener("click", () => cameraActive ? disableCamera() : enableCamera());
cameraToggle.addEventListener('change', () => cameraToggle.checked ? enableCamera() : disableCamera());
cameraClose.addEventListener("click", (e) => { e.stopPropagation(); disableCamera(); });
cameraShell.addEventListener("click", (e) => { 
    if (e.target !== cameraClose && e.target.id !== "cameraToggle") {
        cameraShell.classList.toggle("circle-mode");
    }
});

settingsBtn.onclick = () => settingsModal.style.display = "flex";
closeSettings.onclick = () => settingsModal.style.display = "none";
window.onclick = (e) => { if (e.target == settingsModal) settingsModal.style.display = "none"; };

window.onload = async () => {
    try {
        const g = await fetch(GREET_ENDPOINT).then(r=>r.json());
        appendBubble("assistant", g.greeting);
        speak(g.greeting);
    } catch(e){}
};