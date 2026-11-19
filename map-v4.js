/* =========================================================
   V4 冒險地圖（#tab-map）＋探索副本（#building-detail-panel）
   - 地圖：舊的地圖舞台保留在 DOM（隱藏），新舞台的六角地標仍呼叫 selectMapBuilding。
   - 探索副本：既有 9 欄勘查表單（formal-local.js）原封不動，外面加「情報拼圖」：
     點碎片 → 數字鍵盤／文字框寫回原本的 input，並觸發原本的 input 事件；
     暫存／送審／核可／領獎仍由原本的表單與按鈕處理。
   ========================================================= */

// 地圖版面設定（百分比座標）；stars＝難度星等（顯示用）
const V4_MAP_LAYOUT = {
  b1: { x: 46, y: 36, stars: 2 },
  b2: { x: 72, y: 28, stars: 3 },
  b3: { x: 18, y: 22, stars: 1 }
};
const V4_MAP_DECOR = [
  { kind: 'base', x: 23, y: 55, label: '分店據點' },
  { kind: 'fog', x: 78, y: 62, label: '未探索' },
  { kind: 'fog', x: 14, y: 84, label: '未探索' }
];
const V4_PLAYER_POS = { x: 30, y: 80 };
// 情報拼圖：9 塊碎片＝既有 9 欄（順序＝3×3 由左上到右下）
const V4_PIECES = [
  { key: 'age', label: '屋齡', unit: '年', numeric: true },
  { key: 'units', label: '總戶數', unit: '戶', numeric: true },
  { key: 'fee', label: '管理費', unit: '元/坪', numeric: true },
  { key: 'ratio', label: '公設比', unit: '%', numeric: true },
  { key: 'floorsUp', label: '地上', full: '地上樓層', unit: '層', numeric: true },
  { key: 'floorsDown', label: '地下', full: '地下樓層', unit: '層', numeric: true },
  { key: 'type', label: '建築型態', numeric: false },
  { key: 'management', label: '物業管理', numeric: false },
  { key: 'observation', label: '現場觀察', numeric: false }
];
const V4_HEX = 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)';
const V4_CASTLE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 21 V9 H7 V6 H10 V9 H14 V6 H17 V9 H20 V21 Z"/><path d="M10 21 V16 A2 2 0 0 1 14 16 V21"/></svg>';

let v4ActivePiece = null;

/* ---------- 讀取既有資料 ---------- */
function v4Records() { return v4Safe(() => localRecords, []); }
function v4RecordOf(id) { return v4Records().find(r => r.building === id) || null; }
function v4SurveyMission() { return v4Safe(() => routeTasksData.dev.slots.find(s => s.type === 'navigate_map'), null); }
function v4BuildingIds() { return v4Safe(() => Object.keys(buildingDatabase), []); }
function v4ExploreRate() {
  const ids = v4BuildingIds();
  const approved = ids.filter(id => v4RecordOf(id)?.status === 'approved').length;
  return { approved, total: ids.length, pct: ids.length ? Math.round(approved / ids.length * 100) : 0 };
}
function v4BuildingState(id) {
  const record = v4RecordOf(id);
  if (record?.status === 'approved') return 'explored';
  if (v4TargetBuilding()?.id === id) return 'target';
  return 'open';
}
function v4Stars(n, max = 3) { return '★'.repeat(n) + `<i>${'★'.repeat(Math.max(0, max - n))}</i>`; }

