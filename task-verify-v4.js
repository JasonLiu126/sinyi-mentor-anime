/* =========================================================
   任務檢核（新人端）：依《信義新星 任務與成長系統規格》
   - 📊 日報判定：讀公司日報系統（店長已在該系統審核）每天同步 2 次的數字，從「接任務當天」起累計達標即完成
   - 👑 店長判定：新人送審 → 店長核可／退回（最多退回 3 次，第 3 次退回任務結束）
   - 經驗值依難度（小 20／中 40／大 80），分配到最多 3 項能力
   - 每筆任務的接取、送審、審核、完成都寫入任務紀錄，給公會長後台查看
   - 尚未接資料庫：資料存在本機瀏覽器；之後替換 v4VerifyLoad／v4VerifySave／v4Log 即可
   ========================================================= */

// 日報欄位、任務設定、系統參數改由 content-v4.js 提供（PM 後台修改、PO 核准後生效）
const V4_REPORT_FIELDS = V4C_REPORT_FIELDS;
const V4_TIER_EXP = { S: 20, M: 40, L: 80 };
const V4_TIER_NAME = { S: '小', M: '中', L: '大' };
const V4_TASK_VERIFY = {};
let V4_MAX_RETURNS = 3;
// 套用目前生效的內容；已接取的任務沿用接取當時的設定，不受後續改版影響
function v4ApplyContent() {
  const pub = v4cPublished();
  const snaps = v4VerifyLoad().acceptedCfg;
  for (const [id, cfg] of Object.entries(pub.tasks)) V4_TASK_VERIFY[id] = snaps[id] || cfg;
  V4_MAX_RETURNS = pub.params.maxReturns || 3;
}
const V4_SKILL_NAMES = {
  tax: '稅務', mortgage: '貸款', contract: '契據', law: '不動產法規', market: '商圈行情',
  dev_local: '地緣深耕', dev_track: '踩線', dev_resource: '資源盤點', dev_brand: '個人品牌',
  sal_stranger: '陌生獲客', sal_present: '物件介紹', sal_resource: '資源盤點', sal_market: '行銷'
};
const V4_VERIFY_KEY = 'sinyi-v4-task-verify-v1';
const V4_LOG_KEY = 'sinyi-v4-task-log-v1';
const V4_RESET_KEY = 'sinyi-v4-reset-at';
let v4VerifyBypass = false;
let v4AbilitySplit = null;

/* ---------- 存取（之後換成 API） ---------- */
function v4Today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function v4VerifyLoad() {
  try {
    const data = JSON.parse(localStorage.getItem(V4_VERIFY_KEY) || 'null');
    if (data && data.version === 1) return { reports: data.reports || {}, reviews: data.reviews || {}, accepted: data.accepted || {}, acceptedCfg: data.acceptedCfg || {}, lastSync: data.lastSync || null };
  } catch { /* 讀不到就用空資料 */ }
  return { reports: {}, reviews: {}, accepted: {}, acceptedCfg: {}, lastSync: null };
}
function v4VerifySave(state) {
  try { localStorage.setItem(V4_VERIFY_KEY, JSON.stringify({ version: 1, reports: state.reports, reviews: state.reviews, accepted: state.accepted, acceptedCfg: state.acceptedCfg || {}, lastSync: state.lastSync || null })); } catch { /* 無法存檔時只在本次生效 */ }
}
// 任務紀錄：只新增不覆寫
function v4Log(entry) {
  try {
    const list = JSON.parse(localStorage.getItem(V4_LOG_KEY) || '[]');
    list.push({ at: new Date().toISOString(), ...entry });
    localStorage.setItem(V4_LOG_KEY, JSON.stringify(list.slice(-500)));
  } catch { /* 無法寫入時略過 */ }
}

/* ---------- 日報（公司日報系統同步；只會同步店長已審核的數字） ---------- */
// 舊格式（直接存數字）視為已核可
const v4ReportValues = entry => (entry && entry.values) || (entry && !entry.status ? entry : {});
const v4ReportApproved = entry => !!entry && (!entry.status || entry.status === 'approved');
function v4ReportSum(field, sinceDate, state = v4VerifyLoad()) {
  return Object.entries(state.reports)
    .filter(([date, entry]) => date >= sinceDate && v4ReportApproved(entry))
    .reduce((sum, [, entry]) => sum + (Number(v4ReportValues(entry)[field]) || 0), 0);
}

