/* =========================================================
   V4 夥伴頁：召喚祭壇（5-1）、夥伴名冊（5-3）、各 Modal 外觀、參觀同事主城（5-8）
   - 抽卡機率、保底、升星、融合、對戰都沿用既有函式；這裡只重排與換外觀。
   ========================================================= */

// 各獎池本期 UP 角色（只用於祭壇中央展示）
const V4_POOL_UP = { tony: 'tony_dino', chen: 'tony_dino', all: 'tony_dino', super: null, family: 'founder_zhou' };
// 參觀同事主城：沿用既有示範同事（小林）的資料
const V4_COLLEAGUE = { branch: '松智旗艦店', name: '小林', title: '托尼首席收藏家', classCode: 'B', mates: ['tony_rock', 'tony_alien'], hearts: 142 };
// 會換上 V4 深色外觀的既有 Modal 面板
const V4_DARK_MODALS = ['modal-figurine-detail', 'modal-gacha-reveal', 'modal-select-figurine', 'modal-evolution-collection', 'modal-colleague-visit', 'modal-change-route'];

function v4PoolUpId() {
  const pool = v4Safe(() => currentGachaPool, 'tony');
  return V4_POOL_UP[pool] || v4Safe(() => superSalesCatalog[0].id, 'tony_dino');
}

/* ---------- 召喚祭壇 ---------- */
function v4BuildAltar() {
  const tab = document.getElementById('tab-showcase');
  const banner = document.getElementById('pool-btn-tony')?.closest('.lego-card');
  if (!tab || !banner || document.getElementById('v4-altar')) return;
  banner.id = 'v4-altar';
  document.getElementById('pool-btn-tony').parentElement.id = 'v4-pool-tabs';
  const head = document.createElement('div');
  head.className = 'v4-altar-head';
  head.innerHTML = `<small class="v4-en">SUMMONING ALTAR</small><h2 class="v4-serif">召喚祭壇</h2>`;
  const stage = document.createElement('div');
  stage.className = 'v4-altar-stage';
  stage.innerHTML = '<div class="v4-altar-rays" aria-hidden="true"></div><div class="v4-altar-ring" aria-hidden="true"></div><img id="v4-altar-up" alt=""><span class="v4-altar-rarity v4-en" id="v4-altar-rarity">SSR</span>';
  const pity = document.createElement('div');
  pity.className = 'v4-pity';
  pity.innerHTML = '<span>保底</span><div class="v4-pity-bar"><i id="v4-pity-bar"></i></div><span class="v4-en" id="v4-pity-text">0/50</span>';
  const poolTabs = document.getElementById('v4-pool-tabs');
  banner.insertBefore(head, poolTabs.nextSibling);
  head.after(stage);
  const pullRow = banner.querySelector('[onclick="pullExecutiveGacha(1)"]')?.parentElement;
  if (pullRow) { pullRow.id = 'v4-pull-row'; pullRow.after(pity); }
  const single = banner.querySelector('[onclick="pullExecutiveGacha(1)"]');
  if (single) single.firstElementChild.textContent = '單抽・100';
  const ten = banner.querySelector('[onclick="pullExecutiveGacha(10)"]');
  if (ten) ten.querySelector('span').textContent = '十連・950';

  // 入口：融合工坊、進化圖鑑（搬移原本的按鈕，onclick 不變）；IP 擂台入口已移除（功能程式保留、按鈕隱藏）
  const links = document.createElement('div');
  links.id = 'v4-altar-links';
  const pick = sel => tab.querySelector(`:scope > button[onclick^="${sel}"]`);
  const entries = [[pick('openFamilyFusion'), '✦', '融合工坊'], [pick('openEvolutionCollection'), '📖', '進化圖鑑']];
  for (const [btn, icon, label] of entries) {
    if (!btn) continue;
    btn.className = 'v4-altar-link';
    btn.innerHTML = `<span aria-hidden="true">${icon}</span><b class="v4-serif">${label}</b>`;
    links.appendChild(btn);
  }
  banner.after(links);
  const arena = pick('openAceBattle');
  if (arena) { arena.hidden = true; arena.setAttribute('aria-hidden', 'true'); arena.classList.add('v4-hidden-section'); }
}