/* ---------- 地圖 ---------- */
function v4MapBackground() {
  return `<svg class="v4-map-bg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
    <defs><radialGradient id="v4-fog" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#2A2420" stop-opacity="0.85"/><stop offset="1" stop-color="#2A2420" stop-opacity="0"/></radialGradient></defs>
    <rect width="100" height="100" fill="#E6D3A8"/>
    <path d="M0 15 L100 92" stroke="#CDB58A" stroke-width="4"/>
    <rect x="37" y="0" width="5" height="100" fill="#CDB58A"/>
    <rect x="0" y="62" width="100" height="4" fill="#CDB58A"/>
    <ellipse cx="74" cy="34" rx="11" ry="7" fill="#B7C28E" opacity="0.8"/>
    <ellipse cx="22" cy="72" rx="14" ry="9" fill="#B7C28E" opacity="0.8"/>
    <ellipse cx="8" cy="8" rx="30" ry="14" fill="url(#v4-fog)"/>
    <ellipse cx="96" cy="10" rx="28" ry="16" fill="url(#v4-fog)"/>
    <ellipse cx="88" cy="64" rx="26" ry="18" fill="url(#v4-fog)"/>
    <ellipse cx="6" cy="92" rx="30" ry="14" fill="url(#v4-fog)"/>
    <ellipse cx="100" cy="100" rx="30" ry="16" fill="url(#v4-fog)"/>
  </svg>`;
}

function v4BuildMap() {
  const tab = document.getElementById('tab-map');
  if (!tab || document.getElementById('v4-map-stage')) return;
  const oldStage = tab.querySelector('[onclick="selectMapBuilding(\'b1\')"]')?.closest('.relative');
  if (oldStage) oldStage.classList.add('v4-old-stage');
  [...tab.children].find(el => el.textContent.includes('物件狀態：'))?.classList.add('v4-old-legend');

  const region = document.createElement('div');
  region.id = 'v4-region';
  region.className = 'v4-region';
  region.innerHTML = `<div><small class="v4-en">REGION · XINYI</small><b class="v4-serif">松智生活圈</b></div>
    <div class="v4-region-rate"><span>探索度</span><b class="v4-en" id="v4-explore-pct">0%</b><div class="v4-expbar"><i id="v4-explore-bar"></i></div></div>`;
  const stage = document.createElement('div');
  stage.id = 'v4-map-stage';
  stage.className = 'v4-map-stage';
  const card = document.createElement('div');
  card.id = 'v4-map-card';
  card.className = 'v4-map-card v4-frame';
  (oldStage || tab.firstElementChild).before(region, stage, card);

  const panel = document.getElementById('building-detail-panel');
  if (panel && !document.getElementById('v4-explore-head')) {
    const head = document.createElement('div');
    head.id = 'v4-explore-head';
    head.innerHTML = `<button type="button" class="v4-back" onclick="v4ExitExplore()" aria-label="回到冒險地圖">‹</button>
      <div class="v4-explore-title"><small class="v4-en" id="v4-explore-kicker">EXPLORING</small><b class="v4-serif" id="v4-explore-name">—</b></div>
      <div class="v4-explore-count"><b class="v4-en" id="v4-explore-count">0</b><span class="v4-en">/ 9</span><small>碎片</small></div>`;
    panel.prepend(head);
    panel.children[1]?.classList.add('v4-old-detail-head');
    const tabs = document.getElementById('bsub-tab-summary')?.parentElement;
    if (tabs) tabs.id = 'v4-bsub-tabs';
    const names = { summary: '情報拼圖', trends: '行情走勢', specs: '社區詳情', listings: '目標物件' };
    for (const [key, name] of Object.entries(names)) {
      const btn = document.getElementById('bsub-tab-' + key);
      if (btn) btn.textContent = name;
    }
  }
}

