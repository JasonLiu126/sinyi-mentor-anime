/* =========================================================
   店長／區主管後台（Web）：依《信義新星 任務與成長系統規格》
   - 店長看自己分店的所有新人；區主管看到的一樣，但可切換整區的新人。
   - 尚未接資料庫：每位新人的資料是這台瀏覽器裡新人 APP 的存檔（rookie-v4.js 管理各自存檔）。
     還沒在新人 APP 使用過的新人，顯示示範數字。
   - 任務設定與系統參數來自 content-v4.js（PM 後台修改、PO 核准後生效）。
   - 任務完成後的獎勵由新人 APP 發放：後台核可只改狀態，新人 APP 讀到後自動入帳並播動畫。
   ========================================================= */
const M_KEYS = {
  // 每位新人各自的存檔
  journey: 'sinyi-rpg-formal-journey-v1',       // 等級、金幣、能力分數、任務進度
  quiz: 'sinyi-rpg-formal-aptitude-v1',          // 目前職業（開發／銷售）
  quizHistory: 'sinyi-v4-quiz-history-v1',       // 覺醒試煉作答紀錄、開放重測
  surveys: 'sinyi-formal-pages-surveys-v1',      // 社區勘查紀錄
  verify: 'sinyi-v4-task-verify-v1',             // 日報（公司系統同步）、任務送審、接取日期
  log: 'sinyi-v4-task-log-v1',                   // 任務紀錄（新人 APP 寫入）
  practice: 'sinyi-v4-practice-v1',              // AI 對練評分紀錄
  party: 'sinyi-v4-party-v1',
  usage: 'sinyi-v4-usage-v1',                    // 使用紀錄
  // 共用
  managerLog: 'sinyi-v4-manager-log-v1',         // 任務紀錄（後台寫入，記錄是哪位新人）
  assign: 'sinyi-formal-manager-tasks-v1',       // 指派任務（所有新人）
  viewer: 'sinyi-v4-manager-view'                // 示範用：目前身分與選取的新人
};
const M_CLASSES = {
  A: ['社區開發刺客', '社區經營型', 'class-assassin.png'], B: ['商圈法師', '商圈經營型', 'class-mage.png'],
  C: ['社群吟遊詩人', '網路社群經營型', 'class-bard.png'], D: ['人脈召喚師', '私人人脈經營型', 'class-summoner.png'],
  E: ['名單鍊金術士', '公司既有人脈經營型', 'class-alchemist.png'], F: ['物件遊俠', '市場物件經營型', 'class-ranger.png']
};
const M_SKILL_DEFAULTS = {
  hard_know: { tax: 45, mortgage: 30, contract: 25, law: 10, market: 10 },
  soft_dev: { dev_local: 25, dev_track: 15, dev_resource: 10, dev_brand: 5 },
  soft_sal: { sal_stranger: 20, sal_present: 15, sal_resource: 5, sal_market: 5 }
};
const M_TIERS = V4C_TIERS;
const M_BUILDINGS = { b1: '大器四方', b2: '松智金賞', b3: '莊敬傳家透天' };
const M_SURVEY_FIELDS = [['age', '屋齡'], ['units', '總戶數'], ['fee', '管理費'], ['ratio', '公設比'], ['floorsUp', '地上樓層'], ['floorsDown', '地下樓層'], ['type', '建築型態'], ['management', '物業管理'], ['observation', '現場觀察']];
const M_ASSIGN_STATUS = { todo: '待完成', review: '待確認', done: '已完成', cancelled: '已取消' };
const M_CATEGORIES = ['商圈經營', '客戶跟進', '專業學習', '其他任務'];
const M_COMPANION_DAYS = 180; // 陪伴期 6 個月
// 示範身分（正式版由 SSO 與人事系統判斷）
const M_VIEWERS = [
  { key: 'store:B101', label: `店長・${V4R_BRANCHES.B101}`, role: 'store', branch: 'B101' },
  { key: 'store:B102', label: `店長・${V4R_BRANCHES.B102}`, role: 'store', branch: 'B102' },
  { key: 'area', label: `區主管・${V4R_REGION}`, role: 'area', branch: null }
];
let mView = 'overview';

