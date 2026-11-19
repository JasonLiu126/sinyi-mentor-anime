/* =========================================================
   V4 冒險日誌（#tab-tasks）＋懸賞板＋委託詳情外觀
   - 任務資料、完成判定、領獎全部沿用 routeTasksData 與既有函式，
     這裡只負責重畫外觀；按鈕仍呼叫 openTaskActionModal / handleHeroAction。
   ========================================================= */

// 章節名稱設定檔：依路線填 4 個名稱（I、II、III、👑）。留空字串＝改用任務標題。
const V4_CHAPTER_NAMES = {
  dev: ['', '', '', '首張委託'],
  sal: ['', '', '', '首張委託'],
  com: ['', '', '', '冒險者認證']
};
const V4_ROMAN = ['I', 'II', 'III'];
// 主線金句（依章節輪流顯示；學長頭像旁）
const V4_MENTOR_LINES = [
  '每棟大樓都有一位守門人，先讓他記住你的名字。',
  '情報是跑出來的，不是想出來的。',
  '第一次開口最難，之後就是習慣。'
];

function v4RouteKey() { return v4Safe(() => currentActiveRouteKey, 'dev'); }

// 一條路線的章節：主線／支線依序為 I～III，隱藏任務或全破＝👑
function v4Chapters(routeKey) {
  const slots = v4Safe(() => routeTasksData[routeKey].slots, []);
  const mains = slots.filter(s => /^(主線|支線)/.test(String(s.tag || '')));
  const hidden = slots.find(s => String(s.tag || '').startsWith('隱藏'));
  const currentIndex = mains.findIndex(s => !s.isCompleted);
  const names = V4_CHAPTER_NAMES[routeKey] || [];
  const chapters = mains.slice(0, 3).map((slot, i) => ({
    label: V4_ROMAN[i], name: names[i] || slot.title, slot,
    state: slot.isCompleted ? 'done' : i === currentIndex ? 'current' : 'locked'
  }));
  const allMainDone = mains.length > 0 && mains.every(s => s.isCompleted);
  chapters.push({
    label: '👑', name: names[3] || hidden?.title || '章節完成', slot: hidden || null, crown: true,
    state: hidden ? (hidden.isCompleted ? 'done' : !hidden.isHidden && allMainDone ? 'current' : 'locked') : (allMainDone ? 'done' : 'locked')
  });
  return { chapters, currentIndex };
}

function v4SlotKind(slot) {
  const tag = String(slot.tag || '');
  const num = (tag.match(/\d+/) || [''])[0];
  if (tag.startsWith('主線')) return { kind: 'main', label: 'MAIN ' + num };
  if (tag.startsWith('隱藏')) return { kind: 'hidden', label: 'HIDDEN' };
  if (tag.startsWith('支線')) return { kind: 'side', label: 'QUEST ' + num };
  return { kind: 'main', label: tag };
}

// 公會長指派給「目前業務」且待完成的任務
function v4ManagerBounties() {
  return v4Safe(() => managerTaskState.tasks.filter(t => t.member === managerTaskState.active && t.status === 'todo'), []);
}
// 每日修練：今天完成數／總數（只讀，不建立當日紀錄）
function v4DailyProgress() {
  const quests = v4Safe(() => hunterQuests(), []);
  const tasks = v4Safe(() => hunterState.days[hunterDay()]?.tasks || {}, {});
  const done = quests.filter(q => tasks[q.id]?.status === 'done').length;
  const next = quests.find(q => tasks[q.id]?.status !== 'done');
  return { done, total: quests.length, next };
}

/* ---------- 建立容器 ---------- */
function v4BuildJournal() {
  const tab = document.getElementById('tab-tasks');
  if (!tab || document.getElementById('v4-journal-head')) return;
  const head = document.createElement('div');
  head.id = 'v4-journal-head';
  head.className = 'v4-section-head';
  head.innerHTML = '<div><small class="v4-en">QUEST LOG</small><h2 class="v4-serif">冒險日誌</h2></div>';
  tab.prepend(head);

  const routeSwitch = document.getElementById('route-tab-dev')?.parentElement;
  if (routeSwitch) {
    routeSwitch.id = 'v4-route-switch';
    routeSwitch.setAttribute('role', 'group');
    routeSwitch.setAttribute('aria-label', '切換路線');
  }
  const chapters = document.createElement('ol');
  chapters.id = 'v4-chapters';
  chapters.setAttribute('aria-label', '章節進度');
  (routeSwitch || head).after(chapters);

  const pool = document.getElementById('tasks-pool-title')?.parentElement;
  if (pool) pool.classList.add('v4-pool-head');
}

// 懸賞板（3 張圖釘單）：其他檔案在 DOMContentLoaded 才把面板插到主線卡後面，最後再放
function v4BuildBountyNotes() {
  if (document.getElementById('v4-bounty')) return;
  const board = document.createElement('section');
  board.id = 'v4-bounty';
  board.innerHTML = '<div class="v4-section-head"><h3 class="v4-serif">懸賞板</h3><span>公會長指派・每日刷新</span></div><div class="v4-notes" id="v4-notes"></div>';
  document.getElementById('tasks-hero-card')?.after(board);
}