function v4RenderAltar() {
  const img = document.getElementById('v4-altar-up');
  if (!img) return;
  const id = v4PoolUpId();
  const art = v4FigArt(id);
  if (art && img.getAttribute('src') !== art) img.src = art;
  const info = v4FigInfo(id);
  img.alt = info ? '本期 UP：' + info.name : '';
  const rarity = document.getElementById('v4-altar-rarity');
  if (rarity) rarity.textContent = info?.rarity || 'SSR';
  const pity = v4Safe(() => gachaPityCounter, 0);
  const bar = document.getElementById('v4-pity-bar');
  if (bar) bar.style.width = Math.min(100, pity / 50 * 100) + '%';
  const text = document.getElementById('v4-pity-text');
  if (text) text.textContent = `${pity}/50`;
  const pool = v4Safe(() => currentGachaPool, 'tony');
  ['all', 'chen', 'tony', 'family', 'super'].forEach(k => document.getElementById('pool-btn-' + k)?.setAttribute('aria-pressed', String(k === pool)));
}

/* ---------- 夥伴名冊（#warehouse-grid） ---------- */
function v4BuildRoster() {
  const grid = document.getElementById('warehouse-grid');
  const panel = grid?.parentElement;
  if (!panel || panel.id === 'v4-roster-panel') return;
  panel.id = 'v4-roster-panel';
  const head = panel.firstElementChild;
  head.classList.add('v4-roster-top');
  const title = head.firstElementChild;
  title.innerHTML = '<span><small class="v4-en">ROSTER</small><b class="v4-serif">夥伴名冊</b></span>';
  head.lastElementChild.id = 'v4-roster-filters';
  const visit = document.createElement('button');
  visit.type = 'button';
  visit.className = 'v4-visit-entry';
  visit.setAttribute('onclick', 'openColleagueVisitModal()');
  visit.textContent = '參觀同事主城 ›';
  title.appendChild(visit);
  // 目前隊伍（主城站位）：點頭像設為隊長；在名冊或角色詳情按「攜帶」加入
  const team = document.createElement('div');
  team.id = 'v4-team';
  team.className = 'v4-team';
  head.after(team);
  // 版面：召喚祭壇 → 三入口 → 夥伴名冊 → 典藏館／分店日常（原本上方的編隊縮圖區隱藏）
  document.getElementById('v4-party')?.classList.add('v4-hidden-section');
  document.getElementById('v4-altar-links')?.after(panel);

  // 既有典藏館輪播與分店日常：收進可展開區（節點本身不變）
  const carousel = document.getElementById('ip-carousel');
  if (carousel && !carousel.closest('#v4-gallery')) {
    const details = document.createElement('details');
    details.id = 'v4-gallery';
    details.innerHTML = '<summary><b class="v4-serif">IP 典藏館</b><small>輪播展示・造型衣櫃</small></summary>';
    carousel.before(details);
    details.appendChild(carousel);
    details.addEventListener('toggle', () => { if (details.open && typeof renderCabinetCarousel === 'function') renderCabinetCarousel(); });
  }
}

function v4DecorateRoster() {
  const grid = document.getElementById('warehouse-grid');
  if (!grid) return;
  const filter = v4Safe(() => currentWarehouseFilter, 'all');
  document.querySelectorAll('#v4-roster-filters button').forEach(btn => btn.setAttribute('aria-pressed', String(btn.getAttribute('onclick') === `filterWarehouse('${filter}')`)));
  grid.classList.add('v4-roster-cards');
  for (const card of grid.children) {
    const opener = card.querySelector('[onclick^="openFigurineDetailModal"]');
    const upgrade = card.querySelector('[onclick^="upgradeFigurineStars"]');
    const id = (opener?.getAttribute('onclick').match(/'([^']+)'/) || [])[1];
    if (!id || card.classList.contains('v4-rcard')) continue;
    const info = v4FigInfo(id);
    const item = v4Safe(() => userWarehouse.find(w => w.id === id), null);
    const fig = v4Safe(() => executiveFigurineDatabase[id], {});
    if (!info || !item) continue;
    const founder = fig.familyRole === 'founder';
    const canUpgrade = !!upgrade && !upgrade.disabled;
    const inParty = v4PartyGet().includes(id);
    card.dataset.v4Id = id;
    card.className = `v4-rcard r-${info.rarity.toLowerCase()} ${canUpgrade ? 'can-upgrade' : ''} ${inParty ? 'in-party' : ''}`;
    card.innerHTML = `<button type="button" class="v4-rcard-art" onclick="openFigurineDetailModal('${id}')" aria-label="查看 ${v4Esc(info.name)}">
        ${v4FigArtHTML(id)}<span class="v4-rarity-tag v4-en">${info.rarity}</span>${inParty ? '<span class="v4-carry-tag">隊伍中</span>' : ''}</button>
      <div class="v4-rcard-name"><b class="v4-serif">${v4Esc(info.name)}</b><span class="v4-stars">${'★'.repeat(item.stars)}<i>${'★'.repeat(Math.max(0, info.maxStars - item.stars))}</i></span></div>
      ${founder ? `<p class="v4-rcard-note">持有 ${item.copies ?? 1} 張・融合素材</p>`
        : `<div class="v4-rcard-frag"><span aria-hidden="true">💎</span><div class="v4-frag-bar"><i style="width:${Math.min(100, item.fragments / 5 * 100)}%"></i></div><span class="v4-en">${item.fragments}/5</span></div>`}
      <div class="v4-rcard-actions">
        ${canUpgrade ? `<button type="button" class="v4-btn-gold v4-rcard-up" onclick="upgradeFigurineStars('${id}')">升星 ★</button>` : ''}
      </div>
      ${!canUpgrade && item.stars >= info.maxStars && !founder ? '<p class="v4-rcard-note">已達最高星等</p>' : ''}`;
  }
  v4RenderTeam();
}