/* ---------- 資料存取（之後換成 API） ---------- */
function mLoad(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(M_KEYS[key]) || 'null'); return v ?? fallback; } catch { return fallback; }
}
function mSave(key, value) {
  try { localStorage.setItem(M_KEYS[key], JSON.stringify(value)); return true; }
  catch { mToast('儲存失敗，請檢查瀏覽器儲存空間'); return false; }
}
// 某位新人的個人存檔
function mR(rid, key, fallback) { try { return JSON.parse(v4rRead(rid, M_KEYS[key]) || 'null') ?? fallback; } catch { return fallback; } }
function mW(rid, key, value) { if (v4rWrite(rid, M_KEYS[key], JSON.stringify(value))) return true; mToast('儲存失敗，請檢查瀏覽器儲存空間'); return false; }
function mLog(rid, entry) {
  const list = mLoad('managerLog', []) || [];
  list.push({ at: new Date().toISOString(), by: 'manager', rookie: rid, ...entry });
  mSave('managerLog', list.slice(-500));
}
const mEsc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const mToday = () => v4cToday();
const mTime = iso => iso ? new Date(iso).toLocaleString('zh-TW', { hour12: false, month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
const mParams = () => v4cPublished().params;
const mOverdue = iso => !!iso && Date.now() - new Date(iso).getTime() > mParams().reviewDays * 864e5;
const mSkillName = key => Object.values(V4C_SKILLS).map(g => g.items[key]).find(Boolean) || key;
function mToast(text) {
  const el = document.getElementById('m-toast');
  el.textContent = text;
  el.classList.add('is-show');
  clearTimeout(mToast.t);
  mToast.t = setTimeout(() => el.classList.remove('is-show'), 2800);
}
const mVerify = rid => { const v = mR(rid, 'verify', null); return v && v.version === 1 ? { ...v, reports: v.reports || {}, reviews: v.reviews || {}, accepted: v.accepted || {} } : { reports: {}, reviews: {}, accepted: {}, acceptedCfg: {} }; };
const mSaveVerify = (rid, v) => mW(rid, 'verify', { ...v, version: 1 });
const mAssign = () => { const v = mLoad('assign', null); return v && v.version === 1 ? v : { version: 1, members: [{ id: 'self', name: '我（目前業務）' }], active: v4rActive(), tasks: [] }; };
const mSurveys = rid => mR(rid, 'surveys', { onboarding: null, records: [], drafts: [] });
const mReportValues = e => (e && e.values) || {};

/* ---------- 目前身分與範圍 ---------- */
function mViewer() {
  const v = mLoad('viewer', {}) || {};
  const viewer = M_VIEWERS.find(x => x.key === v.key) || M_VIEWERS[0];
  return { ...viewer, rookie: v.rookie || 'self', branchFilter: v.branchFilter || 'all' };
}
function mSetViewer(patch) { const v = mViewer(); mSave('viewer', { key: v.key, rookie: v.rookie, branchFilter: v.branchFilter, ...patch }); }
function mRookies() {
  return V4R_ROOKIES.map(r => {
    const live = v4rHasData(r.id);
    const journey = live ? (mR(r.id, 'journey', {}) || {}) : {};
    const first = (mR(r.id, 'quizHistory', { entries: [] })?.entries || [])[0]?.at;
    return { ...r, live, name: journey.name && journey.name !== '新夥伴' ? journey.name : r.name, joined: r.joined || (first || new Date().toISOString()).slice(0, 10), active: r.id === v4rActive() };
  });
}
const mNameOf = id => mRookies().find(r => r.id === id)?.name || '新人';
function mScope() {
  const v = mViewer();
  return mRookies().filter(r => v.role === 'area' ? (v.branchFilter === 'all' || r.branch === v.branchFilter) : r.branch === v.branch);
}
function mSelected() {
  const scope = mScope();
  return scope.find(r => r.id === mViewer().rookie) || scope[0] || null;
}
const mDayOf = joined => Math.max(1, Math.floor((Date.parse(mToday()) - Date.parse(joined)) / 864e5) + 1);

/* ---------- 新人資料彙整（用過新人 APP 讀存檔；還沒用過顯示示範數字） ---------- */
function mRoutes() {
  const out = {};
  for (const [id, t] of Object.entries(v4cPublished().tasks)) (out[t.route] ||= []).push([id, t.title]);
  return out;
}
function mProfile(r) {
  const seed = r.seed || { exp: 0, dev: 'A', sal: 'E', routes: {}, surveys: 0, party: 0, scores: {} };
  const journey = r.live ? (mR(r.id, 'journey', {}) || {}) : {};
  const quiz = r.live ? (mR(r.id, 'quiz', {}) || {}) : {};
  const scores = r.live ? (journey.runtime?.scores || {}) : (seed.scores || {});
  const groups = Object.entries(V4C_SKILLS).map(([gk, g]) => {
    const items = Object.entries(g.items).map(([k, name]) => {
      const score = Number.isFinite(scores[gk]?.[k]) ? scores[gk][k] : M_SKILL_DEFAULTS[gk][k];
      const level = Math.min(99, Math.floor(score / 50) + 1);
      return { key: k, name, score, level, ratio: Math.min(1, score / (level * 50)) };
    });
    const total = items.reduce((s, i) => s + i.score, 0);
    return { key: gk, label: g.label, items, total, level: Math.min(99, Math.floor(total / 50) + 1) };
  });
  const exp = r.live ? (journey.game?.exp ?? 0) : seed.exp;
  const routeTitles = mRoutes();
  const routes = Object.entries(V4C_ROUTES).map(([rk, label]) => {
    const rows = r.live ? (journey.runtime?.routes?.[rk] || []) : [];
    const total = (routeTitles[rk] || []).length;
    return { key: rk, label, done: r.live ? rows.filter(x => x.done).length : Math.min(total, seed.routes?.[rk] || 0), total, rows };
  });
  return {
    ...r, level: Math.floor(exp / 60) + 1, exp,
    dev: r.live ? (quiz.appliedDev || quiz.dev || 'A') : seed.dev, sal: r.live ? (quiz.appliedSal || quiz.sal || 'E') : seed.sal,
    groups, routes,
    approvedSurveys: r.live ? (mSurveys(r.id).records || []).filter(x => x.status === 'approved').length : seed.surveys,
    party: r.live ? (mR(r.id, 'party', {})?.ids || []).length : seed.party
  };
}

/* ---------- 共用元件 ---------- */
function mRadar(items, size = 240) {
  const n = Math.max(3, items.length), c = 110, r = 80;
  const pt = (i, k) => { const a = -Math.PI / 2 + i * Math.PI * 2 / n; return [c + Math.cos(a) * r * k, c + Math.sin(a) * r * k].map(v => v.toFixed(1)).join(','); };
  const ring = k => items.map((_, i) => pt(i, k)).join(' ');
  const labels = items.map((it, i) => { const [x, y] = pt(i, 1.24).split(','); return `<text x="${x}" y="${Number(y) + 4}" text-anchor="middle">${mEsc(it.name)}</text>`; }).join('');
  return `<svg class="m-radar" viewBox="-20 -8 260 236" width="${size}" role="img" aria-label="能力雷達">
    <g class="m-radar-grid"><polygon points="${ring(1)}"/><polygon points="${ring(.66)}"/><polygon points="${ring(.33)}"/>${items.map((_, i) => `<line x1="${c}" y1="${c}" x2="${pt(i, 1).split(',')[0]}" y2="${pt(i, 1).split(',')[1]}"/>`).join('')}</g>
    <polygon class="m-radar-shape" points="${items.map((it, i) => pt(i, Math.max(.04, it.ratio))).join(' ')}"/>${labels}</svg>`;
}
const mPanel = (title, body, extra = '') => `<section class="m-panel"><header class="m-panel-head"><h2 class="m-serif">${title}</h2>${extra}</header>${body}</section>`;
const mEmpty = text => `<p class="m-empty">${text}</p>`;
const mTitle = (title, sub = '') => `<div class="m-title"><h1 class="m-serif">${title}</h1>${sub ? `<p>${sub}</p>` : ''}</div>`;
const mDaysAgo = iso => iso ? Math.floor((Date.now() - Date.parse(iso)) / 864e5) : null;
function mBranchPicker() {
  const v = mViewer();
  return v.role === 'area' ? `<div class="m-picker"><label>分店<select id="m-branch-filter"><option value="all">全區</option>${Object.entries(V4R_BRANCHES).map(([k, n]) => `<option value="${k}" ${v.branchFilter === k ? 'selected' : ''}>${n}</option>`).join('')}</select></label></div>` : '';
}
function mScopeName() {
  const v = mViewer();
  return v.role === 'area' ? `區主管・${V4R_REGION}${v.branchFilter !== 'all' ? `・${V4R_BRANCHES[v.branchFilter]}` : ''}` : `店長・${V4R_BRANCHES[v.branch]}`;
}

/* ---------- 待審（範圍內所有新人；任務送審、指派回報、社區勘查合在一起） ---------- */
function mInbox() {
  const scope = mScope();
  const ids = scope.map(r => r.id);
  const items = [];
  for (const r of scope.filter(x => x.live)) {
    for (const [id, rev] of Object.entries(mVerify(r.id).reviews)) if (rev.status === 'pending') items.push({ kind: 'verify', rid: r.id, id, name: r.name, label: '任務', title: rev.title, at: rev.submittedAt, returns: rev.returnCount || 0, body: `<pre class="m-content">${mEsc(rev.content)}</pre>` });
    for (const rec of mSurveys(r.id).records || []) if (rec.status === 'pending') items.push({ kind: 'survey', rid: r.id, id: rec.id, name: r.name, label: '社區勘查', title: M_BUILDINGS[rec.building] || rec.building, at: rec.submittedAt || rec.updatedAt, returns: Math.max(0, (rec.revision || 1) - 1),
      body: `<dl class="m-dl">${M_SURVEY_FIELDS.map(([k, label]) => `<div><dt>${label}</dt><dd>${mEsc(rec.fields?.[k] || '—')}</dd></div>`).join('')}</dl>${rec.feedback ? `<p class="m-muted">上次回饋：${mEsc(rec.feedback)}</p>` : ''}` });
  }
  for (const t of mAssign().tasks) if (t.status === 'review' && ids.includes(t.member)) items.push({ kind: 'assign', rid: t.member, id: t.id, name: mNameOf(t.member), label: '指派任務', title: t.title, at: t.submitted, returns: t.returnCount || 0, body: `<p class="m-muted">完成條件：${mEsc(t.description)}</p><pre class="m-content">${mEsc(t.report)}</pre>` });
  return items.sort((a, b) => String(a.at || '').localeCompare(String(b.at || '')));
}
function mPending() {
  const items = mInbox();
  return { reviews: items.length, overdue: items.filter(i => mOverdue(i.at)).length };
}

/* ---------- 需要關注的新人 ---------- */
function mAttention(p) {
  if (!p.live) return [['還沒開始使用 APP', 'info']];
  const out = [];
  const usage = mR(p.id, 'usage', { sessions: [] })?.sessions || [];
  const last = usage.map(s => s.end).sort().at(-1);
  const idle = mDaysAgo(last);
  if (idle !== null && idle >= 3) out.push([`已 ${idle} 天沒開 APP`, 'warn']);
  const returned = Object.values(mVerify(p.id).reviews).some(r => (r.returnCount || 0) >= 2 && r.status !== 'closed')
    || mAssign().tasks.some(t => t.member === p.id && (t.returnCount || 0) >= 2 && t.status === 'todo');
  if (returned) out.push(['有任務被退回 2 次以上', 'warn']);
  const done = p.routes.reduce((s, r) => s + r.done, 0), total = p.routes.reduce((s, r) => s + r.total, 0);
  const expected = Math.floor(total * Math.min(1, mDayOf(p.joined) / M_COMPANION_DAYS));
  if (done < expected - 1) out.push(['進度落後', 'warn']);
  if (mInbox().some(i => i.rid === p.id && mOverdue(i.at))) out.push([`有送審超過 ${mParams().reviewDays} 天未審`, 'warn']);
  return out;
}
const mAttnTags = list => list.map(([t, k]) => `<span class="m-attn is-${k}">${k === 'warn' ? '⚠ ' : ''}${mEsc(t)}</span>`).join('');

/* ---------- 總覽：今天要處理的事＋新人卡片 ---------- */
function mOverview() {
  const items = mInbox();
  const overdue = items.filter(i => mOverdue(i.at)).length;
  const byKind = k => items.filter(i => i.kind === k).length;
  const todo = [
    [byKind('verify'), '件任務待審', 'reviews'],
    [byKind('assign'), '件指派任務回報待確認', 'reviews'],
    [byKind('survey'), '份社區勘查待審', 'reviews']
  ].filter(([n]) => n);
  const rookies = mScope().map(mProfile).map(p => ({ ...p, attn: mAttention(p) }));
  const watch = rookies.filter(r => r.attn.some(([, k]) => k === 'warn')).length;
  return mTitle('總覽', mScopeName()) + mBranchPicker()
    + mPanel('今天要處理的事', todo.length ? `<ul class="m-todo">${todo.map(([n, t, go]) => `<li><button type="button" data-go="${go}"><b class="m-en">${n}</b> ${t}<span>前往 ›</span></button></li>`).join('')}
        ${overdue ? `<li class="is-red"><button type="button" data-go="reviews"><b class="m-en">${overdue}</b> 件已超過 ${mParams().reviewDays} 天（正式版每天寄 email 提醒）<span>前往 ›</span></button></li>` : ''}</ul>` : '<p class="m-done">目前沒有待處理的事 👍</p>')
    + mPanel(`新人（${rookies.length} 位）`, rookies.length ? `<div class="m-rcards">${rookies.map(r => {
        const done = r.routes.reduce((s, x) => s + x.done, 0), total = r.routes.reduce((s, x) => s + x.total, 0);
        return `<button type="button" class="m-rcard" data-rookie="${r.id}"><div class="m-rcard-top"><b class="m-serif">${mEsc(r.name)}</b><span class="m-en">Lv.${r.level}</span></div>
          <small class="m-muted">${mViewer().role === 'area' ? `${V4R_BRANCHES[r.branch]}・` : ''}到職第 ${mDayOf(r.joined)} 天${r.active ? '・APP 目前新人' : ''}</small>
          <div class="m-rcard-bar"><div class="m-bar"><i style="width:${total ? done / total * 100 : 0}%"></i></div><span>任務 ${done}/${total}</span></div>
          <div class="m-rcard-attn">${r.attn.length ? mAttnTags(r.attn) : '<span class="m-attn is-ok">進度正常</span>'}</div></button>`; }).join('')}</div>` : mEmpty('這個範圍沒有陪伴期中的新人。'), watch ? `<span class="m-badge">${watch} 位需要關注</span>` : '');
}

/* ---------- 審核：收件匣，一件一行，點開才看內容 ---------- */
function mReviews() {
  const items = mInbox();
  const maxReturns = mParams().maxReturns;
  const row = i => `<details class="m-inbox-item ${mOverdue(i.at) ? 'is-overdue' : ''}" data-kind="${i.kind}" data-id="${mEsc(i.id)}" data-rid="${i.rid}">
      <summary><span class="m-tag ${i.kind === 'verify' ? 'is-gold' : i.kind === 'survey' ? 'is-teal' : ''}">${i.label}</span><b>${mEsc(i.name)}</b><span class="m-inbox-title">${mEsc(i.title)}</span>
        ${i.returns ? `<span class="m-tag">已退回 ${i.returns} 次</span>` : ''}<small>${i.at ? (mDaysAgo(i.at) ? `${mDaysAgo(i.at)} 天前送出` : '今天送出') : ''}${mOverdue(i.at) ? '・逾期' : ''}</small></summary>
      <div class="m-inbox-body">${i.body}
        <div class="m-return" hidden><label class="m-field">退回原因${i.kind === 'survey' ? '' : `（第 ${maxReturns} 次退回任務即結束）`}<textarea rows="2" maxlength="300" data-feedback></textarea></label></div>
        <div class="m-actions"><button type="button" class="m-btn-gold" data-act="approve">${i.kind === 'assign' ? '確認完成' : '核可'}</button><button type="button" class="m-btn-ghost" data-act="return">退回…</button></div></div></details>`;
  return mTitle('審核', `請在 ${mParams().reviewDays} 天內審核。核可後新人 APP 自動發放獎勵。`) + mBranchPicker()
    + (items.length ? `<div class="m-inbox">${items.map(row).join('')}</div>` : `<div class="m-panel"><p class="m-done">目前沒有待審核的項目 👍</p></div>`);
}

/* ---------- 新人：分頁（概況／能力／任務紀錄／AI 對練／適性測驗） ---------- */
const M_ROOKIE_TABS = [['summary', '概況'], ['skills', '能力'], ['tasks', '任務紀錄'], ['practice', 'AI 對練'], ['quiz', '適性測驗']];
function mRookieView() {
  const sel = mSelected();
  const scope = mScope(), v = mViewer();
  const picker = `<div class="m-picker">${mBranchPicker().replace(/^<div class="m-picker">|<\/div>$/g, '')}<label>新人<select id="m-rookie-picker">${scope.map(r => `<option value="${r.id}" ${sel?.id === r.id ? 'selected' : ''}>${mEsc(r.name)}${v.role === 'area' ? `（${V4R_BRANCHES[r.branch]}）` : ''}</option>`).join('')}</select></label></div>`;
  if (!sel) return mTitle('新人') + picker + mEmpty('這個範圍沒有新人。');
  const p = mProfile(sel);
  const tab = M_ROOKIE_TABS.some(([k]) => k === mRookieView.tab) ? mRookieView.tab : 'summary';
  const cls = M_CLASSES[p.dev] || M_CLASSES.A, salCls = M_CLASSES[p.sal] || M_CLASSES.E;
  const tabs = `<div class="m-tabs" role="tablist">${M_ROOKIE_TABS.map(([k, l]) => `<button type="button" role="tab" data-tab="${k}" aria-selected="${k === tab}">${l}</button>`).join('')}</div>`;
  const notStarted = p.live ? '' : '<p class="m-note-inline">這位新人還沒在新人 APP 使用過，以下是示範數字。在新人 APP 右上 👤 切換成他，就能實際操作。</p>';
  let body = '';
  if (tab === 'summary') {
    const all6 = [p.groups[0].items[0], p.groups[0].items[1], p.groups[0].items[2], p.groups[1].items[0], p.groups[1].items[1], { ...p.groups[1].items[2], name: '人脈' }];
    const done = p.routes.reduce((s, r) => s + r.done, 0), total = p.routes.reduce((s, r) => s + r.total, 0);
    const practice = p.live ? (mR(p.id, 'practice', []) || []).length : 0;
    const attn = mAttention(p);
    body = `<section class="m-panel m-hero"><img class="m-hero-art" src="./assets/v4/${cls[2]}" alt="">
        <div class="m-hero-info"><b class="m-serif">${mEsc(p.name)}</b><span class="m-muted">${mEsc(V4R_BRANCHES[p.branch])}・到職第 ${mDayOf(p.joined)} 天（陪伴期 ${M_COMPANION_DAYS} 天）</span>
          <span>開發：${cls[0]}・銷售：${salCls[0]}</span>
          <div class="m-hero-nums"><div><b class="m-en">Lv.${p.level}</b><small>等級</small></div><div><b class="m-en">${p.exp}</b><small>經驗值</small></div><div><b class="m-en">${done}/${total}</b><small>完成任務</small></div><div><b class="m-en">${practice}</b><small>AI 對練</small></div></div>
          <div class="m-rcard-attn">${attn.length ? mAttnTags(attn) : '<span class="m-attn is-ok">進度正常</span>'}</div></div>
        <div class="m-hero-radar">${mRadar(all6, 220)}<small>綜合能力</small></div></section>
      ${mPanel('各路線進度', `<div class="m-route-bars">${p.routes.map(r => `<div><span>${r.label}</span><div class="m-bar"><i style="width:${r.total ? r.done / r.total * 100 : 0}%"></i></div><em class="m-en">${r.done}/${r.total}</em></div>`).join('')}</div>`)}`;
  } else if (tab === 'skills') {
    body = `<div class="m-grid3">${p.groups.map(g => mPanel(`${g.label}（Lv${g.level}）`, `${mRadar(g.items, 200)}
      <table class="m-table"><thead><tr><th>技能</th><th>等級</th><th>分數</th></tr></thead><tbody>${g.items.map(i => `<tr><td>${mEsc(i.name)}</td><td class="m-en">Lv${i.level}</td><td><div class="m-bar"><i style="width:${i.ratio * 100}%"></i></div><span class="m-en">${i.score}/${i.level * 50}</span></td></tr>`).join('')}</tbody></table>`)).join('')}</div>`;
  } else if (tab === 'tasks') {
    const routeTitles = mRoutes();
    const log = p.live ? [...(mR(p.id, 'log', []) || []), ...(mLoad('managerLog', []) || []).filter(e => (e.rookie || 'self') === p.id)].sort((a, b) => String(b.at).localeCompare(String(a.at))).slice(0, 60) : [];
    const logType = { accepted: '接取', submitted: '送審', approved: '核可', returned: '退回', closed: '結束', completed: '完成', 'report-synced': '日報同步', assigned: '指派' };
    body = `<div class="m-grid3">${p.routes.map(r => mPanel(`${r.label} ${r.done}/${r.total}`, p.live ? `<ul class="m-list">${(routeTitles[r.key] || []).map(([id, title]) => { const d = r.rows.find(x => x.id === id)?.done; return `<li class="${d ? 'is-done' : ''}">${d ? '✅' : '⬜'} ${mEsc(title)}</li>`; }).join('')}</ul>` : `<div class="m-bar"><i style="width:${r.total ? r.done / r.total * 100 : 0}%"></i></div>`)).join('')}</div>
      ${p.live ? mPanel('紀錄', log.length ? `<table class="m-table"><thead><tr><th>時間</th><th>事件</th><th>任務</th><th>內容／獎勵</th></tr></thead><tbody>${log.map(e => `<tr><td>${mTime(e.at)}</td><td>${logType[e.type] || e.type}</td><td>${mEsc(e.title || '')}</td><td>${e.exp ? `+${e.exp} 經驗（${mEsc(e.abilities || '')}）` : mEsc(e.detail || e.feedback || '')}</td></tr>`).join('')}</tbody></table>` : mEmpty('還沒有任務紀錄。')) : ''}`;
  } else if (tab === 'practice') {
    const practice = p.live ? (mR(p.id, 'practice', []) || []).slice().reverse().slice(0, 30) : [];
    body = mPanel('AI 對練紀錄', practice.length ? `<table class="m-table"><thead><tr><th>時間</th><th>情境</th><th>各面向分數</th><th>總分</th><th>結果</th><th>評語</th></tr></thead><tbody>${practice.map(x => `<tr><td>${mTime(x.at)}<br><small class="m-muted">第 ${x.attempt} 次</small></td><td>${mEsc(x.scenario)}</td><td>${x.dims.map(d => `${mEsc(d.label)} ${d.score}`).join('<br>')}</td><td class="m-en">${x.total}/20</td><td>${x.passed ? '<span class="m-tag is-teal">通過</span>' : '<span class="m-tag is-red">未通過</span>'}</td><td class="m-comment">${mEsc(x.comment)}</td></tr>`).join('')}</tbody></table>` : mEmpty('還沒有 AI 對練紀錄。'));
  } else {
    const history = p.live ? (mR(p.id, 'quizHistory', { entries: [], allowRetake: false }) || { entries: [] }) : { entries: [] };
    const cname = code => code ? (M_CLASSES[code]?.[0] || code) : '—';
    body = mPanel('適性測驗紀錄', `${history.entries.length ? `<table class="m-table"><thead><tr><th>時間</th><th>系統推薦</th><th>新人選擇</th><th></th></tr></thead><tbody>${history.entries.slice().reverse().map(e => {
        const diff = e.recommended && (e.recommended.dev !== e.chosen?.dev || e.recommended.sal !== e.chosen?.sal);
        return `<tr><td>${mTime(e.at)}${e.retake ? '（重測）' : ''}</td><td>開發 ${cname(e.recommended?.dev)}<br>銷售 ${cname(e.recommended?.sal)}</td><td>開發 ${cname(e.chosen?.dev)}<br>銷售 ${cname(e.chosen?.sal)}</td><td>${diff ? '<span class="m-tag is-gold">和推薦不同</span>' : ''}</td></tr>`; }).join('')}</tbody></table>` : mEmpty('還沒有作答紀錄。')}
      ${p.live ? `<div class="m-actions" style="margin-top:12px">${history.allowRetake ? '<span class="m-tag is-gold">已開放重測：新人下次進入會重做</span><button type="button" class="m-btn-ghost" data-retake="off">取消開放</button>' : '<button type="button" class="m-btn-gold" data-retake="on">開放重測</button>'}</div>` : ''}`);
  }
  return mTitle('新人') + picker + notStarted + tabs + body;
}

/* ---------- 指派任務：基本欄位＋進階設定 ---------- */
// 任務類型對應的預設成長能力
const M_CATEGORY_ABILITY = { 商圈經營: 'hard_know:market', 客戶跟進: 'soft_sal:sal_resource', 專業學習: 'hard_know:tax', 其他任務: 'soft_dev:dev_local' };
function mAssignToday(state, member) {
  const today = mToday();
  const created = state.tasks.filter(t => t.member === member && (t.created || '').slice(0, 10) === today && t.status !== 'cancelled');
  return {
    count: created.length,
    exp: created.reduce((s, t) => s + (M_TIERS[t.tier]?.[1] || 0), 0),
    active: state.tasks.filter(t => t.member === member && ['todo', 'review'].includes(t.status)).length
  };
}
function mAssignView() {
  const state = mAssign();
  const limits = mParams();
  const filter = mAssignView.filter || 'todo';
  const scope = mScope();
  const scopeIds = scope.map(r => r.id);
  const list = state.tasks.filter(t => scopeIds.includes(t.member) && (filter === 'all' || t.status === filter)).slice().reverse();
  const skillOptions = sel => `<option value="">（不選）</option>${Object.entries(V4C_SKILLS).map(([gk, g]) => `<optgroup label="${g.label}">${Object.entries(g.items).map(([k, n]) => `<option value="${gk}:${k}" ${sel === `${gk}:${k}` ? 'selected' : ''}>${n}</option>`).join('')}</optgroup>`).join('')}`;
  const abilityRow = (i, w, sel = '') => `<div class="m-ability-row"><select name="ability${i}">${skillOptions(sel)}</select><input type="number" name="weight${i}" min="0" max="100" step="10" value="${w}"><span>%</span></div>`;
  const counts = Object.fromEntries(['todo', 'review', 'done', 'cancelled'].map(k => [k, state.tasks.filter(t => scopeIds.includes(t.member) && t.status === k).length]));
  return mTitle('指派任務', `每位新人每天最多 ${limits.perDay} 件、經驗合計 ${limits.expPerDay}、進行中最多 ${limits.active} 件。指派任務只給經驗，不發金幣。`) + mBranchPicker()
    + mPanel('新增任務', `<form id="m-assign-form" class="m-assign-form">
        <div class="m-form-row"><label class="m-field">任務名稱<input name="title" required maxlength="80" placeholder="例如：整理松智路社區的近期成交"></label>
          <label class="m-field">任務類型<select name="category">${M_CATEGORIES.map(c => `<option>${c}</option>`).join('')}</select></label></div>
        <label class="m-field">完成條件<textarea name="description" required maxlength="1000" rows="2" placeholder="例如：比較 3 筆近期成交，回報一個價格觀察與下一步。"></textarea></label>
        <div class="m-form-row"><fieldset class="m-field"><legend>給誰</legend><div class="m-members">${scope.map(r => { const u = mAssignToday(state, r.id); const full = u.count >= limits.perDay || u.active >= limits.active; return `<label class="m-check ${full ? 'is-full' : ''}"><input type="checkbox" name="member" value="${mEsc(r.id)}" ${r.id === mSelected()?.id && !full ? 'checked' : ''} ${full ? 'disabled' : ''}>${mEsc(r.name)}${full ? '<small class="m-muted">（今天已達上限）</small>' : ''}</label>`; }).join('')}</div></fieldset>
          <label class="m-field">期限（選填）<input type="date" name="due" min="${mToday()}"></label></div>
        <details class="m-advanced"><summary>進階設定：判定方式、難度、成長能力</summary>
          <fieldset class="m-field"><legend>怎麼算完成</legend>
            <label class="m-check"><input type="radio" name="verify" value="manager" checked>新人回報，我來確認</label>
            <label class="m-check"><input type="radio" name="verify" value="report">看公司日報自動判定</label></fieldset>
          <div class="m-report-rule" hidden><fieldset class="m-field"><legend>日報行程（任一筆都算）</legend>${v4cTripPickerHTML('reportTrips')}</fieldset>
            <label class="m-field">累計幾筆算完成<input type="number" name="reportMin" min="1" max="99" value="1"></label></div>
          <label class="m-field">難度<select name="tier">${Object.entries(M_TIERS).map(([k, [n, e]]) => `<option value="${k}" ${k === 'S' ? 'selected' : ''}>${n}（+${e} 經驗）</option>`).join('')}</select></label>
          <fieldset class="m-field"><legend>成長能力（依任務類型預設，可改；最多 3 項，合計 100%）</legend>${abilityRow(1, 100, M_CATEGORY_ABILITY[M_CATEGORIES[0]])}${abilityRow(2, 0)}${abilityRow(3, 0)}</fieldset>
        </details>
        <div class="m-actions"><button type="submit" class="m-btn-gold">指派</button></div></form>`)
    + mPanel('任務清單', `<div class="m-filters">${[['todo', '進行中'], ['review', '待確認'], ['done', '已完成'], ['cancelled', '已取消'], ['all', '全部']].map(([k, l]) => `<button type="button" data-filter="${k}" aria-pressed="${k === filter}">${l}${counts[k] !== undefined ? ` ${counts[k]}` : ''}</button>`).join('')}</div>
        ${list.length ? `<div class="m-inbox">${list.map(t => `<details class="m-inbox-item" data-kind="assign" data-id="${t.id}" data-rid="${t.member}"><summary><span class="m-tag ${t.status === 'done' ? 'is-teal' : t.status === 'review' ? 'is-gold' : ''}">${M_ASSIGN_STATUS[t.status]}</span><b>${mEsc(mNameOf(t.member))}</b><span class="m-inbox-title">${mEsc(t.title)}</span><small>${t.due ? '期限 ' + mEsc(t.due) : ''}</small></summary>
          <div class="m-inbox-body"><p class="m-muted">${mEsc(t.description)}</p>
          <p class="m-muted">${t.verify === 'report' ? `看日報判定：${mEsc(v4cRuleText(t.reportTrips, t.reportMin))}` : '新人回報、店長確認'}・難度${M_TIERS[t.tier]?.[0] || ''}（+${M_TIERS[t.tier]?.[1] || 0} 經驗）${t.abilities?.length ? `・${t.abilities.map(([, k, w]) => `${mSkillName(k)} ${Math.round(w * 100)}%`).join('、')}` : ''}${t.rewarded ? '・已入帳' : ''}</p>
          ${t.report ? `<pre class="m-content">${mEsc(t.report)}</pre>` : ''}${t.feedback ? `<p class="m-muted">回饋：${mEsc(t.feedback)}</p>` : ''}
          ${['todo', 'review'].includes(t.status) ? '<div class="m-actions"><button type="button" class="m-btn-ghost" data-act="cancel">取消任務</button></div>' : ''}</div></details>`).join('')}</div>` : mEmpty('沒有這類任務。')}`);
}

/* ---------- Demo 工具：模擬公司日報同步 ---------- */
// 目前任務規則用到的行程（系統任務＋範圍內未完成的指派任務），讓同步表單只列相關項目
function mRuleTrips() {
  const keys = new Set();
  for (const t of Object.values(v4cPublished().tasks)) if (t.mode === 'report') (t.trips || []).forEach(k => keys.add(k));
  for (const t of mAssign().tasks) if (t.verify === 'report' && t.status === 'todo') (t.reportTrips || []).forEach(k => keys.add(k));
  return [...keys].filter(k => !k.endsWith('|*'));
}
function mSyncView() {
  const sel = mSelected();
  const scope = mScope();
  const picker = `<div class="m-picker"><label>新人<select id="m-rookie-picker">${scope.map(r => `<option value="${r.id}" ${sel?.id === r.id ? 'selected' : ''}>${mEsc(r.name)}</option>`).join('')}</select></label></div>`;
  const head = mTitle('🧪 模擬公司日報同步', 'Demo 用。正式版由排程每天 2 次自動從公司日報系統同步店長已審核的行程，店長不需要操作。');
  if (!sel) return head + mEmpty('這個範圍沒有新人。');
  const verify = mVerify(sel.id);
  const today = mReportValues(verify.reports[mToday()]);
  const dates = Object.keys(verify.reports).sort().reverse().slice(0, 14);
  return head + picker + `<div class="m-grid2">
    ${mPanel('同步一天的日報', `<form id="m-sync-form" class="m-assign-form">
        <label class="m-field">日期<input type="date" name="date" value="${mToday()}" max="${mToday()}" required></label>
        <p class="m-muted">任務規則用到的行程</p>
        <div class="m-sync-rows">${mRuleTrips().map(k => `<label class="m-sync-row"><span>${mEsc(v4cTripLabel(k))}</span><input type="number" min="0" max="99" data-trip="${mEsc(k)}" value="${Number(today[k]) || 0}"></label>`).join('')}</div>
        <p class="m-muted">其他行程</p>
        <div class="m-sync-other"><div class="m-trip-selects"><select data-level="item" aria-label="行程項目">${V4C_TRIP.map(([item]) => `<option>${mEsc(item)}</option>`).join('')}</select><select data-level="mode" aria-label="行程方式"></select><select data-level="act" aria-label="經營行為"></select></div>
          <label class="m-field">筆數<input type="number" name="otherCount" min="0" max="99" value="0"></label></div>
        <button type="submit" class="m-btn-gold">同步</button></form>`)}
    ${mPanel('已同步', `<p class="m-muted">上次同步：${verify.lastSync ? mTime(verify.lastSync) : '尚未同步'}</p>${dates.length ? `<table class="m-table"><thead><tr><th>日期</th><th>已審核行程</th></tr></thead><tbody>${dates.map(d => { const vals = Object.entries(mReportValues(verify.reports[d])).filter(([, n]) => Number(n) > 0); return `<tr><td class="m-en">${d}</td><td>${vals.length ? vals.map(([k, n]) => `${mEsc(v4cTripLabel(k))} <b class="m-en">${n}</b>`).join('<br>') : '—'}</td></tr>`; }).join('')}</tbody></table>` : mEmpty('還沒有同步到日報。')}`)}
  </div>`;
}

/* ---------- 動作 ---------- */
function mAct(card, act) {
  const kind = card.dataset.kind, id = card.dataset.id, rid = card.dataset.rid;
  const maxReturns = mParams().maxReturns;
  const feedback = card.querySelector('[data-feedback]')?.value.trim() || '';
  if (act === 'return') {
    const box = card.querySelector('.m-return');
    if (box?.hidden) { box.hidden = false; card.querySelector('[data-act=return]').textContent = '確定退回'; card.querySelector('[data-feedback]').focus(); return; }
    if (!feedback) { mToast('退回時請填寫原因'); card.querySelector('[data-feedback]')?.focus(); return; }
  }
  if (kind === 'verify') {
    const v = mVerify(rid); const r = v.reviews[id]; if (!r || r.status !== 'pending') return;
    if (act === 'approve') { r.status = 'approved'; r.approvedAt = new Date().toISOString(); mLog(rid, { type: 'approved', source: 'system', taskId: id, title: r.title }); mToast(`已核可「${r.title}」，新人 APP 會自動發獎勵`); }
    else {
      r.returnCount = (r.returnCount || 0) + 1; r.feedback = feedback;
      r.status = r.returnCount >= maxReturns ? 'closed' : 'returned';
      mLog(rid, { type: r.status === 'closed' ? 'closed' : 'returned', source: 'system', taskId: id, title: r.title, feedback });
      mToast(r.status === 'closed' ? `「${r.title}」已退回 ${maxReturns} 次，任務結束` : `已退回「${r.title}」（第 ${r.returnCount} 次）`);
    }
    mSaveVerify(rid, v);
  } else if (kind === 'assign') {
    const s = mAssign(); const t = s.tasks.find(x => x.id === id); if (!t) return;
    if (act === 'cancel') { if (!['todo', 'review'].includes(t.status)) return; t.status = 'cancelled'; mLog(t.member, { type: 'closed', source: 'assign', taskId: id, title: t.title, feedback: '店長取消' }); mToast('已取消任務'); }
    else {
      if (t.status !== 'review') return;
      t.feedback = feedback.slice(0, 500); t.reviewed = new Date().toISOString();
      if (act === 'approve') { t.status = 'done'; mLog(t.member, { type: 'approved', source: 'assign', taskId: id, title: t.title }); mToast('已確認完成，新人 APP 會自動發放經驗'); }
      else {
        t.returnCount = (t.returnCount || 0) + 1;
        t.status = t.returnCount >= maxReturns ? 'cancelled' : 'todo';
        if (t.status === 'cancelled') t.feedback = `${t.feedback}（已退回 ${maxReturns} 次，任務結束）`;
        mLog(t.member, { type: t.status === 'cancelled' ? 'closed' : 'returned', source: 'assign', taskId: id, title: t.title, feedback });
        mToast(t.status === 'cancelled' ? `已退回 ${maxReturns} 次，任務結束` : `已退回（第 ${t.returnCount} 次），新人可補充後再回報`);
      }
    }
    mSave('assign', s);
  } else if (kind === 'survey') {
    const s = mSurveys(rid); const rec = (s.records || []).find(x => x.id === id); if (!rec || rec.status !== 'pending') return;
    Object.assign(rec, { status: act === 'approve' ? 'approved' : 'returned', feedback: act === 'approve' ? '' : feedback.slice(0, 500), revision: rec.revision + 1 });
    mW(rid, 'surveys', s);
    mLog(rid, { type: act === 'approve' ? 'approved' : 'returned', source: 'system', taskId: 'dev_m_01', title: `社區勘查・${M_BUILDINGS[rec.building] || rec.building}`, feedback });
    mToast(act === 'approve' ? `已核可「${M_BUILDINGS[rec.building] || rec.building}」，新人可開寶箱` : '已退回社區勘查');
  }
  mRender();
}

function mSubmitSync(form) {
  const sel = mSelected();
  if (!sel) return;
  const date = form.elements.date.value || mToday();
  const values = {};
  form.querySelectorAll('[data-trip]').forEach(input => { const n = Math.max(0, Math.min(99, parseInt(input.value, 10) || 0)); if (n) values[input.dataset.trip] = n; });
  const other = Math.max(0, Math.min(99, parseInt(form.elements.otherCount.value, 10) || 0));
  if (other) {
    const [item, mode, act] = ['item', 'mode', 'act'].map(l => form.querySelector(`.m-sync-other [data-level=${l}]`).value);
    if (act === '*') { mToast('「其他行程」請選一個經營行為'); return; }
    const key = `${item}|${mode}|${act}`;
    values[key] = (values[key] || 0) + other;
  }
  const v = mVerify(sel.id);
  const now = new Date().toISOString();
  v.reports[date] = { values, status: 'approved', source: 'company', syncedAt: now };
  v.lastSync = now;
  if (mSaveVerify(sel.id, v)) {
    mLog(sel.id, { type: 'report-synced', source: 'report', title: `${date} 日報`, detail: Object.entries(values).map(([k, n]) => `${v4cTripLabel(k)} ${n}`).join('、') || '沒有行程' });
    mToast(`已同步 ${sel.name} ${date} 的日報${sel.active ? '，新人 APP 的 📊 任務會自動核對' : '（他在新人 APP 登入時會自動核對）'}`);
    mRender();
  }
}

function mSubmitAssign(form) {
  const data = new FormData(form), members = data.getAll('member');
  const limits = mParams();
  const title = String(data.get('title')).trim(), description = String(data.get('description')).trim(), due = String(data.get('due') || '');
  const verify = String(data.get('verify') || ''), tier = String(data.get('tier'));
  if (!title || !description || !members.length) { mToast('請填寫任務、完成條件，並至少選一位新人'); return; }
  if (!verify) { mToast('請選擇判定方式（日報或店長）'); return; }
  let reportTrips = [];
  try { reportTrips = JSON.parse(String(data.get('reportTrips') || '[]')); } catch { reportTrips = []; }
  if (verify === 'report' && !reportTrips.length) { mToast('日報判定請至少選一種行程'); return; }
  const abilities = [1, 2, 3].map(i => [String(data.get('ability' + i) || ''), Number(data.get('weight' + i)) || 0]).filter(([a, w]) => a && w > 0);
  const total = abilities.reduce((s, [, w]) => s + w, 0);
  if (!abilities.length) { mToast('請至少選 1 項成長能力'); return; }
  if (new Set(abilities.map(([a]) => a)).size !== abilities.length) { mToast('成長能力不可重複'); return; }
  if (total !== 100) { mToast(`能力權重合計需為 100%（目前 ${total}%）`); return; }
  const s = mAssign();
  const exp = M_TIERS[tier][1];
  for (const member of members) {
    const u = mAssignToday(s, member), name = mNameOf(member);
    if (u.count + 1 > limits.perDay) { mToast(`${name} 今天已派 ${u.count} 件，已達每日上限 ${limits.perDay} 件`); return; }
    if (u.exp + exp > limits.expPerDay) { mToast(`${name} 今天指派經驗合計會超過 ${limits.expPerDay}（目前 ${u.exp}）`); return; }
    if (u.active + 1 > limits.active) { mToast(`${name} 進行中的指派任務已有 ${u.active} 件，上限 ${limits.active} 件`); return; }
  }
  const created = new Date().toISOString();
  for (const member of members) {
    // 既有指派存檔要求對象在成員名單內
    if (!s.members.some(m => m.id === member)) s.members.push({ id: member, name: mNameOf(member) });
    const task = {
      id: crypto.randomUUID(), title: title.slice(0, 80), description: description.slice(0, 1000), category: String(data.get('category')), due, member,
      status: 'todo', report: '', feedback: '', created, verify, tier, exp,
      reportTrips: verify === 'report' ? reportTrips : [], reportMin: verify === 'report' ? Math.max(1, parseInt(data.get('reportMin'), 10) || 1) : 0,
      abilities: abilities.map(([a, w]) => { const [g, k] = a.split(':'); return [g, k, w / 100]; }), returnCount: 0
    };
    s.tasks.push(task);
    mLog(member, { type: 'assigned', source: 'assign', taskId: task.id, title: task.title, detail: `${verify === 'report' ? '日報判定' : '店長判定'}・難度${M_TIERS[tier][0]}` });
  }
  if (mSave('assign', s)) {
    const activeName = mNameOf(v4rActive());
    mToast(members.includes(v4rActive()) ? `已發布給 ${members.length} 位新人，新人 APP 會收到通知` : `已發布給 ${members.length} 位新人。新人 APP 目前是「${activeName}」，要在 APP 右上 👤 切換成對方才看得到`);
    mRender();
  }
}

function mBindView(main) {
  main.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => mGo(b.dataset.go)));
  main.querySelectorAll('[data-rookie]').forEach(b => b.addEventListener('click', () => { mSetViewer({ rookie: b.dataset.rookie }); mRookieView.tab = 'summary'; mGo('rookie'); }));
  main.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => { mRookieView.tab = b.dataset.tab; mRender(); }));
  main.querySelectorAll('[data-kind] [data-act]').forEach(b => b.addEventListener('click', () => mAct(b.closest('[data-kind]'), b.dataset.act)));
  document.getElementById('m-rookie-picker')?.addEventListener('change', e => { mSetViewer({ rookie: e.target.value }); mRender(); });
  document.getElementById('m-branch-filter')?.addEventListener('change', e => { mSetViewer({ branchFilter: e.target.value }); mRender(); });
  main.querySelectorAll('[data-retake]').forEach(b => b.addEventListener('click', () => {
    const rid = mSelected()?.id; if (!rid) return;
    const h = mR(rid, 'quizHistory', { entries: [], allowRetake: false }) || { entries: [] };
    h.allowRetake = b.dataset.retake === 'on';
    mW(rid, 'quizHistory', h);
    mToast(h.allowRetake ? '已開放重測：新人下次進入 APP 會重做適性測驗' : '已取消開放重測');
    mRender();
  }));
  const syncForm = document.getElementById('m-sync-form');
  if (syncForm) {
    const other = syncForm.querySelector('.m-sync-other');
    const [itemSel, modeSel, actSel] = ['item', 'mode', 'act'].map(l => other.querySelector(`[data-level=${l}]`));
    const modes = () => (V4C_TRIP.find(([item]) => item === itemSel.value) || V4C_TRIP[0])[1];
    const fillActs = () => { actSel.innerHTML = (modes()[modeSel.value] || []).map(x => `<option>${mEsc(x)}</option>`).join(''); };
    const fillModes = () => { modeSel.innerHTML = Object.keys(modes()).map(m => `<option>${m}</option>`).join(''); fillActs(); };
    itemSel.addEventListener('change', fillModes);
    modeSel.addEventListener('change', fillActs);
    fillModes();
    syncForm.addEventListener('submit', e => { e.preventDefault(); mSubmitSync(syncForm); });
  }
  const assignForm = document.getElementById('m-assign-form');
  if (assignForm) {
    v4cBindTripPickers(assignForm);
    const rule = assignForm.querySelector('.m-report-rule');
    assignForm.querySelectorAll('[name="verify"]').forEach(r => r.addEventListener('change', () => { rule.hidden = assignForm.elements.verify.value !== 'report'; }));
    // 依任務類型帶入預設成長能力（只在還沒自訂第 2、3 項時）
    assignForm.elements.category.addEventListener('change', () => {
      if (assignForm.elements.ability2.value || assignForm.elements.ability3.value) return;
      assignForm.elements.ability1.value = M_CATEGORY_ABILITY[assignForm.elements.category.value] || '';
      assignForm.elements.weight1.value = 100;
    });
    assignForm.addEventListener('submit', e => { e.preventDefault(); mSubmitAssign(assignForm); });
  }
  main.querySelectorAll('[data-filter]').forEach(b => b.addEventListener('click', () => { mAssignView.filter = b.dataset.filter; mRender(); }));
}

