/* =========================================================
   店長／區主管後台（Web）：依《信義新星 任務與成長系統規格》
   - 店長看自己分店的所有新人；區主管看到的一樣，但可切換整區的新人。
   - 尚未接資料庫：「本機新人」讀寫這台瀏覽器裡新人 APP 的存檔；其他新人是示範資料（唯讀）。
   - 任務設定與系統參數來自 content-v4.js（PM 後台修改、PO 核准後生效）。
   - 任務完成後的獎勵由新人 APP 發放：後台核可只改狀態，新人 APP 讀到後自動入帳並播動畫。
   ========================================================= */
const M_KEYS = {
  journey: 'sinyi-rpg-formal-journey-v1',       // 新人等級、金幣、能力分數、任務進度
  quiz: 'sinyi-rpg-formal-aptitude-v1',          // 目前職業（開發／銷售）
  quizHistory: 'sinyi-v4-quiz-history-v1',       // 覺醒試煉作答紀錄、開放重測
  surveys: 'sinyi-formal-pages-surveys-v1',      // 社區勘查紀錄
  verify: 'sinyi-v4-task-verify-v1',             // 日報（公司系統同步）、任務送審、接取日期
  log: 'sinyi-v4-task-log-v1',                   // 任務紀錄（新人 APP 寫入）
  managerLog: 'sinyi-v4-manager-log-v1',         // 任務紀錄（後台寫入；分開存避免兩個分頁同時寫入互相覆蓋）
  assign: 'sinyi-formal-manager-tasks-v1',       // 指派任務
  practice: 'sinyi-v4-practice-v1',              // AI 對練評分紀錄
  party: 'sinyi-v4-party-v1',
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
const M_REPORT_FIELDS = V4C_REPORT_FIELDS;
const M_TIERS = V4C_TIERS;
const M_BUILDINGS = { b1: '大器四方', b2: '松智金賞', b3: '莊敬傳家透天' };
const M_SURVEY_FIELDS = [['age', '屋齡'], ['units', '總戶數'], ['fee', '管理費'], ['ratio', '公設比'], ['floorsUp', '地上樓層'], ['floorsDown', '地下樓層'], ['type', '建築型態'], ['management', '物業管理'], ['observation', '現場觀察']];
const M_ASSIGN_STATUS = { todo: '待完成', review: '待確認', done: '已完成', cancelled: '已取消' };
const M_CATEGORIES = ['商圈經營', '客戶跟進', '專業學習', '其他任務'];
const M_COMPANION_DAYS = 180; // 陪伴期 6 個月

/* ---------- 組織與示範新人（正式版由人事系統提供；以下皆為虛構示範資料） ---------- */
const M_REGION = '台北一區';
const M_BRANCHES = { B101: '信義松仁店', B102: '大安敦南店', B103: '松山民生店' };
const M_VIEWERS = [
  { key: 'store:B101', label: '店長・信義松仁店', role: 'store', branch: 'B101' },
  { key: 'store:B102', label: '店長・大安敦南店', role: 'store', branch: 'B102' },
  { key: 'area', label: `區主管・${M_REGION}`, role: 'area', branch: null }
];
const M_LOCAL_ID = 'self';
const M_DEMO_ROOKIES = [
  { id: '00000000-0000-4000-8000-00000000000a', name: '林予晴', branch: 'B101', joined: '2026-08-03', exp: 420, dev: 'B', sal: 'D', routes: { dev: 3, sal: 2, com: 2 }, surveys: 2, party: 3,
    scores: { hard_know: { tax: 70, market: 55 }, soft_dev: { dev_local: 80, dev_track: 40 }, soft_sal: { sal_stranger: 35, sal_present: 30 } } },
  { id: '00000000-0000-4000-8000-00000000000b', name: '陳柏宇', branch: 'B102', joined: '2026-09-15', exp: 180, dev: 'A', sal: 'E', routes: { dev: 2, sal: 1, com: 1 }, surveys: 1, party: 1,
    scores: { hard_know: { tax: 50, contract: 35 }, soft_dev: { dev_local: 45 }, soft_sal: { sal_resource: 20 } } },
  { id: '00000000-0000-4000-8000-00000000000c', name: '張雅婷', branch: 'B102', joined: '2026-06-20', exp: 760, dev: 'F', sal: 'C', routes: { dev: 4, sal: 4, com: 3 }, surveys: 3, party: 5,
    scores: { hard_know: { tax: 95, mortgage: 60, market: 70 }, soft_dev: { dev_local: 60, dev_brand: 30 }, soft_sal: { sal_stranger: 75, sal_present: 65, sal_market: 30 } } },
  { id: '00000000-0000-4000-8000-00000000000d', name: '黃俊傑', branch: 'B103', joined: '2026-10-27', exp: 60, dev: 'D', sal: 'E', routes: { dev: 1, sal: 0, com: 1 }, surveys: 0, party: 0,
    scores: {} }
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
function mLog(entry) {
  const list = mLoad('managerLog', []) || [];
  list.push({ at: new Date().toISOString(), by: 'manager', ...entry });
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
const mVerify = () => { const v = mLoad('verify', null); return v && v.version === 1 ? { ...v, reports: v.reports || {}, reviews: v.reviews || {}, accepted: v.accepted || {} } : { reports: {}, reviews: {}, accepted: {}, acceptedCfg: {} }; };
const mSaveVerify = v => mSave('verify', { ...v, version: 1 });
const mAssign = () => { const v = mLoad('assign', null); return v && v.version === 1 ? v : { version: 1, members: [{ id: 'self', name: '我（目前業務）' }], active: 'self', tasks: [] }; };
const mSurveys = () => mLoad('surveys', { onboarding: null, records: [], drafts: [] });
const mReportValues = e => (e && e.values) || (e && !e.status ? e : {});

/* ---------- 目前身分與範圍 ---------- */
function mViewer() {
  const v = mLoad('viewer', {}) || {};
  const viewer = M_VIEWERS.find(x => x.key === v.key) || M_VIEWERS[0];
  return { ...viewer, rookie: v.rookie || M_LOCAL_ID, branchFilter: v.branchFilter || 'all' };
}
function mSetViewer(patch) { const v = mViewer(); mSave('viewer', { key: v.key, rookie: v.rookie, branchFilter: v.branchFilter, ...patch }); }
function mLocalJoined() {
  const first = (mLoad('quizHistory', { entries: [] })?.entries || [])[0]?.at;
  return (first || new Date().toISOString()).slice(0, 10);
}
function mRookies() {
  const journey = mLoad('journey', {}) || {};
  const local = { id: M_LOCAL_ID, name: journey.name && journey.name !== '新夥伴' ? journey.name : '新星（本機新人）', branch: 'B101', joined: mLocalJoined(), live: true };
  return [local, ...M_DEMO_ROOKIES.map(r => ({ ...r, live: false }))];
}
function mScope() {
  const v = mViewer();
  return mRookies().filter(r => v.role === 'area' ? (v.branchFilter === 'all' || r.branch === v.branchFilter) : r.branch === v.branch);
}
const mLocalInScope = () => mScope().some(r => r.id === M_LOCAL_ID);
function mSelected() {
  const scope = mScope();
  return scope.find(r => r.id === mViewer().rookie) || scope[0] || null;
}
const mDayOf = joined => Math.max(1, Math.floor((Date.parse(mToday()) - Date.parse(joined)) / 864e5) + 1);

/* ---------- 新人資料彙整（本機新人讀存檔；示範新人讀固定資料） ---------- */
function mRoutes() {
  const out = {};
  for (const [id, t] of Object.entries(v4cPublished().tasks)) (out[t.route] ||= []).push([id, t.title]);
  return out;
}
function mProfile(r) {
  const journey = r.live ? (mLoad('journey', {}) || {}) : {};
  const quiz = r.live ? (mLoad('quiz', {}) || {}) : {};
  const scores = r.live ? (journey.runtime?.scores || {}) : (r.scores || {});
  const groups = Object.entries(V4C_SKILLS).map(([gk, g]) => {
    const items = Object.entries(g.items).map(([k, name]) => {
      const score = Number.isFinite(scores[gk]?.[k]) ? scores[gk][k] : M_SKILL_DEFAULTS[gk][k];
      const level = Math.min(99, Math.floor(score / 50) + 1);
      return { key: k, name, score, level, ratio: Math.min(1, score / (level * 50)) };
    });
    const total = items.reduce((s, i) => s + i.score, 0);
    return { key: gk, label: g.label, items, total, level: Math.min(99, Math.floor(total / 50) + 1) };
  });
  const exp = r.live ? (journey.game?.exp ?? 0) : r.exp;
  const routeTitles = mRoutes();
  const routes = Object.entries(V4C_ROUTES).map(([rk, label]) => {
    const rows = r.live ? (journey.runtime?.routes?.[rk] || []) : [];
    const total = (routeTitles[rk] || []).length;
    return { key: rk, label, done: r.live ? rows.filter(x => x.done).length : Math.min(total, r.routes?.[rk] || 0), total, rows };
  });
  const surveys = r.live ? (mSurveys().records || []).filter(x => x.status === 'approved').length : r.surveys;
  return {
    ...r, hasData: r.live ? (!!journey.game || !!quiz.complete) : true,
    level: Math.floor(exp / 60) + 1, exp,
    dev: r.live ? (quiz.appliedDev || quiz.dev || 'A') : r.dev, sal: r.live ? (quiz.appliedSal || quiz.sal || 'E') : r.sal,
    groups, routes, approvedSurveys: surveys,
    party: r.live ? (mLoad('party', {})?.ids || []).length : r.party
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
const mPanel = (title, en, body, extra = '') => `<section class="m-panel"><header class="m-panel-head"><div><small class="m-en">${en}</small><h2 class="m-serif">${title}</h2></div>${extra}</header>${body}</section>`;
const mEmpty = text => `<p class="m-empty">${text}</p>`;
const mOverdueTag = iso => mOverdue(iso) ? `<span class="m-tag is-red">逾時（超過 ${mParams().reviewDays} 天）</span>` : '';
const mDemoNote = '<p class="m-note-inline">示範資料：正式版會顯示這位新人的審核、紀錄與日報；原型只有「本機新人」可以實際操作。</p>';
function mRookiePicker() {
  const scope = mScope(), sel = mSelected(), v = mViewer();
  return `<div class="m-picker">${v.role === 'area' ? `<label>分店<select id="m-branch-filter"><option value="all">全區</option>${Object.entries(M_BRANCHES).map(([k, n]) => `<option value="${k}" ${v.branchFilter === k ? 'selected' : ''}>${n}</option>`).join('')}</select></label>` : ''}
    <label>新人<select id="m-rookie-picker">${scope.map(r => `<option value="${r.id}" ${sel?.id === r.id ? 'selected' : ''}>${mEsc(r.name)}${v.role === 'area' ? `（${M_BRANCHES[r.branch]}）` : ''}</option>`).join('')}</select></label></div>`;
}

/* ---------- 待審統計（只有本機新人有真實送審資料） ---------- */
function mPending() {
  if (!mLocalInScope()) return { reviews: 0, surveys: 0, overdue: 0 };
  const verify = mVerify();
  const reviews = Object.values(verify.reviews).filter(r => r.status === 'pending');
  const assigns = mAssign().tasks.filter(t => t.status === 'review' && t.member === M_LOCAL_ID);
  const surveys = (mSurveys().records || []).filter(r => r.status === 'pending');
  const overdue = [...reviews.map(r => r.submittedAt), ...assigns.map(t => t.submitted), ...surveys.map(r => r.submittedAt)].filter(mOverdue).length;
  return { reviews: reviews.length + assigns.length, surveys: surveys.length, overdue };
}

/* ---------- 各頁 ---------- */
function mOverview() {
  const v = mViewer();
  const p = mPending();
  const rookies = mScope().map(mProfile);
  const scopeName = v.role === 'area' ? `${M_REGION}${v.branchFilter !== 'all' ? `・${M_BRANCHES[v.branchFilter]}` : ''}` : M_BRANCHES[v.branch];
  return `<div class="m-title"><small class="m-en">GUILD OVERVIEW</small><h1 class="m-serif">公會總覽</h1><p>${mEsc(scopeName)}・${rookies.length} 位新人在陪伴期</p></div>
    ${v.role === 'area' ? mRookiePicker().replace(/<label>新人[\s\S]*<\/label>/, '') : ''}
    ${p.overdue ? `<div class="m-alert">⚠ 有 ${p.overdue} 件送審超過 ${mParams().reviewDays} 天未審核（正式版每天寄 email 提醒店長）</div>` : ''}
    <div class="m-stats">
      <button type="button" class="m-stat" data-go="reviews"><span>👑</span><b class="m-en">${p.reviews}</b><small>待審任務</small></button>
      <button type="button" class="m-stat" data-go="surveys"><span>🧩</span><b class="m-en">${p.surveys}</b><small>待審社區勘查</small></button>
      <div class="m-stat"><span>🧑‍🎓</span><b class="m-en">${rookies.length}</b><small>陪伴中新人</small></div>
      <div class="m-stat"><span>⏰</span><b class="m-en">${p.overdue}</b><small>逾期未審</small></div>
    </div>
    ${mPanel('新人一覽', 'ROOKIES', rookies.length ? `<table class="m-table m-rookie-table"><thead><tr><th>新人</th>${v.role === 'area' ? '<th>分店</th>' : ''}<th>等級</th><th>陪伴期</th>${rookies[0].routes.map(r => `<th>${r.label}</th>`).join('')}<th></th></tr></thead><tbody>
      ${rookies.map(r => `<tr><td><b>${mEsc(r.name)}</b><br><small class="m-muted">${(M_CLASSES[r.dev] || M_CLASSES.A)[0]}${r.live ? '' : '・示範'}</small></td>${v.role === 'area' ? `<td>${M_BRANCHES[r.branch]}</td>` : ''}<td class="m-en">Lv.${r.level}</td>
        <td>第 ${mDayOf(r.joined)} 天<div class="m-bar"><i style="width:${Math.min(100, mDayOf(r.joined) / M_COMPANION_DAYS * 100)}%"></i></div></td>
        ${r.routes.map(x => `<td class="m-en">${x.done}/${x.total}</td>`).join('')}<td><button type="button" class="m-btn-ghost" data-rookie="${r.id}">查看 ›</button></td></tr>`).join('')}</tbody></table>` : mEmpty('這個範圍沒有陪伴期中的新人。'))}`;
}

function mReviews() {
  if (!mLocalInScope()) return `<div class="m-title"><small class="m-en">REVIEW</small><h1 class="m-serif">任務審核</h1></div>${mPanel('待審', 'QUEST REVIEW', mEmpty('這個範圍目前沒有待審核的任務。') + mDemoNote)}`;
  const name = mRookies()[0].name;
  const verify = mVerify();
  const maxReturns = mParams().maxReturns;
  const pending = Object.entries(verify.reviews).filter(([, r]) => r.status === 'pending');
  const approved = Object.entries(verify.reviews).filter(([, r]) => r.status === 'approved');
  const assignReview = mAssign().tasks.filter(t => t.status === 'review' && t.member === M_LOCAL_ID);
  const returns = n => n ? `<span class="m-tag">已退回 ${n}/${maxReturns} 次</span>` : '';
  const reviewCard = ([id, r]) => `<article class="m-card" data-kind="verify" data-id="${id}">
      <div class="m-card-top"><span class="m-tag is-gold">${mEsc(r.tag || '任務')}</span><b class="m-serif">${mEsc(r.title)}</b>${returns(r.returnCount)}${mOverdueTag(r.submittedAt)}<small>${mEsc(name)}・${mTime(r.submittedAt)} 送出</small></div>
      <pre class="m-content">${mEsc(r.content)}</pre>
      <label class="m-field">退回原因（退回時必填；第 ${maxReturns} 次退回任務即結束）<textarea rows="2" maxlength="300" data-feedback></textarea></label>
      <div class="m-actions"><button type="button" class="m-btn-gold" data-act="approve">核可</button><button type="button" class="m-btn-red" data-act="return">退回補正</button></div></article>`;
  const assignCard = t => `<article class="m-card" data-kind="assign" data-id="${t.id}">
      <div class="m-card-top"><span class="m-tag">指派・${mEsc(t.category)}</span><b class="m-serif">${mEsc(t.title)}</b>${returns(t.returnCount)}${mOverdueTag(t.submitted)}<small>${mEsc(name)}・${mTime(t.submitted)} 回報</small></div>
      <p class="m-muted">完成條件：${mEsc(t.description)}</p><pre class="m-content">${mEsc(t.report)}</pre>
      <label class="m-field">回饋（退回時必填；第 ${maxReturns} 次退回任務即結束）<textarea rows="2" maxlength="500" data-feedback></textarea></label>
      <div class="m-actions"><button type="button" class="m-btn-gold" data-act="approve">確認完成</button><button type="button" class="m-btn-red" data-act="return">退回補充</button></div></article>`;
  return `<div class="m-title"><small class="m-en">REVIEW</small><h1 class="m-serif">任務審核</h1><p>日報無法判定的 👑 任務與指派任務回報，請在 ${mParams().reviewDays} 天內審核。核可後新人 APP 自動發放獎勵。</p></div>
    ${mPanel('👑 系統任務送審', 'QUEST REVIEW', pending.length ? pending.map(reviewCard).join('') : mEmpty('目前沒有待審核的任務。'), `<span class="m-badge">${pending.length} 件</span>`)}
    ${mPanel('📜 指派任務回報', 'BOUNTY REPORT', assignReview.length ? assignReview.map(assignCard).join('') : mEmpty('目前沒有待確認的指派任務。'), `<span class="m-badge">${assignReview.length} 件</span>`)}
    ${approved.length ? mPanel('已核可・等待新人端入帳', 'SYNCING', `<ul class="m-list">${approved.map(([, r]) => `<li>${mEsc(r.title)}<small>新人下次開啟 APP 時自動完成並發獎勵</small></li>`).join('')}</ul>`) : ''}`;
}

function mSurveysView() {
  const head = '<div class="m-title"><small class="m-en">SURVEY REVIEW</small><h1 class="m-serif">社區勘查審核</h1><p>新人在探索副本拼完 9 塊情報後送出。核可後新人可開啟寶箱領獎。</p></div>';
  if (!mLocalInScope()) return head + mPanel('勘查紀錄', 'RECORDS', mEmpty('這個範圍目前沒有社區勘查紀錄。') + mDemoNote);
  const records = (mSurveys().records || []).slice().sort((a, b) => (b.status === 'pending') - (a.status === 'pending'));
  const statusText = { pending: '待審核', approved: '已核可', returned: '已退回' };
  const card = r => `<article class="m-card" data-kind="survey" data-id="${mEsc(r.id)}">
      <div class="m-card-top"><span class="m-tag ${r.status === 'pending' ? 'is-gold' : r.status === 'approved' ? 'is-teal' : 'is-red'}">${statusText[r.status] || r.status}</span><b class="m-serif">${mEsc(M_BUILDINGS[r.building] || r.building)}</b><small>${mEsc(r.profile || '新人')}・第 ${r.revision} 版</small></div>
      <dl class="m-dl">${M_SURVEY_FIELDS.map(([k, label]) => `<div><dt>${label}</dt><dd>${mEsc(r.fields?.[k] || '—')}</dd></div>`).join('')}</dl>
      ${r.feedback ? `<p class="m-muted">上次回饋：${mEsc(r.feedback)}</p>` : ''}
      ${r.status === 'pending' ? `<label class="m-field">退回原因（退回時必填）<textarea rows="2" maxlength="500" data-feedback></textarea></label>
      <div class="m-actions"><button type="button" class="m-btn-gold" data-act="approve">核可（鑑定通過）</button><button type="button" class="m-btn-red" data-act="return">退回補正</button></div>` : ''}</article>`;
  return head + mPanel('勘查紀錄', 'RECORDS', records.length ? records.map(card).join('') : mEmpty('目前沒有社區勘查紀錄。'));
}

function mAbilities() {
  const sel = mSelected();
  if (!sel) return `<div class="m-title"><small class="m-en">ROOKIE</small><h1 class="m-serif">新人能力與紀錄</h1></div>${mEmpty('這個範圍沒有新人。')}`;
  const rookie = mProfile(sel);
  const cls = M_CLASSES[rookie.dev] || M_CLASSES.A;
  const salCls = M_CLASSES[rookie.sal] || M_CLASSES.E;
  const all6 = [rookie.groups[0].items[0], rookie.groups[0].items[1], rookie.groups[0].items[2], rookie.groups[1].items[0], rookie.groups[1].items[1], { ...rookie.groups[1].items[2], name: '人脈' }];
  const cname = code => code ? (M_CLASSES[code]?.[0] || code) : '—';
  const head = `<div class="m-title"><small class="m-en">ROOKIE</small><h1 class="m-serif">新人能力與紀錄</h1></div>${mRookiePicker()}
    <section class="m-panel m-hero">
      <img class="m-hero-art" src="./assets/v4/${cls[2]}" alt="">
      <div class="m-hero-info"><small class="m-en">${mEsc(M_BRANCHES[rookie.branch])}・到職第 ${mDayOf(rookie.joined)} 天</small><b class="m-serif">${mEsc(rookie.name)}</b>
        <span>開發之道：${cls[0]}（${cls[1]}）</span><span>銷售之道：${salCls[0]}（${salCls[1]}）</span>
        <div class="m-hero-nums"><div><b class="m-en">Lv.${rookie.level}</b><small>等級</small></div><div><b class="m-en">${rookie.exp}</b><small>EXP</small></div>
        ${rookie.groups.map(g => `<div><b class="m-en">Lv${g.level}</b><small>${g.label}（${g.total}）</small></div>`).join('')}</div></div>
      <div class="m-hero-radar">${mRadar(all6)}<small>綜合能力</small></div>
    </section>`;
  const skills = `<div class="m-grid3">${rookie.groups.map(g => mPanel(`${g.label}能力`, g.key.toUpperCase(), `${mRadar(g.items, 200)}
      <table class="m-table"><thead><tr><th>技能</th><th>等級</th><th>分數</th></tr></thead><tbody>${g.items.map(i => `<tr><td>${mEsc(i.name)}</td><td class="m-en">Lv${i.level}</td><td><div class="m-bar"><i style="width:${i.ratio * 100}%"></i></div><span class="m-en">${i.score}/${i.level * 50}</span></td></tr>`).join('')}</tbody></table>`)).join('')}</div>`;
  const routeTitles = mRoutes();
  const progress = mPanel('任務進度', 'QUEST PROGRESS', `<div class="m-grid3">${rookie.routes.map(r => `<div class="m-route"><b class="m-serif">${r.label}</b><em class="m-en">${r.done}/${r.total}</em>
      ${rookie.live ? `<ul class="m-list">${(routeTitles[r.key] || []).map(([id, title]) => { const done = r.rows.find(x => x.id === id)?.done; return `<li class="${done ? 'is-done' : ''}">${done ? '✅' : '⬜'} ${mEsc(title)}</li>`; }).join('')}</ul>` : `<div class="m-bar"><i style="width:${r.total ? r.done / r.total * 100 : 0}%"></i></div>`}</div>`).join('')}</div>`);
  if (!rookie.live) return head + skills + progress + mDemoNote;

  const history = mLoad('quizHistory', { entries: [], allowRetake: false }) || { entries: [] };
  const practice = (mLoad('practice', []) || []).slice().reverse().slice(0, 30);
  const log = [...(mLoad('log', []) || []), ...(mLoad('managerLog', []) || [])].sort((a, b) => String(b.at).localeCompare(String(a.at))).slice(0, 60);
  const logType = { accepted: '接取', submitted: '送審', approved: '核可', returned: '退回', closed: '結束', completed: '完成', 'report-synced': '日報同步', assigned: '指派' };
  return head + mPanel('覺醒試煉紀錄', 'AWAKENING', `${history.entries.length ? `<table class="m-table"><thead><tr><th>時間</th><th>系統推薦</th><th>新人選擇</th><th>與推薦不同</th></tr></thead><tbody>${history.entries.slice().reverse().map(e => {
        const diff = e.recommended && (e.recommended.dev !== e.chosen?.dev || e.recommended.sal !== e.chosen?.sal);
        return `<tr><td>${mTime(e.at)}${e.retake ? '（重測）' : ''}</td><td>開發 ${cname(e.recommended?.dev)}<br>銷售 ${cname(e.recommended?.sal)}</td><td>開發 ${cname(e.chosen?.dev)}<br>銷售 ${cname(e.chosen?.sal)}</td><td>${diff ? '<span class="m-tag is-gold">有改選</span>' : '—'}</td></tr>`; }).join('')}</tbody></table>` : mEmpty('還沒有作答紀錄。')}
      <div class="m-actions" style="margin-top:12px">${history.allowRetake ? '<span class="m-tag is-gold">已開放重測：新人下次進入會重做</span><button type="button" class="m-btn-ghost" data-retake="off">取消開放</button>' : '<button type="button" class="m-btn-gold" data-retake="on">開放重測</button>'}</div>`)
    + skills + progress
    + mPanel('AI 對練紀錄', 'SPARRING', practice.length ? `<table class="m-table"><thead><tr><th>時間</th><th>情境</th><th>各面向分數</th><th>總分</th><th>結果</th><th>評語</th></tr></thead><tbody>${practice.map(p => `<tr><td>${mTime(p.at)}<br><small class="m-muted">第 ${p.attempt} 次</small></td><td>${mEsc(p.scenario)}</td><td>${p.dims.map(d => `${mEsc(d.label)} ${d.score}`).join('<br>')}</td><td class="m-en">${p.total}/20<br>${mEsc(p.grade)}</td><td>${p.passed ? '<span class="m-tag is-teal">通過</span>' : '<span class="m-tag is-red">未通過</span>'}</td><td class="m-comment">${mEsc(p.comment)}</td></tr>`).join('')}</tbody></table>` : mEmpty('還沒有 AI 對練紀錄。'))
    + mPanel('任務紀錄', 'QUEST LOG', log.length ? `<table class="m-table"><thead><tr><th>時間</th><th>事件</th><th>任務</th><th>來源</th><th>內容／獎勵</th></tr></thead><tbody>${log.map(e => `<tr><td>${mTime(e.at)}</td><td>${logType[e.type] || e.type}</td><td>${mEsc(e.title || '')}</td><td>${e.source === 'assign' ? '指派' : e.source === 'report' ? '日報' : '系統'}${e.via ? (e.via === 'report' ? '・日報判定' : '・店長判定') : ''}</td><td>${e.exp ? `+${e.exp} EXP（${mEsc(e.abilities || '')}）` : mEsc(e.detail || e.feedback || '')}</td></tr>`).join('')}</tbody></table>` : mEmpty('還沒有任務紀錄。'));
}

function mReports() {
  const head = `<div class="m-title"><small class="m-en">DAILY REPORT</small><h1 class="m-serif">日報同步</h1><p>新人照常在公司日報系統填寫，店長也在該系統審核；本系統每天同步 2 次「已審核」的數字，📊 任務從接取當天起累計，達門檻自動完成。</p></div>`;
  if (!mLocalInScope()) return head + mPanel('同步紀錄', 'HISTORY', mEmpty('這個範圍沒有可同步的日報。') + mDemoNote);
  const verify = mVerify();
  const fields = Object.entries(M_REPORT_FIELDS);
  const dates = Object.keys(verify.reports).sort().reverse().slice(0, 30);
  return head + `<div class="m-grid2">
    ${mPanel('模擬同步（Demo 用）', 'SIMULATE', `<p class="m-muted">正式版由排程自動從公司日報系統同步，不需要這個表單。這裡模擬「本機新人」某一天已審核的日報數字被同步進來。</p>
      <form id="m-sync-form" class="m-assign-form">
        <label class="m-field">日期<input type="date" name="date" value="${mToday()}" max="${mToday()}" required></label>
        <div class="m-report-grid">${fields.map(([k, l]) => `<label class="m-field">${l}<input type="number" name="${k}" min="0" max="99" value="${Number(mReportValues(verify.reports[mToday()])[k]) || 0}"></label>`).join('')}</div>
        <button type="submit" class="m-btn-gold">同步日報</button></form>`)}
    ${mPanel('同步紀錄', 'HISTORY', `<p class="m-muted">上次同步：${verify.lastSync ? mTime(verify.lastSync) : '尚未同步'}</p>${dates.length ? `<table class="m-table"><thead><tr><th>日期</th>${fields.map(([, l]) => `<th>${l}</th>`).join('')}</tr></thead><tbody>${dates.map(d => `<tr><td class="m-en">${d}</td>${fields.map(([k]) => `<td class="m-en">${Number(mReportValues(verify.reports[d])[k]) || 0}</td>`).join('')}</tr>`).join('')}</tbody></table>` : mEmpty('還沒有同步到日報。')}`)}
  </div>`;
}

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
  const filter = mAssignView.filter || 'all';
  const scope = mScope();
  const scopeIds = scope.map(r => r.id);
  const nameOf = id => mRookies().find(r => r.id === id)?.name || '新人';
  const list = state.tasks.filter(t => scopeIds.includes(t.member) && (filter === 'all' || t.status === filter)).slice().reverse();
  const skillOptions = `<option value="">（不選）</option>${Object.entries(V4C_SKILLS).map(([gk, g]) => `<optgroup label="${g.label}">${Object.entries(g.items).map(([k, n]) => `<option value="${gk}:${k}">${n}</option>`).join('')}</optgroup>`).join('')}`;
  const abilityRow = (i, w) => `<div class="m-ability-row"><select name="ability${i}">${skillOptions}</select><input type="number" name="weight${i}" min="0" max="100" step="10" value="${w}"><span>%</span></div>`;
  return `<div class="m-title"><small class="m-en">BOUNTY</small><h1 class="m-serif">指派任務</h1><p>每位新人每天最多 ${limits.perDay} 件、經驗合計 ${limits.expPerDay}、同時進行中最多 ${limits.active} 件（上限由總部設定）。經驗由難度決定，指派任務不發金幣與盲盒券。</p></div>
    <div class="m-grid2">
      ${mPanel('發布懸賞', 'NEW BOUNTY', `<form id="m-assign-form" class="m-assign-form">
        <label class="m-field">任務名稱<input name="title" required maxlength="80" placeholder="例如：整理松智路社區的近期成交"></label>
        <label class="m-field">完成條件<textarea name="description" required maxlength="1000" rows="3" placeholder="例如：比較 3 筆近期成交，回報一個價格觀察與下一步。"></textarea></label>
        <fieldset class="m-field"><legend>判定方式（必選）</legend>
          <label class="m-check"><input type="radio" name="verify" value="report" required>📊 日報判定</label>
          <label class="m-check"><input type="radio" name="verify" value="manager">👑 店長判定</label></fieldset>
        <div class="m-form-row m-report-rule" hidden><label class="m-field">日報欄位<select name="reportField">${Object.entries(M_REPORT_FIELDS).map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select></label>
          <label class="m-field">門檻（接任務起累計）<input type="number" name="reportMin" min="1" max="99" value="1"></label></div>
        <div class="m-form-row"><label class="m-field">難度<select name="tier">${Object.entries(M_TIERS).map(([k, [n, e]]) => `<option value="${k}" ${k === 'S' ? 'selected' : ''}>${n}（+${e} EXP）</option>`).join('')}</select></label>
          <label class="m-field">任務類型<select name="category">${M_CATEGORIES.map(c => `<option>${c}</option>`).join('')}</select></label></div>
        <fieldset class="m-field"><legend>成長能力（1～3 項，權重合計 100%）</legend>${abilityRow(1, 100)}${abilityRow(2, 0)}${abilityRow(3, 0)}</fieldset>
        <label class="m-field">完成期限（選填，逾期未完成即失效）<input type="date" name="due" min="${mToday()}"></label>
        <fieldset class="m-field"><legend>指派對象（今天已派件數／經驗／進行中）</legend>${scope.map(r => { const u = mAssignToday(state, r.id); return `<label class="m-check"><input type="checkbox" name="member" value="${mEsc(r.id)}" ${r.id === mSelected()?.id ? 'checked' : ''}>${mEsc(r.name)}<small class="m-muted">　${u.count}/${limits.perDay} 件・${u.exp}/${limits.expPerDay} EXP・進行中 ${u.active}/${limits.active}${r.live ? '' : '・示範'}</small></label>`; }).join('')}</fieldset>
        <button type="submit" class="m-btn-gold">發布任務</button></form>`)}
      ${mPanel('任務清單', 'BOUNTY LIST', `<div class="m-filters">${[['all', '全部'], ['todo', '待完成'], ['review', '待確認'], ['done', '已完成'], ['cancelled', '已取消']].map(([k, l]) => `<button type="button" data-filter="${k}" aria-pressed="${k === filter}">${l}</button>`).join('')}</div>
        ${list.length ? list.map(t => `<article class="m-card is-compact" data-kind="assign" data-id="${t.id}"><div class="m-card-top"><span class="m-tag ${t.status === 'done' ? 'is-teal' : t.status === 'review' ? 'is-gold' : ''}">${M_ASSIGN_STATUS[t.status]}</span><b class="m-serif">${mEsc(t.title)}</b><small>${mEsc(nameOf(t.member))}${t.due ? '・期限 ' + mEsc(t.due) : ''}</small></div>
          <p class="m-muted">${t.verify === 'report' ? `📊 日報判定：${M_REPORT_FIELDS[t.reportField] || ''} ≥ ${t.reportMin || 1}` : '👑 店長判定'}${t.tier ? `・難度${M_TIERS[t.tier]?.[0]} +${M_TIERS[t.tier]?.[1]} EXP` : ''}${t.abilities?.length ? `・${t.abilities.map(([, k, w]) => `${mSkillName(k)} ${Math.round(w * 100)}%`).join('、')}` : ''}${t.rewarded ? '・已入帳' : ''}</p>
          <p class="m-muted">${mEsc(t.description)}</p>${t.report ? `<pre class="m-content">${mEsc(t.report)}</pre>` : ''}${t.feedback ? `<p class="m-muted">回饋：${mEsc(t.feedback)}</p>` : ''}
          ${['todo', 'review'].includes(t.status) ? '<div class="m-actions"><button type="button" class="m-btn-ghost" data-act="cancel">取消任務</button></div>' : ''}</article>`).join('') : mEmpty('沒有這類任務。')}`)}
    </div>`;
}

/* ---------- 動作 ---------- */
function mAct(card, act) {
  const kind = card.dataset.kind, id = card.dataset.id;
  const maxReturns = mParams().maxReturns;
  const feedback = card.querySelector('[data-feedback]')?.value.trim() || '';
  if (act === 'return' && !feedback) { mToast('退回時請填寫原因'); card.querySelector('[data-feedback]')?.focus(); return; }
  if (kind === 'verify') {
    const v = mVerify(); const r = v.reviews[id]; if (!r || r.status !== 'pending') return;
    if (act === 'approve') { r.status = 'approved'; r.approvedAt = new Date().toISOString(); mLog({ type: 'approved', source: 'system', taskId: id, title: r.title }); mToast(`已核可「${r.title}」，新人 APP 會自動發獎勵`); }
    else {
      r.returnCount = (r.returnCount || 0) + 1; r.feedback = feedback;
      r.status = r.returnCount >= maxReturns ? 'closed' : 'returned';
      mLog({ type: r.status === 'closed' ? 'closed' : 'returned', source: 'system', taskId: id, title: r.title, feedback });
      mToast(r.status === 'closed' ? `「${r.title}」已退回 ${maxReturns} 次，任務結束` : `已退回「${r.title}」（第 ${r.returnCount} 次）`);
    }
    mSaveVerify(v);
  } else if (kind === 'assign') {
    const s = mAssign(); const t = s.tasks.find(x => x.id === id); if (!t) return;
    if (act === 'cancel') { if (!['todo', 'review'].includes(t.status)) return; t.status = 'cancelled'; mLog({ type: 'closed', source: 'assign', taskId: id, title: t.title, feedback: '店長取消' }); mToast('已取消任務'); }
    else {
      if (t.status !== 'review') return;
      t.feedback = feedback.slice(0, 500); t.reviewed = new Date().toISOString();
      if (act === 'approve') { t.status = 'done'; mLog({ type: 'approved', source: 'assign', taskId: id, title: t.title }); mToast('已確認完成，新人 APP 會自動發放經驗'); }
      else {
        t.returnCount = (t.returnCount || 0) + 1;
        t.status = t.returnCount >= maxReturns ? 'cancelled' : 'todo';
        if (t.status === 'cancelled') t.feedback = `${t.feedback}（已退回 ${maxReturns} 次，任務結束）`;
        mLog({ type: t.status === 'cancelled' ? 'closed' : 'returned', source: 'assign', taskId: id, title: t.title, feedback });
        mToast(t.status === 'cancelled' ? `已退回 ${maxReturns} 次，任務結束` : `已退回（第 ${t.returnCount} 次），新人可補充後再回報`);
      }
    }
    mSave('assign', s);
  } else if (kind === 'survey') {
    const s = mSurveys(); const rec = (s.records || []).find(x => x.id === id); if (!rec || rec.status !== 'pending') return;
    Object.assign(rec, { status: act === 'approve' ? 'approved' : 'returned', feedback: act === 'approve' ? '' : feedback.slice(0, 500), revision: rec.revision + 1 });
    mSave('surveys', s);
    mLog({ type: act === 'approve' ? 'approved' : 'returned', source: 'system', taskId: 'dev_m_01', title: `社區勘查・${M_BUILDINGS[rec.building] || rec.building}`, feedback });
    mToast(act === 'approve' ? `已核可「${M_BUILDINGS[rec.building] || rec.building}」，新人可開寶箱` : '已退回社區勘查');
  }
  mRender();
}

function mSubmitSync(form) {
  const data = new FormData(form);
  const date = String(data.get('date') || mToday());
  const values = Object.fromEntries(Object.keys(M_REPORT_FIELDS).map(k => [k, Math.max(0, Math.min(99, parseInt(data.get(k), 10) || 0))]));
  const v = mVerify();
  const now = new Date().toISOString();
  v.reports[date] = { values, status: 'approved', source: 'company', syncedAt: now };
  v.lastSync = now;
  if (mSaveVerify(v)) {
    mLog({ type: 'report-synced', source: 'report', title: `${date} 日報`, detail: Object.entries(values).map(([k, n]) => `${M_REPORT_FIELDS[k]} ${n}`).join('、') });
    mToast(`已同步 ${date} 的日報，新人的 📊 任務會自動核對`);
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
  const abilities = [1, 2, 3].map(i => [String(data.get('ability' + i) || ''), Number(data.get('weight' + i)) || 0]).filter(([a, w]) => a && w > 0);
  const total = abilities.reduce((s, [, w]) => s + w, 0);
  if (!abilities.length) { mToast('請至少選 1 項成長能力'); return; }
  if (new Set(abilities.map(([a]) => a)).size !== abilities.length) { mToast('成長能力不可重複'); return; }
  if (total !== 100) { mToast(`能力權重合計需為 100%（目前 ${total}%）`); return; }
  const s = mAssign();
  const exp = M_TIERS[tier][1];
  const rookies = mRookies();
  for (const member of members) {
    const u = mAssignToday(s, member), name = rookies.find(r => r.id === member)?.name || '新人';
    if (u.count + 1 > limits.perDay) { mToast(`${name} 今天已派 ${u.count} 件，已達每日上限 ${limits.perDay} 件`); return; }
    if (u.exp + exp > limits.expPerDay) { mToast(`${name} 今天指派經驗合計會超過 ${limits.expPerDay}（目前 ${u.exp}）`); return; }
    if (u.active + 1 > limits.active) { mToast(`${name} 進行中的指派任務已有 ${u.active} 件，上限 ${limits.active} 件`); return; }
  }
  const created = new Date().toISOString();
  for (const member of members) {
    // 既有指派存檔要求對象在成員名單內
    if (!s.members.some(m => m.id === member)) s.members.push({ id: member, name: rookies.find(r => r.id === member)?.name || '新人' });
    const task = {
      id: crypto.randomUUID(), title: title.slice(0, 80), description: description.slice(0, 1000), category: String(data.get('category')), due, member,
      status: 'todo', report: '', feedback: '', created, verify, tier, exp,
      reportField: verify === 'report' ? String(data.get('reportField')) : '', reportMin: verify === 'report' ? Math.max(1, parseInt(data.get('reportMin'), 10) || 1) : 0,
      abilities: abilities.map(([a, w]) => { const [g, k] = a.split(':'); return [g, k, w / 100]; }), returnCount: 0
    };
    s.tasks.push(task);
    if (member === M_LOCAL_ID) mLog({ type: 'assigned', source: 'assign', taskId: task.id, title: task.title, detail: `${verify === 'report' ? '日報判定' : '店長判定'}・難度${M_TIERS[tier][0]}` });
  }
  if (mSave('assign', s)) { mToast(`已發布給 ${members.length} 位新人`); mRender(); }
}

function mBindView(main) {
  main.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => mGo(b.dataset.go)));
  main.querySelectorAll('[data-rookie]').forEach(b => b.addEventListener('click', () => { mSetViewer({ rookie: b.dataset.rookie }); mGo('abilities'); }));
  main.querySelectorAll('.m-card [data-act]').forEach(b => b.addEventListener('click', () => mAct(b.closest('.m-card'), b.dataset.act)));
  document.getElementById('m-rookie-picker')?.addEventListener('change', e => { mSetViewer({ rookie: e.target.value }); mRender(); });
  document.getElementById('m-branch-filter')?.addEventListener('change', e => { mSetViewer({ branchFilter: e.target.value }); mRender(); });
  main.querySelectorAll('[data-retake]').forEach(b => b.addEventListener('click', () => {
    const h = mLoad('quizHistory', { entries: [], allowRetake: false }) || { entries: [] };
    h.allowRetake = b.dataset.retake === 'on';
    mSave('quizHistory', h);
    mToast(h.allowRetake ? '已開放重測：新人下次進入 APP 會重做覺醒試煉' : '已取消開放重測');
    mRender();
  }));
  const syncForm = document.getElementById('m-sync-form');
  syncForm?.addEventListener('submit', e => { e.preventDefault(); mSubmitSync(syncForm); });
  const assignForm = document.getElementById('m-assign-form');
  if (assignForm) {
    const rule = assignForm.querySelector('.m-report-rule');
    assignForm.querySelectorAll('[name="verify"]').forEach(r => r.addEventListener('change', () => { rule.hidden = assignForm.elements.verify.value !== 'report'; }));
    assignForm.addEventListener('submit', e => { e.preventDefault(); mSubmitAssign(assignForm); });
    main.querySelectorAll('[data-filter]').forEach(b => b.addEventListener('click', () => { mAssignView.filter = b.dataset.filter; mRender(); }));
  }
}

/* ---------- 重置 Demo（清除這台瀏覽器的所有新星資料） ---------- */
function mResetDemo() {
  if (!confirm('重置 Demo 會清除這台瀏覽器裡新人 APP、店長後台與 PM 後台的所有資料（測驗、任務、日報、夥伴、紀錄、內容變更），回到全新狀態。確定要重置嗎？')) return;
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

const M_VIEWS = { overview: mOverview, reviews: mReviews, reports: mReports, surveys: mSurveysView, abilities: mAbilities, assign: mAssignView };
function mRender() {
  const main = document.getElementById('m-main');
  main.innerHTML = M_VIEWS[mView]();
  mBindView(main);
  const p = mPending();
  document.querySelectorAll('[data-count]').forEach(el => { const n = p[el.dataset.count]; el.textContent = n || ''; el.hidden = !n; });
}
function mGo(view) {
  if (!M_VIEWS[view]) return;
  mView = view;
  document.querySelectorAll('.m-nav [data-view]').forEach(b => { if (b.dataset.view === view) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
  history.replaceState(null, '', '#' + view);
  mRender();
  document.getElementById('m-main').focus({ preventScroll: true });
  window.scrollTo({ top: 0 });
}

document.querySelectorAll('.m-nav [data-view]').forEach(b => b.addEventListener('click', () => mGo(b.dataset.view)));
document.getElementById('m-reset')?.addEventListener('click', mResetDemo);
document.getElementById('m-viewer')?.addEventListener('change', e => { mSave('viewer', { key: e.target.value }); mRender(); });
mRenderViewer();
// 新人 APP 或 PM 後台在另一個分頁更新資料時，後台自動刷新（表單輸入中不打斷）
window.addEventListener('storage', e => {
  if (!e.key || !e.key.startsWith('sinyi-')) return;
  if (document.activeElement && document.activeElement.closest?.('form, .m-card') && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
  mRender();
});
mGo(M_VIEWS[location.hash.slice(1)] ? location.hash.slice(1) : 'overview');
