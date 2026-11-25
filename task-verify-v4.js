/* =========================================================
   任務檢核（新人端）：依《信義新星 任務與成長系統規格》
   - 11/24 規則：新人不用接任務。任務庫一直維持 N 個系統任務（PM 參數），完成或結束一個就從待派清單補一個
   - 📊 日報表判定：新人 KEY 日報表、店長審核後產生「行程資料表」；依該表更新頻率同步，從「派入日」起累計達標即完成
   - 👑 店長判定：新人送審 → 店長核可／退回；不設退回上限，退回幾次都可以修改重送，核可後照常發獎勵（11/25）
   - 經驗值依難度（小 20／中 40／大 80），分配到最多 3 項能力
   - 每筆任務的派入、送審、審核、完成都寫入任務紀錄，給店長後台查看
   - 尚未接資料庫：資料存在本機瀏覽器；之後替換 v4VerifyLoad／v4VerifySave／v4Log 即可
   ========================================================= */

// 日報欄位、任務設定、系統參數改由 content-v4.js 提供（PM 後台修改、PO 核准後生效）
const V4_TIER_EXP = { S: 20, M: 40, L: 80 };
const V4_TIER_NAME = { S: '小', M: '中', L: '大' };
const V4_TASK_VERIFY = {};
let V4_MAX_RETURNS = 3;
let V4_POOL_SIZE = 5;
// 套用目前生效的內容；已派入的任務沿用派入當時的設定（快照），不受後續改版影響
function v4ApplyContent() {
  const pub = v4cPublished();
  const snaps = v4VerifyLoad().acceptedCfg;
  for (const [id, cfg] of Object.entries(pub.tasks)) V4_TASK_VERIFY[id] = snaps[id] || cfg;
  V4_MAX_RETURNS = pub.params.maxReturns || 3;
  V4_POOL_SIZE = Math.max(1, Number(pub.params.poolSize) || 5);
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

/* ---------- 行程資料表（新人 KEY 日報表、店長審核後產生；依該表更新頻率同步） ---------- */
// 舊格式（直接存數字）視為已核可
const v4ReportValues = entry => (entry && entry.values) || (entry && !entry.status ? entry : {});
const v4ReportApproved = entry => !!entry && (!entry.status || entry.status === 'approved');
// trips：行程代碼清單（「項目|方式|行為」），累計派入日起的筆數
function v4ReportSum(trips, sinceDate, state = v4VerifyLoad()) {
  return Object.entries(state.reports)
    .filter(([date, entry]) => date >= sinceDate && v4ReportApproved(entry))
    .reduce((sum, [, entry]) => sum + v4cTripCount(v4ReportValues(entry), trips), 0);
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
/* ---------- 任務庫（11/24：新人不用接任務） ----------
   accepted[id]＝派入日。任務庫＝已派入、未完成、未結束的系統任務；少於 N 個就從待派清單依序補上 */
function v4PoolOrder() {
  const order = typeof V4C_POOL_ORDER !== 'undefined' ? V4C_POOL_ORDER : Object.keys(V4_TASK_VERIFY);
  const all = v4AllSlots();
  return order.map(id => all.find(([, s]) => s.id === id)).filter(Boolean);
}
function v4InPool(id, state = v4VerifyLoad()) {
  const slot = v4AllSlots().find(([, s]) => s.id === id)?.[1];
  return !!slot && !!state.accepted[id] && !slot.isCompleted && state.reviews[id]?.status !== 'closed';
}
function v4PoolSync() {
  if (!v4Safe(() => isQuizCompleted, false)) return [];
  const state = v4VerifyLoad();
  const firstFill = !Object.keys(state.accepted).length;
  const order = v4PoolOrder();
  const added = [];
  let size = order.filter(([, s]) => v4InPool(s.id, state)).length;
  for (const [, slot] of order) {
    if (size >= V4_POOL_SIZE) break;
    if (state.accepted[slot.id] || slot.isCompleted) continue;
    state.accepted[slot.id] = v4Today();
    if (V4_TASK_VERIFY[slot.id]) state.acceptedCfg[slot.id] = JSON.parse(JSON.stringify(V4_TASK_VERIFY[slot.id]));
    v4Log({ type: 'accepted', source: 'system', taskId: slot.id, title: slot.title, mode: V4_TASK_VERIFY[slot.id]?.mode || 'manager' });
    added.push(slot.title);
    size++;
  }
  if (added.length) {
    v4VerifySave(state);
    if (!firstFill && typeof showCustomToast === 'function') showCustomToast(`任務庫補上新任務：${added.join('、')}`, '📜');
  }
  return added;
}
// 舊名稱保留給其他檔案呼叫：打開任務不再算接取，只確保任務庫已補滿
function v4AcceptTask() { v4PoolSync(); }
function v4VerifyStatus(slot) {
  if (!slot) return null;
  const cfg = V4_TASK_VERIFY[slot.id];
  if (!cfg || slot.isCompleted) return null;
  const state = v4VerifyLoad();
  if (cfg.mode === 'manager') return state.reviews[slot.id]?.status || null; // pending／returned／closed
  return state.accepted[slot.id] ? 'waiting' : null;
}
function v4ReportProgress(cfg, sinceDate, state) {
  return { have: v4ReportSum(cfg.trips, sinceDate || v4Today(), state), need: cfg.min || 1 };
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

  const state = v4VerifyLoad();
  if (!v4InPool(slot.id, state)) { showCustomToast('這個任務還在待派清單，完成任務庫裡的任務後會自動補上。', '⏳'); return; }
  if (cfg.mode === 'report') {
    const p = v4ReportProgress(cfg, state.accepted[slot.id], state);
    if (p.have >= p.need) {
      closeModal('modal-task-action');
      v4CompleteTask(routeKey, slot.id, '', 'report');
      showCustomToast(`📊 行程資料表核對通過：${p.have}/${p.need} 筆`, '✅');
      v4AfterVerifyChange();
      return;
    }
    closeModal('modal-task-action');
    showCustomToast(`行程資料表目前 ${p.have}/${p.need} 筆，同步後達標會自動完成，不用另外送審`, '📊');
    v4AfterVerifyChange();
    return;
  }
  // 店長判定
  const prev = state.reviews[slot.id];
  if (prev?.status === 'pending') { showCustomToast('已在公會長審核中，請耐心等候。', '👑'); return; }
  if (prev?.status === 'closed') { showCustomToast(`這個任務已退回 ${V4_MAX_RETURNS} 次，任務已結束。`, '⛔'); return; }
  const content = v4CollectContent(slot);
  state.reviews[slot.id] = { status: 'pending', routeKey, title: slot.title, tag: slot.tag, content, feedback: prev?.feedback || '', returnCount: prev?.returnCount || 0, submittedAt: new Date().toISOString() };
  v4VerifySave(state);
  v4Log({ type: 'submitted', source: 'system', taskId: slot.id, title: slot.title, detail: content.slice(0, 200) });
  closeModal('modal-task-action');
  showCustomToast('已交給店長審核，核可後自動發放獎勵', '👑');
  v4AfterVerifyChange();
}

// 任務庫裡的日報表判定任務：行程資料表同步後自動核對
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

/* ---------- 店長派發任務（店長後台 Web 建立；新人不能拒絕） ---------- */
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
// 店長派發任務：日報表判定的要新人先按「完成」（status review＝待確認），行程資料表比對達標才完成；
// 任務從未完成變已完成就發獎勵（經驗＋店長設定的金幣），每一筆都發
function v4SyncAssigned() {
  const state = v4AssignLoad();
  if (!state) return [];
  const verify = v4VerifyLoad();
  const rewarded = [];
  let changed = false;
  for (const task of state.tasks) {
    if (task.member !== state.active) continue;
    if (task.status === 'review' && task.verify === 'report' && task.reportTrips?.length) {
      const have = v4ReportSum(task.reportTrips, (task.created || '').slice(0, 10) || v4Today(), verify);
      if (have >= (task.reportMin || 1)) { task.status = 'done'; task.reviewed = new Date().toISOString(); task.feedback = `行程資料表比對通過（${have}/${task.reportMin || 1}）`; changed = true; }
    }
    if (task.status === 'done' && !task.rewarded) {
      const exp = V4_TIER_EXP[task.tier] || task.exp || 20;
      v4GrantAbilities(task.abilities, exp, `店長派發任務【${task.title}】`);
      const coins = Number(task.coins) || 0;
      if (coins > 0) v4Safe(() => { userCoins += coins; updateCurrencyUI(); }, null);
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
// 新人端「店長派發」卡片：日報表判定的按「完成」後等行程資料表比對；店長審核的寫文字回報
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
    meta.textContent = `${task.verify === 'report' ? '📊 日報表判定' : '👑 店長審核'}${exp ? `・難度${V4_TIER_NAME[task.tier] || ''} +${exp} EXP` : ''}${Number(task.coins) > 0 ? `・🪙 +${task.coins}` : ''}`;
    card.querySelector('h4')?.after(meta);
    if (task.detail) { const d = document.createElement('p'); d.className = 'mt-description'; d.textContent = task.detail; meta.after(d); }
    if (task.verify === 'report' && ['todo', 'review'].includes(task.status) && task.member === state.active) {
      const have = v4ReportSum(task.reportTrips || [], (task.created || '').slice(0, 10), verify);
      const p = document.createElement('div');
      p.className = 'v4-assign-progress';
      const rule = v4cRuleText(task.reportTrips, task.reportMin).replace(/ 累計.*$/, '');
      p.innerHTML = task.status === 'todo'
        ? `<p>行程「${v4Esc(rule)}」目前 ${have}/${task.reportMin || 1} 筆。做完後按「完成」，等行程資料表比對。</p><button class="mt-primary" data-mt-action="finish" data-id="${task.id}">完成</button>`
        : `<p>⏳ 已按完成，等行程資料表比對（目前 ${have}/${task.reportMin || 1} 筆）</p>`;
      if (area) area.replaceWith(p); else card.appendChild(p);
    }
  }
}

/* ---------- 新人端：委託視窗與任務條顯示分類／狀態 ---------- */
const V4_STATUS_TEXT = { waiting: '等待行程資料表', pending: '審核中', returned: '退回補正', closed: '已結束' };
function v4DecorateVerifyModal(routeKey, id) {
  const panel = document.getElementById('modal-task-action')?.firstElementChild;
  const slot = v4SlotById(routeKey, id);
  if (!panel || !slot) return;
  panel.querySelector('.v4-verify-box')?.remove();
  const cfg = V4_TASK_VERIFY[slot.id];
  const submit = panel.querySelector(':scope > button:last-of-type');
  if (submit) { submit.textContent = '確認完成並領取獎勵'; submit.disabled = false; } // 委託視窗共用，每次先還原
  if (!cfg) return;
  v4PoolSync();
  const status = v4VerifyStatus(slot);
  const state = v4VerifyLoad();
  const abilities = (cfg.abilities || []).map(([, k, w]) => `${V4_SKILL_NAMES[k] || k} ${Math.round(w * 100)}%`).join('、');
  const box = document.createElement('div');
  box.className = `v4-verify-box is-${cfg.mode}`;
  const growth = `<p>難度${V4_TIER_NAME[cfg.tier] || ''}・+${V4_TIER_EXP[cfg.tier] || slot.rewardExp} EXP・成長：${abilities}</p>`;
  if (cfg.mode === 'report') {
    const p = v4ReportProgress(cfg, state.accepted[slot.id], state);
    box.innerHTML = state.accepted[slot.id]
      ? `<b>📊 日報表判定</b><p>${state.accepted[slot.id]}（派入日）起，行程資料表中「${v4Esc((cfg.trips || []).map(v4cTripLabel).join('、'))}」的行程：<em>${p.have}</em> / ${p.need} 筆</p>${growth}
      <p class="v4-verify-state">照常 KEY 日報表，店長審核後會進行程資料表；同步後累計達標自動完成，不用按完成</p>`
      : `<b>📊 日報表判定</b><p>這個任務還在待派清單，派入任務庫後才開始計算。</p>${growth}`;
    if (submit) { submit.textContent = state.accepted[slot.id] ? '核對行程資料表' : '待派入'; submit.disabled = !v4InPool(slot.id, state); }
  } else {
    const review = state.reviews[slot.id];
    box.innerHTML = `<b>👑 店長審核</b><p>${cfg.native ? '到冒險地圖勘查 D1 大樓，送出後由店長在後台（Web）審核。' : '用文字回報成果，送出後由店長在後台（Web）審核，核可後自動發放獎勵。請勿填寫客戶個資。'}</p>${growth}
      ${!v4InPool(slot.id, state) && !status ? '<p class="v4-verify-state">⏳ 這個任務還在待派清單，完成任務庫裡的任務後會自動補上</p>' : ''}
      ${status === 'pending' ? '<p class="v4-verify-state">⏳ 審核中：已送出，等待公會長核可</p>' : ''}
      ${status === 'returned' ? `<p class="v4-verify-state is-returned">↩ 退回補正（第 ${review?.returnCount || 1} 次，修改後可再送審）：${v4Esc(review?.feedback || '')}</p>` : ''}
      ${status === 'closed' ? `<p class="v4-verify-state is-returned">⛔ 已退回 ${V4_MAX_RETURNS} 次，任務結束</p>` : ''}`;
    if (submit && !cfg.native) {
      const waiting = !v4InPool(slot.id, state) && !status;
      submit.textContent = waiting ? '待派入' : status === 'returned' ? '修改後重新送審' : status === 'pending' ? '審核中…' : status === 'closed' ? '任務已結束' : '交給店長審核';
      submit.disabled = waiting || status === 'pending' || status === 'closed';
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
    small?.insertAdjacentHTML('beforeend', `<span class="v4-verify-tag is-${cfg.mode}">${cfg.mode === 'report' ? '📊 日報表' : '👑 店長'}</span>`);
    const slot = match ? v4SlotById(match[1], match[2]) : null;
    const status = v4VerifyStatus(slot);
    if (btn && status) { btn.textContent = V4_STATUS_TEXT[status]; btn.classList.add('is-status', 'is-' + status); }
  });
}

/* ---------- 新人端：今日行程（唯讀，資料來自店長審核後的行程資料表） ---------- */
function v4BuildReportCard() {
  if (document.getElementById('v4-report-card')) return;
  const card = document.createElement('section');
  card.id = 'v4-report-card';
  card.className = 'v4-report-card';
  document.getElementById('tasks-hero-card')?.after(card);
}
// 新人不在這裡填日報表（照常在公司系統 KEY），這裡只顯示行程資料表同步進來的數字
function v4RenderReportCard() {
  const card = document.getElementById('v4-report-card');
  if (!card) return;
  const state = v4VerifyLoad();
  const entry = state.reports[v4Today()];
  const values = v4ReportValues(entry);
  card.className = `v4-report-card ${entry ? 'is-approved' : 'is-none'}`;
  card.innerHTML = `<div><small class="v4-en">DAILY REPORT</small><b class="v4-serif">今日行程（行程資料表同步）</b>
    <p>${entry ? (Object.entries(values).filter(([, n]) => Number(n) > 0).map(([k, n]) => `${v4Esc(v4cTripLabel(k))} ${n} 筆`).join('<br>') || '今天的行程資料表沒有行程') : '今天還沒有同步到店長審核後的行程資料'}</p>
    <p>請照常在公司系統 KEY 日報表，店長審核後會進行程資料表，依該表更新頻率同步${state.lastSync ? `・上次同步 ${new Date(state.lastSync).toLocaleString('zh-TW', { hour12: false, month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}` : ''}</p></div>`;
}

function v4AfterVerifyChange() {
  if (typeof switchRoute === 'function') switchRoute(v4Safe(() => currentActiveRouteKey, 'dev'));
  v4RenderReportCard();
}

/* ---------- 從店長後台同步：核可的任務、行程資料表、店長派發任務；最後補滿任務庫 ---------- */
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
    v4PoolSync();
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
  // 店長派發任務：日報表判定的「完成」＝改待確認；店長審核的文字回報不做個資檢查（11/24）
  if (typeof managerTransition === 'function') {
    const originalTransition = managerTransition;
    managerTransition = function (id, action, ...rest) {
      if (action === 'finish') {
        const state = v4AssignLoad();
        const task = state?.tasks.find(t => t.id === id);
        if (!task || task.member !== state.active || task.status !== 'todo' || task.verify !== 'report') return;
        task.status = 'review'; task.submitted = new Date().toISOString();
        const saved = typeof managerSave === 'function' ? managerSave(state) : (localStorage.setItem('sinyi-formal-manager-tasks-v1', JSON.stringify(state)), true);
        if (saved) {
          v4Log({ type: 'finished', source: 'assign', taskId: id, title: task.title });
          showCustomToast('已按完成，行程資料表同步後比對達標就會完成', '📊');
          v4SyncFromManager();
          if (typeof managerRender === 'function') managerRender();
        }
        return;
      }
      if (action === 'submit') {
        const task = v4AssignLoad()?.tasks.find(t => t.id === id);
        if (task) v4Log({ type: 'submitted', source: 'assign', taskId: id, title: task.title, detail: (document.getElementById('mt-report-' + id)?.value || '').slice(0, 200) });
      }
      return originalTransition.call(this, id, action, ...rest);
    };
  }
  const originalSwitchTab = switchTab;
  switchTab = function (...args) { const r = originalSwitchTab.apply(this, args); v4SyncFromManager(); return r; };
  window.addEventListener('storage', event => {
    if (event.key === V4_RESET_KEY || event.key === V4R_ACTIVE_KEY) v4HandleReset();
    else if (event.key === V4_VERIFY_KEY || event.key === 'sinyi-formal-manager-tasks-v1') v4SyncFromManager();
    else if (event.key === V4_CONTENT_KEY) { v4ApplyTaskConfig(); v4AfterVerifyChange(); }
  });
  v4BuildReportCard();
  v4RenderReportCard();
  window.addEventListener('formal-profile-ready', () => setTimeout(() => { v4PoolSync(); v4AfterVerifyChange(); }, 0));
  v4DecorateVerifyStrips();
});

// 公會長後台按「重置 Demo」：停止本頁寫入存檔（避免關頁時把舊資料寫回），重新載入成全新狀態
function v4HandleReset() {
  try { hunterStorageBlocked = true; } catch { /* 無此變數時略過 */ }
  try { formalQuizBlocked = true; } catch { /* 無此變數時略過 */ }
  try { managerStorageBlocked = true; } catch { /* 無此變數時略過 */ }
  location.reload();
}
