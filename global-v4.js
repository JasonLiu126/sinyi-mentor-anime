/* =========================================================
   V4 全域：職業覺醒（1-1～1-4）、全域 Modal（7-1～7-4）、學長浮動頭像
   - 測驗計分、路線選擇、店長後台、測試後台、每日修練、學長引導的功能都不變，只換外觀。
   ========================================================= */
const V4_ROMANS = ['I', 'II', 'III', 'IV', 'V', 'VI'];

/* ---------- 覺醒試煉（1-1／1-2） ---------- */
function v4BuildQuiz() {
  const flow = document.getElementById('screen-quiz-flow');
  if (!flow || document.getElementById('v4-quiz-head')) return;
  flow.firstElementChild?.classList.add('v4-old-quiz-intro');
  const head = document.createElement('div');
  head.id = 'v4-quiz-head';
  head.innerHTML = `<div class="v4-quiz-top"><div><small class="v4-en">AWAKENING TRIAL</small><h2 class="v4-serif">職業覺醒試煉</h2></div><b class="v4-en" id="v4-quiz-roman">I / VI</b></div>
    <div class="v4-gems" id="v4-gems" aria-hidden="true">${V4_ROMANS.map(() => '<i></i>').join('')}</div>`;
  flow.prepend(head);
  const title = document.getElementById('quiz-question-title');
  const card = title?.parentElement;
  if (card) {
    card.classList.add('v4-question-card', 'v4-parch');
    card.insertAdjacentHTML('afterbegin', `<img class="v4-question-mentor" src="${V4_ASSET}mentor_face.jpg" alt="阿義學長">`);
  }
  document.getElementById('quiz-container')?.classList.add('v4-quiz');
}
function v4RenderQuizHead() {
  const idx = v4Safe(() => currentQuizIndex, 0);
  const roman = document.getElementById('v4-quiz-roman');
  if (roman) roman.textContent = `${V4_ROMANS[idx] || idx + 1} / VI`;
  document.querySelectorAll('#v4-gems i').forEach((gem, i) => { gem.className = i < idx ? 'is-done' : i === idx ? 'is-current' : ''; });
}

/* ---------- 職業揭曉（1-3） ---------- */
function v4BuildAwaken() {
  const card = document.getElementById('card-recommendation');
  if (!card || document.getElementById('v4-awaken')) return;
  card.classList.add('v4-awaken-card');
  const block = document.createElement('div');
  block.id = 'v4-awaken';
  card.prepend(block);
  const confirm = card.querySelector('[onclick="confirmAndEnterApp()"]');
  if (confirm) { confirm.classList.add('v4-confirm-class'); card.appendChild(confirm); }
}
function v4RenderAwaken() {
  const block = document.getElementById('v4-awaken');
  if (!block) return;
  const dev = v4Safe(() => currentSelectedDevCode, 'A');
  const sal = v4Safe(() => currentSelectedSalCode, 'E');
  const devDef = v4Safe(() => devStyleDefinitions[dev], {}) || {};
  const salDef = v4Safe(() => salStyleDefinitions[sal], {}) || {};
  const classCard = (kind, code, def) => `<div class="v4-class-card is-${kind}">
      <div class="v4-class-band v4-serif">${kind === 'dev' ? '開發之道' : '銷售之道'}</div>
      <img src="${v4ClassArt(code)}" alt="">
      <b class="v4-serif">${v4ClassOf(code).name}</b><span>${v4Esc(def.name || '')}</span>
      <button type="button" onclick="openChangeRouteModal('${kind}')">⇄ 更換</button></div>`;
  block.innerHTML = `<div class="v4-awaken-rays" aria-hidden="true"></div>
    <div class="v4-awaken-title"><b class="v4-en">AWAKENED</b><span>你的雙軌起步職業</span></div>
    <div class="v4-class-pair">${classCard('dev', dev, devDef)}${classCard('sal', sal, salDef)}</div>
    <div class="v4-parch v4-awaken-mentor"><img src="${V4_ASSET}mentor_face.jpg" alt="阿義學長"><p>${v4Esc(devDef.dimension || '')}是你的起手式，${v4Esc(salDef.dimension || '')}幫你接住買方！</p></div>`;
}

