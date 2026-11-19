/* =========================================================
   任務檢核模擬：📊 日報表自動核對／👑 公會長審核
   - 還沒有資料庫：日報表與審核清單都存在本機瀏覽器（同一台瀏覽器模擬新人與店長）。
   - 之後接資料庫，只要換掉 v4VerifyLoad／v4VerifySave（讀日報、存審核）兩處。
   - 任務完成、發獎勵仍呼叫既有的 submitCurrentTaskDemo，判定與獎勵邏輯不變。
   ========================================================= */

// 日報表欄位（模擬公司日報表上能看到的數字）
const V4_REPORT_FIELDS = {
  visits: '社區拜訪',
  gatekeeper: '管理員／守門人接觸',
  calls: '電話／訊息聯繫',
  appointments: '帶看預約',
  cold: '陌生接觸（派報／舉牌）'
};
// 任務分類設定：mode＝report（日報表自動核對）或 manager（公會長審核）
// native：既有流程本來就有審核（社區勘查），只顯示標籤不另外攔截
const V4_TASK_VERIFY = {
  dev_m_01: { mode: 'manager', native: true },
  dev_m_02: { mode: 'report', field: 'visits', min: 1 },
  dev_m_03: { mode: 'manager' },
  dev_m_04: { mode: 'report', field: 'gatekeeper', min: 1 },
  sal_m_01: { mode: 'manager' },
  sal_m_02: { mode: 'manager' },
  sal_m_03: { mode: 'report', field: 'calls', min: 1 },
  sal_m_04: { mode: 'report', field: 'appointments', min: 1 },
  com_m_01: { mode: 'report', field: 'cold', min: 1 },
  com_m_02: { mode: 'manager' },
  com_m_03: { mode: 'manager' }
};
const V4_VERIFY_KEY = 'sinyi-v4-task-verify-v1';
let v4VerifyBypass = false;

/* ---------- 存取（之後換成 API） ---------- */
function v4Today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function v4VerifyLoad() {
  try {
    const data = JSON.parse(localStorage.getItem(V4_VERIFY_KEY) || 'null');
    if (data && data.version === 1) return { reports: data.reports || {}, reviews: data.reviews || {}, waiting: data.waiting || {} };
  } catch { /* 讀不到就用空資料 */ }
  return { reports: {}, reviews: {}, waiting: {} };
}
function v4VerifySave(state) {
  try { localStorage.setItem(V4_VERIFY_KEY, JSON.stringify({ version: 1, ...state })); } catch { /* 無法存檔時只在本次生效 */ }
}
function v4TodayReport(state = v4VerifyLoad()) { return state.reports[v4Today()] || {}; }
function v4ReportMeets(cfg, report = v4TodayReport()) { return (Number(report[cfg.field]) || 0) >= (cfg.min || 1); }

function v4SlotById(routeKey, id) { return v4Safe(() => routeTasksData[routeKey].slots.find(s => s.id === id), null); }
function v4VerifyStatus(slot) {
  if (!slot) return null;
  const cfg = V4_TASK_VERIFY[slot.id];
  if (!cfg || slot.isCompleted) return null;
  const state = v4VerifyLoad();
  if (cfg.mode === 'manager') return state.reviews[slot.id]?.status || null; // pending／returned
  return state.waiting[slot.id] ? 'waiting' : null;
}

/* ---------- 完成任務（呼叫既有完成流程） ---------- */
function v4CompleteTask(routeKey, id, content) {
  const slot = v4SlotById(routeKey, id);
  if (!slot || slot.isCompleted) return false;
  if (Array.isArray(slot.checkItems)) slot.checkItems.forEach(item => { item.checked = true; });
  if (slot.type === 'input_notes') {
    // 既有完成流程會讀委託視窗內的筆記欄；從後台完成時補一個隱藏欄位帶入送審內容
    let note = document.getElementById('task-note-textarea');
    if (!note) {
      note = document.createElement('textarea');
      note.id = 'task-note-textarea';
      note.hidden = true;
      document.getElementById('modal-task-content')?.appendChild(note);
    }
    note.value = content || slot.defaultNote || '公會長審核通過';
  }
  activeTaskInModal = { routeKey, slot };
  v4VerifyBypass = true;
  try { submitCurrentTaskDemo(); } finally { v4VerifyBypass = false; }
  return slot.isCompleted;
}

// 送審內容：筆記欄、勾選項目，或通用說明
function v4CollectContent(slot) {
  const note = document.getElementById('task-note-textarea');
  if (slot.type === 'input_notes' && note) return note.value.trim();
  if (Array.isArray(slot.checkItems)) return slot.checkItems.map(i => `${i.checked ? '☑' : '☐'} ${i.text}`).join('\n');
  return `已完成「${slot.title}」，請公會長確認。`;
}

