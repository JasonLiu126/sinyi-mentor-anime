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

// 玩家：等級／EXP 以既有 header 顯示值為準（renderHandbookUI 寫入），每 50 EXP 一級
function v4Player() {
  const exp = v4NumberFrom('header-user-exp', 0);
  const level = v4NumberFrom('header-user-level', 1);
  return {
    name: v4Safe(() => hunterState.name && hunterState.name !== '新夥伴' ? hunterState.name : '', '') || '新星',
    level,
    exp,
    expPct: level >= 99 ? 100 : Math.round(((exp % 50) / 50) * 100),
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
