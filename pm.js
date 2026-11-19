/* =========================================================
   總部 PM 後台（Web）
   - PM 修改系統任務、系統參數 → 存草稿 → 送 PO 核准 → 核准後（到生效日）新人 APP 與店長後台套用。
   - 每次核准都是一個版本，可還原到任一版（還原也要 PO 核准）。
   - 名單：輸入員工編號加入 PM／PO。
   - 使用統計：使用時間、任務數量、完成時間、AI 對練，可匯出 Excel（CSV）。
   - 尚未接資料庫：存在 localStorage；示範身分正式版由 SSO＋名單判斷。
   ========================================================= */
const P_VIEW_KEY = 'sinyi-v4-pm-view';
const P_STATUS = { draft: '草稿', pending: '待 PO 核准', approved: '已核准', returned: '已退回' };
const P_TAB_NAMES = { 'tab-lobby': '主城', 'tab-tasks': '任務', 'tab-academy': '試煉／對練', 'tab-map': '冒險地圖', 'tab-handbook': '角色', 'tab-showcase': '夥伴' };
// 示範新人的統計（虛構資料；正式版由後端彙整全公司新人）
const P_DEMO_STATS = [
  { name: '林予晴', branch: '信義松仁店', sessions: 42, minutes: 615, accepted: 14, done: 10, active: 3, ended: 1, workH: 30, waitH: 20, practice: 9, passRate: 78, avgScore: 16.2 },
  { name: '陳柏宇', branch: '大安敦南店', sessions: 18, minutes: 240, accepted: 7, done: 4, active: 3, ended: 0, workH: 41, waitH: 35, practice: 3, passRate: 33, avgScore: 12.7 },
  { name: '張雅婷', branch: '大安敦南店', sessions: 77, minutes: 1290, accepted: 22, done: 19, active: 2, ended: 1, workH: 22, waitH: 15, practice: 15, passRate: 87, avgScore: 17.4 },
  { name: '黃俊傑', branch: '松山民生店', sessions: 5, minutes: 52, accepted: 2, done: 1, active: 1, ended: 0, workH: 18, waitH: 9, practice: 1, passRate: 0, avgScore: 11 }
];
let pView = 'tasks';
let pEditing = null; // { type: 'task', target } 或 { type: 'params' }

const pEsc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pTime = iso => iso ? new Date(iso).toLocaleString('zh-TW', { hour12: false, month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
const pJson = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; } };
const pPanel = (title, en, body, extra = '') => `<section class="m-panel"><header class="m-panel-head"><div><small class="m-en">${en}</small><h2 class="m-serif">${title}</h2></div>${extra}</header>${body}</section>`;
const pEmpty = text => `<p class="m-empty">${text}</p>`;
const pSkill = key => Object.values(V4C_SKILLS).map(g => g.items[key]).find(Boolean) || key;
const pAbilities = list => (list || []).map(([, k, w]) => `${pSkill(k)} ${Math.round(w * 100)}%`).join('、');
const pRule = t => t.mode === 'report' ? `📊 ${V4C_REPORT_FIELDS[t.field] || ''} ≥ ${t.min || 1}` : t.native ? '👑 社區勘查審核' : '👑 店長判定';
function pToast(text) {
  const el = document.getElementById('m-toast');
  el.textContent = text;
  el.classList.add('is-show');
  clearTimeout(pToast.t);
  pToast.t = setTimeout(() => el.classList.remove('is-show'), 2800);
}

/* ---------- 名單與目前身分 ---------- */
function pState() {
  const state = v4cLoad();
  if (!state.staff.length) { // 示範名單（虛構員工編號）
    state.staff = [{ emp: '000101', role: 'PM', addedAt: new Date().toISOString() }, { emp: '000201', role: 'PO', addedAt: new Date().toISOString() }];
    v4cSave(state);
  }
  return state;
}
function pMe() {
  const staff = pState().staff;
  const saved = pJson(P_VIEW_KEY, {});
  return staff.find(s => s.emp === saved.emp) || staff.find(s => s.role === 'PM') || staff[0];
}
const pIsPO = () => pMe()?.role === 'PO';