/* ---------- 個資檢查 ---------- */
const V4_PII_RULES = [
  [/09\d{2}[-\s]?\d{3}[-\s]?\d{3}/, '手機號碼'],
  [/\b[A-Z][12]\d{8}\b/i, '身分證字號'],
  [/[\w.+-]+@[\w-]+\.[\w.]+/, 'Email']
];
function v4PiiFound(text) {
  const hit = V4_PII_RULES.find(([re]) => re.test(String(text || '')));
  return hit ? hit[1] : null;
}

/* ---------- 系統任務 ---------- */
function v4SlotById(routeKey, id) { return v4Safe(() => routeTasksData[routeKey].slots.find(s => s.id === id), null); }
function v4AllSlots() {
  return v4Safe(() => Object.entries(routeTasksData).flatMap(([rk, r]) => r.slots.map(s => [rk, s])), []);
}
// 依難度設定任務經驗（任務條、委託視窗顯示的數字也跟著變）
function v4ApplyTaskConfig() {
  v4ApplyContent();
  for (const [, slot] of v4AllSlots()) {
    const cfg = V4_TASK_VERIFY[slot.id];
    if (cfg?.tier) slot.rewardExp = V4_TIER_EXP[cfg.tier];
    if (slot.v4BaseTitle === undefined) slot.v4BaseTitle = slot.title;
    const base = V4C_BASE_TASKS[slot.id];
    if (cfg && base) slot.title = cfg.title && cfg.title !== base.title ? cfg.title : slot.v4BaseTitle;
  }
}
function v4AcceptTask(routeKey, slot) {
  if (!slot || slot.isCompleted || slot.isHidden) return;
  const state = v4VerifyLoad();
  if (state.accepted[slot.id]) return;
  state.accepted[slot.id] = v4Today();
  if (V4_TASK_VERIFY[slot.id]) state.acceptedCfg[slot.id] = JSON.parse(JSON.stringify(V4_TASK_VERIFY[slot.id]));
  v4VerifySave(state);
  const cfg = V4_TASK_VERIFY[slot.id];
  v4Log({ type: 'accepted', source: 'system', taskId: slot.id, title: slot.title, mode: cfg?.mode || 'manager' });
}
function v4VerifyStatus(slot) {
  if (!slot) return null;
  const cfg = V4_TASK_VERIFY[slot.id];
  if (!cfg || slot.isCompleted) return null;
  const state = v4VerifyLoad();
  if (cfg.mode === 'manager') return state.reviews[slot.id]?.status || null; // pending／returned／closed
  return state.accepted[slot.id] ? 'waiting' : null;
}
function v4ReportProgress(cfg, sinceDate, state) {
  return { have: v4ReportSum(cfg.field, sinceDate || v4Today(), state), need: cfg.min || 1 };
}

