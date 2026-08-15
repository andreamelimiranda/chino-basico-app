const words = [
  { hanzi: "你", pinyin: "nǐ", meaning: "tú / usted", tip: "Tercer tono: baja y luego sube." },
  { hanzi: "好", pinyin: "hǎo", meaning: "bien / bueno", tip: "También usa tercer tono." },
  { hanzi: "我", pinyin: "wǒ", meaning: "yo", tip: "Tercer tono. Empieza grave y vuelve a subir." },
  { hanzi: "很", pinyin: "hěn", meaning: "muy", tip: "Se usa mucho antes de adjetivos: 很好 = muy bien." },
  { hanzi: "吗", pinyin: "ma", meaning: "partícula de pregunta", tip: "Tono neutro. Convierte una frase en pregunta." },
  { hanzi: "呢", pinyin: "ne", meaning: "¿y...?", tip: "Tono neutro. Ejemplo: 你呢？ = ¿y tú?" },
  { hanzi: "也", pinyin: "yě", meaning: "también", tip: "Tercer tono. Ejemplo: 我也很好 = yo también estoy bien." },
  { hanzi: "再见", pinyin: "zàijiàn", meaning: "adiós / hasta luego", tip: "再 es cuarto tono y 见 también es cuarto tono." }
];

const phrases = [
  { hanzi: "你好！", pinyin: "Nǐ hǎo!", meaning: "¡Hola!" },
  { hanzi: "你好吗？", pinyin: "Nǐ hǎo ma?", meaning: "¿Cómo estás?" },
  { hanzi: "我很好。", pinyin: "Wǒ hěn hǎo.", meaning: "Estoy muy bien." },
  { hanzi: "你呢？", pinyin: "Nǐ ne?", meaning: "¿Y tú?" },
  { hanzi: "我也很好。", pinyin: "Wǒ yě hěn hǎo.", meaning: "Yo también estoy muy bien." },
  { hanzi: "再见！", pinyin: "Zàijiàn!", meaning: "¡Adiós!" }
];

let currentWord = 0;
let deferredPrompt = null;
let quizQuestions = [];
let quizIndex = 0;
let quizScore = 0;

const $ = (id) => document.getElementById(id);

function navigate(target) {
  document.querySelectorAll(".screen").forEach(s => s.classList.toggle("active", s.id === target));
  document.querySelectorAll(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.go === target));
  if (target === "quiz") startQuiz();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll("[data-go]").forEach(btn => {
  btn.addEventListener("click", () => navigate(btn.dataset.go));
});

function markSeen(index) {
  const seen = new Set(JSON.parse(localStorage.getItem("chinoSeen") || "[]"));
  seen.add(index);
  localStorage.setItem("chinoSeen", JSON.stringify([...seen]));
  updateStats();
}

function renderWord() {
  const w = words[currentWord];
  $("hanzi").textContent = w.hanzi;
  $("pinyin").textContent = w.pinyin;
  $("meaning").textContent = w.meaning;
  $("tip").textContent = w.tip;
  $("wordIndex").textContent = `${currentWord + 1} / ${words.length}`;
  $("prevWord").disabled = currentWord === 0;
  $("nextWord").textContent = currentWord === words.length - 1 ? "Volver al inicio" : "Siguiente →";
  markSeen(currentWord);
}

$("prevWord").addEventListener("click", () => {
  if (currentWord > 0) { currentWord--; renderWord(); }
});

$("nextWord").addEventListener("click", () => {
  if (currentWord < words.length - 1) { currentWord++; renderWord(); }
  else navigate("inicio");
});

function speakChinese(text) {
  if (!("speechSynthesis" in window)) {
    alert("Tu navegador no tiene lectura de voz disponible.");
    return;
  }
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "zh-CN";
  utter.rate = 0.82;
  utter.pitch = 1;
  const voices = window.speechSynthesis.getVoices();
  const zhVoice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith("zh"));
  if (zhVoice) utter.voice = zhVoice;
  window.speechSynthesis.speak(utter);
}

$("speakWord").addEventListener("click", () => speakChinese(words[currentWord].hanzi));
$("speakNi").addEventListener("click", () => speakChinese("你"));