/* ---------- 重畫 ---------- */
function v4RenderJournal() {
  const tab = document.getElementById('tab-tasks');
  if (!tab) return;
  const routeKey = v4RouteKey();

  ['dev', 'sal', 'com'].forEach(k => document.getElementById('route-tab-' + k)?.setAttribute('aria-pressed', String(k === routeKey)));

  // 章節列
  const { chapters, currentIndex } = v4Chapters(routeKey);
  const list = document.getElementById('v4-chapters');
  if (list) {
    list.innerHTML = chapters.map(ch => `<li class="v4-ch is-${ch.state} ${ch.crown ? 'is-crown' : ''}" ${ch.state === 'current' ? 'aria-current="step"' : ''}>
      <span class="v4-ch-orb v4-serif">${ch.state === 'done' && !ch.crown ? '✓' : ch.label}</span>
      <span class="v4-ch-name">${v4Esc(ch.name)}</span></li>`).join('');
  }

  // 主線卡：加章節標籤（主線卡內容由 switchRoute 每次重畫，所以每次補上）
  const hero = document.getElementById('tasks-hero-card');
  if (hero && !hero.querySelector('.v4-chapter-label')) {
    const label = document.createElement('div');
    label.className = 'v4-chapter-label v4-en';
    const chapterNo = currentIndex >= 0 ? V4_ROMAN[currentIndex] || '👑' : '👑';
    label.textContent = `CHAPTER ${chapterNo} · ${routeKey === 'com' ? '基本功' : '主線'}`;
    hero.prepend(label);
    const quote = document.createElement('p');
    quote.className = 'v4-mentor-quote';
    quote.innerHTML = `<img src="${V4_ASSET}mentor_face.jpg" alt="阿義學長"><span>「${v4Esc(V4_MENTOR_LINES[Math.max(0, currentIndex) % V4_MENTOR_LINES.length])}」</span>`;
    hero.querySelector('h3')?.after(quote);
  }

  // 懸賞板 3 張：公會長指派、每日修練、下一個主線
  const slots = v4Safe(() => routeTasksData[routeKey].slots, []);
  const mains = slots.filter(s => /^(主線|支線)/.test(String(s.tag || '')) && !s.isCompleted);
  const nextMain = mains[1] || mains[0] || null;
  const bounty = v4ManagerBounties()[0];
  const daily = v4DailyProgress();
  const notes = [
    bounty
      ? { tag: 'BOUNTY', title: bounty.title, who: '公會長', reward: '指派', action: 'v4OpenBountyPanel()' }
      : { tag: 'BOUNTY', title: '等待公會長指派', who: '公會長', reward: '—', action: 'v4OpenBountyPanel()', empty: true },
    { tag: 'DAILY', title: daily.next ? daily.next.name : '今日修練完成', who: '每日', reward: `${daily.done}/${daily.total}`, action: 'hunterHome()', empty: !daily.next },
    nextMain
      ? { tag: v4SlotKind(nextMain).label.split(' ')[0], title: nextMain.title, who: '主線', reward: '+' + (nextMain.rewardCoins || 150), action: `openTaskActionModal('${routeKey}','${nextMain.id}')` }
      : { tag: 'MAIN', title: '主線全部完成', who: '主線', reward: '✓', action: "switchTab('tab-lobby')", empty: true }
  ];
  const notesEl = document.getElementById('v4-notes');
  if (notesEl) {
    notesEl.innerHTML = notes.map((n, i) => `<button type="button" class="v4-note ${n.empty ? 'is-empty' : ''}" style="--tilt:${[-1.5, 1, -0.8][i]}deg" onclick="${n.action}">
      <span class="v4-pin" aria-hidden="true"></span><small class="v4-en">${n.tag}</small><b class="v4-serif">${v4Esc(n.title)}</b>
      <span>委託人：${n.who}</span><em class="v4-serif">${v4Esc(n.reward)}</em></button>`).join('');
  }

  v4RenderStrips(routeKey, slots, bounty, daily);
}

// 2-4 懸賞板：所有挑戰改成圖釘羊皮紙條（按鈕仍呼叫既有函式）
function v4RenderStrips(routeKey, slots, bounty, daily) {
  const container = document.getElementById('tasks-slots-container');
  if (!container) return;
  // 每個功能只保留一個入口：公會長指派在下方「額外任務」面板操作、每日修練（阿義學長）已移除，這裡不再重複列出
  const extra = [];
  const strips = slots.map(slot => {
    const { kind, label } = v4SlotKind(slot);
    const reward = `+${slot.rewardCoins || 150}`;
    let right;
    if (slot.isHidden) right = `<span class="v4-lock">🔒 ${v4Esc(slot.desc || '')}</span>`;
    else if (slot.isCompleted) right = '<span class="v4-stamp-done v4-en">CLEAR</span>';
    else right = `<button type="button" class="v4-btn-gold v4-strip-btn" onclick="openTaskActionModal('${routeKey}', '${slot.id}')">${slot.isOngoing ? '執行中' : '接取'}</button>`;
    return `<div class="v4-strip is-${kind} ${slot.isHidden ? 'is-locked' : ''} ${slot.isCompleted ? 'is-done' : ''}">
      <span class="v4-pin" aria-hidden="true"></span>
      <div class="v4-strip-body"><small class="v4-en">${v4Esc(label)} <i>${reward}</i> <i class="v4-exp">+${slot.rewardExp || 20}EXP</i></small>
      <b class="v4-serif">${v4Esc(slot.title)}</b>${slot.isHidden ? '' : `<span>${v4Esc(slot.desc || '')}</span>`}</div>${right}</div>`;
  });
  container.innerHTML = extra.join('') + strips.join('');
  container.classList.add('v4-board');
}