// 完成任務：依設定分配能力，再呼叫既有完成流程（發經驗、金幣、播動畫）
function v4CompleteTask(routeKey, id, content, via) {
  const slot = v4SlotById(routeKey, id);
  if (!slot || slot.isCompleted) return false;
  const cfg = V4_TASK_VERIFY[slot.id];
  if (cfg?.tier) slot.rewardExp = V4_TIER_EXP[cfg.tier];
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
  v4AbilitySplit = cfg?.abilities || null;
  v4VerifyBypass = true;
  try { submitCurrentTaskDemo(); } finally { v4VerifyBypass = false; v4AbilitySplit = null; }
  if (slot.isCompleted) {
    v4Log({ type: 'completed', source: 'system', taskId: slot.id, title: slot.title, via: via || cfg?.mode || 'manager', exp: slot.rewardExp, abilities: (cfg?.abilities || []).map(([, k, w]) => `${V4_SKILL_NAMES[k] || k} ${Math.round(w * 100)}%`).join('、') });
  }
  return slot.isCompleted;
}

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
  if (!cfg || slot.isCompleted) return original.apply(this, args);
  if (cfg.native) { // 社區勘查：既有流程，只補能力分配
    v4AbilitySplit = cfg.abilities;
    try { return original.apply(this, args); } finally { v4AbilitySplit = null; }
  }

  if (slot.type === 'input_notes' && !document.getElementById('task-note-textarea')?.value.trim()) { showCustomToast('請先填寫任務筆記。', '✍️'); return; }
  if (slot.type === 'checklist' && slot.checkItems && !slot.checkItems.every(i => i.checked)) { showCustomToast('請先將所有實務走訪項目全數打勾確認！', '⚠️'); return; }

  v4AcceptTask(routeKey, slot);
  const state = v4VerifyLoad();
  if (cfg.mode === 'report') {
    const p = v4ReportProgress(cfg, state.accepted[slot.id], state);
    if (p.have >= p.need) {
      closeModal('modal-task-action');
      v4CompleteTask(routeKey, slot.id, '', 'report');
      showCustomToast(`📊 日報核對通過：${V4_REPORT_FIELDS[cfg.field]} ${p.have}/${p.need}`, '✅');
      v4AfterVerifyChange();
      return;
    }
    closeModal('modal-task-action');
    showCustomToast(`日報「${V4_REPORT_FIELDS[cfg.field]}」目前 ${p.have}/${p.need}，公司日報同步後達標會自動完成`, '📊');
    v4AfterVerifyChange();
    return;
  }
  // 店長判定
  const prev = state.reviews[slot.id];
  if (prev?.status === 'pending') { showCustomToast('已在公會長審核中，請耐心等候。', '👑'); return; }
  if (prev?.status === 'closed') { showCustomToast(`這個任務已退回 ${V4_MAX_RETURNS} 次，任務已結束。`, '⛔'); return; }
  const content = v4CollectContent(slot);
  const pii = v4PiiFound(content);
  if (pii) { showCustomToast(`內容疑似包含客戶${pii}，請刪除個資後再送審`, '🔒'); return; }
  state.reviews[slot.id] = { status: 'pending', routeKey, title: slot.title, tag: slot.tag, content, feedback: prev?.feedback || '', returnCount: prev?.returnCount || 0, submittedAt: new Date().toISOString() };
  v4VerifySave(state);
  v4Log({ type: 'submitted', source: 'system', taskId: slot.id, title: slot.title, detail: content.slice(0, 200) });
  closeModal('modal-task-action');
  showCustomToast('已交給公會長審核（2 天內完成），核可後自動發放獎勵', '👑');
  v4AfterVerifyChange();
}

// 已接取的日報判定任務：店長核可新日報後自動核對
function v4ProcessReportTasks() {
  const state = v4VerifyLoad();
  const done = [];
  for (const [rk, slot] of v4AllSlots()) {
    const cfg = V4_TASK_VERIFY[slot.id];
    if (!cfg || cfg.mode !== 'report' || slot.isCompleted || !state.accepted[slot.id]) continue;
    const p = v4ReportProgress(cfg, state.accepted[slot.id], state);
    if (p.have >= p.need && v4CompleteTask(rk, slot.id, '', 'report')) done.push(slot.title);
  }
  return done;
}

