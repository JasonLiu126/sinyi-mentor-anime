/* =========================================================
   公會長後台（Web）：給店長管理新人用，和新人 APP 分開
   - 尚未接資料庫：直接讀寫這台瀏覽器裡新人 APP 的存檔（localStorage）。
   - 之後接資料庫時，只需替換下方「資料存取」區的 mLoad／mSave。
   - 任務完成後的獎勵由新人 APP 發放：後台核可只改狀態，新人 APP 讀到後自動入帳並播動畫。
   ========================================================= */
const M_KEYS = {
  journey: 'sinyi-rpg-formal-journey-v1',       // 新人等級、金幣、能力分數、任務進度
  quiz: 'sinyi-rpg-formal-aptitude-v1',          // 職業（開發／銷售）
  surveys: 'sinyi-formal-pages-surveys-v1',      // 社區勘查紀錄
  verify: 'sinyi-v4-task-verify-v1',             // 日報表、任務送審
  assign: 'sinyi-formal-manager-tasks-v1',       // 指派任務
  party: 'sinyi-v4-party-v1'
};
const M_CLASSES = {
  A: ['社區開發刺客', '社區經營型', 'class-assassin.png'], B: ['商圈法師', '商圈經營型', 'class-mage.png'],
  C: ['社群吟遊詩人', '網路社群經營型', 'class-bard.png'], D: ['人脈召喚師', '私人人脈經營型', 'class-summoner.png'],
  E: ['名單鍊金術士', '公司既有人脈經營型', 'class-alchemist.png'], F: ['物件遊俠', '市場物件經營型', 'class-ranger.png']
};
const M_SKILLS = {
  hard_know: { label: '專業', items: { tax: ['稅務', 45], mortgage: ['貸款', 30], contract: ['契據', 25], law: ['不動產法規', 10], market: ['商圈行情', 10] } },
  soft_dev: { label: '開發', items: { dev_local: ['地緣深耕', 25], dev_track: ['踩線', 15], dev_resource: ['資源盤點', 10], dev_brand: ['個人品牌', 5] } },
  soft_sal: { label: '銷售', items: { sal_stranger: ['陌生獲客', 20], sal_present: ['物件介紹', 15], sal_resource: ['資源盤點', 5], sal_market: ['行銷', 5] } }
};
const M_ROUTES = {
  dev: ['開發路線', { dev_m_01: '從地圖選一個想了解的社區（社區勘查）', dev_m_02: '實地走訪，辨識主力大樓生活機能', dev_m_03: '整理社區筆記與三個想請教的問題', dev_m_04: '社區管理員破冰並獲得第一手情資' }],
  sal: ['銷售路線', { sal_m_01: '接收可聯繫的舊買資源並了解現況', sal_m_02: '準備釐清需求的問題清單', sal_m_03: '完成首次電話或訊息聯繫', sal_m_04: '久未互動舊買重新回應並同意看屋' }],
  com: ['冒險基本功', { com_m_01: '嘗試一次陌生接觸', com_m_02: '比較相鄰兩個生活圈的環境差異', com_m_03: '追蹤所選生活圈的一項新市場訊號' }]
};
const M_REPORT_FIELDS = { visits: '社區拜訪', gatekeeper: '管理員／守門人接觸', calls: '電話／訊息聯繫', appointments: '帶看預約', cold: '陌生接觸（派報／舉牌）' };
const M_BUILDINGS = { b1: '大器四方', b2: '松智金賞', b3: '莊敬傳家透天' };
const M_SURVEY_FIELDS = [['age', '屋齡'], ['units', '總戶數'], ['fee', '管理費'], ['ratio', '公設比'], ['floorsUp', '地上樓層'], ['floorsDown', '地下樓層'], ['type', '建築型態'], ['management', '物業管理'], ['observation', '現場觀察']];
const M_ASSIGN_STATUS = { todo: '待完成', review: '待確認', done: '已完成', cancelled: '已取消' };
const M_CATEGORIES = ['商圈經營', '客戶跟進', '專業學習', '其他任務'];
let mView = 'overview';