function v4RenderMap() {
  const stage = document.getElementById('v4-map-stage');
  if (!stage) return;
  const rate = v4ExploreRate();
  document.getElementById('v4-explore-pct').textContent = rate.pct + '%';
  document.getElementById('v4-explore-bar').style.width = rate.pct + '%';

  const selected = v4Safe(() => currentSelectedBuildingId, null);
  const target = v4TargetBuilding();
  const targetPos = target && V4_MAP_LAYOUT[target.id];
  const path = targetPos
    ? `<svg class="v4-map-path" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M${V4_PLAYER_POS.x} ${V4_PLAYER_POS.y} Q ${(V4_PLAYER_POS.x + targetPos.x) / 2 + 14} ${(V4_PLAYER_POS.y + targetPos.y) / 2} ${targetPos.x} ${targetPos.y + 6}" fill="none" stroke="#B8472F" stroke-width="0.8" stroke-dasharray="2 1.6" vector-effect="non-scaling-stroke"/></svg>`
    : '';
  const markers = v4BuildingIds().map(id => {
    const pos = V4_MAP_LAYOUT[id] || { x: 50, y: 50 };
    const state = v4BuildingState(id);
    const name = v4Safe(() => buildingDatabase[id].name, id);
    return `<button type="button" class="v4-hex is-${state} ${id === selected ? 'is-selected' : ''}" style="left:${pos.x}%;top:${pos.y}%"
      onclick="selectMapBuilding('${id}')" aria-label="${v4Esc(name)}（${{ explored: '已探索', target: '任務目標', open: '可探索' }[state]}）" aria-pressed="${id === selected}">
      ${state === 'target' ? '<span class="v4-hex-alert" aria-hidden="true">!</span>' : ''}
      <span class="v4-hex-shape">${V4_CASTLE}</span><span class="v4-hex-label">${v4Esc(name)}</span></button>`;
  }).join('');
  const decor = V4_MAP_DECOR.map(d => `<div class="v4-hex is-${d.kind}" style="left:${d.x}%;top:${d.y}%" aria-hidden="true">
      <span class="v4-hex-shape">${d.kind === 'fog' ? '🔒' : V4_CASTLE}</span><span class="v4-hex-label">${d.label}</span></div>`).join('');
  const avatar = `<div class="v4-map-player" style="left:${V4_PLAYER_POS.x}%;top:${V4_PLAYER_POS.y}%;background-image:url('${v4ClassArt(v4DevCode())}')" aria-hidden="true"></div>`;
  stage.innerHTML = v4MapBackground() + path + decor + markers + avatar;
  v4RenderMapCard();
}

function v4RenderMapCard() {
  const card = document.getElementById('v4-map-card');
  const id = v4Safe(() => currentSelectedBuildingId, null);
  const b = v4Safe(() => buildingDatabase[id], null);
  if (!card || !b) return;
  const state = v4BuildingState(id);
  const record = v4RecordOf(id);
  const counts = {};
  for (const l of b.listings || []) counts[l.statusName] = (counts[l.statusName] || 0) + 1;
  const tagClass = { '可售': 'g', '潛案': 'y', '逾案': 'n', '開發機會': 'r' };
  const mission = v4SurveyMission();
  const reward = mission && !mission.isCompleted ? mission : null;
  const statusText = record ? { pending: '鑑定中', approved: '已探索', returned: '待補正' }[record.status] : { target: '任務目標', open: '可探索' }[state];
  card.innerHTML = `<div class="v4-map-card-top">
      <span class="v4-hex-shape is-${state}">${V4_CASTLE}</span>
      <div><b class="v4-serif">${v4Esc(b.name)} <span class="v4-stars">${v4Stars(V4_MAP_LAYOUT[id]?.stars || 1)}</span></b>
      <div class="v4-tags"><span class="v4-tag is-status">${statusText}</span>${Object.entries(counts).map(([name, n]) => `<span class="v4-tag t-${tagClass[name] || 'n'}">${v4Esc(name)} ${n}</span>`).join('')}</div></div></div>
    <div class="v4-drops"><span>掉落</span>${reward ? `<em class="v4-en">☆ +${reward.rewardExp || 20}</em><em class="v4-en">🪙 +${reward.rewardCoins || 150}</em>` : ''}<em class="v4-en">🧩 ×9</em></div>
    <button type="button" class="v4-btn-gold v4-enter" onclick="v4EnterExplore()">${state === 'explored' ? '查看情報' : '進入探索'}</button>`;
}

/* ---------- 探索副本 ---------- */
function v4EnterExplore() {
  const tab = document.getElementById('tab-map');
  tab?.classList.add('v4-exploring');
  if (typeof switchBuildingSubtab === 'function') switchBuildingSubtab('summary');
  document.getElementById('app-main-scroll')?.scrollTo({ top: 0 });
  v4RenderExploreHead();
}
function v4ExitExplore() {
  document.getElementById('tab-map')?.classList.remove('v4-exploring');
  v4RenderMap();
  document.getElementById('app-main-scroll')?.scrollTo({ top: 0 });
}