function v4OpenBountyPanel() {
  switchTab('tab-tasks');
  const panel = document.querySelector('.mt-member-panel');
  if (panel) setTimeout(() => panel.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
}

/* ---------- 委託詳情 Modal（2-3）：沿用既有內容，補標頭、獎勵、勾選進度 ---------- */
function v4DecorateTaskModal(routeKey, taskId) {
  const modal = document.getElementById('modal-task-action');
  if (!modal || modal.classList.contains('hidden')) return;
  const slot = v4Safe(() => routeTasksData[routeKey].slots.find(s => s.id === taskId), null);
  if (!slot) return;
  const panel = modal.firstElementChild;
  panel.classList.add('v4-quest-modal');
  panel.querySelector('button[aria-label="關閉任務視窗"]')?.parentElement.classList.add('v4-modal-close');
  if (!panel.querySelector('.v4-quest-kicker')) {
    const kicker = document.createElement('div');
    kicker.className = 'v4-quest-kicker';
    kicker.innerHTML = '<small class="v4-en">QUEST</small><b class="v4-serif">委託詳情</b>';
    panel.prepend(kicker);
  }
  let meta = document.getElementById('v4-task-meta');
  if (!meta) {
    meta = document.createElement('div');
    meta.id = 'v4-task-meta';
    document.getElementById('modal-task-title').before(meta);
  }
  // 任務標籤（#modal-task-tag）是既有程式要讀的元素：只搬位置、不可被 innerHTML 清掉
  let tag = document.getElementById('modal-task-tag');
  if (!tag) { tag = document.createElement('span'); tag.id = 'modal-task-tag'; tag.textContent = slot.tag || ''; }
  tag.classList.add('v4-tag-main');
  let reward = meta.querySelector('.v4-meta-reward');
  if (!reward) { reward = document.createElement('span'); reward.className = 'v4-en v4-meta-reward'; meta.appendChild(reward); }
  reward.textContent = `+${slot.rewardCoins || 150} · +${slot.rewardExp || 20}EXP`;
  if (tag.parentElement !== meta) meta.prepend(tag);
  [...meta.childNodes].forEach(n => { if (n.nodeType === 3) n.remove(); });

  const items = slot.checkItems;
  const content = document.getElementById('modal-task-content');
  if (Array.isArray(items) && content) {
    const progress = document.createElement('div');
    progress.className = 'v4-task-progress';
    const update = () => {
      const done = items.filter(i => i.checked).length;
      progress.innerHTML = `<div><span>現場確認 ${items.length} 項</span><b class="v4-en">${done} / ${items.length}</b></div><div class="v4-expbar"><i style="width:${Math.round(done / items.length * 100)}%"></i></div>`;
    };
    update();
    content.prepend(progress);
    content.addEventListener('change', () => setTimeout(update, 0));
  }
}

/* ---------- 包裝既有函式（DOMContentLoaded 最後執行，位於其他包裝的最外層） ---------- */
v4BuildJournal();

window.addEventListener('DOMContentLoaded', () => {
  v4BuildBountyNotes();
  // 其他檔案在 DOMContentLoaded 會 prepend 路線摘要；把日誌標題放回最上面
  const tab = document.getElementById('tab-tasks');
  const head = document.getElementById('v4-journal-head');
  if (tab && head) tab.prepend(head);

  const originalRoute = switchRoute;
  switchRoute = function (...args) {
    const result = originalRoute.apply(this, args);
    v4RenderJournal();
    return result;
  };
  const originalTaskModal = openTaskActionModal;
  openTaskActionModal = function (routeKey, taskId, ...rest) {
    const result = originalTaskModal.call(this, routeKey, taskId, ...rest);
    v4DecorateTaskModal(routeKey, taskId);
    return result;
  };
  if (typeof managerRender === 'function') {
    const originalManagerRender = managerRender;
    managerRender = function (...args) {
      const result = originalManagerRender.apply(this, args);
      v4RenderJournal();
      return result;
    };
  }
  const originalSwitchTab = switchTab;
  switchTab = function (tabId, ...rest) {
    const result = originalSwitchTab.call(this, tabId, ...rest);
    if (tabId === 'tab-tasks' && !document.getElementById('tab-tasks').classList.contains('hidden')) v4RenderJournal();
    return result;
  };
  v4RenderJournal();
});
