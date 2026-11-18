/* =========================================================
   V4 試煉（#tab-academy）：試煉之塔（6-1～6-4）＋實戰對練 VS／戰鬥中／結算（6-5～6-7）
   - 題目、補課影片、重答、AI 對練評分全部沿用既有函式；這裡只重排與換外觀。
   - 試煉之塔不鎖關（既有沒有答錯次數限制），HP 只顯示 3 顆心。
   ========================================================= */
const V4_TOWER_NAMES = { tax: '稅務塔', mortgage: '貸款塔', contract: '契據塔', law: '法規塔', market: '行情塔' };

/* ---------- 試煉之塔 ---------- */
// 只讀舊糖果地圖裡的節點（塔的按鈕刻意不用同樣的 onclick，避免被既有程式的 querySelector 誤抓）
function v4StageNode(n) { return document.querySelector(`.v4-old-candy [onclick="launchSchoolStage(${n})"], #academy-subtab-school-view > .rounded-3xl [onclick="launchSchoolStage(${n})"]`); }
function v4StageInfo(n) {
  const node = v4StageNode(n);
  if (!node) return null;
  const badge = node.firstElementChild?.textContent.trim() || '';
  const caption = node.lastElementChild?.textContent.trim() || '';
  const stars = (badge.match(/⭐/g) || []).length;
  const passed = /✓/.test(badge) || stars > 0;
  return { n, caption, badge, stars: /✓/.test(badge) ? 3 : stars, passed, pending: badge.includes('補課') };
}

function v4BuildTower() {
  const view = document.getElementById('academy-subtab-school-view');
  if (!view || document.getElementById('v4-tower')) return;
  const candy = v4StageNode(1)?.closest('.rounded-3xl');
  if (candy) candy.classList.add('v4-old-candy');
  const tower = document.createElement('section');
  tower.id = 'v4-tower';
  tower.innerHTML = `<div class="v4-tower-head"><div><small class="v4-en">TRIAL TOWER</small><b class="v4-serif" id="v4-tower-name">稅務塔</b></div>
      <div class="v4-hp" aria-label="生命 3 顆（不扣關卡）">♥♥♥</div></div>
    <div class="v4-tower-body" id="v4-tower-floors"></div>
    <div class="v4-tower-foot"><img src="${V4_ASSET}mentor_face.jpg" alt="阿義學長"><p class="v4-parch" id="v4-tower-tip">答錯沒關係，看完補課短片就能重答！</p>
      <button type="button" class="v4-btn-gold" id="v4-tower-go">挑戰 1F</button></div>`;
  (candy || view.lastElementChild).before(tower);
  for (const [dom, name] of Object.entries(V4_TOWER_NAMES)) {
    const btn = document.getElementById('school-dom-' + dom);
    if (btn && !btn.dataset.v4) { btn.dataset.v4 = '1'; btn.textContent = btn.textContent.trim().split(/\s+/)[0] + ' ' + name; }
  }
  view.firstElementChild?.setAttribute('id', 'v4-tower-tabs');
  // 既有程式會改動舊節點的徽章與文字（formal-training），觀察後同步塔的樓層
  if (candy) new MutationObserver(() => v4RenderTower()).observe(candy, { subtree: true, childList: true, characterData: true });
}