/* ---------- 攜帶夥伴（主城站位，最多 3 位） ---------- */
function v4RenderTeam() {
  const team = document.getElementById('v4-team');
  if (!team) return;
  const party = v4PartyGet();
  const slots = [0, 1, 2].map(i => {
    const id = party[i];
    const info = id ? v4FigInfo(id) : null;
    return id ? `<button type="button" class="v4-team-slot ${i === 0 ? 'is-captain' : ''}" onclick="v4SetCaptain('${id}')" aria-label="${v4Esc(info?.name || '')}${i === 0 ? '（隊長）' : '，設為隊長'}">
        ${v4FigArtHTML(id)}<b>${i === 0 ? '隊長' : v4Esc(info?.name || '')}</b></button>`
      : '<span class="v4-team-slot is-empty"><i>＋</i><b>空位</b></span>';
  }).join('');
  team.innerHTML = `<div class="v4-team-head"><b class="v4-serif">攜帶中 ${party.length}/3</b><small>點名冊角色→攜帶／卸下・點頭像設為隊長</small></div><div class="v4-team-slots">${slots}</div>`;
}
function v4ToggleCarry(id) {
  const party = [...v4PartyGet()];
  const info = v4FigInfo(id);
  const name = info?.name || '夥伴';
  if (party.includes(id)) {
    if (party.length <= 1) { showCustomToast('至少要攜帶 1 位夥伴喔！', '⚠️'); return; }
    v4PartySet(party.filter(x => x !== id));
    showCustomToast(`${name} 回到名冊休息`, '🏠');
  } else {
    if (party.length >= 3) { showCustomToast('隊伍已滿（3/3），請先卸下一位', '⚠️'); return; }
    v4PartySet([...party, id]);
    showCustomToast(`${name} 加入隊伍，會在主城陪你！`, '⚔️');
  }
  v4RefreshCarry();
}
function v4SetCaptain(id) {
  const party = v4PartyGet();
  if (party[0] === id) return;
  v4PartySet([id, ...party.filter(x => x !== id)]);
  showCustomToast(`${v4FigInfo(id)?.name || '夥伴'} 擔任隊長！`, '👑');
  v4RefreshCarry();
}
function v4RefreshCarry() {
  document.querySelectorAll('#warehouse-grid .v4-rcard').forEach(c => c.classList.remove('v4-rcard'));
  v4DecorateRoster();
  v4DecorateDetailCarry();
  if (typeof v4RenderParty === 'function') v4RenderParty();
}
// 角色詳情 Modal：加「攜帶到主城／卸下」
let v4DetailId = null;
function v4DecorateDetailCarry(id = v4DetailId) {
  const panel = document.getElementById('modal-figurine-detail')?.firstElementChild;
  if (!panel || !id) return;
  v4DetailId = id;
  panel.querySelector('.v4-detail-carry')?.remove();
  const owned = v4Safe(() => userWarehouse.some(w => w.id === id), false);
  if (!owned) return;
  const inParty = v4PartyGet().includes(id);
  const row = document.createElement('div');
  row.className = 'v4-detail-carry';
  row.innerHTML = `<button type="button" class="${inParty ? 'v4-btn-ghost' : 'v4-btn-teal'}" onclick="v4ToggleCarry('${id}')">${inParty ? '從隊伍卸下' : '⚔ 攜帶到主城'}</button>${inParty && v4PartyGet()[0] !== id ? `<button type="button" class="v4-btn-gold" onclick="v4SetCaptain('${id}')">設為隊長</button>` : ''}`;
  const name = document.getElementById('fig-detail-name')?.parentElement;
  (name || panel.firstElementChild).after(row);
}

