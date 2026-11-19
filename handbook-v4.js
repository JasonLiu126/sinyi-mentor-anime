/* =========================================================
   V4 角色頁（#tab-handbook）：角色立繪、六角雷達、三格等級、裝備欄、天賦樹
   - 分數與等級沿用 handbookDatabase / calculateLevelFromScore，只重畫外觀。
   - 天賦點、點天賦、真的換裝屬於 P2，這裡不實作。
   ========================================================= */

// 雷達六軸：[顯示名, 分類, 技能 key]
const V4_RADAR_AXES = [
  ['稅務', 'hard_know', 'tax'],
  ['貸款', 'hard_know', 'mortgage'],
  ['契據', 'hard_know', 'contract'],
  ['地緣深耕', 'soft_dev', 'dev_local'],
  ['踩線', 'soft_dev', 'dev_track'],
  ['人脈', 'soft_dev', 'dev_resource']
];
const V4_OUTFITS = { A: '刺客斗篷', B: '法師長袍', C: '詩人披風', D: '召喚師法衣', E: '鍊金圍裙', F: '遊俠皮甲' };
const V4_HB_GROUP = { hard: 'hard_know', dev: 'soft_dev', sal: 'soft_sal' };
let v4HandbookTab = 'hard';

function v4Skill(groupKey, key) {
  return v4Safe(() => handbookDatabase[groupKey].items.find(i => i.key === key), null);
}
// 數值＝技能 EXP ÷ 該級上限（Lv.n 上限 n×50）
function v4SkillRatio(item) {
  if (!item) return 0;
  const lv = calculateLevelFromScore(item.score);
  return Math.max(0.04, Math.min(1, item.score / (lv * 50)));
}
function v4GroupLevel(groupKey) {
  const total = v4Safe(() => handbookDatabase[groupKey].items.reduce((s, i) => s + i.score, 0), 0);
  return calculateLevelFromScore(total);
}