function v4SurveyValues() {
  const panel = document.getElementById('community-survey');
  const form = panel?.querySelector('form');
  if (form) return Object.fromEntries(V4_PIECES.map(p => [p.key, form.elements[p.key]?.value ?? '']));
  const record = v4RecordOf(v4Safe(() => currentSelectedBuildingId, null));
  return Object.fromEntries(V4_PIECES.map(p => [p.key, record?.fields?.[p.key] ?? '']));
}
function v4PieceCount(values = v4SurveyValues()) { return V4_PIECES.filter(p => String(values[p.key] || '').trim()).length; }

function v4RenderExploreHead() {
  const id = v4Safe(() => currentSelectedBuildingId, null);
  const b = v4Safe(() => buildingDatabase[id], null);
  if (!b || !document.getElementById('v4-explore-head')) return;
  const record = v4RecordOf(id);
  document.getElementById('v4-explore-kicker').textContent = record?.status === 'approved' ? 'CLEARED' : 'EXPLORING';
  document.getElementById('v4-explore-name').textContent = b.name;
  document.getElementById('v4-explore-count').textContent = v4PieceCount();
}

function v4PuzzleArt() {
  let windows = '';
  for (let r = 0; r < 7; r++) for (let c = 0; c < 4; c++) windows += `<rect x="${118 + c * 33}" y="${50 + r * 21}" width="22" height="12" fill="${(r * 3 + c) % 3 ? '#FFC56B' : '#4A3F6B'}"/>`;
  let side = '';
  for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) side += `<rect x="${32 + c * 24}" y="${118 + r * 18}" width="13" height="9" fill="#FFC56B"/>`;
  return `<svg class="v4-puzzle-art" viewBox="0 0 360 225" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <rect width="360" height="225" fill="#2C2350"/><ellipse cx="292" cy="38" rx="24" ry="16" fill="#E6D3A8"/>
    <rect x="100" y="30" width="152" height="195" fill="#C9A06E"/><rect x="100" y="30" width="152" height="10" fill="#9E7A4E"/>${windows}
    <rect x="160" y="196" width="34" height="29" fill="#5A3E2B"/>
    <rect x="22" y="105" width="70" height="120" fill="#B48F62"/>${side}
    <rect x="268" y="85" width="72" height="140" fill="#A88A62"/>
    <ellipse cx="62" cy="222" rx="44" ry="8" fill="#3E7A3E"/><ellipse cx="320" cy="222" rx="30" ry="7" fill="#3E7A3E"/></svg>`;
}

function v4PieceText(piece, value) {
  const v = String(value || '').trim();
  if (!v) return '';
  if (piece.numeric) return `${piece.label} ${v}${piece.unit && !v.includes(piece.unit) && /\d$/.test(v) ? ' ' + piece.unit : ''}`;
  return `${piece.label} ✓`;
}