/* ---------- 新人端：攔截「完成並領獎」 ---------- */
function v4HandleSubmit(original, args) {
  if (v4VerifyBypass) return original.apply(this, args);
  const slot = v4Safe(() => activeTaskInModal.slot, null);
  const routeKey = v4Safe(() => activeTaskInModal.routeKey, null);
  const cfg = slot && V4_TASK_VERIFY[slot.id];
  if (!cfg || cfg.native || slot.isCompleted) return original.apply(this, args);

  // 先做既有的必填檢查（筆記不可空白、勾選需全勾）
  if (slot.type === 'input_notes' && !document.getElementById('task-note-textarea')?.value.trim()) { showCustomToast('請先填寫任務筆記。', '✍️'); return; }
  if (slot.type === 'checklist' && slot.checkItems && !slot.checkItems.every(i => i.checked)) { showCustomToast('請先將所有實務走訪項目全數打勾確認！', '⚠️'); return; }

  const state = v4VerifyLoad();
  if (cfg.mode === 'report') {
    if (v4ReportMeets(cfg, v4TodayReport(state))) {
      delete state.waiting[slot.id];
      v4VerifySave(state);
      const result = original.apply(this, args);
      showCustomToast(`📊 日報表核對通過：${V4_REPORT_FIELDS[cfg.field]} 已達標`, '✅');
      return result;
    }
    state.waiting[slot.id] = { routeKey, since: new Date().toISOString() };
    v4VerifySave(state);
    closeModal('modal-task-action');
    showCustomToast(`今天的日報還沒有「${V4_REPORT_FIELDS[cfg.field]}」紀錄，日報送出後會自動完成`, '📊');
    v4AfterVerifyChange();
    return;
  }
  // 公會長審核
  if (state.reviews[slot.id]?.status === 'pending') { showCustomToast('已在公會長審核中，請耐心等候。', '👑'); return; }
  state.reviews[slot.id] = { status: 'pending', routeKey, title: slot.title, tag: slot.tag, content: v4CollectContent(slot), feedback: '', submittedAt: new Date().toISOString() };
  v4VerifySave(state);
  closeModal('modal-task-action');
  showCustomToast('已交給公會長審核，核可後會自動發放獎勵', '👑');
  v4AfterVerifyChange();
}

// 日報送出後：自動核對等待中的任務（模擬公司每日批次對帳）
function v4ProcessWaiting() {
  const state = v4VerifyLoad();
  const done = [];
  for (const [id, info] of Object.entries(state.waiting)) {
    const cfg = V4_TASK_VERIFY[id];
    const slot = v4SlotById(info.routeKey, id);
    if (!cfg || !slot || slot.isCompleted) { delete state.waiting[id]; continue; }
    if (v4ReportMeets(cfg, v4TodayReport(state))) { delete state.waiting[id]; done.push([info.routeKey, id, slot.title]); }
  }
  v4VerifySave(state);
  done.forEach(([routeKey, id]) => v4CompleteTask(routeKey, id));
  return done.map(d => d[2]);
}

/* ---------- 新人端：委託視窗與任務條顯示分類／狀態 ---------- */
const V4_STATUS_TEXT = { waiting: '等待日報', pending: '審核中', returned: '退回補正' };
function v4DecorateVerifyModal(routeKey, id) {
  const panel = document.getElementById('modal-task-action')?.firstElementChild;
  const slot = v4SlotById(routeKey, id);
  if (!panel || !slot) return;
  panel.querySelector('.v4-verify-box')?.remove();
  const cfg = V4_TASK_VERIFY[slot.id];
  const submit = panel.querySelector(':scope > button:last-of-type');
  if (submit) { submit.textContent = '確認完成並領取獎勵'; submit.disabled = false; } // 委託視窗共用，每次先還原
  if (!cfg) return;
  const status = v4VerifyStatus(slot);
  const state = v4VerifyLoad();
  const box = document.createElement('div');
  box.className = `v4-verify-box is-${cfg.mode}`;
  if (cfg.mode === 'report') {
    const have = Number(v4TodayReport(state)[cfg.field]) || 0;
    box.innerHTML = `<b>📊 日報表自動核對</b><p>今日日報「${V4_REPORT_FIELDS[cfg.field]}」：<em>${have}</em> 筆（需 ≥ ${cfg.min || 1}）</p>
      ${status === 'waiting' ? '<p class="v4-verify-state">⏳ 等待日報：日報送出達標後會自動完成</p>' : ''}`;
    if (submit && !cfg.native) submit.textContent = '核對日報表並完成';
  } else {
    const review = state.reviews[slot.id];
    box.innerHTML = `<b>👑 公會長審核</b><p>${cfg.native ? '社區勘查資料送出後，由公會長在後台核可。' : '送出後由公會長在後台核可，核可後自動發放獎勵。'}</p>
      ${status === 'pending' ? '<p class="v4-verify-state">⏳ 審核中：已送出，等待公會長核可</p>' : ''}
      ${status === 'returned' ? `<p class="v4-verify-state is-returned">↩ 退回補正：${v4Esc(review?.feedback || '')}</p>` : ''}`;
    if (submit && !cfg.native) {
      submit.textContent = status === 'returned' ? '修改後重新送審' : status === 'pending' ? '審核中…' : '交給公會長審核';
      submit.disabled = status === 'pending';
    }
  }
  (document.getElementById('modal-task-title') || panel.firstElementChild).after(box);
}