/* ---------- 變更單 ---------- */
function pNewChange(fields) {
  return { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), status: 'draft', createdBy: pMe().emp, createdAt: new Date().toISOString(), ...fields };
}
function pDiff(c) {
  if (c.type === 'restore') return `<p>還原到第 ${c.restoreTo} 版的完整內容</p>`;
  const before = c.before || {}, after = c.after || {};
  const label = { title: '任務名稱', mode: '判定方式', field: '日報欄位', min: '門檻', tier: '難度', abilities: '成長能力', ...V4C_PARAM_NAMES };
  const show = (k, v) => k === 'abilities' ? pAbilities(v) : k === 'mode' ? (v === 'report' ? '日報判定' : '店長判定') : k === 'field' ? (V4C_REPORT_FIELDS[v] || '—') : k === 'tier' ? V4C_TIERS[v]?.[0] : v ?? '—';
  const rows = Object.keys(after).filter(k => JSON.stringify(before[k]) !== JSON.stringify(after[k]));
  return rows.length ? `<table class="m-table"><thead><tr><th>欄位</th><th>原本</th><th>改成</th></tr></thead><tbody>${rows.map(k => `<tr><td>${label[k] || k}</td><td>${pEsc(show(k, before[k]))}</td><td><b>${pEsc(show(k, after[k]))}</b></td></tr>`).join('')}</tbody></table>` : '<p class="m-muted">沒有實際差異</p>';
}
const pTarget = c => c.type === 'task' ? `任務・${pEsc(V4C_BASE_TASKS[c.target]?.title || c.target)}` : c.type === 'params' ? '系統參數' : '版本還原';
function pChangeCard(c, actions) {
  return `<article class="m-card" data-change="${c.id}">
    <div class="m-card-top"><span class="m-tag ${c.status === 'approved' ? 'is-teal' : c.status === 'pending' ? 'is-gold' : c.status === 'returned' ? 'is-red' : ''}">${P_STATUS[c.status]}</span><b class="m-serif">${pTarget(c)}</b><small>${pEsc(c.createdBy)}・${pTime(c.createdAt)}${c.effectiveAt ? `・生效日 ${pEsc(c.effectiveAt)}` : '・核准後立即生效'}</small></div>
    ${c.note ? `<p class="m-muted">修改原因：${pEsc(c.note)}</p>` : ''}${pDiff(c)}${c.feedback ? `<p class="m-muted">PO 回覆：${pEsc(c.feedback)}</p>` : ''}${actions || ''}</article>`;
}