// formal-local 每次重畫勘查面板後，加上 V4 拼圖外觀
function v4DecorateSurvey() {
  const panel = document.getElementById('community-survey');
  if (!panel) { v4RenderExploreHead(); return; }
  const id = v4Safe(() => currentSelectedBuildingId, null);
  const record = v4RecordOf(id);
  const form = panel.querySelector('form');
  const values = v4SurveyValues();
  const count = v4PieceCount(values);
  const status = record?.status || null;
  panel.classList.add('v4-survey');

  // 原本的欄位：可編輯時改由拼圖操作（保留在 DOM，表單送出與驗證照舊）
  panel.querySelectorAll('.fl-survey-grid, .fl-survey-notes').forEach(el => el.classList.add('v4-visually-hidden'));
  panel.querySelector('.fl-survey-banner')?.classList.add('v4-visually-hidden');
  const hint = [...panel.querySelectorAll('form > p')].find(p => p.textContent.includes('可以分次填寫'));
  if (hint) hint.classList.add('v4-visually-hidden');

  if (v4ActivePiece === null) {
    const firstEmpty = V4_PIECES.findIndex(p => !String(values[p.key] || '').trim());
    v4ActivePiece = firstEmpty === -1 ? 0 : firstEmpty;
  }

  const stamp = status === 'pending' ? '<span class="v4-stamp is-red v4-serif">鑑定中</span>'
    : status === 'approved' ? '<span class="v4-stamp is-teal v4-serif">鑑定通過</span>'
    : status === 'returned' ? '<span class="v4-stamp is-red v4-serif">待補正</span>' : '';
  const tiles = V4_PIECES.map((piece, i) => {
    const filled = !!String(values[piece.key] || '').trim();
    const active = form && i === v4ActivePiece;
    return `<button type="button" class="v4-piece ${filled ? 'is-open' : ''} ${active ? 'is-active' : ''}" ${form ? `onclick="v4SelectPiece(${i})"` : 'tabindex="-1"'}
      aria-label="${piece.full || piece.label}${filled ? '：已填' : '：未填'}">
      ${filled ? `<span class="v4-piece-chip">${v4Esc(v4PieceText(piece, values[piece.key]))}</span>` : `<span class="v4-piece-q">?</span><span class="v4-piece-name">${piece.label}</span>`}</button>`;
  }).join('');

  let puzzle = panel.querySelector('.v4-puzzle');
  if (!puzzle) {
    puzzle = document.createElement('div');
    puzzle.className = 'v4-puzzle';
    panel.prepend(puzzle);
  }
  puzzle.classList.toggle('is-cleared', status === 'approved');
  puzzle.innerHTML = `${v4PuzzleArt()}<div class="v4-piece-grid">${tiles}</div>${stamp}`;

  // 鑑定通過：情報摘要＋三格獎勵
  panel.querySelector('.v4-cleared')?.remove();
  if (status === 'approved') {
    const mission = v4SurveyMission();
    const claimable = !!panel.querySelector('[data-claim]');
    const block = document.createElement('div');
    block.className = 'v4-cleared';
    block.innerHTML = `<div class="v4-parch v4-intel">${V4_PIECES.slice(0, 6).map(p => `<div><b class="v4-serif">${v4Esc(values[p.key] || '—')}</b><span>${p.full || p.label}</span></div>`).join('')}
      <p>${v4Esc([values.type, values.management, values.observation].filter(Boolean).join('・'))}</p></div>
      ${claimable && mission ? `<div class="v4-rewards"><div><span>☆</span><b class="v4-en">+${mission.rewardExp || 20}</b></div><div><span>🪙</span><b class="v4-en">+${mission.rewardCoins || 150}</b></div><div><span>🧩</span><b class="v4-en">9/9</b></div></div>` : ''}
      <p class="v4-cleared-note">✦ ${claimable ? '鑑定通過！打開寶箱領取獎勵' : '探索完成！社區全貌已解鎖'}</p>`;
    puzzle.after(block);
    const claim = panel.querySelector('[data-claim]');
    if (claim) { claim.textContent = '開啟寶箱'; claim.classList.add('v4-btn-gold', 'v4-big-btn'); panel.appendChild(claim); }
  }

  // 編輯器（數字鍵盤／文字框）
  panel.querySelector('.v4-editor')?.remove();
  if (form) {
    const piece = V4_PIECES[v4ActivePiece];
    const editor = document.createElement('div');
    editor.className = 'v4-editor v4-frame';
    const value = values[piece.key] || '';
    if (piece.numeric) {
      const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];
      editor.innerHTML = `<div class="v4-editor-row"><label class="v4-serif" for="v4-editor-display">${piece.full || piece.label}</label>
        <output id="v4-editor-display" class="v4-editor-display"><b class="v4-en">${v4Esc(value) || '&nbsp;'}</b><span>${piece.unit || ''}</span></output></div>
        <div class="v4-keypad">${keys.map(k => `<button type="button" onclick="v4KeyPress('${k}')" aria-label="${k === '⌫' ? '刪除' : k}">${k}</button>`).join('')}
        <button type="button" class="v4-key-ok" onclick="v4NextPiece()" aria-label="下一塊">✓ 下一塊</button></div>`;
    } else {
      editor.innerHTML = `<div class="v4-editor-row is-text"><label class="v4-serif" for="v4-editor-text">${piece.full || piece.label}</label>
        <textarea id="v4-editor-text" rows="${piece.key === 'observation' ? 3 : 2}" maxlength="${piece.key === 'observation' ? 500 : 120}" placeholder="${v4Esc(form.elements[piece.key]?.placeholder || '')}">${v4Esc(value)}</textarea></div>
        <button type="button" class="v4-btn-teal v4-key-next" onclick="v4NextPiece()">✓ 下一塊</button>`;
      editor.querySelector('textarea').addEventListener('input', e => v4WritePiece(piece.key, e.target.value, false));
    }
    puzzle.after(editor);

    // 暫存／交給公會長鑑定（原本的兩顆 submit 按鈕）
    const draftBtn = form.querySelector('button[value="draft"]');
    const reviewBtn = form.querySelector('button[value="review"]');
    if (draftBtn) draftBtn.textContent = '暫存';
    if (reviewBtn) reviewBtn.textContent = '交給公會長鑑定';
    form.querySelector('.fl-survey-actions')?.classList.add('v4-survey-actions');
    if (reviewBtn && !reviewBtn.dataset.v4Guard) {
      reviewBtn.dataset.v4Guard = '1';
      // 碎片沒拼完時先擋下（原本會因隱藏欄位的 required 驗證而沒有反應）
      reviewBtn.addEventListener('click', event => {
        const missing = V4_PIECES.findIndex(p => !String(form.elements[p.key]?.value || '').trim());
        if (missing === -1) return;
        event.preventDefault();
        v4ActivePiece = missing;
        showCustomToast(`還差 ${9 - v4PieceCount()} 塊碎片才能交給公會長`, '🧩');
        v4DecorateSurvey();
      }, true);
    }
  }

  panel.querySelector('[data-refresh]')?.replaceChildren('更新鑑定狀態');
  v4WatchDraftToast(panel);
  v4RenderExploreHead();
}