function v4RenderTower() {
  const floors = document.getElementById('v4-tower-floors');
  if (!floors) return;
  const domain = v4Safe(() => currentSchoolDomain, 'tax');
  document.getElementById('v4-tower-name').textContent = V4_TOWER_NAMES[domain] || '試煉之塔';
  Object.keys(V4_TOWER_NAMES).forEach(k => document.getElementById('school-dom-' + k)?.setAttribute('aria-pressed', String(k === domain)));
  const infos = [1, 2, 3, 4, 5, 6].map(v4StageInfo).filter(Boolean);
  const current = infos.find(i => !i.passed) || infos[infos.length - 1];
  floors.innerHTML = infos.slice().reverse().map(info => {
    const boss = info.n === 6;
    const state = info.passed ? 'passed' : info === current ? 'current' : 'locked';
    const stars = '★'.repeat(info.stars) + `<i>${'★'.repeat(3 - info.stars)}</i>`;
    return `<button type="button" class="v4-floor is-${state} ${boss ? 'is-boss' : ''}" data-v4-stage="${info.n}" aria-label="${info.n}F ${v4Esc(info.caption)}">
      <span class="v4-floor-no v4-en">${boss ? '👑' : info.n + 'F'}</span>
      <span class="v4-floor-name">${boss ? 'BOSS・' : ''}${v4Esc(info.caption)}</span>
      <span class="v4-floor-state">${state === 'passed' ? `<span class="v4-stars">${stars}</span>` : state === 'current' ? (info.pending ? '待補課' : '▶ 挑戰中') : '🔒'}</span></button>`;
  }).join('');
  floors.querySelectorAll('[data-v4-stage]').forEach(btn => { btn.onclick = () => launchSchoolStage(Number(btn.dataset.v4Stage)); });
  const go = document.getElementById('v4-tower-go');
  go.textContent = current ? `挑戰 ${current.n === 6 ? 'BOSS' : current.n + 'F'}` : '挑戰';
  go.onclick = () => current && launchSchoolStage(current.n);
  document.getElementById('v4-tower-tip').textContent = current?.pending ? '先看補課短片，再回來重答這一關。' : current?.n === 6 ? 'BOSS 關！把前面學到的全部用上。' : '答錯沒關係，看完補課短片就能重答！';
}

/* ---------- 實戰對練 VS（6-5） ---------- */
function v4BuildVS() {
  const setup = document.getElementById('rp-setup-screen');
  if (!setup || document.getElementById('v4-vs')) return;
  setup.classList.add('v4-rp-setup');
  const vs = document.createElement('div');
  vs.id = 'v4-vs';
  setup.prepend(vs);
  const start = setup.querySelector('[onclick="startRPSessionFromSetup()"]');
  if (start) { start.classList.add('v4-start-battle'); start.innerHTML = '<span>⚔ 出陣！</span>'; vs.after(start); }
}
function v4RenderVS() {
  const vs = document.getElementById('v4-vs');
  if (!vs) return;
  const t = v4Safe(() => currentSelectedRPTemplate, {}) || {};
  const tags = v4Safe(() => rpSelectedTags, []);
  const goalSel = document.getElementById('rp-goal-select');
  const goal = goalSel?.value === 'custom' ? (document.getElementById('rp-custom-goal-input')?.value.trim() || '自訂目標') : (goalSel?.value || t.goal || '');
  const stars = Math.max(1, Math.min(3, tags.length));
  const open = document.getElementById('rp-setup-screen').classList.contains('v4-show-settings');
  vs.innerHTML = `<div class="v4-vs-goal"><small class="v4-en">VICTORY</small><span>勝利條件：<b>${v4Esc(goal)}</b></span></div>
    <div class="v4-vs-arena">
      <img class="v4-vs-me" src="${v4ClassArt(v4DevCode())}" alt="我的角色">
      <div class="v4-vs-foe" aria-hidden="true"><span>?</span></div>
      <b class="v4-vs-mark v4-en">VS</b>
    </div>
    <div class="v4-vs-card v4-frame"><div class="v4-vs-name"><b class="v4-serif">${v4Esc(t.clientName || '對手')}</b><span class="v4-stars">${'★'.repeat(stars)}<i>${'★'.repeat(3 - stars)}</i></span></div>
      <p class="v4-vs-row"><span class="v4-vs-k">抗性</span>${tags.map(x => `<em>${v4Esc(x)}</em>`).join('') || '—'}</p>
      <p class="v4-vs-row"><span class="v4-vs-k is-weak">弱點</span>${v4Esc(t.title || '')}</p>
      <button type="button" class="v4-btn-ghost v4-vs-swap" onclick="v4ToggleRPSettings()">${open ? '收起設定' : '換對手 ⇄'}</button></div>`;
}
function v4ToggleRPSettings() {
  document.getElementById('rp-setup-screen').classList.toggle('v4-show-settings');
  v4RenderVS();
}

