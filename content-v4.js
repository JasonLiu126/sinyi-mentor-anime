/* =========================================================
   遊戲內容設定（新人 APP、店長後台、PM 後台共用）
   - 系統任務與系統參數的「預設值」寫在這裡。
   - PM 在 PM 後台修改 → 產生「變更單」→ PO 核准後才生效（可設定生效日）。
   - 目前生效的內容＝預設值依序套上已核准、已到生效日的變更單。
   - 尚未接資料庫：變更單存在 localStorage 的 sinyi-v4-content-v1。
   ========================================================= */
const V4_CONTENT_KEY = 'sinyi-v4-content-v1';

// 公司日報的行程分類：行程項目 → 行程方式 → 經營行為。
// 公開版只放示意分類；真實分類放在本機的 trip-catalog.local.js（不上傳），存在時優先使用。
// 一筆行程的代碼＝「項目|方式|行為」；行為寫 * 代表該方式下全部行為；第 3 欄是行程項目說明
const V4C_TRIP_SAMPLE = [
  ['社區經營', { 面訪: ['拜訪社區管理員', '住戶互動', '社區派報'], 非面訪: ['電話關懷'], 基礎作業: ['整理社區資料'] }, '示意分類：在負責的社區經營人脈'],
  ['屋主開發', { 面訪: ['拜訪屋主', '查看屋況'], 非面訪: ['電話詢問在售狀態'], 基礎作業: ['準備開發資料'] }, '示意分類：開發有意出售的屋主'],
  ['買方服務', { 面訪: ['需求訪談', '帶看'], 非面訪: ['電話聯繫', '約看'], 基礎作業: ['整理買方資料'] }, '示意分類：服務有購屋需求的客戶']
];
const V4C_TRIP = (typeof window !== 'undefined' && window.V4C_TRIP_LOCAL) || V4C_TRIP_SAMPLE;
const v4cTripLabel = key => { const [item, mode, act] = String(key).split('|'); return `${item}・${mode}・${act === '*' ? '全部' : act}`; };
const v4cRuleText = (trips, min) => `${(trips || []).map(v4cTripLabel).join('、') || '（未設定）'} 累計 ≥ ${min || 1} 筆`;
// 一天的日報：{ 行程代碼: 筆數 }；規則可含 * 代表該方式全部行為
function v4cTripCount(values, trips) {
  let sum = 0;
  for (const [key, n] of Object.entries(values || {})) {
    const [item, mode] = key.split('|');
    if ((trips || []).some(t => t === key || t === `${item}|${mode}|*`)) sum += Number(n) || 0;
  }
  return sum;
}
const V4C_TIERS = { S: ['小', 20], M: ['中', 40], L: ['大', 80] };
const V4C_SKILLS = {
  hard_know: { label: '專業', items: { tax: '稅務', mortgage: '貸款', contract: '契據', law: '不動產法規', market: '商圈行情' } },
  soft_dev: { label: '開發', items: { dev_local: '地緣深耕', dev_track: '踩線', dev_resource: '資源盤點', dev_brand: '個人品牌' } },
  soft_sal: { label: '銷售', items: { sal_stranger: '陌生獲客', sal_present: '物件介紹', sal_resource: '資源盤點', sal_market: '行銷' } }
};
const V4C_ROUTES = { dev: '開發路線', sal: '銷售路線', com: '冒險基本功' };

