/* =========================================================
   新人 APP：遊戲內通知、使用紀錄、AI 對練評分紀錄
   - 通知：任務核可、退回、店長指派、日報同步完成、開放重測、指派快到期
   - 使用紀錄：每次開啟到離開的時間、各分頁停留秒數（給 PM 後台統計）
   - AI 對練：只存各面向分數、總分、評語（不存對話）
   - 尚未接資料庫：存在 localStorage；之後換成 API
   ========================================================= */
const V4_NOTIFY_KEY = 'sinyi-v4-notify-v1';
const V4_USAGE_KEY = 'sinyi-v4-usage-v1';
const V4_PRACTICE_KEY = 'sinyi-v4-practice-v1';
const V4_NOTIFY_ICON = { approved: '🎉', returned: '↩️', closed: '⛔', assigned: '📜', report: '📊', retake: '🧭', due: '⏰' };

function v4JsonLoad(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; } }
function v4JsonSave(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* 無法存檔時略過 */ } }

/* ---------- 通知 ---------- */
function v4NotifyLoad() { return v4JsonLoad(V4_NOTIFY_KEY, null); }
function v4Notify(type, title, body = '') {
  const state = v4NotifyLoad() || { items: [], seen: {} };
  state.items.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), at: new Date().toISOString(), type, title, body, read: false });
  state.items = state.items.slice(-100);
  v4JsonSave(V4_NOTIFY_KEY, state);
  v4RenderNotifyBadge();
}
// 比對後台資料與上次看到的狀態，產生退回、新指派、快到期、開放重測的通知
function v4NotifySnapshot() {
  const verify = v4VerifyLoad();
  const assign = v4AssignLoad();
  const reviews = Object.fromEntries(Object.entries(verify.reviews).map(([id, r]) => [id, `${r.status}:${r.returnCount || 0}`]));
  const tasks = Object.fromEntries((assign?.tasks || []).filter(t => t.member === assign.active).map(t => [t.id, `${t.status}:${t.returnCount || 0}`]));
  return { reviews, tasks, retake: !!v4QuizHistory().allowRetake };
}
function v4NotifyScan() {
  const now = v4NotifySnapshot();
  const state = v4NotifyLoad();
  if (!state) { v4JsonSave(V4_NOTIFY_KEY, { items: [], seen: { ...now, due: {} } }); return; } // 第一次：只記現況，不補發
  const seen = state.seen || {};
  const verify = v4VerifyLoad();
  const assign = v4AssignLoad();
  const notices = [];
  for (const [id, sig] of Object.entries(now.reviews)) {
    if (seen.reviews?.[id] === sig) continue;
    const r = verify.reviews[id];
    if (r.status === 'returned') notices.push(['returned', `任務被退回：${r.title}`, `原因：${r.feedback || '—'}（第 ${r.returnCount} 次，最多 ${V4_MAX_RETURNS} 次）`]);
    if (r.status === 'closed') notices.push(['closed', `任務已結束：${r.title}`, `已退回 ${V4_MAX_RETURNS} 次。原因：${r.feedback || '—'}`]);
  }
  for (const task of assign?.tasks || []) {
    if (task.member !== assign.active) continue;
    const sig = now.tasks[task.id];
    const before = seen.tasks?.[task.id];
    if (!before && task.status === 'todo') notices.push(['assigned', `店長指派新任務：${task.title}`, `${task.verify === 'report' ? '📊 日報判定' : '👑 店長判定'}${task.due ? `・期限 ${task.due}` : ''}`]);
    else if (before && before !== sig && task.status === 'todo' && (task.returnCount || 0) > Number(before.split(':')[1] || 0)) notices.push(['returned', `指派任務被退回：${task.title}`, `回饋：${task.feedback || '—'}`]);
    else if (before && before !== sig && task.status === 'cancelled' && task.returnCount >= V4_MAX_RETURNS) notices.push(['closed', `指派任務已結束：${task.title}`, task.feedback || '']);
    const daysLeft = task.due ? Math.round((Date.parse(task.due) - Date.parse(v4Today())) / 864e5) : null;
    if (task.status === 'todo' && daysLeft !== null && daysLeft >= 0 && daysLeft <= 1 && !seen.due?.[task.id]) {
      notices.push(['due', `指派任務快到期：${task.title}`, daysLeft === 0 ? '今天到期' : '明天到期']);
      seen.due = { ...(seen.due || {}), [task.id]: true };
    }
  }
  if (now.retake && !seen.retake) notices.push(['retake', '店長開放重測覺醒試煉', '下次進入 APP 會重新作答，可以重新選擇職業']);
  state.seen = { ...now, due: seen.due || {} };
  v4JsonSave(V4_NOTIFY_KEY, state);
  notices.forEach(n => v4Notify(...n));
  if (!notices.length) v4RenderNotifyBadge();
}

