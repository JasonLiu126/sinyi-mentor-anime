/* =========================================================
   示範用新人名單與各自的存檔（新人 APP、店長後台、PM 後台共用）
   - 正式版每位新人用自己的帳號登入，不需要切換；原型為了 Demo 讓同一台瀏覽器能切換新人。
   - 「目前新人」的資料放在一般存檔位置（既有程式照常讀寫）；其他新人的資料打包存在 sinyi-slot-<id>。
   - 切換時：把目前新人的個人存檔打包收起來，再把要切換的新人的存檔放回一般位置。
   - 所有新人都是虛構示範資料。
   ========================================================= */
const V4R_ACTIVE_KEY = 'sinyi-v4-active-rookie';
const V4R_SLOT_PREFIX = 'sinyi-slot-';
// 大家共用、不屬於個別新人的存檔
const V4R_SHARED_KEYS = new Set(['sinyi-formal-manager-tasks-v1', 'sinyi-v4-content-v1', 'sinyi-v4-manager-log-v1', 'sinyi-v4-manager-view', 'sinyi-v4-pm-view', 'sinyi-v4-reset-at', V4R_ACTIVE_KEY]);
const V4R_REGION = '台北一區';
const V4R_BRANCHES = { B101: '信義松仁店', B102: '大安敦南店', B103: '松山民生店' };
// seed：還沒在新人 APP 用過時，後台顯示的示範數字
const V4R_ROOKIES = [
  { id: 'self', name: '新星', branch: 'B101', joined: null },
  { id: '00000000-0000-4000-8000-00000000000a', name: '林予晴', branch: 'B101', joined: '2026-08-03',
    seed: { exp: 420, dev: 'B', sal: 'D', routes: { dev: 3, sal: 2, com: 2 }, surveys: 2, party: 3, scores: { hard_know: { tax: 70, market: 55 }, soft_dev: { dev_local: 80, dev_track: 40 }, soft_sal: { sal_stranger: 35, sal_present: 30 } } } },
  { id: '00000000-0000-4000-8000-00000000000b', name: '陳柏宇', branch: 'B102', joined: '2026-09-15',
    seed: { exp: 180, dev: 'A', sal: 'D', routes: { dev: 2, sal: 1, com: 1 }, surveys: 1, party: 1, scores: { hard_know: { tax: 50, contract: 35 }, soft_dev: { dev_local: 45 }, soft_sal: { sal_resource: 20 } } } },
  { id: '00000000-0000-4000-8000-00000000000c', name: '張雅婷', branch: 'B102', joined: '2026-06-20',
    seed: { exp: 760, dev: 'F', sal: 'C', routes: { dev: 4, sal: 4, com: 3 }, surveys: 3, party: 5, scores: { hard_know: { tax: 95, mortgage: 60, market: 70 }, soft_dev: { dev_local: 60, dev_brand: 30 }, soft_sal: { sal_stranger: 75, sal_present: 65, sal_market: 30 } } } },
  { id: '00000000-0000-4000-8000-00000000000d', name: '黃俊傑', branch: 'B103', joined: '2026-10-27',
    seed: { exp: 60, dev: 'D', sal: 'D', routes: { dev: 1, sal: 0, com: 1 }, surveys: 0, party: 0, scores: {} } }
];

const v4rIsPersonal = key => key.startsWith('sinyi-') && !V4R_SHARED_KEYS.has(key) && !key.startsWith(V4R_SLOT_PREFIX);
function v4rActive() {
  try { const id = localStorage.getItem(V4R_ACTIVE_KEY); return V4R_ROOKIES.some(r => r.id === id) ? id : 'self'; } catch { return 'self'; }
}
const v4rRookie = id => V4R_ROOKIES.find(r => r.id === id) || V4R_ROOKIES[0];
function v4rSlot(id) { try { return JSON.parse(localStorage.getItem(V4R_SLOT_PREFIX + id) || '{}') || {}; } catch { return {}; } }
// 讀寫某位新人的個人存檔（目前新人＝一般位置；其他新人＝打包的存檔）
function v4rRead(id, key) {
  if (id === v4rActive()) { try { return localStorage.getItem(key); } catch { return null; } }
  return v4rSlot(id)[key] ?? null;
}
function v4rWrite(id, key, value) {
  try {
    if (id === v4rActive()) { localStorage.setItem(key, value); return true; }
    const slot = v4rSlot(id);
    slot[key] = value;
    localStorage.setItem(V4R_SLOT_PREFIX + id, JSON.stringify(slot));
    return true;
  } catch { return false; }
}
const v4rHasData = id => !!v4rRead(id, 'sinyi-rpg-formal-journey-v1') || !!v4rRead(id, 'sinyi-v4-quiz-history-v1');
// 切換目前新人（呼叫端要先停止本頁寫入，切換後重新載入）
function v4rSwitch(id) {
  const current = v4rActive();
  if (id === current || !V4R_ROOKIES.some(r => r.id === id)) return false;
  const keys = Object.keys(localStorage).filter(v4rIsPersonal);
  const packed = Object.fromEntries(keys.map(k => [k, localStorage.getItem(k)]));
  localStorage.setItem(V4R_SLOT_PREFIX + current, JSON.stringify(packed));
  keys.forEach(k => localStorage.removeItem(k));
  for (const [k, v] of Object.entries(v4rSlot(id))) if (v4rIsPersonal(k) && v !== null) localStorage.setItem(k, v);
  localStorage.removeItem(V4R_SLOT_PREFIX + id);
  localStorage.setItem(V4R_ACTIVE_KEY, id);
  // 指派任務：新人 APP 只顯示「目前成員」的任務
  try {
    const assign = JSON.parse(localStorage.getItem('sinyi-formal-manager-tasks-v1') || 'null');
    if (assign && assign.version === 1) {
      if (!assign.members.some(m => m.id === id)) assign.members.push({ id, name: v4rRookie(id).name });
      assign.active = id;
      localStorage.setItem('sinyi-formal-manager-tasks-v1', JSON.stringify(assign));
    }
  } catch { /* 略過 */ }
  return true;
}