// 系統任務預設值：判定方式、日報規則、難度、成長能力（[分類, 技能, 權重]，最多 3 項，權重合計 1）
// native：社區勘查沿用既有流程（店長在後台審核勘查內容）
const V4C_BASE_TASKS = {
  dev_m_01: { route: 'dev', title: '從地圖選一個想了解的社區', mode: 'manager', native: true, tier: 'M', abilities: [['soft_dev', 'dev_local', 0.5], ['hard_know', 'market', 0.5]] },
  dev_m_02: { route: 'dev', title: '實地走訪，辨識主力大樓生活機能', mode: 'report', trips: ['社區經營|面訪|拜訪社區管理員'], min: 1, tier: 'S', abilities: [['soft_dev', 'dev_local', 0.6], ['soft_dev', 'dev_track', 0.4]] },
  dev_m_03: { route: 'dev', title: '整理社區筆記與三個想請教的問題', mode: 'manager', tier: 'M', abilities: [['hard_know', 'market', 0.6], ['soft_dev', 'dev_local', 0.4]] },
  dev_m_04: { route: 'dev', title: '社區管理員破冰並獲得第一手情資', mode: 'manager', tier: 'M', abilities: [['soft_dev', 'dev_local', 1]] },
  sal_m_01: { route: 'sal', title: '接收可聯繫的舊買資源並了解現況', mode: 'manager', tier: 'M', abilities: [['soft_sal', 'sal_resource', 0.6], ['soft_dev', 'dev_resource', 0.4]] },
  sal_m_02: { route: 'sal', title: '準備釐清需求的問題清單', mode: 'manager', tier: 'S', abilities: [['soft_sal', 'sal_present', 1]] },
  sal_m_03: { route: 'sal', title: '完成首次電話或訊息聯繫', mode: 'report', trips: ['買方服務|非面訪|電話聯繫'], min: 1, tier: 'S', abilities: [['soft_sal', 'sal_resource', 0.5], ['soft_sal', 'sal_stranger', 0.5]] },
  sal_m_04: { route: 'sal', title: '久未互動舊買重新回應並同意看屋', mode: 'report', trips: ['買方服務|非面訪|約看', '買方服務|面訪|帶看'], min: 1, tier: 'L', abilities: [['soft_sal', 'sal_present', 0.6], ['soft_sal', 'sal_resource', 0.4]] },
  com_m_01: { route: 'com', title: '嘗試一次陌生接觸，練習非主力技能', mode: 'report', trips: ['社區經營|面訪|社區派報', '屋主開發|面訪|拜訪屋主'], min: 1, tier: 'S', abilities: [['soft_sal', 'sal_stranger', 1]] },
  com_m_02: { route: 'com', title: '比較相鄰兩個生活圈的環境差異', mode: 'manager', tier: 'M', abilities: [['hard_know', 'market', 1]] },
  com_m_03: { route: 'com', title: '追蹤所選生活圈的一項新市場訊號', mode: 'manager', tier: 'M', abilities: [['hard_know', 'market', 0.5], ['soft_dev', 'dev_track', 0.5]] }
};
// 本機有真實分類時，系統任務改用真實行程
if (typeof window !== 'undefined' && window.V4C_TASK_TRIPS_LOCAL) for (const [id, trips] of Object.entries(window.V4C_TASK_TRIPS_LOCAL)) if (V4C_BASE_TASKS[id]) V4C_BASE_TASKS[id].trips = trips;
// 系統參數預設值
const V4C_BASE_PARAMS = { perDay: 3, expPerDay: 120, active: 5, reviewDays: 2, maxReturns: 3 };
const V4C_PARAM_NAMES = { perDay: '店長每日指派件數上限（每位新人）', expPerDay: '店長每日指派經驗上限（每位新人）', active: '指派任務同時進行中上限', reviewDays: '店長審核期限（天）', maxReturns: '退回次數上限' };