/* ---------- 指派任務（公會長後台建立；欄位見規格「店長派發規則」） ---------- */
function v4AssignLoad() {
  try { const v = JSON.parse(localStorage.getItem('sinyi-formal-manager-tasks-v1') || 'null'); return v && v.version === 1 ? v : null; } catch { return null; }
}
function v4GrantAbilities(abilities, exp, reason) {
  const list = Array.isArray(abilities) && abilities.length ? abilities : [['soft_dev', 'dev_local', 1]];
  let left = exp;
  list.forEach(([cat, key, w], i) => {
    const pts = i === list.length - 1 ? left : Math.round(exp * w);
    left -= pts;
    if (pts > 0) addCapabilityExp(cat, key, pts, reason);
  });
}
// 日報判定的指派任務自動完成；已完成（日報或店長核可）但未發獎勵的發放經驗與能力（不發金幣）
function v4SyncAssigned() {
  const state = v4AssignLoad();
  if (!state) return [];
  const verify = v4VerifyLoad();
  const rewarded = [];
  let changed = false;
  for (const task of state.tasks) {
    if (task.member !== state.active) continue;
    if (task.status === 'todo' && task.verify === 'report' && task.reportField) {
      const have = v4ReportSum(task.reportField, (task.created || '').slice(0, 10) || v4Today(), verify);
      if (have >= (task.reportMin || 1)) { task.status = 'done'; task.reviewed = new Date().toISOString(); task.feedback = `日報核對通過（${have}/${task.reportMin || 1}）`; changed = true; }
    }
    if (task.status === 'done' && !task.rewarded) {
      const exp = V4_TIER_EXP[task.tier] || task.exp || 20;
      v4GrantAbilities(task.abilities, exp, `指派任務【${task.title}】`);
      task.rewarded = true; changed = true;
      rewarded.push(task.title);
      v4Log({ type: 'completed', source: 'assign', taskId: task.id, title: task.title, via: task.verify || 'manager', exp, abilities: (task.abilities || []).map(([, k, w]) => `${V4_SKILL_NAMES[k] || k} ${Math.round(w * 100)}%`).join('、') });
    }
  }
  if (changed) {
    if (typeof managerSave === 'function') managerSave(state); else localStorage.setItem('sinyi-formal-manager-tasks-v1', JSON.stringify(state));
    if (typeof managerRender === 'function') managerRender();
  }
  return rewarded;
}
// 新人端「額外任務」卡片：日報判定的任務不需回報，改顯示累計進度
function v4DecorateAssignCards() {
  const state = v4AssignLoad();
  if (!state) return;
  const verify = v4VerifyLoad();
  for (const task of state.tasks) {
    const area = document.getElementById('mt-report-' + task.id)?.closest('details');
    const card = area?.closest('.mt-card') || [...document.querySelectorAll('#mt-member-list .mt-card')].find(c => c.querySelector(`[data-id="${task.id}"]`));
    if (!card || card.querySelector('.v4-assign-meta')) continue;
    const exp = V4_TIER_EXP[task.tier] || task.exp;
    const meta = document.createElement('p');
    meta.className = 'v4-assign-meta';
    meta.textContent = `${task.verify === 'report' ? '📊 日報判定' : '👑 店長判定'}${exp ? `・難度${V4_TIER_NAME[task.tier] || ''} +${exp} EXP` : ''}`;
    card.querySelector('h4')?.after(meta);
    if (task.verify === 'report' && task.status === 'todo' && area) {
      const have = v4ReportSum(task.reportField, (task.created || '').slice(0, 10), verify);
      const p = document.createElement('p');
      p.className = 'v4-assign-progress';
      p.textContent = `日報「${V4_REPORT_FIELDS[task.reportField] || task.reportField}」${have}/${task.reportMin || 1}，公司日報同步後達標會自動完成`;
      area.replaceWith(p);
    }
  }
}

