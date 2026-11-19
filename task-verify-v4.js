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
  v4RenderReviewQueue();
  v4RenderReportForm();
}

/* ---------- 測試後台：今日日報（模擬） ---------- */
function v4BuildReportForm() {
  const body = document.querySelector('#test-admin-modal .ta-body');
  if (!body || document.getElementById('v4-report-form')) return;
  const section = document.createElement('section');
  section.id = 'v4-report-form';
  section.className = 'v4-report-form';
  body.prepend(section);
  v4RenderReportForm();
}
function v4RenderReportForm() {
  const section = document.getElementById('v4-report-form');
  if (!section) return;
  const report = v4TodayReport();
  const waiting = Object.keys(v4VerifyLoad().waiting).length;
  section.innerHTML = `<h3>今日日報（模擬）</h3>
    <p>模擬公司日報表。送出後，📊 類任務會自動核對；等待中 ${waiting} 項。</p>
    <div class="v4-report-grid">${Object.entries(V4_REPORT_FIELDS).map(([k, label]) => `<label>${label}<input type="number" min="0" max="99" inputmode="numeric" name="${k}" value="${Number(report[k]) || 0}"></label>`).join('')}</div>
    <div class="ta-actions"><button type="button" data-v4-report="save">送出日報</button><button type="button" data-v4-report="sample">產生範例日報</button><button type="button" data-v4-report="clear">清除今日日報</button></div>`;
  section.querySelectorAll('[data-v4-report]').forEach(btn => btn.addEventListener('click', () => v4ReportAction(btn.dataset.v4Report)));
}
function v4ReportAction(action) {
  const state = v4VerifyLoad();
  const today = v4Today();
  if (action === 'clear') delete state.reports[today];
  else if (action === 'sample') state.reports[today] = { visits: 2, gatekeeper: 1, calls: 3, appointments: 1, cold: 1 };
  else {
    const values = {};
    document.querySelectorAll('#v4-report-form input[name]').forEach(input => { values[input.name] = Math.max(0, Math.min(99, parseInt(input.value, 10) || 0)); });
    state.reports[today] = values;
  }
  v4VerifySave(state);
  const done = action === 'clear' ? [] : v4ProcessWaiting();
  showCustomToast(action === 'clear' ? '已清除今日日報' : done.length ? `日報核對完成：${done.join('、')}` : '日報已送出，沒有等待核對的任務', '📊');
  v4AfterVerifyChange();
}

/* ---------- 店長後台：任務審核 ---------- */
function v4BuildReviewQueue() {
  const dialog = document.getElementById('mt-dialog');
  const anchor = dialog?.querySelector('.mt-compose') || dialog?.querySelector('.mt-body');
  if (!anchor || document.getElementById('v4-review-queue')) return;
  const section = document.createElement('section');
  section.id = 'v4-review-queue';
  section.className = 'fl-panel v4-review-queue';
  if (anchor.classList.contains('mt-body')) anchor.prepend(section); else anchor.before(section);
  v4RenderReviewQueue();
}
function v4RenderReviewQueue() {
  const section = document.getElementById('v4-review-queue');
  if (!section) return;
  const reviews = Object.entries(v4VerifyLoad().reviews).filter(([, r]) => r.status === 'pending');
  section.innerHTML = `<h3>任務審核 <small>${reviews.length} 件待審</small></h3>
    ${reviews.length ? reviews.map(([id, r]) => `<article class="v4-review-item" data-id="${id}">
      <div class="v4-review-top"><b>${v4Esc(r.tag || '')}｜${v4Esc(r.title || '')}</b><small>${new Date(r.submittedAt).toLocaleString('zh-TW', { hour12: false })}</small></div>
      <pre class="v4-review-content">${v4Esc(r.content || '')}</pre>
      <label>退回原因（退回時必填）<textarea rows="2" maxlength="300" data-feedback></textarea></label>
      <div class="ta-actions"><button type="button" value="approved" class="fl-primary">核可</button><button type="button" value="returned">退回補正</button></div>
    </article>`).join('') : '<p class="mt-empty">目前沒有待審核的任務。</p>'}`;
  section.querySelectorAll('.v4-review-item').forEach(item => item.querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => {
    v4ReviewDecide(item.dataset.id, btn.value, item.querySelector('[data-feedback]').value.trim());
  })));
}
function v4ReviewDecide(id, decision, feedback) {
  const state = v4VerifyLoad();
  const review = state.reviews[id];
  if (!review) return;
  if (decision === 'returned') {
    if (!feedback) { showCustomToast('退回時請填寫補正原因。', '⚠️'); return; }
    review.status = 'returned';
    review.feedback = feedback;
    v4VerifySave(state);
    showCustomToast(`已退回「${review.title}」`, '↩');
  } else {
    delete state.reviews[id];
    v4VerifySave(state);
    v4CompleteTask(review.routeKey, id, review.content);
    showCustomToast(`已核可「${review.title}」，獎勵已發放`, '✅');
  }
  v4AfterVerifyChange();
}

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
  if (typeof managerOpen === 'function') {
    const originalManagerOpen = managerOpen;
    managerOpen = function (...args) { const r = originalManagerOpen.apply(this, args); v4BuildReviewQueue(); v4RenderReviewQueue(); return r; };
  }
  if (typeof openTestAdmin === 'function') {
    const originalAdmin = openTestAdmin;
    openTestAdmin = function (...args) { const r = originalAdmin.apply(this, args); v4BuildReportForm(); v4RenderReportForm(); return r; };
  }
  v4BuildReviewQueue();
  v4BuildReportForm();
  v4DecorateVerifyStrips();
});