function v4BuildNotify() {
  const hud = document.getElementById('v4-hud');
  if (!hud || document.getElementById('v4-notify-btn')) return;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.id = 'v4-notify-btn';
  btn.className = 'v4-notify-btn';
  btn.setAttribute('aria-label', '通知');
  btn.innerHTML = '<span aria-hidden="true">🔔</span><i id="v4-notify-badge" hidden></i>';
  btn.addEventListener('click', v4OpenNotify);
  const admin = hud.querySelector('.ta-entry');
  admin ? hud.insertBefore(btn, admin) : hud.appendChild(btn);
  const modal = document.createElement('div');
  modal.id = 'v4-notify-modal';
  modal.className = 'v4-report-modal hidden';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', '通知');
  modal.innerHTML = '<div class="v4-darkify v4-report-panel v4-notify-panel"></div>';
  modal.addEventListener('click', e => { if (e.target === modal) v4CloseNotify(); });
  document.body.appendChild(modal);
  v4RenderNotifyBadge();
}
function v4RenderNotifyBadge() {
  const badge = document.getElementById('v4-notify-badge');
  if (!badge) return;
  const n = (v4NotifyLoad()?.items || []).filter(i => !i.read).length;
  badge.textContent = n > 9 ? '9+' : String(n);
  badge.hidden = !n;
}
function v4OpenNotify() {
  const modal = document.getElementById('v4-notify-modal');
  const panel = modal.firstElementChild;
  const state = v4NotifyLoad() || { items: [], seen: {} };
  const items = state.items.slice().reverse();
  panel.innerHTML = `<div class="v4-quest-kicker"><small class="v4-en">NOTICE</small><b class="v4-serif">通知</b></div>
    ${items.length ? `<ul class="v4-notify-list">${items.map(i => `<li class="${i.read ? '' : 'is-new'}"><span aria-hidden="true">${V4_NOTIFY_ICON[i.type] || '🔔'}</span><div><b>${v4Esc(i.title)}</b>${i.body ? `<p>${v4Esc(i.body)}</p>` : ''}<small>${new Date(i.at).toLocaleString('zh-TW', { hour12: false, month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</small></div></li>`).join('')}</ul>` : '<p class="v4-report-hint">目前沒有通知。</p>'}
    <div class="v4-report-actions"><button type="button" class="v4-btn-gold" onclick="v4CloseNotify()">知道了</button></div>`;
  modal.classList.remove('hidden');
  state.items.forEach(i => { i.read = true; });
  v4JsonSave(V4_NOTIFY_KEY, state);
  v4RenderNotifyBadge();
}
function v4CloseNotify() { document.getElementById('v4-notify-modal')?.classList.add('hidden'); }

/* ---------- 使用紀錄 ---------- */
let v4UsageTab = 'tab-lobby';
let v4UsageSession = null;
function v4UsageTick(seconds) {
  if (document.hidden) return;
  const usage = v4JsonLoad(V4_USAGE_KEY, { sessions: [] });
  const now = new Date().toISOString();
  let session = usage.sessions.find(s => s.id === v4UsageSession);
  if (!session) {
    v4UsageSession = Date.now().toString(36);
    session = { id: v4UsageSession, start: now, end: now, features: {} };
    usage.sessions.push(session);
  }
  session.end = now;
  if (seconds) session.features[v4UsageTab] = (session.features[v4UsageTab] || 0) + seconds;
  usage.sessions = usage.sessions.slice(-300);
  v4JsonSave(V4_USAGE_KEY, usage);
}
// 離開超過 30 分鐘再回來算新的一次使用
let v4HiddenAt = 0;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { v4HiddenAt = Date.now(); return; }
  if (v4HiddenAt && Date.now() - v4HiddenAt > 30 * 60 * 1000) v4UsageSession = null;
  v4UsageTick(0);
});