function v4DecorateVerifyStrips() {
  document.querySelectorAll('#tasks-slots-container .v4-strip').forEach(strip => {
    const btn = strip.querySelector('[onclick^="openTaskActionModal"]');
    const match = (btn?.getAttribute('onclick') || '').match(/openTaskActionModal\('(\w+)',\s*'(\w+)'\)/);
    const cfgId = match?.[2] || strip.dataset.v4SlotId;
    if (match) strip.dataset.v4SlotId = match[2];
    const cfg = V4_TASK_VERIFY[cfgId];
    if (!cfg || strip.querySelector('.v4-verify-tag')) return;
    const small = strip.querySelector('.v4-strip-body small');
    small?.insertAdjacentHTML('beforeend', `<span class="v4-verify-tag is-${cfg.mode}">${cfg.mode === 'report' ? '📊 日報表' : '👑 公會長'}</span>`);
    const slot = match ? v4SlotById(match[1], match[2]) : null;
    const status = v4VerifyStatus(slot);
    if (btn && status) { btn.textContent = V4_STATUS_TEXT[status]; btn.classList.add('is-status', 'is-' + status); }
  });
}

function v4AfterVerifyChange() {
  if (typeof switchRoute === 'function') switchRoute(v4Safe(() => currentActiveRouteKey, 'dev'));
}

// 日報登錄與任務審核介面在公會長後台（manager.html / manager.js），資料共用 sinyi-v4-task-verify-v1

/* ---------- 啟動與包裝 ---------- */
window.addEventListener('DOMContentLoaded', () => {
  const originalSubmit = submitCurrentTaskDemo;
  submitCurrentTaskDemo = function (...args) { return v4HandleSubmit.call(this, originalSubmit, args); };
  const originalOpen = openTaskActionModal;
  openTaskActionModal = function (routeKey, id, ...rest) {
    const result = originalOpen.call(this, routeKey, id, ...rest);
    v4DecorateVerifyModal(routeKey, id);
    return result;
  };
  const originalRoute = switchRoute;
  switchRoute = function (...args) { const r = originalRoute.apply(this, args); v4DecorateVerifyStrips(); return r; };
  // 店長的審核與日報已搬到獨立的公會長後台（manager.html）；新人 APP 只負責讀取結果並入帳
  const originalSwitchTab = switchTab;
  switchTab = function (...args) { const r = originalSwitchTab.apply(this, args); v4SyncFromManager(); return r; };
  window.addEventListener('storage', event => { if (event.key === V4_VERIFY_KEY) v4SyncFromManager(); });
  v4DecorateVerifyStrips();
});

/* ---------- 從公會長後台同步：核可的任務、登錄的日報 ---------- */
let v4Syncing = false;
function v4SyncFromManager() {
  if (v4Syncing || document.getElementById('app-shell')?.classList.contains('v4-quiz-lock') || !v4Safe(() => isQuizCompleted, false)) return;
  v4Syncing = true;
  try {
    const state = v4VerifyLoad();
    const approved = Object.entries(state.reviews).filter(([, r]) => r.status === 'approved');
    const titles = [];
    for (const [id, review] of approved) {
      delete state.reviews[id];
      v4VerifySave(state);
      if (v4CompleteTask(review.routeKey, id, review.content)) titles.push(review.title);
    }
    const reportDone = v4ProcessWaiting();
    if (titles.length) showCustomToast(`公會長已核可：${titles.join('、')}`, '👑');
    else if (reportDone.length) showCustomToast(`日報核對通過：${reportDone.join('、')}`, '📊');
    if (titles.length || reportDone.length || approved.length) v4AfterVerifyChange();
  } finally { v4Syncing = false; }
}