/* ---------- 各頁 ---------- */
function pTasksView() {
  const state = pState();
  const pub = v4cPublished(state);
  const mine = state.changes.filter(c => ['draft', 'pending', 'returned'].includes(c.status) && c.type !== 'params' && c.type !== 'restore');
  const open = id => state.changes.find(c => c.type === 'task' && c.target === id && ['draft', 'pending'].includes(c.status));
  const editor = pEditing?.type === 'task' ? pTaskEditor(pEditing.target, pub.tasks[pEditing.target]) : '';
  return `<div class="m-title"><small class="m-en">QUEST TEMPLATES</small><h1 class="m-serif">任務範本</h1><p>修改系統任務的名稱、判定方式、難度與成長能力。改完送 PO 核准，核准後（到生效日）新人 APP 套用；新人已接取的任務沿用接取當時的設定。</p></div>
    ${editor}
    ${mine.length ? pPanel('我的草稿與送審', 'CHANGES', mine.map(c => pChangeCard(c, c.status === 'pending' ? '' : `<div class="m-actions"><button type="button" class="m-btn-gold" data-submit="${c.id}">送 PO 核准</button><button type="button" class="m-btn-ghost" data-drop="${c.id}">刪除草稿</button></div>`)).join('')) : ''}
    ${pPanel('系統任務', 'TEMPLATES', `<table class="m-table"><thead><tr><th>路線</th><th>任務</th><th>判定</th><th>難度</th><th>成長能力</th><th></th></tr></thead><tbody>
      ${Object.entries(pub.tasks).map(([id, t]) => `<tr><td>${V4C_ROUTES[t.route]}</td><td>${pEsc(t.title)}</td><td>${pRule(t)}</td><td>${V4C_TIERS[t.tier][0]}（+${V4C_TIERS[t.tier][1]}）</td><td>${pAbilities(t.abilities)}</td>
        <td>${open(id) ? `<span class="m-tag is-gold">${P_STATUS[open(id).status]}</span>` : `<button type="button" class="m-btn-ghost" data-edit-task="${id}">編輯</button>`}</td></tr>`).join('')}</tbody></table>
      <p class="m-note-inline">新增全新的系統任務需要新的任務畫面，原型先開放修改既有任務；IP 角色與卡池管理等素材清單確定後再加入。</p>`)}`;
}
function pTaskEditor(id, t) {
  const skillOptions = sel => `<option value="">（不選）</option>${Object.entries(V4C_SKILLS).map(([gk, g]) => `<optgroup label="${g.label}">${Object.entries(g.items).map(([k, n]) => `<option value="${gk}:${k}" ${sel === `${gk}:${k}` ? 'selected' : ''}>${n}</option>`).join('')}</optgroup>`).join('')}`;
  const ab = [0, 1, 2].map(i => t.abilities?.[i]);
  return pPanel(`編輯：${pEsc(t.title)}`, 'EDIT', `<form id="p-task-form" class="m-assign-form" data-target="${id}">
    <label class="m-field">任務名稱<input name="title" required maxlength="40" value="${pEsc(t.title)}"></label>
    ${t.native ? '<p class="m-muted">社區勘查沿用既有流程（店長在後台審核勘查內容），判定方式不可修改。</p>' : `<fieldset class="m-field"><legend>判定方式</legend>
      <label class="m-check"><input type="radio" name="mode" value="report" ${t.mode === 'report' ? 'checked' : ''}>📊 日報判定</label>
      <label class="m-check"><input type="radio" name="mode" value="manager" ${t.mode === 'manager' ? 'checked' : ''}>👑 店長判定</label></fieldset>
    <div class="m-form-row m-report-rule" ${t.mode === 'report' ? '' : 'hidden'}><label class="m-field">日報欄位<select name="field">${Object.entries(V4C_REPORT_FIELDS).map(([k, l]) => `<option value="${k}" ${t.field === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <label class="m-field">門檻<input type="number" name="min" min="1" max="99" value="${t.min || 1}"></label></div>`}
    <label class="m-field">難度<select name="tier">${Object.entries(V4C_TIERS).map(([k, [n, e]]) => `<option value="${k}" ${t.tier === k ? 'selected' : ''}>${n}（+${e} EXP）</option>`).join('')}</select></label>
    <fieldset class="m-field"><legend>成長能力（1～3 項，權重合計 100%）</legend>${ab.map((a, i) => `<div class="m-ability-row"><select name="ability${i}">${skillOptions(a ? `${a[0]}:${a[1]}` : '')}</select><input type="number" name="weight${i}" min="0" max="100" step="10" value="${a ? Math.round(a[2] * 100) : 0}"><span>%</span></div>`).join('')}</fieldset>
    <div class="m-form-row"><label class="m-field">生效日（選填，空白＝核准後立即生效）<input type="date" name="effectiveAt" min="${v4cToday()}"></label>
      <label class="m-field">修改原因<input name="note" maxlength="100" placeholder="例如：新人反映門檻太高"></label></div>
    <div class="m-actions"><button type="submit" class="m-btn-gold" data-mode="pending">送 PO 核准</button><button type="submit" class="m-btn-ghost" data-mode="draft">存草稿</button><button type="button" class="m-btn-ghost" data-cancel-edit>取消</button></div></form>`);
}

function pParamsView() {
  const state = pState();
  const pub = v4cPublished(state);
  const open = state.changes.filter(c => c.type === 'params' && ['draft', 'pending', 'returned'].includes(c.status));
  return `<div class="m-title"><small class="m-en">SETTINGS</small><h1 class="m-serif">系統參數</h1><p>店長派發上限、審核期限、退回上限由總部統一設定，修改同樣要 PO 核准。</p></div>
    ${open.length ? pPanel('送審中的修改', 'CHANGES', open.map(c => pChangeCard(c, c.status === 'pending' ? '' : `<div class="m-actions"><button type="button" class="m-btn-gold" data-submit="${c.id}">送 PO 核准</button><button type="button" class="m-btn-ghost" data-drop="${c.id}">刪除草稿</button></div>`)).join('')) : ''}
    ${pPanel('目前生效的參數', 'PARAMS', `<form id="p-params-form" class="m-assign-form">
      ${Object.entries(V4C_PARAM_NAMES).map(([k, l]) => `<label class="m-field">${l}<input type="number" name="${k}" min="1" max="999" value="${pub.params[k]}" ${open.some(c => c.status === 'pending') ? 'disabled' : ''}></label>`).join('')}
      <div class="m-form-row"><label class="m-field">生效日（選填）<input type="date" name="effectiveAt" min="${v4cToday()}"></label><label class="m-field">修改原因<input name="note" maxlength="100"></label></div>
      ${open.some(c => c.status === 'pending') ? '<p class="m-muted">已有修改在等 PO 核准。</p>' : '<div class="m-actions"><button type="submit" class="m-btn-gold" data-mode="pending">送 PO 核准</button><button type="submit" class="m-btn-ghost" data-mode="draft">存草稿</button></div>'}</form>`)}`;
}

function pApprovalsView() {
  const state = pState();
  const pending = state.changes.filter(c => c.status === 'pending');
  const me = pMe();
  return `<div class="m-title"><small class="m-en">APPROVAL</small><h1 class="m-serif">PO 核准</h1><p>所有遊戲內容的修改都要產品負責人（PO）核准才會上架；不能核准自己送出的修改。</p></div>
    ${pIsPO() ? '' : '<div class="m-alert">目前身分是 PM：只能查看。切換成 PO 身分才能核准或退回。</div>'}
    ${pPanel('待核准', 'PENDING', pending.length ? pending.map(c => pChangeCard(c, pIsPO() && c.createdBy !== me.emp ? `<label class="m-field">退回原因（退回時必填）<textarea rows="2" maxlength="300" data-feedback></textarea></label>
      <div class="m-actions"><button type="button" class="m-btn-gold" data-approve="${c.id}">核准上架</button><button type="button" class="m-btn-red" data-return="${c.id}">退回</button></div>` : pIsPO() ? '<p class="m-muted">這是你自己送出的修改，需由其他 PO 核准。</p>' : '')).join('') : pEmpty('目前沒有待核准的修改。'), `<span class="m-badge">${pending.length} 件</span>`)}`;
}

function pVersionsView() {
  const state = pState();
  const approved = v4cApproved(state);
  const today = v4cToday();
  return `<div class="m-title"><small class="m-en">VERSIONS</small><h1 class="m-serif">版本紀錄</h1><p>每次核准都是一個新版本。出問題時可還原到任一版，還原也要 PO 核准。</p></div>
    ${pPanel('版本', 'HISTORY', `<table class="m-table"><thead><tr><th>版本</th><th>內容</th><th>送出／核准</th><th>生效</th><th></th></tr></thead><tbody>
      <tr><td class="m-en">v0</td><td>預設內容</td><td>—</td><td>已生效</td><td>${approved.length ? '<button type="button" class="m-btn-ghost" data-restore="0">還原到此版</button>' : ''}</td></tr>
      ${approved.map((c, i) => `<tr><td class="m-en">v${i + 1}</td><td>${pTarget(c)}${c.note ? `<br><small class="m-muted">${pEsc(c.note)}</small>` : ''}</td><td>${pEsc(c.createdBy)} → ${pEsc(c.approvedBy)}<br><small class="m-muted">${pTime(c.approvedAt)}</small></td><td>${!c.effectiveAt || c.effectiveAt <= today ? '已生效' : `${pEsc(c.effectiveAt)} 生效`}</td><td>${i + 1 < approved.length ? `<button type="button" class="m-btn-ghost" data-restore="${i + 1}">還原到此版</button>` : '<span class="m-tag is-teal">最新</span>'}</td></tr>`).join('')}</tbody></table>`)}`;
}

function pStaffView() {
  const state = pState();
  return `<div class="m-title"><small class="m-en">STAFF</small><h1 class="m-serif">名單</h1><p>輸入員工編號加入 PM 或 PO。登入一樣用公司 SSO，系統用員工編號對照這份名單決定能不能進 PM 後台。</p></div>
    <div class="m-grid2">
      ${pPanel('加入成員', 'ADD', `<form id="p-staff-form" class="m-assign-form">
        <label class="m-field">員工編號<input name="emp" required maxlength="10" pattern="[A-Za-z0-9]{4,10}" placeholder="例如：000123" inputmode="numeric"></label>
        <label class="m-field">角色<select name="role"><option value="PM">PM（編輯內容、看統計）</option><option value="PO">PO（核准上架）</option></select></label>
        <button type="submit" class="m-btn-gold">加入</button></form>`)}
      ${pPanel('目前名單', 'MEMBERS', `<table class="m-table"><thead><tr><th>員工編號</th><th>角色</th><th>加入時間</th><th></th></tr></thead><tbody>${state.staff.map(s => `<tr><td class="m-en">${pEsc(s.emp)}</td><td>${s.role}</td><td>${pTime(s.addedAt)}</td><td><button type="button" class="m-btn-ghost" data-remove="${pEsc(s.emp)}">移除</button></td></tr>`).join('')}</tbody></table>`)}
    </div>`;
}

/* ---------- 使用統計 ---------- */
function pLocalStats() {
  const usage = pJson('sinyi-v4-usage-v1', { sessions: [] }).sessions || [];
  const verify = pJson('sinyi-v4-task-verify-v1', {}) || {};
  const assign = pJson('sinyi-formal-manager-tasks-v1', { tasks: [] }) || { tasks: [] };
  const log = [...(pJson('sinyi-v4-task-log-v1', []) || []), ...(pJson('sinyi-v4-manager-log-v1', []) || [])];
  const practice = pJson('sinyi-v4-practice-v1', []) || [];
  const journey = pJson('sinyi-rpg-formal-journey-v1', {}) || {};
  const minutes = Math.round(usage.reduce((s, x) => s + Math.max(0, Date.parse(x.end) - Date.parse(x.start)), 0) / 60000);
  const features = {};
  usage.forEach(x => Object.entries(x.features || {}).forEach(([k, v]) => { features[k] = (features[k] || 0) + v; }));
  const mineAssigned = (assign.tasks || []).filter(t => t.member === 'self');
  const acceptedSys = Object.keys(verify.accepted || {});
  const completed = log.filter(e => e.type === 'completed');
  const doneSys = new Set(completed.filter(e => e.source === 'system').map(e => e.taskId));
  const closed = Object.values(verify.reviews || {}).filter(r => r.status === 'closed').length + mineAssigned.filter(t => t.status === 'cancelled').length;
  const accepted = acceptedSys.length + mineAssigned.length;
  const done = doneSys.size + mineAssigned.filter(t => t.status === 'done').length;
  // 完成花費時間：接取→送審（新人作業）、送審→核可（等待審核）
  const firstAt = (type, id) => log.filter(e => e.type === type && e.taskId === id).map(e => Date.parse(e.at)).sort()[0];
  const work = [], wait = [];
  for (const id of doneSys) {
    const acc = firstAt('accepted', id), sub = firstAt('submitted', id), ok = firstAt('completed', id);
    if (acc && sub) work.push(sub - acc); else if (acc && ok) work.push(ok - acc);
    if (sub && ok) wait.push(ok - sub);
  }
  const avgH = list => list.length ? Math.round(list.reduce((a, b) => a + b, 0) / list.length / 36e5 * 10) / 10 : 0;
  return {
    name: journey.name && journey.name !== '新夥伴' ? journey.name : '新星（本機新人）', branch: '信義松仁店', live: true,
    sessions: usage.length, minutes, features, accepted, done, active: Math.max(0, accepted - done - closed), ended: closed,
    workH: avgH(work), waitH: avgH(wait), practice: practice.length,
    passRate: practice.length ? Math.round(practice.filter(p => p.passed).length / practice.length * 100) : 0,
    avgScore: practice.length ? Math.round(practice.reduce((s, p) => s + p.total, 0) / practice.length * 10) / 10 : 0
  };
}
const P_STAT_COLS = [['name', '新人'], ['branch', '分店'], ['sessions', '使用次數'], ['minutes', '使用時間（分）'], ['accepted', '任務數'], ['done', '完成'], ['active', '進行中'], ['ended', '結束／取消'], ['workH', '平均作業時間（時）'], ['waitH', '平均等待審核（時）'], ['practice', 'AI 對練次數'], ['passRate', '對練通過率（%）'], ['avgScore', '對練平均分']];
function pStatsView() {
  const local = pLocalStats();
  const rows = [local, ...P_DEMO_STATS];
  const sum = k => rows.reduce((s, r) => s + (Number(r[k]) || 0), 0);
  const feat = Object.entries(local.features).sort((a, b) => b[1] - a[1]);
  return `<div class="m-title"><small class="m-en">ANALYTICS</small><h1 class="m-serif">使用統計</h1><p>全公司陪伴期新人的使用與成效。正式版可依期間、區、分店篩選；匯出格式依公司資料庫做法定案，原型先匯出 Excel 可開啟的 CSV。</p></div>
    <div class="m-stats">
      <div class="m-stat"><span>⏱</span><b class="m-en">${sum('minutes')}</b><small>總使用分鐘</small></div>
      <div class="m-stat"><span>📜</span><b class="m-en">${sum('accepted')}</b><small>任務數</small></div>
      <div class="m-stat"><span>✅</span><b class="m-en">${sum('done')}</b><small>已完成</small></div>
      <div class="m-stat"><span>⚔</span><b class="m-en">${sum('practice')}</b><small>AI 對練次數</small></div>
    </div>
    ${pPanel('新人明細', 'ROOKIES', `<div class="m-table-wrap"><table class="m-table"><thead><tr>${P_STAT_COLS.map(([, l]) => `<th>${l}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${P_STAT_COLS.map(([k]) => `<td>${k === 'name' ? `${pEsc(r.name)}${r.live ? '' : '<br><small class="m-muted">示範</small>'}` : pEsc(r[k])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`,
      '<button type="button" class="m-btn-gold" id="p-export">匯出 Excel</button>')}
    ${pPanel('本機新人：各功能停留時間', 'FEATURES', feat.length ? `<table class="m-table"><thead><tr><th>功能</th><th>停留時間（分）</th></tr></thead><tbody>${feat.map(([k, v]) => `<tr><td>${P_TAB_NAMES[k] || pEsc(k)}</td><td class="m-en">${Math.round(v / 6) / 10}</td></tr>`).join('')}</tbody></table>` : pEmpty('還沒有使用紀錄。'))}`;
}
function pExport() {
  const rows = [pLocalStats(), ...P_DEMO_STATS];
  const cell = v => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const csv = [P_STAT_COLS.map(([, l]) => l), ...rows.map(r => P_STAT_COLS.map(([k]) => r[k]))].map(line => line.map(cell).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `新人使用統計_${v4cToday()}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  pToast('已匯出 CSV，可用 Excel 開啟');
}

/* ---------- 動作 ---------- */
function pSubmitTask(form, mode) {
  const id = form.dataset.target;
  const pub = v4cPublished();
  const before = pub.tasks[id];
  const data = new FormData(form);
  const abilities = [0, 1, 2].map(i => [String(data.get('ability' + i) || ''), Number(data.get('weight' + i)) || 0]).filter(([a, w]) => a && w > 0);
  const total = abilities.reduce((s, [, w]) => s + w, 0);
  if (!abilities.length) return pToast('請至少選 1 項成長能力');
  if (new Set(abilities.map(([a]) => a)).size !== abilities.length) return pToast('成長能力不可重複');
  if (total !== 100) return pToast(`能力權重合計需為 100%（目前 ${total}%）`);
  const after = { title: String(data.get('title')).trim().slice(0, 40), tier: String(data.get('tier')), abilities: abilities.map(([a, w]) => { const [g, k] = a.split(':'); return [g, k, w / 100]; }) };
  if (!after.title) return pToast('請填寫任務名稱');
  if (!before.native) {
    after.mode = String(data.get('mode'));
    if (after.mode === 'report') { after.field = String(data.get('field')); after.min = Math.max(1, parseInt(data.get('min'), 10) || 1); }
  }
  const pick = Object.fromEntries(Object.keys(after).map(k => [k, before[k]]));
  if (JSON.stringify(pick) === JSON.stringify(after)) return pToast('內容沒有修改');
  const state = pState();
  state.changes.push(pNewChange({ type: 'task', target: id, before: pick, after, note: String(data.get('note') || '').trim(), effectiveAt: String(data.get('effectiveAt') || ''), status: mode, submittedAt: mode === 'pending' ? new Date().toISOString() : null }));
  v4cSave(state);
  pEditing = null;
  pToast(mode === 'pending' ? '已送 PO 核准' : '已存成草稿');
  pRender();
}
function pSubmitParams(form, mode) {
  const pub = v4cPublished();
  const data = new FormData(form);
  const after = Object.fromEntries(Object.keys(V4C_PARAM_NAMES).map(k => [k, Math.max(1, parseInt(data.get(k), 10) || pub.params[k])]));
  if (JSON.stringify(after) === JSON.stringify(Object.fromEntries(Object.keys(V4C_PARAM_NAMES).map(k => [k, pub.params[k]])))) return pToast('參數沒有修改');
  const state = pState();
  state.changes.push(pNewChange({ type: 'params', before: { ...pub.params }, after, note: String(data.get('note') || '').trim(), effectiveAt: String(data.get('effectiveAt') || ''), status: mode, submittedAt: mode === 'pending' ? new Date().toISOString() : null }));
  v4cSave(state);
  pToast(mode === 'pending' ? '已送 PO 核准' : '已存成草稿');
  pRender();
}
function pDecide(id, approve, feedback) {
  const state = pState();
  const c = state.changes.find(x => x.id === id);
  if (!c || c.status !== 'pending' || !pIsPO() || c.createdBy === pMe().emp) return;
  if (!approve && !feedback) return pToast('退回時請填寫原因');
  Object.assign(c, approve ? { status: 'approved', approvedBy: pMe().emp, approvedAt: new Date().toISOString(), feedback: '' } : { status: 'returned', feedback, returnedAt: new Date().toISOString() });
  v4cSave(state);
  pToast(approve ? (c.effectiveAt && c.effectiveAt > v4cToday() ? `已核准，${c.effectiveAt} 生效` : '已核准，新人 APP 與店長後台已套用') : '已退回給 PM');
  pRender();
}

function pBind(main) {
  main.querySelectorAll('[data-edit-task]').forEach(b => b.addEventListener('click', () => { pEditing = { type: 'task', target: b.dataset.editTask }; pRender(); window.scrollTo({ top: 0 }); }));
  main.querySelector('[data-cancel-edit]')?.addEventListener('click', () => { pEditing = null; pRender(); });
  const taskForm = document.getElementById('p-task-form');
  if (taskForm) {
    const rule = taskForm.querySelector('.m-report-rule');
    taskForm.querySelectorAll('[name="mode"]').forEach(r => r.addEventListener('change', () => { rule.hidden = taskForm.elements.mode.value !== 'report'; }));
    taskForm.addEventListener('submit', e => { e.preventDefault(); pSubmitTask(taskForm, e.submitter?.dataset.mode || 'draft'); });
  }
  const paramsForm = document.getElementById('p-params-form');
  paramsForm?.addEventListener('submit', e => { e.preventDefault(); pSubmitParams(paramsForm, e.submitter?.dataset.mode || 'draft'); });
  main.querySelectorAll('[data-submit]').forEach(b => b.addEventListener('click', () => {
    const state = pState(); const c = state.changes.find(x => x.id === b.dataset.submit);
    if (c) { c.status = 'pending'; c.submittedAt = new Date().toISOString(); v4cSave(state); pToast('已送 PO 核准'); pRender(); }
  }));
  main.querySelectorAll('[data-drop]').forEach(b => b.addEventListener('click', () => {
    const state = pState(); state.changes = state.changes.filter(x => x.id !== b.dataset.drop); v4cSave(state); pToast('已刪除草稿'); pRender();
  }));
  main.querySelectorAll('[data-approve]').forEach(b => b.addEventListener('click', () => pDecide(b.dataset.approve, true)));
  main.querySelectorAll('[data-return]').forEach(b => b.addEventListener('click', () => pDecide(b.dataset.return, false, b.closest('.m-card').querySelector('[data-feedback]')?.value.trim())));
  main.querySelectorAll('[data-restore]').forEach(b => b.addEventListener('click', () => {
    const n = Number(b.dataset.restore);
    const state = pState();
    if (state.changes.some(c => c.type === 'restore' && c.status === 'pending')) return pToast('已有還原在等 PO 核准');
    state.changes.push(pNewChange({ type: 'restore', restoreTo: n, snapshot: v4cVersion(n, state), status: 'pending', submittedAt: new Date().toISOString(), note: `還原到 v${n}` }));
    v4cSave(state);
    pToast(`已送出還原到 v${n}，等 PO 核准`);
    pRender();
  }));
  const staffForm = document.getElementById('p-staff-form');
  staffForm?.addEventListener('submit', e => {
    e.preventDefault();
    const emp = staffForm.elements.emp.value.trim(), role = staffForm.elements.role.value;
    if (!/^[A-Za-z0-9]{4,10}$/.test(emp)) return pToast('員工編號格式不正確');
    const state = pState();
    if (state.staff.some(s => s.emp === emp)) return pToast('這個員工編號已在名單中');
    state.staff.push({ emp, role, addedAt: new Date().toISOString(), addedBy: pMe().emp });
    v4cSave(state);
    pToast(`已加入 ${emp}（${role}）`);
    pRenderMe(); pRender();
  });
  main.querySelectorAll('[data-remove]').forEach(b => b.addEventListener('click', () => {
    const state = pState();
    const target = state.staff.find(s => s.emp === b.dataset.remove);
    if (target?.role === 'PO' && state.staff.filter(s => s.role === 'PO').length === 1) return pToast('至少要保留一位 PO');
    if (target?.role === 'PM' && state.staff.filter(s => s.role === 'PM').length === 1) return pToast('至少要保留一位 PM');
    state.staff = state.staff.filter(s => s.emp !== b.dataset.remove);
    v4cSave(state);
    pToast('已移除');
    pRenderMe(); pRender();
  }));
  document.getElementById('p-export')?.addEventListener('click', pExport);
}

const P_VIEWS = { tasks: pTasksView, params: pParamsView, approvals: pApprovalsView, versions: pVersionsView, staff: pStaffView, stats: pStatsView };
function pRender() {
  const main = document.getElementById('m-main');
  main.innerHTML = P_VIEWS[pView]();
  pBind(main);
  const n = pState().changes.filter(c => c.status === 'pending').length;
  const badge = document.querySelector('[data-count="approvals"]');
  if (badge) { badge.textContent = n || ''; badge.hidden = !n; }
}
function pGo(view) {
  if (!P_VIEWS[view]) return;
  pView = view;
  pEditing = null;
  document.querySelectorAll('.m-nav [data-view]').forEach(b => { if (b.dataset.view === view) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
  history.replaceState(null, '', '#' + view);
  pRender();
  document.getElementById('m-main').focus({ preventScroll: true });
  window.scrollTo({ top: 0 });
}
function pRenderMe() {
  const sel = document.getElementById('p-me');
  const me = pMe();
  sel.innerHTML = pState().staff.map(s => `<option value="${pEsc(s.emp)}" ${s.emp === me.emp ? 'selected' : ''}>${s.role}・${pEsc(s.emp)}</option>`).join('');
}
document.querySelectorAll('.m-nav [data-view]').forEach(b => b.addEventListener('click', () => pGo(b.dataset.view)));
document.getElementById('p-me').addEventListener('change', e => { try { localStorage.setItem(P_VIEW_KEY, JSON.stringify({ emp: e.target.value })); } catch { /* 略過 */ } pRender(); });
window.addEventListener('storage', e => {
  if (!e.key || !e.key.startsWith('sinyi-')) return;
  if (document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && document.activeElement.closest('form')) return;
  pRenderMe(); pRender();
});
pRenderMe();
pGo(P_VIEWS[location.hash.slice(1)] ? location.hash.slice(1) : 'tasks');