/* ---------- AI 對練評分紀錄（不存對話） ---------- */
function v4RecordPractice(reason) {
  const total = parseInt(document.getElementById('rp-review-total-score')?.textContent || '0', 10);
  const dims = [1, 2, 3, 4].map(i => {
    const el = document.getElementById('rubric-score-' + i);
    const label = el?.parentElement?.firstElementChild?.textContent.replace(/^\d\.\s*/, '').replace(/[（(].*$/, '').replace(/[：:]\s*$/, '').trim() || `面向 ${i}`;
    return { label, score: parseInt(el?.textContent || '0', 10) };
  });
  const scenario = v4Safe(() => currentSelectedRPTemplate?.title, '') || document.getElementById('rp-goal-select')?.selectedOptions?.[0]?.textContent?.trim() || '自訂情境';
  const comment = ['rp-review-positive', 'rp-review-negative'].map(id => document.getElementById(id)?.textContent.trim()).filter(Boolean).join('／').slice(0, 300);
  const list = v4JsonLoad(V4_PRACTICE_KEY, []);
  list.push({ at: new Date().toISOString(), scenario, dims, total, grade: v4Grade(total), passed: v4Safe(() => rpTrustMeter, 0) >= 70 || reason === 'success' || total >= 15, comment, attempt: list.filter(p => p.scenario === scenario).length + 1 });
  v4JsonSave(V4_PRACTICE_KEY, list.slice(-300));
}

/* ---------- 啟動與包裝 ---------- */
window.addEventListener('DOMContentLoaded', () => {
  v4BuildNotify();
  const originalComplete = v4CompleteTask;
  v4CompleteTask = function (routeKey, id, content, via) {
    const done = originalComplete.call(this, routeKey, id, content, via);
    if (done) {
      const slot = v4SlotById(routeKey, id);
      if (via === 'report') v4Notify('report', `日報同步後自動完成：${slot?.title || id}`, `+${slot?.rewardExp || ''} EXP`);
      else v4Notify('approved', `店長核可：${slot?.title || id}`, `+${slot?.rewardExp || ''} EXP，獎勵已發放`);
    }
    return done;
  };
  const originalAssigned = v4SyncAssigned;
  v4SyncAssigned = function (...args) {
    const titles = originalAssigned.apply(this, args);
    titles.forEach(t => v4Notify('approved', `指派任務完成：${t}`, '經驗已發放'));
    return titles;
  };
  const originalSync = v4SyncFromManager;
  v4SyncFromManager = function (...args) { const r = originalSync.apply(this, args); v4NotifyScan(); return r; };
  const originalSwitchTab = switchTab;
  switchTab = function (tabId, ...rest) {
    v4UsageTick(0);
    const r = originalSwitchTab.call(this, tabId, ...rest);
    if (typeof tabId === 'string') v4UsageTab = tabId;
    return r;
  };
  if (typeof concludeRPSession === 'function') {
    const originalConclude = concludeRPSession;
    concludeRPSession = function (reason, ...rest) { const r = originalConclude.call(this, reason, ...rest); v4RecordPractice(reason); return r; };
  }
  window.addEventListener('storage', e => {
    if (e.key === 'sinyi-v4-quiz-history-v1' || e.key === 'sinyi-formal-manager-tasks-v1' || e.key === 'sinyi-v4-task-verify-v1') v4NotifyScan();
    if (e.key === V4_NOTIFY_KEY) v4RenderNotifyBadge();
  });
  v4UsageTick(0);
  setInterval(() => v4UsageTick(15), 15000);
  setTimeout(v4NotifyScan, 500);
});