/* ---------- 資料存取（之後換成 API） ---------- */
function mLoad(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(M_KEYS[key]) || 'null'); return v ?? fallback; } catch { return fallback; }
}
function mSave(key, value) {
  try { localStorage.setItem(M_KEYS[key], JSON.stringify(value)); return true; }
  catch { mToast('儲存失敗，請檢查瀏覽器儲存空間'); return false; }
}
const mEsc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const mToday = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const mTime = iso => iso ? new Date(iso).toLocaleString('zh-TW', { hour12: false, month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
function mToast(text) {
  const el = document.getElementById('m-toast');
  el.textContent = text;
  el.classList.add('is-show');
  clearTimeout(mToast.t);
  mToast.t = setTimeout(() => el.classList.remove('is-show'), 2600);
}
const mVerify = () => { const v = mLoad('verify', null); return v && v.version === 1 ? { reports: v.reports || {}, reviews: v.reviews || {}, waiting: v.waiting || {} } : { reports: {}, reviews: {}, waiting: {} }; };
const mSaveVerify = v => mSave('verify', { version: 1, ...v });
const mAssign = () => { const v = mLoad('assign', null); return v && v.version === 1 ? v : { version: 1, members: [{ id: 'self', name: '我（目前業務）' }], active: 'self', tasks: [] }; };
const mSurveys = () => mLoad('surveys', { onboarding: null, records: [], drafts: [] });

/* ---------- 新人資料彙整 ---------- */
function mRookie() {
  const journey = mLoad('journey', {}) || {};
  const quiz = mLoad('quiz', {}) || {};
  const scores = journey.runtime?.scores || {};
  const groups = Object.entries(M_SKILLS).map(([gk, g]) => {
    const items = Object.entries(g.items).map(([k, [name, def]]) => {
      const score = Number.isFinite(scores[gk]?.[k]) ? scores[gk][k] : def;
      const level = Math.min(99, Math.floor(score / 50) + 1);
      return { key: k, name, score, level, ratio: Math.min(1, score / (level * 50)) };
    });
    const total = items.reduce((s, i) => s + i.score, 0);
    return { key: gk, label: g.label, items, total, level: Math.min(99, Math.floor(total / 50) + 1) };
  });
  const exp = journey.game?.exp ?? 0;
  const routes = Object.entries(M_ROUTES).map(([rk, [label, titles]]) => {
    const rows = journey.runtime?.routes?.[rk] || [];
    return { key: rk, label, done: rows.filter(r => r.done).length, total: Object.keys(titles).length, rows };
  });
  const surveys = mSurveys().records || [];
  const dev = quiz.appliedDev || quiz.dev || 'A';
  const sal = quiz.appliedSal || quiz.sal || 'E';
  return {
    name: journey.name && journey.name !== '新夥伴' ? journey.name : '新人（本機）',
    hasData: !!journey.game || !!quiz.complete,
    level: Math.floor(exp / 60) + 1, exp, coins: journey.game?.coins ?? 0,
    dev, sal, groups, routes,
    approvedSurveys: surveys.filter(r => r.status === 'approved').length,
    party: (mLoad('party', {})?.ids || []).length
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

/* ---------- 各頁 ---------- */
function mPendingCounts() {
  const verify = mVerify();
  const reviews = Object.values(verify.reviews).filter(r => r.status === 'pending').length;
  const assigns = mAssign().tasks.filter(t => t.status === 'review').length;
  const surveys = (mSurveys().records || []).filter(r => r.status === 'pending').length;
  return { reviews: reviews + assigns, surveys };
}

function mOverview() {
  const rookie = mRookie();
  const counts = mPendingCounts();
  const report = mVerify().reports[mToday()];
  const cls = M_CLASSES[rookie.dev] || M_CLASSES.A;
  return `<div class="m-title"><small class="m-en">GUILD OVERVIEW</small><h1 class="m-serif">公會總覽</h1></div>
    <div class="m-stats">
      <button type="button" class="m-stat" data-go="reviews"><span>👑</span><b class="m-en">${counts.reviews}</b><small>待審任務</small></button>
      <button type="button" class="m-stat" data-go="surveys"><span>🧩</span><b class="m-en">${counts.surveys}</b><small>待審社區勘查</small></button>
      <button type="button" class="m-stat" data-go="reports"><span>📊</span><b>${report ? '已登錄' : '未登錄'}</b><small>今日日報</small></button>
      <button type="button" class="m-stat" data-go="abilities"><span>⭐</span><b class="m-en">Lv.${rookie.level}</b><small>新人等級</small></button>
    </div>
    ${mPanel('新人進度', 'ROOKIES', `<div class="m-rookie-row">
      <img class="m-rookie-art" src="./assets/v4/${cls[2]}" alt="">
      <div class="m-rookie-info"><b class="m-serif">${mEsc(rookie.name)}</b><span>Lv.${rookie.level}・${cls[0]}（${cls[1]}）</span>
        <div class="m-route-bars">${rookie.routes.map(r => `<div><span>${r.label}</span><div class="m-bar"><i style="width:${r.total ? r.done / r.total * 100 : 0}%"></i></div><em class="m-en">${r.done}/${r.total}</em></div>`).join('')}</div>
        <span class="m-muted">社區勘查核可 ${rookie.approvedSurveys} 個・攜帶夥伴 ${rookie.party} 位</span></div>
      <button type="button" class="m-btn-ghost" data-go="abilities">查看能力 ›</button></div>
      ${rookie.hasData ? '' : '<p class="m-note-inline">這台瀏覽器還沒有新人存檔，請先在新人 APP 完成職業覺醒試煉。</p>'}`)}`;
}

function mReviews() {
  const verify = mVerify();
  const pending = Object.entries(verify.reviews).filter(([, r]) => r.status === 'pending');
  const approved = Object.entries(verify.reviews).filter(([, r]) => r.status === 'approved');
  const assign = mAssign();
  const assignReview = assign.tasks.filter(t => t.status === 'review');
  const memberName = id => assign.members.find(m => m.id === id)?.name || '新人';
  const reviewCard = ([id, r]) => `<article class="m-card" data-kind="verify" data-id="${id}">
      <div class="m-card-top"><span class="m-tag is-gold">${mEsc(r.tag || '任務')}</span><b class="m-serif">${mEsc(r.title)}</b><small>${mTime(r.submittedAt)} 送出</small></div>
      <pre class="m-content">${mEsc(r.content)}</pre>
      <label class="m-field">退回原因（退回時必填）<textarea rows="2" maxlength="300" data-feedback></textarea></label>
      <div class="m-actions"><button type="button" class="m-btn-gold" data-act="approve">核可</button><button type="button" class="m-btn-red" data-act="return">退回補正</button></div></article>`;
  const assignCard = t => `<article class="m-card" data-kind="assign" data-id="${t.id}">
      <div class="m-card-top"><span class="m-tag">指派・${mEsc(t.category)}</span><b class="m-serif">${mEsc(t.title)}</b><small>${mEsc(memberName(t.member))}・${mTime(t.submitted)} 回報</small></div>
      <p class="m-muted">完成條件：${mEsc(t.description)}</p><pre class="m-content">${mEsc(t.report)}</pre>
      <label class="m-field">回饋（退回時必填）<textarea rows="2" maxlength="500" data-feedback></textarea></label>
      <div class="m-actions"><button type="button" class="m-btn-gold" data-act="approve">確認完成</button><button type="button" class="m-btn-red" data-act="return">退回補充</button></div></article>`;
  return `<div class="m-title"><small class="m-en">REVIEW</small><h1 class="m-serif">任務審核</h1><p>新人送出的 👑 任務與指派任務回報。核可後，新人 APP 會自動發放獎勵。</p></div>
    ${mPanel('👑 任務送審', 'QUEST REVIEW', pending.length ? pending.map(reviewCard).join('') : mEmpty('目前沒有待審核的任務。'), `<span class="m-badge">${pending.length} 件</span>`)}
    ${mPanel('📜 指派任務回報', 'BOUNTY REPORT', assignReview.length ? assignReview.map(assignCard).join('') : mEmpty('目前沒有待確認的指派任務。'), `<span class="m-badge">${assignReview.length} 件</span>`)}
    ${approved.length ? mPanel('已核可・等待新人端入帳', 'SYNCING', `<ul class="m-list">${approved.map(([, r]) => `<li>${mEsc(r.title)}<small>新人下次開啟 APP 時自動完成並發獎勵</small></li>`).join('')}</ul>`) : ''}`;
}

function mSurveysView() {
  const records = (mSurveys().records || []).slice().sort((a, b) => (b.status === 'pending') - (a.status === 'pending'));
  const statusText = { pending: '待審核', approved: '已核可', returned: '已退回' };
  const card = r => `<article class="m-card" data-kind="survey" data-id="${mEsc(r.id)}">
      <div class="m-card-top"><span class="m-tag ${r.status === 'pending' ? 'is-gold' : r.status === 'approved' ? 'is-teal' : 'is-red'}">${statusText[r.status] || r.status}</span><b class="m-serif">${mEsc(M_BUILDINGS[r.building] || r.building)}</b><small>${mEsc(r.profile || '新人')}・第 ${r.revision} 版</small></div>
      <dl class="m-dl">${M_SURVEY_FIELDS.map(([k, label]) => `<div><dt>${label}</dt><dd>${mEsc(r.fields?.[k] || '—')}</dd></div>`).join('')}</dl>
      ${r.feedback ? `<p class="m-muted">上次回饋：${mEsc(r.feedback)}</p>` : ''}
      ${r.status === 'pending' ? `<label class="m-field">退回原因（退回時必填）<textarea rows="2" maxlength="500" data-feedback></textarea></label>
      <div class="m-actions"><button type="button" class="m-btn-gold" data-act="approve">核可（鑑定通過）</button><button type="button" class="m-btn-red" data-act="return">退回補正</button></div>` : ''}</article>`;
  return `<div class="m-title"><small class="m-en">SURVEY REVIEW</small><h1 class="m-serif">社區勘查審核</h1><p>新人在探索副本拼完 9 塊情報後送出。核可後新人可開啟寶箱領獎。</p></div>
    ${mPanel('勘查紀錄', 'RECORDS', records.length ? records.map(card).join('') : mEmpty('目前沒有社區勘查紀錄。'))}`;
}

function mAbilities() {
  const rookie = mRookie();
  const cls = M_CLASSES[rookie.dev] || M_CLASSES.A;
  const salCls = M_CLASSES[rookie.sal] || M_CLASSES.E;
  const all6 = [rookie.groups[0].items[0], rookie.groups[0].items[1], rookie.groups[0].items[2], rookie.groups[1].items[0], rookie.groups[1].items[1], { ...rookie.groups[1].items[2], name: '人脈' }];
  return `<div class="m-title"><small class="m-en">ABILITIES</small><h1 class="m-serif">新人能力</h1></div>
    <section class="m-panel m-hero">
      <img class="m-hero-art" src="./assets/v4/${cls[2]}" alt="">
      <div class="m-hero-info"><small class="m-en">ROOKIE</small><b class="m-serif">${mEsc(rookie.name)}</b>
        <span>開發之道：${cls[0]}（${cls[1]}）</span><span>銷售之道：${salCls[0]}（${salCls[1]}）</span>
        <div class="m-hero-nums"><div><b class="m-en">Lv.${rookie.level}</b><small>等級</small></div><div><b class="m-en">${rookie.exp}</b><small>EXP</small></div>
        ${rookie.groups.map(g => `<div><b class="m-en">Lv${g.level}</b><small>${g.label}（${g.total}）</small></div>`).join('')}</div></div>
      <div class="m-hero-radar">${mRadar(all6)}<small>綜合能力</small></div>
    </section>
    <div class="m-grid3">${rookie.groups.map(g => mPanel(`${g.label}能力`, g.key.toUpperCase(), `${mRadar(g.items, 200)}
      <table class="m-table"><thead><tr><th>技能</th><th>等級</th><th>分數</th></tr></thead><tbody>${g.items.map(i => `<tr><td>${mEsc(i.name)}</td><td class="m-en">Lv${i.level}</td><td><div class="m-bar"><i style="width:${i.ratio * 100}%"></i></div><span class="m-en">${i.score}/${i.level * 50}</span></td></tr>`).join('')}</tbody></table>`)).join('')}</div>
    ${mPanel('任務進度', 'QUEST PROGRESS', `<div class="m-grid3">${rookie.routes.map(r => `<div class="m-route"><b class="m-serif">${r.label}</b><em class="m-en">${r.done}/${r.total}</em>
      <ul class="m-list">${Object.entries(M_ROUTES[r.key][1]).map(([id, title]) => `<li class="${r.rows.find(x => x.id === id)?.done ? 'is-done' : ''}">${r.rows.find(x => x.id === id)?.done ? '✅' : '⬜'} ${mEsc(title)}</li>`).join('')}</ul></div>`).join('')}</div>`)}`;
}

function mReports() {
  const verify = mVerify();
  const date = mReports.date || mToday();
  const report = verify.reports[date] || {};
  const dates = Object.keys(verify.reports).sort().reverse().slice(0, 14);
  const waiting = Object.keys(verify.waiting).length;
  return `<div class="m-title"><small class="m-en">DAILY REPORT</small><h1 class="m-serif">日報表</h1><p>模擬公司日報表。登錄後，新人的 📊 任務會自動核對（目前等待核對 ${waiting} 項）。</p></div>
    ${mPanel('登錄日報', 'ENTRY', `<form id="m-report-form" class="m-report-form">
      <label class="m-field">日期<input type="date" name="date" value="${date}" max="${mToday()}"></label>
      <div class="m-report-grid">${Object.entries(M_REPORT_FIELDS).map(([k, label]) => `<label class="m-field">${label}<input type="number" min="0" max="99" inputmode="numeric" name="${k}" value="${Number(report[k]) || 0}"></label>`).join('')}</div>
      <div class="m-actions"><button type="submit" class="m-btn-gold">儲存日報</button><button type="button" class="m-btn-ghost" data-act="sample">填入範例數字</button>${verify.reports[date] ? '<button type="button" class="m-btn-red" data-act="clear">刪除這天日報</button>' : ''}</div></form>`)}
    ${mPanel('近期日報', 'HISTORY', dates.length ? `<table class="m-table"><thead><tr><th>日期</th>${Object.values(M_REPORT_FIELDS).map(l => `<th>${l}</th>`).join('')}</tr></thead><tbody>${dates.map(d => `<tr class="${d === date ? 'is-active' : ''}" data-date="${d}"><td class="m-en">${d}</td>${Object.keys(M_REPORT_FIELDS).map(k => `<td class="m-en">${Number(verify.reports[d][k]) || 0}</td>`).join('')}</tr>`).join('')}</tbody></table>` : mEmpty('還沒有日報紀錄。'))}`;
}

function mAssignView() {
  const state = mAssign();
  const filter = mAssignView.filter || 'all';
  const memberName = id => state.members.find(m => m.id === id)?.name || '新人';
  const list = state.tasks.filter(t => filter === 'all' || t.status === filter).slice().reverse();
  return `<div class="m-title"><small class="m-en">BOUNTY</small><h1 class="m-serif">指派任務</h1><p>指派給新人的額外任務，新人會在 APP 的冒險日誌「額外任務」看到並回報。</p></div>
    <div class="m-grid2">
      ${mPanel('發布懸賞', 'NEW BOUNTY', `<form id="m-assign-form" class="m-assign-form">
        <label class="m-field">任務名稱<input name="title" required maxlength="80" placeholder="例如：整理松智路社區的近期成交"></label>
        <label class="m-field">完成條件<textarea name="description" required maxlength="1000" rows="3" placeholder="例如：比較 3 筆近期成交，回報一個價格觀察與下一步。"></textarea></label>
        <div class="m-form-row"><label class="m-field">任務類型<select name="category">${M_CATEGORIES.map(c => `<option>${c}</option>`).join('')}</select></label>
        <label class="m-field">完成期限（選填）<input type="date" name="due" min="${mToday()}"></label></div>
        <fieldset class="m-field"><legend>指派對象</legend>${state.members.map(m => `<label class="m-check"><input type="checkbox" name="member" value="${mEsc(m.id)}" ${m.id === 'self' ? 'checked' : ''}>${mEsc(m.name)}</label>`).join('')}</fieldset>
        <button type="submit" class="m-btn-gold">發布任務</button></form>`)}
      ${mPanel('任務清單', 'BOUNTY LIST', `<div class="m-filters">${[['all', '全部'], ['todo', '待完成'], ['review', '待確認'], ['done', '已完成'], ['cancelled', '已取消']].map(([k, l]) => `<button type="button" data-filter="${k}" aria-pressed="${k === filter}">${l}</button>`).join('')}</div>
        ${list.length ? list.map(t => `<article class="m-card is-compact" data-kind="assign" data-id="${t.id}"><div class="m-card-top"><span class="m-tag ${t.status === 'done' ? 'is-teal' : t.status === 'review' ? 'is-gold' : ''}">${M_ASSIGN_STATUS[t.status]}</span><b class="m-serif">${mEsc(t.title)}</b><small>${mEsc(memberName(t.member))}${t.due ? '・期限 ' + mEsc(t.due) : ''}</small></div>
          <p class="m-muted">${mEsc(t.description)}</p>${t.report ? `<pre class="m-content">${mEsc(t.report)}</pre>` : ''}${t.feedback ? `<p class="m-muted">回饋：${mEsc(t.feedback)}</p>` : ''}
          ${['todo', 'review'].includes(t.status) ? '<div class="m-actions"><button type="button" class="m-btn-ghost" data-act="cancel">取消任務</button></div>' : ''}</article>`).join('') : mEmpty('沒有這類任務。')}`)}
    </div>`;
}

/* ---------- 動作 ---------- */
function mAct(card, act) {
  const kind = card.dataset.kind, id = card.dataset.id;
  const feedback = card.querySelector('[data-feedback]')?.value.trim() || '';
  if (act === 'return' && !feedback) { mToast('退回時請填寫原因'); card.querySelector('[data-feedback]')?.focus(); return; }
  if (kind === 'verify') {
    const v = mVerify(); const r = v.reviews[id]; if (!r || r.status !== 'pending') return;
    if (act === 'approve') { r.status = 'approved'; r.approvedAt = new Date().toISOString(); mToast(`已核可「${r.title}」，新人 APP 會自動發獎勵`); }
    else { r.status = 'returned'; r.feedback = feedback; mToast(`已退回「${r.title}」`); }
    mSaveVerify(v);
  } else if (kind === 'assign') {
    const s = mAssign(); const t = s.tasks.find(x => x.id === id); if (!t) return;
    if (act === 'cancel') { if (!['todo', 'review'].includes(t.status)) return; t.status = 'cancelled'; mToast('已取消任務'); }
    else { if (t.status !== 'review') return; t.feedback = feedback.slice(0, 500); t.status = act === 'approve' ? 'done' : 'todo'; t.reviewed = new Date().toISOString(); mToast(act === 'approve' ? '已確認任務完成' : '已退回，新人可補充後再回報'); }
    mSave('assign', s);
  } else if (kind === 'survey') {
    const s = mSurveys(); const rec = (s.records || []).find(x => x.id === id); if (!rec || rec.status !== 'pending') return;
    Object.assign(rec, { status: act === 'approve' ? 'approved' : 'returned', feedback: act === 'approve' ? '' : feedback.slice(0, 500), revision: rec.revision + 1 });
    mSave('surveys', s);
    mToast(act === 'approve' ? `已核可「${M_BUILDINGS[rec.building] || rec.building}」，新人可開寶箱` : '已退回社區勘查');
  }
  mRender();
}

function mBindView(main) {
  main.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => mGo(b.dataset.go)));
  main.querySelectorAll('.m-card [data-act]').forEach(b => b.addEventListener('click', () => mAct(b.closest('.m-card'), b.dataset.act)));
  const reportForm = document.getElementById('m-report-form');
  if (reportForm) {
    reportForm.elements.date.addEventListener('change', e => { mReports.date = e.target.value; mRender(); });
    reportForm.addEventListener('submit', e => {
      e.preventDefault();
      const v = mVerify(); const date = reportForm.elements.date.value || mToday();
      v.reports[date] = Object.fromEntries(Object.keys(M_REPORT_FIELDS).map(k => [k, Math.max(0, Math.min(99, parseInt(reportForm.elements[k].value, 10) || 0))]));
      mSaveVerify(v); mToast(`已儲存 ${date} 日報，新人 APP 會自動核對 📊 任務`); mRender();
    });
    reportForm.querySelector('[data-act="sample"]').addEventListener('click', () => {
      const sample = { visits: 2, gatekeeper: 1, calls: 3, appointments: 1, cold: 1 };
      for (const [k, v] of Object.entries(sample)) reportForm.elements[k].value = v;
    });
    reportForm.querySelector('[data-act="clear"]')?.addEventListener('click', () => {
      const v = mVerify(); delete v.reports[reportForm.elements.date.value]; mSaveVerify(v); mToast('已刪除這天日報'); mRender();
    });
    main.querySelectorAll('tr[data-date]').forEach(tr => tr.addEventListener('click', () => { mReports.date = tr.dataset.date; mRender(); }));
  }
  const assignForm = document.getElementById('m-assign-form');
  if (assignForm) {
    assignForm.addEventListener('submit', e => {
      e.preventDefault();
      const data = new FormData(assignForm), members = data.getAll('member');
      const title = String(data.get('title')).trim(), description = String(data.get('description')).trim(), due = String(data.get('due') || '');
      if (!title || !description || !members.length) { mToast('請填寫任務、完成條件，並至少選一位新人'); return; }
      const s = mAssign(), created = new Date().toISOString();
      for (const member of members) s.tasks.push({ id: crypto.randomUUID(), title: title.slice(0, 80), description: description.slice(0, 1000), category: String(data.get('category')), due, member, status: 'todo', report: '', feedback: '', created });
      if (mSave('assign', s)) { mToast(`已發布給 ${members.length} 位新人`); mRender(); }
    });
    main.querySelectorAll('[data-filter]').forEach(b => b.addEventListener('click', () => { mAssignView.filter = b.dataset.filter; mRender(); }));
  }
}

const M_VIEWS = { overview: mOverview, reviews: mReviews, surveys: mSurveysView, abilities: mAbilities, reports: mReports, assign: mAssignView };
function mRender() {
  const main = document.getElementById('m-main');
  main.innerHTML = M_VIEWS[mView]();
  mBindView(main);
  const counts = mPendingCounts();
  document.querySelectorAll('[data-count]').forEach(el => { const n = counts[el.dataset.count]; el.textContent = n || ''; el.hidden = !n; });
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
// 新人 APP 在另一個分頁更新資料時，後台自動刷新
window.addEventListener('storage', e => { if (Object.values(M_KEYS).includes(e.key)) mRender(); });
mGo(M_VIEWS[location.hash.slice(1)] ? location.hash.slice(1) : 'overview');