function v4WatchDraftToast(panel) {
  const result = panel.querySelector('.fl-result');
  if (!result || result.dataset.v4Watch) return;
  result.dataset.v4Watch = '1';
  new MutationObserver(() => {
    if (result.textContent.startsWith('草稿已儲存')) showCustomToast(`進度已暫存・${v4PieceCount()} / 9 碎片`, '✦');
  }).observe(result, { childList: true, characterData: true, subtree: true });
}

function v4SelectPiece(i) {
  v4ActivePiece = i;
  const panel = document.getElementById('community-survey');
  if (panel) panel.dataset.v4Touched = '1';
  v4DecorateSurvey();
  (document.getElementById('v4-editor-text') || document.querySelector('.v4-keypad button'))?.focus({ preventScroll: true });
}
function v4NextPiece() {
  const values = v4SurveyValues();
  const order = [...V4_PIECES.keys()];
  const next = order.slice(v4ActivePiece + 1).concat(order.slice(0, v4ActivePiece + 1)).find(i => !String(values[V4_PIECES[i].key] || '').trim());
  v4SelectPiece(next === undefined ? Math.min(v4ActivePiece + 1, 8) : next);
}
// 寫回原本的 input，並觸發原本表單的 input 事件（草稿計數、未儲存提示照舊運作）
function v4WritePiece(key, value, rerender = true) {
  const form = document.querySelector('#community-survey form');
  const field = form?.elements[key];
  if (!field) return;
  field.value = value;
  field.dispatchEvent(new Event('input', { bubbles: true }));
  const panel = document.getElementById('community-survey');
  if (panel) panel.dataset.v4Touched = '1';
  if (rerender) v4DecorateSurvey();
  else {
    // 文字欄位：只更新拼圖與計數，不重建輸入框（避免游標跳掉）
    const piece = V4_PIECES.findIndex(p => p.key === key);
    const tile = document.querySelectorAll('.v4-piece')[piece];
    const filled = !!value.trim();
    if (tile) {
      tile.classList.toggle('is-open', filled);
      tile.innerHTML = filled ? `<span class="v4-piece-chip">${v4Esc(v4PieceText(V4_PIECES[piece], value))}</span>` : `<span class="v4-piece-q">?</span><span class="v4-piece-name">${V4_PIECES[piece].label}</span>`;
    }
    v4RenderExploreHead();
  }
}
function v4KeyPress(key) {
  const piece = V4_PIECES[v4ActivePiece];
  const form = document.querySelector('#community-survey form');
  const current = form?.elements[piece.key]?.value || '';
  let next = current;
  if (key === '⌫') next = current.slice(0, -1);
  else if (key === '.' && current.includes('.')) return;
  else if (current.length < 12) next = current + key;
  v4WritePiece(piece.key, next);
}

