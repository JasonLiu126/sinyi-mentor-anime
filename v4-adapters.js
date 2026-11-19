/* =========================================================
   V4 adapters：只「讀」既有資料，換算成 V4 畫面要顯示的數值。
   不寫入任何既有狀態，不改計分／審核／存檔邏輯。
   ========================================================= */
const V4_ASSET = './assets/v4/';

// 職業對照（開發與銷售共用代碼 A～F）
const V4_CLASSES = {
  A: { name: '社區開發刺客', art: 'class-assassin.png' },
  B: { name: '商圈法師', art: 'class-mage.png' },
  C: { name: '社群吟遊詩人', art: 'class-bard.png' },
  D: { name: '人脈召喚師', art: 'class-summoner.png' },
  E: { name: '名單鍊金術士', art: 'class-alchemist.png' },
  F: { name: '物件遊俠', art: 'class-ranger.png' }
};

function v4Safe(fn, fallback) {
  try { const value = fn(); return value === undefined || value === null ? fallback : value; } catch { return fallback; }
}

function v4DevCode() {
  return v4Safe(() => (typeof formalActiveDevCode !== 'undefined' && formalActiveDevCode) || currentSelectedDevCode, 'A');
}
function v4SalCode() {
  return v4Safe(() => (typeof formalActiveSalCode !== 'undefined' && formalActiveSalCode) || currentSelectedSalCode, 'E');
}
function v4ClassOf(code) { return V4_CLASSES[code] || V4_CLASSES.A; }
function v4ClassArt(code) { return V4_ASSET + v4ClassOf(code).art; }
function v4OriginalTypeName(code) { return v4Safe(() => devStyleDefinitions[code].name, ''); }

function v4NumberFrom(id, fallback) {
  const text = v4Safe(() => document.getElementById(id).textContent, '');
  const n = parseInt(String(text).replace(/[^\d-]/g, ''), 10);
  return Number.isFinite(n) ? n : fallback;
}

// 玩家：等級／EXP 以既有 header 顯示值為準（addCapabilityExp 寫入），每 60 EXP 一級
function v4Player() {
  const exp = v4NumberFrom('header-user-exp', 0);
  const level = v4NumberFrom('header-user-level', 1);
  return {
    name: v4Safe(() => hunterState.name && hunterState.name !== '新夥伴' ? hunterState.name : '', '') || '新星',
    level,
    exp,
    expPct: Math.round(((exp % 60) / 60) * 100),
    coins: v4Safe(() => userCoins, 0),
    tickets: v4Safe(() => gachaTickets, 0)
  };
}

// 主線：目前路線（預設開發）中標記「主線」的任務
function v4MainQuests(routeKey = 'dev') {
  const slots = v4Safe(() => routeTasksData[routeKey].slots, []);
  return slots.filter(slot => String(slot.tag || '').startsWith('主線'));
}
function v4CurrentMainQuest(routeKey = 'dev') {
  const mains = v4MainQuests(routeKey);
  const current = mains.find(slot => !slot.isCompleted && !slot.isHidden) || null;
  return { current, done: mains.filter(slot => slot.isCompleted).length, total: mains.length };
}

// 目標社區：主線 01 標記的社區 → 目前選中的社區 → 第一個社區
function v4TargetBuilding() {
  return v4Safe(() => {
    const db = buildingDatabase;
    const marked = routeTasksData.dev.slots.find(slot => slot.type === 'navigate_map')?.targetBuildingId;
    const id = (marked && db[marked] && marked) || (currentSelectedBuildingId && db[currentSelectedBuildingId] && currentSelectedBuildingId) || Object.keys(db)[0];
    return id ? { id, name: db[id].name } : null;
  }, null);
}

// 公會長指派中待完成件數（取既有面板顯示值）
function v4ManagerPending() { return v4NumberFrom('mt-pending-count', 0); }

/* ---------- 夥伴（IP 角色） ---------- */
const V4_RARITY_ORDER = { SSR: 3, SR: 2, R: 1, N: 0 };
const V4_FAMILY_ART = { founder_zhou: 'zhou', founder_wang: 'wang', heir_ken: 'ken', heir_howard: 'howard', heir_henry: 'henry' };