/* ---------- 更換職業 Modal（1-4）：每列加角色半身圖與職業名 ---------- */
function v4DecorateRouteModal(type) {
  const list = document.getElementById('route-options-list');
  if (!list) return;
  const defs = v4Safe(() => (type === 'dev' ? devStyleDefinitions : salStyleDefinitions), {});
  Object.keys(defs).forEach((code, i) => {
    const btn = list.children[i];
    if (!btn || btn.querySelector('.v4-route-art')) return;
    btn.classList.add('v4-route-row');
    btn.insertAdjacentHTML('afterbegin', `<img class="v4-route-art" src="${v4ClassArt(code)}" alt="">`);
    const name = btn.querySelector('.text-xs.font-black');
    if (name && V4_CLASSES[code]) name.insertAdjacentHTML('beforebegin', `<b class="v4-route-class v4-serif">${V4_CLASSES[code].name}</b>`);
  });
}

/* ---------- 全域 Modal 與學長浮動頭像 ---------- */
function v4DecorateGlobal() {
  const float = document.getElementById('mentor-float');
  const img = float?.querySelector('img');
  if (img && !img.dataset.v4) { img.dataset.v4 = '1'; img.src = V4_ASSET + 'mentor_face.jpg'; }
  float?.classList.add('v4-mentor-float');
  document.querySelectorAll('.ff-panel, .mt-window, .ta-panel').forEach(p => p.classList.add('v4-global-panel'));
  const labels = { 'formal-journey-modal-title': '每日修練', 'formal-mentor-modal-title': '學長引導', 'mt-title': '公會長任務後台' };
  for (const [id, text] of Object.entries(labels)) { const el = document.getElementById(id); if (el && !el.dataset.v4) { el.dataset.v4 = '1'; el.textContent = text; } }
}

/* ---------- 每次進入都要重做職業覺醒試煉 ---------- */
// true：每次打開網頁都從第 1 題開始，完成並按「確認職業，進入主城」後才能使用其他功能。
// 想恢復「做過一次就直接進主城」，改成 false 即可。
const V4_QUIZ_EVERY_VISIT = true;
let v4QuizForced = false;

function v4LockForQuiz(locked) {
  document.getElementById('app-shell')?.classList.toggle('v4-quiz-lock', locked);
}
function v4ForceQuizOnEntry() {
  if (!V4_QUIZ_EVERY_VISIT || v4QuizForced) return;
  if (!v4Safe(() => isQuizCompleted, false)) { v4QuizForced = true; return; } // 首次使用：原本就會開測驗
  v4QuizForced = true;
  v4LockForQuiz(true);
  formalQuizOpen(true); // 清空本次作答，從第 1 題開始
}

// 使用紀錄讀取完成後（formal-local 會發出 formal-profile-ready）再開測驗，避免被開機流程蓋掉。
// 該事件可能在其他 DOMContentLoaded 處理中就觸發，所以在檔案載入時就先註冊。
window.addEventListener('formal-profile-ready', () => setTimeout(v4ForceQuizOnEntry, 0));

v4BuildQuiz();
v4BuildAwaken();

window.addEventListener('DOMContentLoaded', () => {
  const wrap = (name, after) => {
    if (typeof window[name] !== 'function') return;
    const original = window[name];
    window[name] = function (...args) { const r = original.apply(this, args); after(...args); return r; };
  };
  wrap('renderQuizQuestion', () => v4RenderQuizHead());
  wrap('renderSelectedRouteRecommendations', () => v4RenderAwaken());
  wrap('openChangeRouteModal', type => v4DecorateRouteModal(type));
  wrap('selectCustomRoute', () => v4RenderAwaken());
  // 完成測驗並確認職業後解除鎖定
  const originalConfirm = confirmAndEnterApp;
  confirmAndEnterApp = async function (...args) {
    const wasLocked = document.getElementById('app-shell')?.classList.contains('v4-quiz-lock');
    v4LockForQuiz(false); // 讓確認流程內的 switchTab 能執行
    try { return await originalConfirm.apply(this, args); }
    finally { if (wasLocked && !document.getElementById('screen-quiz-flow')?.classList.contains('hidden')) v4LockForQuiz(true); }
  };
  // 鎖定期間擋下其他入口（HUD、按鈕）切頁
  const originalSwitch = switchTab;
  switchTab = function (...args) {
    if (document.getElementById('app-shell')?.classList.contains('v4-quiz-lock')) {
      showCustomToast('請先完成職業覺醒試煉，再進入主城！', '🔒');
      return;
    }
    return originalSwitch.apply(this, args);
  };

  v4DecorateGlobal();
  v4RenderQuizHead();
  v4RenderAwaken();
});