/* ---------- 重置 Demo（清除這台瀏覽器的所有新星資料） ---------- */
function mResetDemo() {
  if (!confirm('重置 Demo 會清除這台瀏覽器裡新人 APP（所有新人）、店長後台與 PM 後台的所有資料（測驗、任務、日報、夥伴、紀錄、內容變更），回到全新狀態。確定要重置嗎？')) return;
  Object.keys(localStorage).filter(k => k.startsWith('sinyi-') && k !== 'sinyi-v4-reset-at').forEach(k => localStorage.removeItem(k));
  try { sessionStorage.clear(); } catch { /* 略過 */ }
  // 通知已開著的新人 APP 分頁停止寫入並重新載入
  localStorage.setItem('sinyi-v4-reset-at', new Date().toISOString());
  mToast('已重置 Demo：新人 APP 會從覺醒試煉重新開始');
  mRenderViewer();
  mGo('overview');
}

function mRenderViewer() {
  const sel = document.getElementById('m-viewer');
  if (!sel) return;
  const v = mViewer();
  sel.innerHTML = M_VIEWERS.map(x => `<option value="${x.key}" ${x.key === v.key ? 'selected' : ''}>${x.label}</option>`).join('');
}

const M_VIEWS = { overview: mOverview, reviews: mReviews, rookie: mRookieView, assign: mAssignView, sync: mSyncView };
const M_VIEW_ALIAS = { abilities: 'rookie', surveys: 'reviews', reports: 'sync' };
function mRender() {
  const main = document.getElementById('m-main');
  main.innerHTML = M_VIEWS[mView]();
  mBindView(main);
  const p = mPending();
  document.querySelectorAll('[data-count]').forEach(el => { const n = p[el.dataset.count]; el.textContent = n || ''; el.hidden = !n; });
  const scope = document.getElementById('m-scope-name');
  if (scope) scope.textContent = mScopeName();
}
function mGo(view) {
  view = M_VIEW_ALIAS[view] || view;
  if (!M_VIEWS[view]) return;
  mView = view;
  document.querySelectorAll('.m-side [data-view]').forEach(b => { if (b.dataset.view === view) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
  history.replaceState(null, '', '#' + view);
  mRender();
  document.getElementById('m-main').focus({ preventScroll: true });
  window.scrollTo({ top: 0 });
}

document.querySelectorAll('.m-side [data-view]').forEach(b => b.addEventListener('click', () => mGo(b.dataset.view)));
document.getElementById('m-reset')?.addEventListener('click', mResetDemo);
document.getElementById('m-viewer')?.addEventListener('change', e => { mSave('viewer', { key: e.target.value }); mRender(); });
mRenderViewer();
// 新人 APP 或 PM 後台在另一個分頁更新資料時，後台自動刷新（表單輸入中不打斷）
window.addEventListener('storage', e => {
  if (!e.key || !e.key.startsWith('sinyi-')) return;
  if (document.activeElement && document.activeElement.closest?.('form, .m-card') && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
  mRender();
});
mGo(M_VIEWS[M_VIEW_ALIAS[location.hash.slice(1)] || location.hash.slice(1)] ? location.hash.slice(1) : 'overview');