function v4FigVisible(id) {
  return v4Safe(() => Object.hasOwn(executiveFigurineDatabase, id) && (typeof isFigurineVisible !== 'function' || isFigurineVisible(id)), false);
}
function v4FigInfo(id) {
  const fig = v4Safe(() => executiveFigurineDatabase[id], null);
  if (!fig) return null;
  const item = v4Safe(() => userWarehouse.find(w => w.id === id), null);
  return { id, name: fig.name, rarity: fig.rarity || 'R', owned: !!item, stars: item ? item.stars : 0, maxStars: fig.maxStars || 5 };
}
// 單張全身圖：托尼／傳承用 assets/v4/ip 去背圖，其餘沿用既有進化圖
function v4FigArt(id) {
  const stars = v4Safe(() => getEquippedFigurineStars(id), 1);
  if (id.startsWith('tony_')) {
    const key = id.slice(5);
    return V4_ASSET + 'ip/' + (key === 'ninja' ? 'ninja' + stars : key + '2') + '.png';
  }
  if (V4_FAMILY_ART[id]) return V4_ASSET + 'ip/' + V4_FAMILY_ART[id] + '.png';
  const evo = v4Safe(() => globalThis.characterEvolutionCatalog[id], null);
  if (evo?.files) return './' + evo.files[stars - 1];
  const sup = v4Safe(() => globalThis.superSalesCatalog.find(f => f.id === id), null);
  if (sup?.files) return './' + sup.files[stars - 1];
  const fam = v4Safe(() => globalThis.familyIPCatalog[id], null);
  if (fam?.file) return './' + fam.file;
  return null;
}
// 名冊：目前可見的所有角色（已擁有在前）
function v4RosterAll() {
  const ids = v4Safe(() => Object.keys(executiveFigurineDatabase), []).filter(v4FigVisible);
  return ids.map(v4FigInfo).filter(Boolean);
}
function v4OwnedFigures() {
  return v4RosterAll().filter(f => f.owned);
}
// 預設隊伍：擁有中星等最高的 3 位（同星比稀有度）
function v4DefaultParty() {
  return v4OwnedFigures()
    .map((f, index) => ({ ...f, index }))
    .sort((a, b) => b.stars - a.stars || V4_RARITY_ORDER[b.rarity] - V4_RARITY_ORDER[a.rarity] || a.index - b.index)
    .slice(0, 3)
    .map(f => f.id);
}

// 依星等回傳角色圖 HTML（升星後換新造型）：
// - 有單張去背圖（忍者 1～5、托尼 2★、傳承）就用 <img>
// - 進化圖是多張檔案（超業、傳承五星）用對應星等的 <img>
// - 進化圖是一張拼圖（托尼、陳總）就用 SVG 裁出該星等那一格
function v4FigArtHTML(id, { stars = null, cls = '', alt = '' } = {}) {
  const star = Math.max(1, Math.min(5, stars ?? v4Safe(() => getEquippedFigurineStars(id), 1)));
  const img = src => `<img class="${cls}" src="${v4Esc(src)}" alt="${v4Esc(alt)}">`;
  if (id === 'tony_ninja') return img(V4_ASSET + `ip/ninja${star}.png`);
  const evo = v4Safe(() => globalThis.characterEvolutionCatalog[id], null);
  if (id.startsWith('tony_') && star === 2) return img(V4_ASSET + 'ip/' + id.slice(5) + '2.png');
  if (evo?.files) return img('./' + evo.files[star - 1]);
  if (evo?.file && evo.frames?.[star - 1]) {
    const [x, y, w, h] = evo.frames[star - 1];
    return `<svg class="${cls}" viewBox="${x} ${y} ${w} ${h}" preserveAspectRatio="xMidYMax meet" role="img" aria-label="${v4Esc(alt)}"><image href="./${v4Esc(evo.file)}" width="${evo.width}" height="${evo.height}"/></svg>`;
  }
  const src = v4FigArt(id);
  return src ? img(src) : '';
}