// 雷達分類：綜合（上方六軸）／專業／開發／銷售（各分類全部技能）
const V4_RADAR_SHORT = { market: '行情', law: '法規', dev_resource: '資源盤點', sal_resource: '資源盤點' };
let v4RadarCat = 'all';
function v4RadarAxes(cat) {
  if (cat === 'all' || !V4_HB_GROUP[cat]) return V4_RADAR_AXES;
  const group = V4_HB_GROUP[cat];
  return v4Safe(() => handbookDatabase[group].items, []).map(item => [V4_RADAR_SHORT[item.key] || item.name, group, item.key]);
}
function v4RadarSVG(cat = 'all') {
  const axes = v4RadarAxes(cat);
  const n = Math.max(3, axes.length);
  const cx = 110, cy = 110, r = 80;
  const point = (i, k) => {
    const a = -Math.PI / 2 + i * (Math.PI * 2 / n);
    return [cx + Math.cos(a) * r * k, cy + Math.sin(a) * r * k];
  };
  const ring = k => axes.map((_, i) => point(i, k).map(n => n.toFixed(1)).join(',')).join(' ');
  const values = axes.map(([, g, key]) => v4SkillRatio(v4Skill(g, key)));
  const shape = values.map((v, i) => point(i, v).map(n => n.toFixed(1)).join(',')).join(' ');
  const V4_RADAR_AXES_ = axes;
  const labels = V4_RADAR_AXES_.map(([name], i) => {
    const [x, y] = point(i, 1.22);
    return `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="middle">${name}</text>`;
  }).join('');
  const spokes = axes.map((_, i) => { const [x, y] = point(i, 1); return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/>`; }).join('');
  return `<svg class="v4-radar" viewBox="-14 -6 248 232" role="img" aria-label="能力雷達：${axes.map(([n], i) => n + ' ' + Math.round(values[i] * 100) + '%').join('、')}">
    <g class="v4-radar-grid"><polygon points="${ring(1)}"/><polygon points="${ring(0.66)}"/><polygon points="${ring(0.33)}"/>${spokes}</g>
    <polygon class="v4-radar-shape" points="${shape}"/>${labels}</svg>`;
}

function v4BuildHandbook() {
  const tab = document.getElementById('tab-handbook');
  if (!tab || document.getElementById('v4-hero-card')) return;
  tab.firstElementChild?.classList.add('v4-old-hb-summary');
  const hero = document.createElement('section');
  hero.id = 'v4-hero-card';
  hero.className = 'v4-hero-card v4-frame';
  const gear = document.createElement('div');
  gear.id = 'v4-gear';
  gear.className = 'v4-gear';
  tab.prepend(hero, gear);
  const tabs = document.getElementById('hb-btn-hard')?.parentElement;
  if (tabs) tabs.id = 'v4-hb-tabs';
  const labels = { hard: '專業天賦', dev: '開發天賦', sal: '銷售天賦' };
  for (const [k, v] of Object.entries(labels)) {
    const b = document.getElementById('hb-btn-' + k);
    if (!b) continue;
    b.textContent = v;
    // 點下方天賦分頁時，上方雷達也切到同一分類
    b.addEventListener('click', () => { v4RadarCat = k; v4RenderHandbook(); });
  }
  const tree = document.createElement('section');
  tree.id = 'v4-talent-tree';
  document.getElementById('handbook-items-list')?.before(tree);
}

function v4RenderHandbook() {
  const hero = document.getElementById('v4-hero-card');
  if (!hero) return;
  const code = v4DevCode();
  const cls = v4ClassOf(code);
  const player = v4Player();
  const lv = { hard: v4GroupLevel('hard_know'), dev: v4GroupLevel('soft_dev'), sal: v4GroupLevel('soft_sal') };
  hero.innerHTML = `<div class="v4-hero-rays" aria-hidden="true"></div>
    <img class="v4-hero-art" src="${v4ClassArt(code)}" alt="${cls.name}">
    <span class="v4-hero-name v4-serif">Lv.${player.level} ${cls.name}</span>
    ${v4RadarSVG(v4RadarCat)}
    <div class="v4-hero-levels" role="group" aria-label="切換雷達：綜合、專業、開發、銷售">
      <button type="button" class="is-all" aria-pressed="${v4RadarCat === 'all'}" onclick="v4SetRadar('all')"><b class="v4-serif">綜合</b><span>能力</span></button>
      <button type="button" class="is-hard" aria-pressed="${v4RadarCat === 'hard'}" onclick="v4SetRadar('hard')"><b class="v4-serif">Lv${lv.hard}</b><span>專業</span></button>
      <button type="button" class="is-dev" aria-pressed="${v4RadarCat === 'dev'}" onclick="v4SetRadar('dev')"><b class="v4-serif">Lv${lv.dev}</b><span>開發</span></button>
      <button type="button" class="is-sal" aria-pressed="${v4RadarCat === 'sal'}" onclick="v4SetRadar('sal')"><b class="v4-serif">Lv${lv.sal}</b><span>銷售</span></button>
    </div>`;
  const partyCount = v4Safe(() => v4PartyGet().length, 0);
  const title = player.level >= 10 ? '王牌' : player.level >= 5 ? '新銳' : '新星';
  document.getElementById('v4-gear').innerHTML = `
    <div class="v4-gear-slot"><span aria-hidden="true">🛡</span><b>${V4_OUTFITS[code] || '冒險披風'}</b></div>
    <div class="v4-gear-slot"><span aria-hidden="true">👑</span><b>稱號：${title}</b></div>
    <div class="v4-gear-slot"><span aria-hidden="true">👥</span><b>夥伴 ×${partyCount}</b></div>
    <div class="v4-gear-slot is-locked"><span aria-hidden="true">🔒</span><b>Lv.5 解鎖</b></div>`;
}

// 切換雷達分類；選專業／開發／銷售時，下方天賦分頁也一起切過去
function v4SetRadar(cat) {
  v4RadarCat = cat;
  v4RenderHandbook();
  if (cat !== 'all' && typeof switchHandbookTab === 'function') switchHandbookTab(cat);
}

// 天賦樹：第一個技能為根，其餘為分支；有分數的節點亮起並與根連線
function v4RenderTalents(cat) {
  v4HandbookTab = cat;
  ['hard', 'dev', 'sal'].forEach(k => document.getElementById('hb-btn-' + k)?.setAttribute('aria-pressed', String(k === cat)));
  const groupKey = V4_HB_GROUP[cat];
  const items = v4Safe(() => handbookDatabase[groupKey].items, []);
  const tree = document.getElementById('v4-talent-tree');
  const list = document.getElementById('handbook-items-list');
  if (!tree || !list) return;

  if (cat === 'hard') {
    tree.innerHTML = '';
    tree.hidden = true;
  } else {
    tree.hidden = false;
    const [root, ...branches] = items;
    const lit = item => item && item.score > 0;
    const node = (item, x, y) => `<div class="v4-node ${lit(item) ? 'is-lit' : ''}" style="left:${x}%;top:${y}%">
        <span class="v4-diamond v4-serif">${lit(item) ? 'Lv' + calculateLevelFromScore(item.score) : '0'}</span><b>${v4Esc(item.name)}</b></div>`;
    const xs = branches.map((_, i) => branches.length === 1 ? 50 : 14 + i * (72 / (branches.length - 1)));
    const lines = branches.map((b, i) => `<line x1="50" y1="24" x2="${xs[i]}" y2="70" class="${lit(root) && lit(b) ? 'is-lit' : ''}"/>`).join('');
    tree.innerHTML = `<div class="v4-section-head"><h3 class="v4-serif">${cat === 'dev' ? '開發' : '銷售'}天賦樹</h3><span>點亮更多技能</span></div>
      <div class="v4-tree v4-frame"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${lines}</svg>
      ${root ? node(root, 50, 24) : ''}${branches.map((b, i) => node(b, xs[i], 70)).join('')}</div>`;
  }

  list.innerHTML = items.map(item => {
    const level = calculateLevelFromScore(item.score);
    const cap = level * 50;
    const pct = Math.min(100, Math.round(((item.score % 50) / 50) * 100));
    return `<div class="v4-skill"><span class="v4-diamond v4-serif">Lv${level}</span>
      <div class="v4-skill-body"><div><b class="v4-serif">${v4Esc(item.name)}</b><span class="v4-en">${item.score}/${cap}</span></div>
      <div class="v4-expbar"><i style="width:${pct}%"></i></div><p>${v4Esc(item.desc)}</p></div></div>`;
  }).join('');
}

v4BuildHandbook();

window.addEventListener('DOMContentLoaded', () => {
  const originalRender = renderHandbookUI;
  renderHandbookUI = function (...args) {
    const result = originalRender.apply(this, args);
    v4RenderHandbook();
    return result;
  };
  const originalTab = switchHandbookTab;
  switchHandbookTab = function (cat, ...rest) {
    const result = originalTab.call(this, cat, ...rest);
    v4RenderTalents(cat);
    return result;
  };
  const originalSwitchTab = switchTab;
  switchTab = function (tabId, ...rest) {
    const result = originalSwitchTab.call(this, tabId, ...rest);
    if (tabId === 'tab-handbook') { v4RenderHandbook(); v4RenderTalents(v4HandbookTab); }
    return result;
  };
  v4RenderHandbook();
  v4RenderTalents('hard');
});