/* ---------- 新人端：委託視窗與任務條顯示分類／狀態 ---------- */
const V4_STATUS_TEXT = { waiting: '等待日報', pending: '審核中', returned: '退回補正', closed: '已結束' };
function v4DecorateVerifyModal(routeKey, id) {
  const panel = document.getElementById('modal-task-action')?.firstElementChild;
  const slot = v4SlotById(routeKey, id);
  if (!panel || !slot) return;
  panel.querySelector('.v4-verify-box')?.remove();
  const cfg = V4_TASK_VERIFY[slot.id];
  const submit = panel.querySelector(':scope > button:last-of-type');
  if (submit) { submit.textContent = '確認完成並領取獎勵'; submit.disabled = false; } // 委託視窗共用，每次先還原
  if (!cfg) return;
  v4AcceptTask(routeKey, slot); // 打開任務＝接取，從今天起的日報可計入
  const status = v4VerifyStatus(slot);
  const state = v4VerifyLoad();
  const abilities = (cfg.abilities || []).map(([, k, w]) => `${V4_SKILL_NAMES[k] || k} ${Math.round(w * 100)}%`).join('、');
  const box = document.createElement('div');
  box.className = `v4-verify-box is-${cfg.mode}`;
  const growth = `<p>難度${V4_TIER_NAME[cfg.tier] || ''}・+${V4_TIER_EXP[cfg.tier] || slot.rewardExp} EXP・成長：${abilities}</p>`;
  if (cfg.mode === 'report') {
    const p = v4ReportProgress(cfg, state.accepted[slot.id], state);
    box.innerHTML = `<b>📊 日報判定</b><p>${state.accepted[slot.id]} 起公司日報（店長已審核）的「${V4_REPORT_FIELDS[cfg.field]}」：<em>${p.have}</em> / ${p.need}</p>${growth}
      <p class="v4-verify-state">請照常在公司日報系統填寫；每天同步 2 次，累計達標會自動完成</p>`;
    if (submit) submit.textContent = '核對日報';
  } else {
    const review = state.reviews[slot.id];
    box.innerHTML = `<b>👑 店長判定</b><p>${cfg.native ? '社區勘查資料送出後，由公會長在後台核可。' : '送出後由公會長 2 天內審核，核可後自動發放獎勵。請勿填寫客戶個資。'}</p>${growth}
      ${status === 'pending' ? '<p class="v4-verify-state">⏳ 審核中：已送出，等待公會長核可</p>' : ''}
      ${status === 'returned' ? `<p class="v4-verify-state is-returned">↩ 退回補正（第 ${review?.returnCount || 1} 次，最多 ${V4_MAX_RETURNS} 次）：${v4Esc(review?.feedback || '')}</p>` : ''}
      ${status === 'closed' ? `<p class="v4-verify-state is-returned">⛔ 已退回 ${V4_MAX_RETURNS} 次，任務結束</p>` : ''}`;
    if (submit && !cfg.native) {
      submit.textContent = status === 'returned' ? '修改後重新送審' : status === 'pending' ? '審核中…' : status === 'closed' ? '任務已結束' : '交給公會長審核';
      submit.disabled = status === 'pending' || status === 'closed';
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
    small?.insertAdjacentHTML('beforeend', `<span class="v4-verify-tag is-${cfg.mode}">${cfg.mode === 'report' ? '📊 日報' : '👑 店長'}</span>`);
    const slot = match ? v4SlotById(match[1], match[2]) : null;
    const status = v4VerifyStatus(slot);
    if (btn && status) { btn.textContent = V4_STATUS_TEXT[status]; btn.classList.add('is-status', 'is-' + status); }
  });
}

