/* =========================================================
   V4 主城、HUD、底部導覽
   - 只包裝既有函式（switchTab / confirmAndEnterApp / formalQuizOpen / updateCurrencyUI），
     原本的行為照常執行，再補上 V4 畫面。
   ========================================================= */
const V4_ICON = {
  coin: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F2B544" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 8 V16 M9.5 10 H14 M9.5 14 H14"/></svg>',
  gem: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B79CF0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 4 H18 L22 9 L12 21 L2 9 Z"/><path d="M2 9 H22 M9 4 L12 9 L15 4 M12 9 V21"/></svg>',
  mail: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#CDB591" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7 L12 13 L21 7"/></svg>',
  crown: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F2B544" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8 L7 12 L12 5 L17 12 L21 8 L19 19 H5 Z"/></svg>',
  calendar: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7FD8C8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10 H21 M8 3 V7 M16 3 V7"/></svg>',
  spark: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#B79CF0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 L13.5 10.5 L21 12 L13.5 13.5 L12 21 L10.5 13.5 L3 12 L10.5 10.5 Z"/></svg>',
  arena: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F0A08A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4 L20 4 L20 10 L9 21 L3 15 Z"/><path d="M6 12 L12 18"/></svg>',
  map: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4 L3 6 V20 L9 18 L15 20 L21 18 V4 L15 6 Z"/><path d="M9 4 V18 M15 6 V20"/></svg>',
  hero: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21 C5 16 8 14 12 14 C16 14 19 16 20 21"/></svg>',
  castle: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 21 V9 H7 V6 H10 V9 H14 V6 H17 V9 H20 V21 Z"/><path d="M10 21 V16 A2 2 0 0 1 14 16 V21"/></svg>',
  party: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.5"/><path d="M2 20 C3 15.5 6 14 9 14 C12 14 15 15.5 16 20"/><circle cx="17" cy="9" r="2.8"/><path d="M17 14 C19.5 14 21.5 15.5 22 19"/></svg>',
  tower: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 21 V8 L12 3 L16 8 V21 Z"/><path d="M10 12 H14 M10 16 H14"/></svg>'
};