const v4cClone = v => JSON.parse(JSON.stringify(v));
function v4cLoad() {
  try { const v = JSON.parse(localStorage.getItem(V4_CONTENT_KEY) || 'null'); if (v && v.version === 1) return { changes: v.changes || [], staff: v.staff || [] }; } catch { /* 讀不到就用預設 */ }
  return { changes: [], staff: [] };
}
function v4cSave(state) {
  try { localStorage.setItem(V4_CONTENT_KEY, JSON.stringify({ version: 1, ...state })); return true; } catch { return false; }
}
const v4cToday = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
// 已核准的變更單（依核准順序），可只取到第 n 版
function v4cApproved(state = v4cLoad()) {
  return state.changes.filter(c => c.status === 'approved').sort((a, b) => String(a.approvedAt).localeCompare(String(b.approvedAt)));
}
function v4cFold(changes) {
  const out = { tasks: v4cClone(V4C_BASE_TASKS), params: { ...V4C_BASE_PARAMS } };
  for (const c of changes) {
    if (c.type === 'task' && out.tasks[c.target]) out.tasks[c.target] = { ...out.tasks[c.target], ...v4cClone(c.after) };
    else if (c.type === 'params') out.params = { ...out.params, ...c.after };
    else if (c.type === 'restore' && c.snapshot) { out.tasks = v4cClone(c.snapshot.tasks); out.params = { ...c.snapshot.params }; }
  }
  return out;
}
// 目前生效的內容：已核准且已到生效日
function v4cPublished(state = v4cLoad()) {
  const today = v4cToday();
  return v4cFold(v4cApproved(state).filter(c => !c.effectiveAt || c.effectiveAt <= today));
}
// 版本 n（第 n 張生效的變更單之後）的完整內容，供還原用
function v4cVersion(n, state = v4cLoad()) {
  return v4cFold(v4cApproved(state).slice(0, n));
}

/* ---------- 後台用：行程分類選擇器（店長後台、PM 後台共用） ---------- */
const v4cEsc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function v4cTripPickerHTML(name, selected = []) {
  return `<div class="m-trip-picker" data-name="${name}"><input type="hidden" name="${name}" value="${v4cEsc(JSON.stringify(selected))}">
    <div class="m-trip-chips"></div>
    <div class="m-trip-selects"><select data-level="item" aria-label="行程項目">${V4C_TRIP.map(([item]) => `<option>${v4cEsc(item)}</option>`).join('')}</select>
      <select data-level="mode" aria-label="行程方式"></select><select data-level="act" aria-label="經營行為"></select>
      <button type="button" class="m-btn-ghost" data-add-trip>加入</button></div><small class="m-muted m-trip-desc"></small></div>`;
}
function v4cBindTripPickers(root) {
  root.querySelectorAll('.m-trip-picker').forEach(picker => {
    const hidden = picker.querySelector('input[type=hidden]');
    const [itemSel, modeSel, actSel] = ['item', 'mode', 'act'].map(l => picker.querySelector(`[data-level=${l}]`));
    const modes = () => (V4C_TRIP.find(([item]) => item === itemSel.value) || V4C_TRIP[0])[1];
    const fillActs = () => { actSel.innerHTML = '<option value="*">（此方式全部行為）</option>' + (modes()[modeSel.value] || []).map(a => `<option>${v4cEsc(a)}</option>`).join(''); };
    const fillModes = () => { modeSel.innerHTML = Object.keys(modes()).map(m => `<option>${m}</option>`).join(''); fillActs(); const d = picker.querySelector('.m-trip-desc'); if (d) d.textContent = (V4C_TRIP.find(([item]) => item === itemSel.value) || [])[2] || ''; };
    const list = () => { try { return JSON.parse(hidden.value) || []; } catch { return []; } };
    const draw = () => {
      picker.querySelector('.m-trip-chips').innerHTML = list().map((k, i) => `<span class="m-trip-chip">${v4cEsc(v4cTripLabel(k))}<button type="button" data-del-trip="${i}" aria-label="移除">×</button></span>`).join('') || '<span class="m-muted">尚未選擇行程</span>';
      picker.querySelectorAll('[data-del-trip]').forEach(b => b.addEventListener('click', () => { const l = list(); l.splice(Number(b.dataset.delTrip), 1); hidden.value = JSON.stringify(l); draw(); }));
    };
    itemSel.addEventListener('change', fillModes);
    modeSel.addEventListener('change', fillActs);
    picker.querySelector('[data-add-trip]').addEventListener('click', () => {
      const key = `${itemSel.value}|${modeSel.value}|${actSel.value}`;
      const l = list();
      if (!l.includes(key)) l.push(key);
      hidden.value = JSON.stringify(l);
      draw();
    });
    fillModes();
    draw();
  });
}