/* ---------- 參觀同事主城（5-8） ---------- */
let v4VisitLiked = false;
function v4BuildVisit() {
  if (document.getElementById('v4-visit')) return;
  const visit = document.createElement('section');
  visit.id = 'v4-visit';
  visit.hidden = true;
  visit.setAttribute('aria-label', '參觀同事主城');
  const c = V4_COLLEAGUE;
  visit.innerHTML = `${v4Skyline()}
    <div class="v4-visit-head"><button type="button" class="v4-back" onclick="v4CloseVisit()" aria-label="離開同事主城">‹</button>
      <div><small class="v4-en">VISITING</small><b class="v4-serif">${c.branch}・${c.name}的主城</b></div><span class="v4-visit-title">${c.title}</span></div>
    <div class="v4-stage">
      <div class="v4-stage-glow"></div>
      <img class="v4-mate v4-mate-l" src="${v4FigArt(c.mates[0])}" alt="夥伴">
      <img class="v4-mate v4-mate-r" src="${v4FigArt(c.mates[1])}" alt="夥伴">
      <img class="v4-hero" src="${v4ClassArt(c.classCode)}" alt="${c.name}的角色">
      <div class="v4-bubble v4-parch">歡迎來${c.name}的主城！</div>
    </div>
    <div class="v4-ribbon">${v4ClassOf(c.classCode).name}・${c.name}</div>
    <div class="v4-lobby-floor"><div class="v4-lobby-bottom">
      <div class="v4-visit-hearts"><span aria-hidden="true">♥</span><b class="v4-en" id="v4-visit-hearts">${c.hearts}</b><small>本週人氣</small>
        <button type="button" class="v4-visit-cabinet" onclick="v4OpenColleagueCabinet()">看展示櫃</button></div>
      <button type="button" class="v4-btn-red v4-like" id="v4-visit-like" onclick="v4LikeColleague()">♥ 點讚</button>
    </div></div>`;
  document.getElementById('app-shell').appendChild(visit);
}
function v4OpenVisit() {
  v4BuildVisit();
  document.getElementById('v4-visit').hidden = false;
  document.getElementById('app-shell').classList.add('v4-visiting');
}
function v4CloseVisit() {
  const visit = document.getElementById('v4-visit');
  if (visit) visit.hidden = true;
  document.getElementById('app-shell').classList.remove('v4-visiting');
}
function v4OpenColleagueCabinet() {
  if (typeof renderColleagueCabinet === 'function') renderColleagueCabinet();
  openModal('modal-colleague-visit');
}
function v4LikeColleague() {
  likeColleagueCabinet(); // 既有：送愛心 Toast
  if (!v4VisitLiked) {
    v4VisitLiked = true;
    document.getElementById('v4-visit-hearts').textContent = V4_COLLEAGUE.hearts + 1;
    document.getElementById('v4-visit-like').textContent = '♥ 已點讚';
  }
}

/* ---------- 啟動與包裝 ---------- */
v4BuildAltar();
v4BuildRoster();
for (const id of V4_DARK_MODALS) document.getElementById(id)?.firstElementChild?.classList.add('v4-darkify');

window.addEventListener('DOMContentLoaded', () => {
  const originalPool = switchGachaPool;
  switchGachaPool = function (...args) { const r = originalPool.apply(this, args); v4RenderAltar(); return r; };
  const originalCurrency = updateCurrencyUI;
  updateCurrencyUI = function (...args) { const r = originalCurrency.apply(this, args); v4RenderAltar(); return r; };
  const originalWarehouse = renderWarehouseUI;
  renderWarehouseUI = function (...args) { const r = originalWarehouse.apply(this, args); v4DecorateRoster(); return r; };
  openColleagueVisitModal = function () { v4OpenVisit(); };
  const originalDetail = openFigurineDetailModal;
  openFigurineDetailModal = function (figId, ...rest) { const r = originalDetail.call(this, figId, ...rest); v4DecorateDetailCarry(figId); return r; };
  const originalSwitchTab = switchTab;
  switchTab = function (tabId, ...rest) {
    v4CloseVisit();
    const r = originalSwitchTab.call(this, tabId, ...rest);
    if (tabId === 'tab-showcase') { v4RenderAltar(); v4DecorateRoster(); }
    return r;
  };
  v4RenderAltar();
  v4DecorateRoster();
});