function v4Esc(text) {
  return String(text ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

/* ---------- 夜景（設計圖 skyline() 的程式版） ---------- */
function v4Skyline() {
  let seed = 7;
  const rand = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const stars = Array.from({ length: 40 }, () =>
    `<circle cx="${Math.round(rand() * 390)}" cy="${Math.round(90 + rand() * 230)}" r="${[0.8, 1.2, 1.6][Math.floor(rand() * 3)]}" fill="#FFF3D6" opacity="${[0.4, 0.7, 1][Math.floor(rand() * 3)]}"/>`).join('');
  const blocks = [[0, 470, 60], [55, 430, 50], [100, 500, 70], [165, 440, 40], [300, 455, 52], [345, 420, 60], [250, 480, 56]];
  let windows = '';
  for (const [x, y, w] of blocks) {
    for (let wy = y + 12; wy < 650; wy += 18) {
      for (let wx = x + 8; wx < x + w - 4; wx += 12) {
        if (rand() < 0.32) windows += `<rect x="${wx}" y="${wy}" width="5" height="7" fill="#FFC56B" opacity="${[0.5, 0.75, 0.9][Math.floor(rand() * 3)]}"/>`;
      }
    }
  }
  let towerLights = '';
  for (let i = 0; i < 18; i++) towerLights += `<rect x="${i % 2 ? 200 : 186}" y="${215 + i * 22}" width="6" height="3" fill="#7FD8C8" opacity="0.7"/>`;
  const lanterns = [[20, 112], [70, 126], [120, 134], [270, 134], [320, 126], [370, 112]].map(([x, y]) =>
    `<g class="v4-lantern"><circle cx="${x}" cy="${y}" r="16" fill="#FFB347" opacity="0.18"/><ellipse cx="${x}" cy="${y}" rx="8" ry="10" fill="#F07A3A"/><ellipse cx="${x}" cy="${y}" rx="5" ry="7" fill="#FFC56B"/></g>`).join('');
  return `<svg class="v4-sky" viewBox="0 0 390 844" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
<defs><linearGradient id="v4-sky-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#151026"/><stop offset="0.45" stop-color="#3A2337"/><stop offset="0.72" stop-color="#7A3E2E"/><stop offset="1" stop-color="#2A160E"/></linearGradient>
<radialGradient id="v4-plaza" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#F2B544" stop-opacity="0.55"/><stop offset="0.6" stop-color="#9C6514" stop-opacity="0.25"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs>
<rect width="390" height="844" fill="url(#v4-sky-g)"/>${stars}
<path d="M195 140 L199 140 L199 170 L203 170 L203 200 L210 205 L206 250 L214 255 L209 300 L217 305 L212 350 L220 355 L215 400 L223 405 L218 450 L226 455 L224 640 L170 640 L168 455 L176 450 L171 405 L179 400 L174 355 L182 350 L177 305 L185 300 L180 255 L188 250 L184 205 L191 200 L191 170 L195 170 Z" fill="#1A1218"/>${towerLights}
${blocks.map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="${844 - y}" fill="#140D10"/>`).join('')}${windows}
<path d="M0 104 Q 98 150 195 140 Q 292 150 390 104" fill="none" stroke="#3A2414" stroke-width="2"/>${lanterns}
<rect x="0" y="640" width="390" height="204" fill="#1E140E"/><ellipse cx="195" cy="660" rx="230" ry="70" fill="url(#v4-plaza)"/></svg>`;
}

/* ---------- 建立 DOM ---------- */
function v4BuildHud() {
  const hud = document.createElement('div');
  hud.id = 'v4-hud';
  hud.innerHTML = `
    <div class="v4-hud-avatar" id="v4-hud-avatar" role="img" aria-label="我的角色"><span class="v4-hud-lv">Lv.<span id="v4-hud-level">1</span></span></div>
    <div class="v4-hud-name"><b id="v4-hud-name">新星</b><div class="v4-expbar" title="EXP"><i id="v4-hud-exp"></i></div></div>
    <div class="v4-chip" title="金幣"><span class="v4-chip-emoji" aria-hidden="true">🪙</span><span id="v4-hud-coins">0</span></div>
    <div class="v4-chip" title="盲盒券"><span class="v4-chip-emoji" aria-hidden="true">🎟️</span><span id="v4-hud-tickets">0</span></div>`;
  const shell = document.getElementById('app-shell');
  shell.insertBefore(hud, document.getElementById('app-main-scroll'));
}
// 測試後台入口：從舊 header 搬進 HUD（節點本身不變；test-admin.js 在 DOMContentLoaded 才建立）
function v4AdoptAdminEntry() {
  const adminEntry = document.querySelector('#app-shell > header .ta-entry');
  const hud = document.getElementById('v4-hud');
  if (adminEntry && hud) hud.appendChild(adminEntry);
}

function v4BuildLobby() {
  const lobby = document.createElement('section');
  lobby.id = 'tab-lobby';
  lobby.className = 'hidden';
  lobby.setAttribute('aria-label', '主城');
  lobby.innerHTML = `${v4Skyline()}
    <div class="v4-side v4-side-right">
      <div class="v4-limited" role="img" aria-label="本期限時召喚 UP">
        <span class="v4-limited-clip"><img src="${V4_ASSET}ip/dino2.png" alt=""><small>LIMITED</small><b>限時<br>召喚</b><em>本期 UP</em></span>
      </div>
    </div>
    <div class="v4-stage" id="v4-stage">
      <div class="v4-stage-glow"></div>
      <div class="v4-mate v4-mate-back" id="v4-mate-3" hidden></div>
      <div class="v4-mate v4-mate-l" id="v4-mate-1"></div>
      <div class="v4-mate v4-mate-r" id="v4-mate-2"></div>
      <img class="v4-hero" id="v4-hero" alt="我的角色">
      <div class="v4-bubble v4-parch" id="v4-bubble" aria-live="polite"></div>
    </div>
    <div class="v4-ribbon" id="v4-class-ribbon">社區開發刺客</div>
    <div class="v4-lobby-floor">
      <div class="v4-lobby-bottom">
        <button type="button" class="v4-quest-track" onclick="switchTab('tab-tasks')" aria-label="冒險日誌：查看全部任務">
          <div><span class="v4-tag-main">主線</span><span class="v4-quest-title" id="v4-quest-title">—</span><span class="v4-quest-more">全部任務 ›</span></div>
          <div><span class="v4-mini-bar"><i id="v4-quest-bar"></i></span><span class="v4-quest-count" id="v4-quest-count">0/0</span></div>
          <small class="v4-quest-open" id="v4-all-quests-count">0 項進行中</small>
        </button>
        <button type="button" class="v4-btn-gold v4-go" onclick="v4GoAdventure()">出發冒險<small id="v4-go-target">→ 冒險地圖</small></button>
      </div>
    </div>`;
  const main = document.getElementById('app-main-scroll');
  main.insertBefore(lobby, document.getElementById('tab-tasks'));
}

function v4BuildNav() {
  const nav = document.getElementById('bottom-navbar');
  if (!nav) return;
  const setButton = (id, icon, label) => {
    const btn = document.getElementById(id);
    if (!btn) return null;
    btn.innerHTML = `${icon}<span>${label}</span>`;
    btn.setAttribute('aria-label', label);
    return btn;
  };
  setButton('nav-btn-map', V4_ICON.map, '冒險地圖');
  setButton('nav-btn-handbook', V4_ICON.hero, '角色');
  setButton('nav-btn-showcase', V4_ICON.party, '夥伴');
  setButton('nav-btn-academy', V4_ICON.tower, '試煉');
  // 冒險日誌不放導覽列，但保留節點（既有程式會更新它的 className）
  const tasksBtn = document.getElementById('nav-btn-tasks');
  if (tasksBtn) { tasksBtn.hidden = true; tasksBtn.style.display = 'none'; tasksBtn.setAttribute('aria-hidden', 'true'); }
  const lobbyBtn = document.createElement('button');
  lobbyBtn.id = 'nav-btn-lobby';
  lobbyBtn.type = 'button';
  lobbyBtn.className = 'v4-nav-center';
  lobbyBtn.setAttribute('aria-label', '主城');
  lobbyBtn.setAttribute('onclick', "switchTab('tab-lobby')");
  lobbyBtn.innerHTML = `<span class="v4-nav-orb">${V4_ICON.castle}</span><span>主城</span>`;
  nav.insertBefore(lobbyBtn, document.getElementById('nav-btn-showcase'));
}

/* ---------- 畫面更新 ---------- */
function v4RenderHud() {
  const p = v4Player();
  const set = (id, value) => { const el = document.getElementById(id); if (el && el.textContent !== String(value)) el.textContent = value; };
  set('v4-hud-level', p.level);
  set('v4-hud-name', p.name);
  set('v4-hud-coins', p.coins.toLocaleString());
  set('v4-hud-tickets', p.tickets);
  const bar = document.getElementById('v4-hud-exp');
  if (bar) bar.style.width = p.expPct + '%';
  const avatar = document.getElementById('v4-hud-avatar');
  if (avatar) avatar.style.backgroundImage = `url('${v4ClassArt(v4DevCode())}')`;
  const pending = v4ManagerPending();
  for (const id of ['v4-hud-mail-badge', 'v4-badge-guild']) {
    const badge = document.getElementById(id);
    if (badge) { badge.hidden = pending <= 0; badge.textContent = pending > 9 ? '9+' : pending; }
  }
  const daily = document.getElementById('v4-badge-daily');
  if (daily) {
    const doneToday = v4Safe(() => Object.values(hunterState.days[hunterDay()]?.tasks || {}).filter(t => t.status === 'done').length, 0);
    daily.hidden = doneToday >= 2;
  }
}

/* ---------- 夥伴編隊 party（新欄位，獨立存檔、向下相容） ---------- */
// 格式：{ version: 1, ids: [隊長, 第 2 位, 第 3 位] }；舊使用者沒有這個 key → 預設擁有中星等最高的 3 位
const V4_PARTY_KEY = 'sinyi-v4-party-v1';
let v4PartyIds = null;
let v4PartySelectedSlot = 0;

function v4PartyNormalize(ids) {
  const owned = new Set(v4OwnedFigures().map(f => f.id));
  const result = [];
  for (const id of Array.isArray(ids) ? ids : []) {
    if (typeof id === 'string' && owned.has(id) && !result.includes(id)) result.push(id);
    if (result.length === 3) break;
  }
  return result;
}
function v4PartyGet() {
  if (v4PartyIds === null) {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(V4_PARTY_KEY) || 'null'); } catch { saved = null; }
    v4PartyIds = saved && saved.version === 1 && Array.isArray(saved.ids) ? saved.ids : null;
  }
  // 存檔中的角色若已不在名冊（例如測試後台還原快照），自動剔除；整隊空了就給預設值
  const normalized = v4PartyNormalize(v4PartyIds || []);
  return normalized.length ? normalized : v4DefaultParty();
}
function v4PartySet(ids) {
  v4PartyIds = v4PartyNormalize(ids);
  try { localStorage.setItem(V4_PARTY_KEY, JSON.stringify({ version: 1, ids: v4PartyIds })); } catch { /* 無法存檔時只在本次生效 */ }
}

/* ---------- 夥伴編隊畫面（5-2，放在夥伴頁最上方） ---------- */
// 畫面站位：左＝第 2 位、中＝隊長、右＝第 3 位
const V4_PARTY_DISPLAY = [1, 0, 2];

function v4BuildPartyPanel() {
  const tab = document.getElementById('tab-showcase');
  if (!tab || document.getElementById('v4-party')) return;
  const panel = document.createElement('section');
  panel.id = 'v4-party';
  panel.setAttribute('aria-label', '夥伴編隊');
  panel.innerHTML = `
    <div class="v4-section-head">
      <div><small class="v4-en">MY PARTY</small><h2 class="v4-serif">今天帶誰出門？</h2></div>
      <span>隊伍會站在主城陪你</span>
    </div>
    <div class="v4-party-stage v4-frame" id="v4-party-stage"></div>
    <p class="v4-party-hint" id="v4-party-hint">點上方格子選位置，再點下方夥伴放入隊伍</p>
    <div class="v4-section-head v4-roster-head"><h3 class="v4-serif">夥伴名冊</h3><span class="v4-en" id="v4-roster-count">0 / 0</span></div>
    <div class="v4-roster-grid" id="v4-roster-grid"></div>
    <div class="v4-party-actions">
      <button type="button" class="v4-btn-gold" onclick="v4ScrollToSummon()">召喚新夥伴</button>
      <button type="button" class="v4-btn-ghost" onclick="openFamilyFusion()">融合</button>
    </div>`;
  tab.prepend(panel);
}

function v4RenderParty() {
  const stage = document.getElementById('v4-party-stage');
  if (!stage) return;
  const party = v4PartyGet();
  if (v4PartySelectedSlot > party.length) v4PartySelectedSlot = party.length;
  stage.innerHTML = V4_PARTY_DISPLAY.map(slot => {
    const id = party[slot];
    const info = id ? v4FigInfo(id) : null;
    const selected = slot === v4PartySelectedSlot;
    const label = slot === 0 ? '隊長' : `第 ${slot + 1} 位`;
    const art = id ? v4FigArt(id) : null;
    return `<button type="button" class="v4-party-slot ${slot === 0 ? 'is-captain' : ''} ${selected ? 'is-selected' : ''}"
        onclick="v4PartyPickSlot(${slot})" aria-pressed="${selected}" aria-label="${label}${info ? '：' + v4Esc(info.name) : '：空位'}">
      <span class="v4-party-art">${art ? `<img src="${v4Esc(art)}" alt="">` : '<span class="v4-party-empty">＋</span>'}</span>
      ${slot === 0 ? '<span class="v4-captain-tag">隊長</span>' : ''}
      <b class="v4-serif">${info ? v4Esc(info.name) : '空位'}</b>
      <small>${info ? '★'.repeat(info.stars) + '<i>' + '★'.repeat(Math.max(0, info.maxStars - info.stars)) + '</i>' : '點此選擇'}</small>
    </button>`;
  }).join('');

  const roster = v4RosterAll();
  const owned = roster.filter(f => f.owned);
  const sorted = [...owned, ...roster.filter(f => !f.owned)];
  document.getElementById('v4-roster-count').textContent = `${owned.length} / ${roster.length}`;
  document.getElementById('v4-roster-grid').innerHTML = sorted.map(f => {
    const inParty = party.includes(f.id);
    const art = v4FigArt(f.id);
    return `<button type="button" class="v4-roster-card r-${f.rarity.toLowerCase()} ${f.owned ? '' : 'is-locked'} ${inParty ? 'in-party' : ''}"
        ${f.owned ? `onclick="v4PartyAssign('${f.id}')"` : 'disabled'} aria-label="${v4Esc(f.name)}${f.owned ? '' : '（未擁有）'}${inParty ? '（隊伍中）' : ''}">
      ${art ? `<img src="${v4Esc(art)}" alt="" loading="lazy">` : ''}
      ${inParty ? '<span class="v4-check" aria-hidden="true">✓</span>' : ''}
      <span class="v4-rarity v4-en">${f.rarity}</span>
    </button>`;
  }).join('');
  const hint = document.getElementById('v4-party-hint');
  if (hint) hint.textContent = owned.length ? `選擇「${v4PartySelectedSlot === 0 ? '隊長' : '第 ' + (v4PartySelectedSlot + 1) + ' 位'}」：點下方夥伴放入` : '還沒有夥伴，先召喚一位吧！';
}

function v4PartyPickSlot(slot) {
  v4PartySelectedSlot = Math.min(slot, v4PartyGet().length);
  v4RenderParty();
}
function v4PartyAssign(id) {
  const party = [...v4PartyGet()];
  const slot = v4PartySelectedSlot;
  const existing = party.indexOf(id);
  if (existing === slot) return;
  if (existing !== -1) {
    // 已在隊伍中：與選中的位置互換
    [party[existing], party[slot]] = [party[slot], party[existing]];
  } else if (slot < party.length) {
    party[slot] = id;
  } else {
    party.push(id);
  }
  v4PartySet(party.filter(Boolean));
  const info = v4FigInfo(id);
  if (typeof showCustomToast === 'function' && info) showCustomToast(`${info.name} 加入隊伍${slot === 0 ? '，擔任隊長' : ''}！`, '⚔️');
  v4PartySelectedSlot = Math.min(slot + 1, 2, v4PartyGet().length);
  v4RenderParty();
}
function v4ScrollToSummon() {
  const target = document.getElementById('v4-altar');
  if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// 主城站位：左＝隊長（說話）、右＝第 2 位、後方＝第 3 位
function v4LobbyPartners() {
  return v4PartyGet().map(id => {
    const info = v4FigInfo(id);
    return { id, name: info?.name || '', img: v4FigArt(id) };
  }).filter(mate => mate.img);
}

let v4BubbleTimer = null;
let v4BubbleIndex = 0;
function v4BubbleLines() {
  const lines = [];
  const quest = v4CurrentMainQuest();
  if (!v4PartyGet().length) return ['到夥伴頁召喚第一位夥伴吧！'];
  const target = v4TargetBuilding();
  if (quest.current && target) lines.push(`老大，今天去${target.name}吧！`);
  else if (quest.current) lines.push(`主線「${quest.current.title}」還在等你！`);
  const pending = v4ManagerPending();
  if (pending > 0) lines.push(`公會長貼了 ${pending} 張懸賞單！`);
  if (!lines.length) lines.push('今天也一起去冒險吧！');
  return lines;
}
function v4RotateBubble() {
  const bubble = document.getElementById('v4-bubble');
  if (!bubble) return;
  const lines = v4BubbleLines();
  bubble.textContent = lines[v4BubbleIndex % lines.length];
  v4BubbleIndex++;
}

function v4RenderLobby() {
  v4RenderHud();
  if (!document.getElementById('tab-lobby')) return;
  const code = v4DevCode();
  const hero = document.getElementById('v4-hero');
  if (hero && !hero.src.endsWith(v4ClassOf(code).art)) hero.src = v4ClassArt(code);
  const ribbon = document.getElementById('v4-class-ribbon');
  if (ribbon) ribbon.textContent = v4ClassOf(code).name;

  const mates = v4LobbyPartners();
  ['v4-mate-1', 'v4-mate-2', 'v4-mate-3'].forEach((id, i) => {
    const img = document.getElementById(id);
    if (!img) return;
    const mate = mates[i];
    img.hidden = !mate;
    // 依穿用星等顯示造型（升星後主城夥伴也換新外觀）
    const key = mate ? mate.id + ':' + v4Safe(() => getEquippedFigurineStars(mate.id), 1) : '';
    if (mate && img.dataset.v4Art !== key) { img.dataset.v4Art = key; img.innerHTML = v4FigArtHTML(mate.id, { alt: '夥伴 ' + mate.name }); }
  });

  const quest = v4CurrentMainQuest();
  document.getElementById('v4-quest-title').textContent = quest.current ? quest.current.title : '主線全部完成！';
  document.getElementById('v4-quest-count').textContent = `${quest.done}/${quest.total}`;
  document.getElementById('v4-quest-bar').style.width = (quest.total ? Math.round(quest.done / quest.total * 100) : 0) + '%';

  const target = v4TargetBuilding();
  document.getElementById('v4-go-target').textContent = target ? '→ ' + target.name : '→ 冒險地圖';

  // 全部任務入口：目前路線未完成且已解鎖的任務＋公會長指派待完成
  const openSlots = v4Safe(() => routeTasksData[currentActiveRouteKey || 'dev'].slots.filter(s => !s.isCompleted && !s.isHidden).length, 0);
  const openCount = openSlots + v4ManagerPending();
  document.getElementById('v4-all-quests-count').textContent = `${openCount} 項進行中`;
  const questBadge = document.getElementById('v4-badge-quests');
  if (questBadge) { questBadge.hidden = openCount <= 0; questBadge.textContent = openCount > 9 ? '9+' : openCount; }

  v4RotateBubble();
  clearInterval(v4BubbleTimer);
  v4BubbleTimer = setInterval(() => {
    if (document.getElementById('tab-lobby')?.classList.contains('hidden')) { clearInterval(v4BubbleTimer); return; }
    v4RotateBubble();
  }, 6000);
}

/* ---------- 主城按鈕動作 ---------- */
function v4GoAdventure() {
  const target = v4TargetBuilding();
  switchTab('tab-map');
  if (target && typeof selectMapBuilding === 'function') selectMapBuilding(target.id);
}
function v4OpenGuild() {
  if (typeof managerOpen === 'function') managerOpen();
}

/* ---------- 包裝既有函式 ---------- */
// 原本「進任務主頁」的兩個時機改進主城：
// 1. 開機還原存檔（使用者還沒操作前，程式自動呼叫的 switchTab('tab-tasks')）
// 2. 完成覺醒試煉後的 confirmAndEnterApp
let v4BootRedirect = true;
let v4RedirectTasks = false;
document.addEventListener('pointerdown', event => { if (event.isTrusted) v4BootRedirect = false; }, { capture: true, once: true });

// 本檔在 </body> 前載入，DOM 已存在：立刻建立 HUD／主城／導覽，
// 讓其他檔案在 DOMContentLoaded 還原存檔時呼叫 switchTab 就能進主城。
v4BuildHud();
v4BuildLobby();
v4BuildNav();
v4BuildPartyPanel();

(function v4WrapCore() {
  const originalSwitch = switchTab;
  switchTab = function (tabId) {
    const ev = window.event;
    const userInitiated = !!(ev && (ev.type === 'click' || ev.type === 'keydown'));
    if (tabId === 'tab-tasks' && isQuizCompleted && (v4RedirectTasks || (v4BootRedirect && !userInitiated))) {
      tabId = 'tab-lobby';
      v4RedirectTasks = false;
    }
    if (userInitiated) v4BootRedirect = false;
    originalSwitch(tabId);
    if (!isQuizCompleted) return;
    const onLobby = tabId === 'tab-lobby';
    document.getElementById('tab-lobby')?.classList.toggle('hidden', !onLobby);
    document.getElementById('app-shell').classList.toggle('v4-lobby-mode', onLobby);
    document.querySelectorAll('#bottom-navbar > button').forEach(btn => {
      if (btn.id === 'nav-btn-' + tabId.replace('tab-', '')) btn.setAttribute('aria-current', 'page');
      else btn.removeAttribute('aria-current');
    });
    if (onLobby) v4RenderLobby(); else v4RenderHud();
    if (tabId === 'tab-showcase') v4RenderParty();
  };

  // 名冊變動（抽卡、升星、融合、測試後台）後同步編隊畫面
  const originalWarehouse = renderWarehouseUI;
  renderWarehouseUI = function (...args) {
    const result = originalWarehouse.apply(this, args);
    v4RenderParty();
    if (!document.getElementById('tab-lobby')?.classList.contains('hidden')) v4RenderLobby();
    return result;
  };

  const originalConfirm = confirmAndEnterApp;
  confirmAndEnterApp = async function (...args) {
    v4RedirectTasks = true;
    try { return await originalConfirm.apply(this, args); }
    finally { v4RedirectTasks = false; }
  };

  if (typeof formalQuizOpen === 'function') {
    const originalQuizOpen = formalQuizOpen;
    formalQuizOpen = function (...args) {
      document.getElementById('tab-lobby')?.classList.add('hidden');
      document.getElementById('app-shell')?.classList.remove('v4-lobby-mode');
      document.querySelectorAll('#bottom-navbar > button').forEach(btn => btn.removeAttribute('aria-current'));
      return originalQuizOpen.apply(this, args);
    };
  }

  const originalCurrency = updateCurrencyUI;
  updateCurrencyUI = function (...args) {
    const result = originalCurrency.apply(this, args);
    v4RenderHud();
    return result;
  };
})();

window.addEventListener('DOMContentLoaded', () => {
  v4AdoptAdminEntry();
  // 既有程式更新舊 header（等級／EXP／金幣）時，同步刷新 HUD
  const header = document.querySelector('#app-shell > header');
  if (header) new MutationObserver(() => v4RenderHud()).observe(header, { subtree: true, childList: true, characterData: true });
  const pending = document.getElementById('mt-pending-count');
  if (pending) new MutationObserver(() => v4RenderHud()).observe(pending, { childList: true, characterData: true, subtree: true });
  v4RenderHud();
  // 存檔載入若早於主城建立，畫面可能停在「沒有任何分頁」：補進主城
  const allHidden = ['tasks', 'map', 'handbook', 'showcase', 'academy'].every(id => document.getElementById('tab-' + id)?.classList.contains('hidden'));
  if (isQuizCompleted && allHidden && document.getElementById('screen-quiz-flow').classList.contains('hidden')) switchTab('tab-lobby');
});