/* ---------- 戰鬥中（6-6）：心防＝100−信任度、技能卡 ---------- */
let v4LastGuard = null;
function v4BuildBattle() {
  const chat = document.getElementById('rp-chat-screen');
  if (!chat || document.getElementById('v4-guard')) return;
  chat.classList.add('v4-rp-chat');
  const guard = document.createElement('div');
  guard.id = 'v4-guard';
  guard.innerHTML = `<div class="v4-guard-top"><span class="v4-serif">心防</span><b class="v4-en" id="v4-guard-val">60</b><span class="v4-en v4-round" id="v4-round">ROUND 1</span></div>
    <div class="v4-guard-bar"><i class="v4-guard-ghost" id="v4-guard-ghost"></i><i class="v4-guard-fill" id="v4-guard-fill"></i></div>`;
  chat.firstElementChild.after(guard);
}
function v4RenderGuard() {
  const trust = v4Safe(() => rpTrustMeter, 40);
  const guard = Math.max(0, Math.min(100, 100 - trust));
  const fill = document.getElementById('v4-guard-fill');
  const ghost = document.getElementById('v4-guard-ghost');
  if (!fill) return;
  document.getElementById('v4-guard-val').textContent = guard;
  fill.style.width = guard + '%';
  // 扣下去的那段先留著，再慢慢縮（傷害動畫）
  if (v4LastGuard !== null && guard < v4LastGuard) {
    ghost.style.transition = 'none'; ghost.style.width = v4LastGuard + '%';
    requestAnimationFrame(() => requestAnimationFrame(() => { ghost.style.transition = 'width .9s ease .25s'; ghost.style.width = guard + '%'; }));
    document.getElementById('v4-guard')?.classList.remove('is-hit'); void fill.offsetWidth; document.getElementById('v4-guard')?.classList.add('is-hit');
  } else { ghost.style.transition = 'none'; ghost.style.width = guard + '%'; }
  v4LastGuard = guard;
  const rounds = v4Safe(() => rpChatHistory.filter(m => m.role === 'user' || m.sender === 'user').length, 0);
  document.getElementById('v4-round').textContent = 'ROUND ' + (rounds + 1);
}
function v4DecorateSkills() {
  const box = document.getElementById('rp-quick-tactics');
  if (!box) return;
  box.classList.add('v4-skills');
  [...box.querySelectorAll('button')].forEach((btn, i) => {
    if (btn.dataset.v4) return;
    btn.dataset.v4 = '1';
    btn.classList.add('v4-skill-card');
    // 規格 6-6：技能卡點了把話術帶入輸入框（由玩家按送出），話術內容仍取自既有 sendPresetTactic
    const tacticId = Number((btn.getAttribute('onclick') || '').match(/\d+/)?.[0]);
    if (tacticId) {
      btn.removeAttribute('onclick');
      btn.addEventListener('click', () => {
        const input = document.getElementById('rp-user-input');
        const send = window.sendRPUserMessage;
        window.sendRPUserMessage = text => { if (input && typeof text === 'string') { input.value = text; input.focus(); } };
        try { sendPresetTactic(tacticId); } finally { window.sendRPUserMessage = send; }
      });
    }
    btn.insertAdjacentHTML('afterbegin', `<small class="v4-en">SKILL ${i + 1}</small>`);
  });
}