/* ---------- 新人端：今日日報（唯讀，資料來自公司日報系統） ---------- */
function v4BuildReportCard() {
  if (document.getElementById('v4-report-card')) return;
  const card = document.createElement('section');
  card.id = 'v4-report-card';
  card.className = 'v4-report-card';
  document.getElementById('tasks-hero-card')?.after(card);
}
// 新人不在這裡填日報（照常在公司日報系統填寫），這裡只顯示同步進來的已審核數字
function v4RenderReportCard() {
  const card = document.getElementById('v4-report-card');
  if (!card) return;
  const state = v4VerifyLoad();
  const entry = state.reports[v4Today()];
  const values = v4ReportValues(entry);
  card.className = `v4-report-card ${entry ? 'is-approved' : 'is-none'}`;
  card.innerHTML = `<div><small class="v4-en">DAILY REPORT</small><b class="v4-serif">今日日報（公司系統同步）</b>
    <p>${entry ? Object.entries(V4_REPORT_FIELDS).map(([k, l]) => `${l} ${Number(values[k]) || 0}`).join('・') : '今天還沒有同步到店長已審核的日報'}</p>
    <p>請在公司日報系統填寫，每天同步 2 次${state.lastSync ? `・上次同步 ${new Date(state.lastSync).toLocaleString('zh-TW', { hour12: false, month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}` : ''}</p></div>`;
}

function v4AfterVerifyChange() {
  if (typeof switchRoute === 'function') switchRoute(v4Safe(() => currentActiveRouteKey, 'dev'));
  v4RenderReportCard();
}

/* ---------- 從公會長後台同步：核可的任務、審核通過的日報、指派任務 ---------- */
let v4Syncing = false;
function v4SyncFromManager() {
  if (v4Syncing || document.getElementById('app-shell')?.classList.contains('v4-quiz-lock') || !v4Safe(() => isQuizCompleted, false)) return;
  v4Syncing = true;
  try {
    const state = v4VerifyLoad();
    const approved = Object.entries(state.reviews).filter(([, r]) => r.status === 'approved');
    const titles = [];
    for (const [id, review] of approved) {
      const s = v4VerifyLoad(); delete s.reviews[id]; v4VerifySave(s);
      if (v4CompleteTask(review.routeKey, id, review.content, 'manager')) titles.push(review.title);
    }
    const reportDone = v4ProcessReportTasks();
    const assignDone = v4SyncAssigned();
    const all = [...titles, ...reportDone, ...assignDone];
    if (all.length) showCustomToast(`任務完成：${all.join('、')}`, '🎉');
    v4AfterVerifyChange();
  } finally { v4Syncing = false; }
}

/* ---------- 啟動與包裝 ---------- */
window.addEventListener('DOMContentLoaded', () => {
  v4ApplyTaskConfig();
  // 一個任務的經驗分配到最多 3 項能力（角色總等級＝能力加總，既有 addCapabilityExp 會同時累計）
  const originalCapability = addCapabilityExp;
  addCapabilityExp = function (cat, key, points, reason) {
    if (!v4AbilitySplit) return originalCapability.call(this, cat, key, points, reason);
    const split = v4AbilitySplit; v4AbilitySplit = null;
    let left = points, result;
    split.forEach(([c, k, w], i) => {
      const pts = i === split.length - 1 ? left : Math.round(points * w);
      left -= pts;
      if (pts > 0) result = originalCapability.call(this, c, k, pts, reason);
    });
    return result;
  };
  const originalSubmit = submitCurrentTaskDemo;
  submitCurrentTaskDemo = function (...args) { return v4HandleSubmit.call(this, originalSubmit, args); };
  const originalOpen = openTaskActionModal;
  openTaskActionModal = function (routeKey, id, ...rest) {
    v4ApplyTaskConfig();
    const result = originalOpen.call(this, routeKey, id, ...rest);
    v4DecorateVerifyModal(routeKey, id);
    return result;
  };
  const originalRoute = switchRoute;
  switchRoute = function (...args) { v4ApplyTaskConfig(); const r = originalRoute.apply(this, args); v4DecorateVerifyStrips(); return r; };
  if (typeof managerRender === 'function') {
    const originalManagerRender = managerRender;
    managerRender = function (...args) { const r = originalManagerRender.apply(this, args); v4DecorateAssignCards(); return r; };
  }
  // 指派任務回報：送出前檢查個資
  if (typeof managerTransition === 'function') {
    const originalTransition = managerTransition;
    managerTransition = function (id, action, ...rest) {
      if (action === 'submit') {
        const pii = v4PiiFound(document.getElementById('mt-report-' + id)?.value);
        if (pii) { showCustomToast(`內容疑似包含客戶${pii}，請刪除個資後再回報`, '🔒'); return; }
        const task = v4AssignLoad()?.tasks.find(t => t.id === id);
        if (task) v4Log({ type: 'submitted', source: 'assign', taskId: id, title: task.title, detail: (document.getElementById('mt-report-' + id)?.value || '').slice(0, 200) });
      }
      return originalTransition.call(this, id, action, ...rest);
    };
  }
  const originalSwitchTab = switchTab;
  switchTab = function (...args) { const r = originalSwitchTab.apply(this, args); v4SyncFromManager(); return r; };
  window.addEventListener('storage', event => {
    if (event.key === V4_RESET_KEY) v4HandleReset();
    else if (event.key === V4_VERIFY_KEY || event.key === 'sinyi-formal-manager-tasks-v1') v4SyncFromManager();
    else if (event.key === V4_CONTENT_KEY) { v4ApplyTaskConfig(); v4AfterVerifyChange(); }
  });
  v4BuildReportCard();
  v4RenderReportCard();
  v4DecorateVerifyStrips();
});

// 公會長後台按「重置 Demo」：停止本頁寫入存檔（避免關頁時把舊資料寫回），重新載入成全新狀態
function v4HandleReset() {
  try { hunterStorageBlocked = true; } catch { /* 無此變數時略過 */ }
  try { formalQuizBlocked = true; } catch { /* 無此變數時略過 */ }
  try { managerStorageBlocked = true; } catch { /* 無此變數時略過 */ }
  location.reload();
}