/* ---------- 子分頁：行情迷霧、目標物件 ---------- */
function v4DecorateSubtab(tab) {
  ['summary', 'trends', 'specs', 'listings'].forEach(k => document.getElementById('bsub-tab-' + k)?.setAttribute('aria-pressed', String(k === tab)));
  const container = document.getElementById('building-subtab-content');
  if (!container) return;
  if (tab === 'trends' || tab === 'specs') {
    const empty = container.querySelector('.fl-note');
    if (empty && empty.textContent.includes('沒有已核可')) {
      container.innerHTML = `<div class="v4-fog-lock"><span aria-hidden="true">🔒</span><b class="v4-serif">情報被迷霧遮住了</b><p>拼完情報拼圖，交給公會長鑑定通過即可解鎖</p>
        <button type="button" class="v4-btn-gold" onclick="switchBuildingSubtab('summary')">去拼情報拼圖</button></div>`;
    }
  }
  if (tab === 'listings') {
    const difficulty = { green: 1, yellow: 2, gray: 2, red: 3 };
    container.querySelectorAll('button[onclick^="launchRPWithCase"]').forEach(btn => {
      const status = (btn.getAttribute('onclick').match(/'(\w+)'/) || [])[1];
      const card = btn.closest('.lego-card-sm');
      if (!card || card.classList.contains('v4-target')) return;
      card.classList.add('v4-target', 's-' + status);
      card.insertAdjacentHTML('afterbegin', `<span class="v4-hex-shape is-target-icon">${V4_CASTLE}</span>`);
      const stars = document.createElement('span');
      stars.className = 'v4-stars';
      stars.innerHTML = v4Stars(difficulty[status] || 1);
      btn.before(stars);
      btn.textContent = '攻略 ›';
    });
  }
  v4RenderExploreHead();
}

/* ---------- 包裝既有函式（DOMContentLoaded 最後執行＝最外層） ---------- */
v4BuildMap();

window.addEventListener('DOMContentLoaded', () => {
  const originalSelect = selectMapBuilding;
  selectMapBuilding = function (...args) {
    const result = originalSelect.apply(this, args);
    v4ActivePiece = null;
    v4RenderMap();
    return result;
  };
  const originalSubtab = switchBuildingSubtab;
  switchBuildingSubtab = function (tab, ...rest) {
    const result = originalSubtab.call(this, tab, ...rest);
    v4DecorateSubtab(tab);
    return result;
  };
  if (typeof renderCommunityPanel === 'function') {
    const originalPanel = renderCommunityPanel;
    renderCommunityPanel = function (...args) {
      const result = originalPanel.apply(this, args);
      v4DecorateSurvey();
      v4RenderMap();
      return result;
    };
  }
  const originalSwitchTab = switchTab;
  switchTab = function (tabId, ...rest) {
    const result = originalSwitchTab.call(this, tabId, ...rest);
    if (tabId === 'tab-map') {
      document.getElementById('tab-map')?.classList.remove('v4-exploring');
      v4RenderMap();
    }
    return result;
  };
  // 「查看勘查任務」（formal-local 的社區勘查入口）＝進入探索副本
  const surveyEntry = document.querySelector('#building-detail-panel .v4-old-detail-head button');
  surveyEntry?.addEventListener('click', () => {
    document.getElementById('tab-map')?.classList.add('v4-exploring');
    v4RenderExploreHead();
  });
  window.addEventListener('formal-profile-ready', () => { v4RenderMap(); v4DecorateSurvey(); });
  v4RenderMap();
  v4DecorateSurvey();
});