/* ---------- 戰鬥結算（6-7） ---------- */
function v4Grade(score) { return score >= 19 ? 'S' : score >= 15 ? 'A' : score >= 11 ? 'B' : 'C'; }
function v4DecorateReview(reason) {
  const modal = document.getElementById('modal-rp-review');
  const panel = modal?.firstElementChild;
  if (!panel) return;
  panel.classList.add('v4-darkify', 'v4-review');
  const score = parseInt(document.getElementById('rp-review-total-score')?.textContent || '0', 10);
  const victory = v4Safe(() => rpTrustMeter, 0) >= 70 || reason === 'success';
  const grade = v4Grade(score);
  const dims = [1, 2, 3, 4].map(i => {
    const el = document.getElementById('rubric-score-' + i);
    const val = parseInt(el?.textContent || '0', 10);
    const label = el?.previousElementSibling?.textContent.replace(/^\d\.\s*/, '').replace(/[（(].*$/, '').replace(/[：:]\s*$/, '').trim() || '';
    if (el) {
      el.parentElement.querySelector('.v4-seg')?.remove();
      el.insertAdjacentHTML('beforebegin', `<span class="v4-seg" aria-hidden="true">${[1, 2, 3, 4, 5].map(k => `<i class="${k <= val ? 'on' : ''}"></i>`).join('')}</span>`);
    }
    return { label, val };
  });
  const mvp = dims.reduce((a, b) => (b.val > a.val ? b : a), dims[0]);
  panel.querySelector('#v4-result')?.remove();
  const loot = document.getElementById('rp-review-points-badge')?.textContent || '';
  const result = document.createElement('div');
  result.id = 'v4-result';
  result.className = victory ? 'is-win' : 'is-lose';
  result.innerHTML = `<div class="v4-result-rays" aria-hidden="true"></div>
    <small class="v4-en">${victory ? 'VICTORY' : 'TRY AGAIN'}</small>
    <b class="v4-grade v4-en">${grade}</b><span class="v4-en">${score} / 20</span>
    ${mvp ? `<p class="v4-mvp"><span class="v4-en">MVP</span> ${v4Esc(mvp.label)}</p>` : ''}
    <p class="v4-loot">戰利品：${v4Esc(loot)}</p>`;
  panel.firstElementChild.after(result);
  // 店長示範話術收進「看示範招式」
  const gold = document.getElementById('rp-review-gold')?.parentElement;
  if (gold && !gold.closest('details.v4-demo')) {
    const details = document.createElement('details');
    details.className = 'v4-demo';
    details.innerHTML = '<summary>看示範招式</summary>';
    gold.before(details);
    details.appendChild(gold);
  }
}

/* ---------- 啟動與包裝 ---------- */
v4BuildTower();
v4BuildVS();
v4BuildBattle();
for (const id of ['modal-school-stage-play']) document.getElementById(id)?.firstElementChild?.classList.add('v4-darkify');

window.addEventListener('DOMContentLoaded', () => {
  document.querySelector('#fl-training-dialog')?.classList.add('v4-darkify');
  const academyTabs = document.getElementById('acad-subtab-school')?.parentElement;
  if (academyTabs) {
    academyTabs.id = 'v4-academy-tabs';
    document.getElementById('acad-subtab-school').innerHTML = '<span>🗼</span> <span>試煉之塔</span>';
    document.getElementById('acad-subtab-roleplay').innerHTML = '<span>⚔</span> <span>實戰對練</span>';
  }
  const wrap = (name, after) => {
    if (typeof window[name] !== 'function') return;
    const original = window[name];
    window[name] = function (...args) { const r = original.apply(this, args); after(...args); return r; };
  };
  wrap('switchSchoolDomain', () => v4RenderTower());
  wrap('switchAcademySubtab', sub => {
    ['school', 'roleplay'].forEach(k => document.getElementById('acad-subtab-' + k)?.setAttribute('aria-pressed', String(k === sub)));
    if (sub === 'roleplay') v4RenderVS(); else v4RenderTower();
  });
  wrap('selectRPTemplate', () => v4RenderVS());
  wrap('toggleRPTag', () => v4RenderVS());
  wrap('handleGoalSelectChange', () => v4RenderVS());
  wrap('startRPSessionFromSetup', () => { v4LastGuard = null; v4RenderGuard(); v4DecorateSkills(); });
  wrap('updateTrustMeterUI', () => v4RenderGuard());
  wrap('renderQuickTactics', () => v4DecorateSkills());
  wrap('sendRPUserMessage', () => v4RenderGuard());
  wrap('concludeRPSession', reason => v4DecorateReview(reason));
  document.getElementById('rp-goal-select')?.addEventListener('change', v4RenderVS);
  const originalSwitchTab = switchTab;
  switchTab = function (tabId, ...rest) {
    const r = originalSwitchTab.call(this, tabId, ...rest);
    if (tabId === 'tab-academy') { v4RenderTower(); v4RenderVS(); }
    return r;
  };
  document.getElementById('acad-subtab-school')?.setAttribute('aria-pressed', 'true');
  v4RenderTower();
  v4RenderVS();
  v4RenderGuard();
});