function renderPhrases() {
  $("phraseList").innerHTML = phrases.map((p, i) => `
    <article class="phrase-card">
      <div>
        <div class="phrase-hanzi">${p.hanzi}</div>
        <div class="phrase-pinyin">${p.pinyin}</div>
        <div class="phrase-meaning">${p.meaning}</div>
      </div>
      <button class="icon-btn phrase-speak" data-index="${i}" type="button" aria-label="Escuchar ${p.hanzi}">🔊</button>
    </article>
  `).join("");

  document.querySelectorAll(".phrase-speak").forEach(btn => {
    btn.addEventListener("click", () => speakChinese(phrases[Number(btn.dataset.index)].hanzi));
  });
}

function shuffled(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function makeQuiz() {
  return shuffled(words).slice(0, 5).map(word => {
    const wrong = shuffled(words.filter(w => w.meaning !== word.meaning)).slice(0, 3).map(w => w.meaning);
    return { ...word, options: shuffled([word.meaning, ...wrong]) };
  });
}

function startQuiz() {
  quizQuestions = makeQuiz();
  quizIndex = 0;
  quizScore = 0;
  $("quizCard").classList.remove("hidden");
  $("quizResult").classList.add("hidden");
  renderQuizQuestion();
}

function renderQuizQuestion() {
  const q = quizQuestions[quizIndex];
  $("quizProgress").textContent = `${quizIndex + 1} / 5`;
  $("quizHanzi").textContent = q.hanzi;
  $("quizPinyin").textContent = q.pinyin;
  $("answers").innerHTML = q.options.map(opt => `<button class="answer-btn" type="button">${opt}</button>`).join("");

  document.querySelectorAll(".answer-btn").forEach(btn => {
    btn.addEventListener("click", () => selectAnswer(btn, q));
  });
}

function selectAnswer(btn, q) {
  const buttons = [...document.querySelectorAll(".answer-btn")];
  buttons.forEach(b => b.disabled = true);
  const correct = btn.textContent === q.meaning;
  if (correct) {
    quizScore++;
    btn.classList.add("correct");
  } else {
    btn.classList.add("wrong");
    buttons.find(b => b.textContent === q.meaning)?.classList.add("correct");
  }

  setTimeout(() => {
    quizIndex++;
    if (quizIndex < quizQuestions.length) renderQuizQuestion();
    else finishQuiz();
  }, 650);
}

function finishQuiz() {
  $("quizCard").classList.add("hidden");
  $("quizResult").classList.remove("hidden");
  $("quizProgress").textContent = "5 / 5";
  $("resultText").textContent = `Obtuviste ${quizScore} de 5. ${quizScore >= 4 ? "¡Muy bien!" : "Repasa las tarjetas y vuelve a intentarlo."}`;
  const best = Math.max(Number(localStorage.getItem("chinoBest") || 0), quizScore);
  localStorage.setItem("chinoBest", String(best));
  updateStats();
}

$("restartQuiz").addEventListener("click", startQuiz);

function updateStats() {
  const seen = JSON.parse(localStorage.getItem("chinoSeen") || "[]").length;
  const best = Number(localStorage.getItem("chinoBest") || 0);
  $("seenCount").textContent = seen;
  $("bestScore").textContent = best;
}

const canvas = $("drawCanvas");
const ctx = canvas.getContext("2d");
ctx.lineWidth = 18;
ctx.lineCap = "round";
ctx.lineJoin = "round";
ctx.strokeStyle = "#111827";
let drawing = false;

function canvasPoint(e) {
  const rect = canvas.getBoundingClientRect();
  const source = e.touches ? e.touches[0] : e;
  return {
    x: (source.clientX - rect.left) * (canvas.width / rect.width),
    y: (source.clientY - rect.top) * (canvas.height / rect.height)
  };
}

function startDraw(e) {
  drawing = true;
  const p = canvasPoint(e);
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  e.preventDefault();
}
function draw(e) {
  if (!drawing) return;
  const p = canvasPoint(e);
  ctx.lineTo(p.x, p.y);
  ctx.stroke();
  e.preventDefault();
}
function endDraw() { drawing = false; }

["pointerdown"].forEach(ev => canvas.addEventListener(ev, startDraw));
["pointermove"].forEach(ev => canvas.addEventListener(ev, draw));
["pointerup","pointerleave","pointercancel"].forEach(ev => canvas.addEventListener(ev, endDraw));
$("clearCanvas").addEventListener("click", () => ctx.clearRect(0, 0, canvas.width, canvas.height));

window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault();
  deferredPrompt = e;
  $("installBtn").classList.remove("hidden");
});
$("installBtn").addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  $("installBtn").classList.add("hidden");
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}

renderPhrases();
renderWord();
updateStats();
