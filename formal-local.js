// Local formal edition: browser identity, onboarding and community review.
const communityMetrics = [
  ['age', '屋齡'], ['units', '總戶數'], ['fee', '管理費'],
  ['ratio', '約略公設比'], ['floorsUp', '地上樓層'], ['floorsDown', '地下樓層']
];
const communityNotes = [
  ['type', '建築形態', '例如：大樓／華廈／公寓'],
  ['management', '物業管理', '例如：24 小時保全'],
  ['observation', '現場觀察', '記下社區特色與查證來源']
];
const communityHistory = [
  ['floors', '地上／地下樓層'], ['structure', '建築結構'], ['builder', '建商／營造'],
  ['area', '基地面積'], ['zoning', '土地分區'], ['parking', '停車規劃'],
  ['accessibility', '無障礙設施'], ['layout', '主力格局'], ['market', '實登行情'], ['evidence', '查證來源與觀察日期']
];
const reviewStatus = { pending: '待店長審核', approved: '已核可', returned: '待補正' };
const communityDrafts = new Map();
const surveyRequests = new Set();
let savedCommunityDrafts = new Map();
let localRecords = [];
let localProfileReady = false;
let onboardingBusy = false;

async function formalRequest(path, body) {
  if (typeof requestFormalPreview === 'function') return requestFormalPreview(path, body);
  const response = await fetch('./api/formal/' + path, {
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
    ...(body === undefined ? {} : {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
  });
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error(data.error), { status: response.status });
  return data;
}

const localMessage = error => error.status ? error.message : '暫時無法連線，請重試。';

async function loadFormalProfile() {
  const gate = document.getElementById('formal-profile-gate');
  const hint = document.getElementById('formal-profile-hint');
  const retry = gate.querySelector('button');
  if (!gate.open) gate.showModal();
  retry.hidden = true;
  gate.querySelector('p').textContent = '正在讀取使用紀錄…';
  try {
    let profile = await formalRequest('profile');
    const validAnswers = officialQuestions.every(q => formalQuizValid(q, userQuizAnswers[q.id]));
    if (!profile.completed && isQuizCompleted && validAnswers) {
      profile = await formalRequest('onboarding', {
        answers: userQuizAnswers, dev: formalActiveDevCode, sal: formalActiveSalCode
      });
    }
    localRecords = profile.records;
    savedCommunityDrafts = new Map(profile.drafts.map(draft => [draft.building, draft]));
    localProfileReady = true;
    if (profile.completed) {
      isQuizCompleted = true;
      formalActiveDevCode = profile.dev;
      formalActiveSalCode = profile.sal;
      // An unfinished retake stays in the draft. A completed result uses the saved route.
      if (validAnswers) {
        formalManualDevCode = currentSelectedDevCode = profile.dev;
        formalManualSalCode = currentSelectedSalCode = profile.sal;
        renderSelectedRouteRecommendations();
      }
      document.getElementById('screen-quiz-flow').classList.add('hidden');
      document.getElementById('bottom-navbar').classList.remove('hidden');
      formalRefreshAppliedRoutes(false);
      formalQuizSave();
      switchTab('tab-tasks');
      hint.textContent = '已完成適性測驗';
      if (new URLSearchParams(location.search).get('view') === 'aptitude') formalQuizOpen();
    } else {
      isQuizCompleted = false;
      document.getElementById('bottom-navbar').classList.add('hidden');
      formalQuizOpen();
      hint.textContent = '首次使用 · 請先完成適性測驗';
    }
    renderCommunityPanel();
    gate.close();
    window.dispatchEvent(new Event('formal-profile-ready'));
  } catch (error) {
    gate.querySelector('p').textContent = localMessage(error);
    retry.hidden = false;
  }
}

function communityValues(values) {
  return `<div class="fl-group"><dl>${[...communityMetrics, ...communityNotes, ...communityHistory]
    .filter(([key]) => values?.[key])
    .map(([key, label]) => `<div><dt>${label}</dt><dd>${managerEscape(values[key])}</dd></div>`).join('')}</dl></div>`;
}

function communityField(field, values, canFill, metric) {
  const [key, label, hint] = field;
  const value = managerEscape(values?.[key] ?? '');
  const placeholder = managerEscape(hint ?? '＋待填寫');
  const control = canFill
    ? key === 'observation'
      ? `<textarea name="${key}" rows="2" maxlength="500" placeholder="${placeholder}" required>${value}</textarea>`
      : `<input name="${key}" value="${value}" maxlength="120" placeholder="${placeholder}" required>`
    : `<span class="fl-survey-value">${value || '—'}</span>`;
  return metric ? `<label>${control}<span>${label}</span></label>` : `<label><span>${label}</span>${control}</label>`;
}

function renderCommunityPanel() {
  const task = document.getElementById('fl-community-task');
  if (task) {
    task.hidden = formalActiveDevCode === 'A' && routeTasksData.dev.slots.some(slot => slot.type === 'navigate_map' && !slot.isCompleted);
    task.querySelector('p').textContent = `已核可 ${localRecords.filter(row => row.status === 'approved').length}／3 個地標`;
  }
  const panel = document.getElementById('community-survey');
  if (!panel) return;
  const building = buildingDatabase[currentSelectedBuildingId];
  const record = localRecords.find(row => row.building === building.id);
  const canFill = localProfileReady && isQuizCompleted && (!record || record.status === 'returned');
  const mission = routeTasksData.dev.slots.find(task => task.type === 'navigate_map' && !task.isCompleted);
  const canClaim = record?.status === 'approved' && !!mission;
  const savedDraft = savedCommunityDrafts.get(building.id);
  const values = canFill ? communityDrafts.get(building.id) ?? savedDraft?.fields ?? record?.fields : record?.fields;
  const completed = [...communityMetrics, ...communityNotes].filter(([key]) => values?.[key]?.trim()).length;
  const fieldLayout = `<div class="fl-survey-grid">${communityMetrics.map(field => communityField(field, values, canFill, true)).join('')}</div>
    <div class="fl-survey-notes">${communityNotes.map(field => communityField(field, values, canFill, false)).join('')}</div>`;
  panel.innerHTML = `
    <div class="fl-survey-banner"><span aria-hidden="true">🧭</span><div><h3>探索任務：補齊這個社區的資訊</h3>
    <p>${record ? reviewStatus[record.status] : '實地走訪，查證後填寫'} · <span data-survey-progress>已填 ${completed}／9 項</span></p></div>
    ${mission ? `<small>EXP +${mission.rewardExp}<br>🪙 +${mission.rewardCoins}</small>` : ''}</div>
    ${record?.feedback ? `<p class="fl-note">店長回饋：${managerEscape(record.feedback)}</p>` : ''}
    ${canFill ? `<form data-building="${building.id}">${fieldLayout}
      <p>可以分次填寫，填齊 9 項後再送審。</p>
      <div class="fl-survey-actions">
        <button type="submit" value="draft" formnovalidate ${surveyRequests.has(building.id) ? 'disabled' : ''}>儲存草稿</button>
        <button class="fl-primary fl-survey-submit" type="submit" value="review" ${surveyRequests.has(building.id) ? 'disabled' : ''}>送交店長審核</button>
      </div></form>` : fieldLayout}
    ${canClaim ? '<button type="button" class="fl-primary" data-claim>領取勘查任務獎勵</button>' : ''}
    ${record?.status === 'pending' ? '<button type="button" data-refresh>更新審核狀態</button>' : ''}
    <p role="status" class="fl-result">${canFill && communityDrafts.has(building.id) ? '有未儲存的變更。' : canFill && savedDraft ? '已載入上次儲存的草稿。' : ''}</p>`;
  panel.querySelector('[data-claim]')?.addEventListener('click', () => { markCommunityTarget(); renderCommunityPanel(); });
  panel.querySelector('[data-refresh]')?.addEventListener('click', async () => {
    try { localRecords = (await formalRequest('profile')).records; renderCommunityPanel(); }
    catch (error) { panel.querySelector('.fl-result').textContent = localMessage(error); }
  });
  const form = panel.querySelector('form');
  if (!form) return;
  form.addEventListener('input', () => {
    const draft = Object.fromEntries(new FormData(form));
    communityDrafts.set(building.id, draft);
    panel.querySelector('[data-survey-progress]').textContent = `已填 ${Object.values(draft).filter(value => value.trim()).length}／9 項`;
    panel.querySelector('.fl-result').textContent = '有未儲存的變更。';
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (surveyRequests.has(building.id)) return;
    const saveOnly = event.submitter?.value === 'draft';
    const editing = communityDrafts.get(building.id);
    const draftRevision = savedCommunityDrafts.get(building.id)?.revision;
    const fields = Object.fromEntries(new FormData(form));
    surveyRequests.add(building.id);
    for (const button of form.querySelectorAll('button')) button.disabled = true;
    try {
      const data = await formalRequest(saveOnly ? 'surveys/draft' : 'surveys', { building: building.id, fields, revision: record?.revision, draftRevision });
      if (saveOnly) {
        savedCommunityDrafts.set(building.id, data.draft);
        const editedDuringSave = communityDrafts.get(building.id) !== editing;
        if (!editedDuringSave) communityDrafts.delete(building.id);
        const visibleForm = document.querySelector(`#community-survey form[data-building="${building.id}"]`);
        if (visibleForm) visibleForm.closest('section').querySelector('.fl-result').textContent = editedDuringSave ? '草稿已儲存，另有未儲存的變更。' : '草稿已儲存，下次可以接著填。';
      } else {
        const submitted = data.records.find(row => row.building === building.id);
        localRecords = [...localRecords.filter(row => row.building !== building.id), submitted];
        savedCommunityDrafts.delete(building.id);
        communityDrafts.delete(building.id);
        renderCommunityPanel();
        showCustomToast('勘查資料已送交店長審核。', '✓');
      }
    } catch (error) {
      if (panel.contains(form)) panel.querySelector('.fl-result').textContent = localMessage(error);
      else showCustomToast(localMessage(error), '!');
    } finally {
      surveyRequests.delete(building.id);
      for (const button of document.querySelectorAll(`#community-survey form[data-building="${building.id}"] button`)) button.disabled = false;
    }
  });
}

function setupCommunityMap() {
  const query = document.getElementById('btn-query-comm').parentElement;
  query.className = 'fl-search';
  query.innerHTML = '<form><label>社區／案源查詢<input type="search" placeholder="輸入社區或案源名稱"></label><button type="submit">查詢</button></form><p role="status"></p>';
  const queryForm = query.querySelector('form');
  queryForm.addEventListener('submit', event => {
    event.preventDefault();
    const keyword = queryForm.querySelector('input').value.trim();
    const hit = keyword && Object.values(buildingDatabase).find(b => [b.name, b.address, ...b.listings.map(item => item.title)].some(text => text.includes(keyword)));
    query.querySelector('p').textContent = hit ? '已找到 ' + hit.name : '請輸入社區名稱、路段或案源關鍵字。';
    if (hit) {
      selectMapBuilding(hit.id);
      switchBuildingSubtab(hit.listings.some(item => item.title.includes(keyword)) && !hit.name.includes(keyword) ? 'listings' : 'summary');
    }
  });
  const target = document.querySelector('[onclick="markCommunityTarget()"]');
  target.removeAttribute('onclick');
  target.textContent = '查看勘查任務';
  const task = document.createElement('section');
  task.id = 'fl-community-task';
  task.className = 'fl-panel';
  task.innerHTML = '<h3>社區勘查任務</h3><p></p><button type="button" class="fl-primary">前往地圖勘查</button>';
  function openSurveyMission() {
    switchTab('tab-map');
    const claimable = routeTasksData.dev.slots.some(slot => slot.type === 'navigate_map' && !slot.isCompleted);
    const approved = claimable && localRecords.find(record => record.status === 'approved');
    const next = approved?.building ?? Object.keys(buildingDatabase)
      .find(id => !localRecords.some(record => record.building === id && record.status === 'approved'));
    if (next) selectMapBuilding(next);
    target.click();
  }
  task.querySelector('button').onclick = openSurveyMission;
  document.getElementById('tasks-hero-card').after(task);
  const container = document.getElementById('building-subtab-content');
  const baseBuildingTab = switchBuildingSubtab;
  switchBuildingSubtab = function(tab) {
    const building = buildingDatabase[currentSelectedBuildingId];
    document.getElementById('b-detail-type').textContent = building.address;
    if (tab === 'listings') {
      baseBuildingTab('listings');
      container.insertAdjacentHTML('afterbegin', '<p class="fl-note">以下為案源示範資料。</p>');
      return;
    }
    currentBuildingSubtab = tab;
    for (const key of ['summary', 'trends', 'specs', 'listings']) {
      document.getElementById('bsub-tab-' + key).className = key === tab
        ? 'pb-1.5 px-2 text-sinyi-green border-b-2 border-sinyi-green font-black'
        : 'pb-1.5 px-2 text-slate-500 font-bold';
    }
    if (tab !== 'summary') {
      const record = localRecords.find(row => row.building === building.id && row.status === 'approved');
      const values = record?.fields ?? {};
      const detailFields = tab === 'trends' ? ['market', 'evidence'] : ['type', 'management', 'observation', ...communityHistory.map(([key]) => key).filter(key => !['market', 'evidence'].includes(key))];
      const details = Object.fromEntries(detailFields.filter(key => values[key]).map(key => [key, values[key]]));
      container.innerHTML = Object.keys(details).length ? communityValues(details) : '<p class="fl-note">目前沒有已核可的資料。</p>';
      return;
    }
    container.innerHTML = '<section id="community-survey" class="fl-panel fl-survey"></section>';
    renderCommunityPanel();
  };
  target.addEventListener('click', () => {
    switchBuildingSubtab('summary');
    const panel = document.getElementById('community-survey');
    panel.scrollIntoView({ block: 'start', behavior: 'smooth' });
  });
  const heroAction = handleHeroAction;
  handleHeroAction = function(routeKey) {
    const next = routeTasksData[routeKey]?.slots.find(slot => !slot.isCompleted && !slot.isHidden);
    if (next?.type === 'navigate_map') openSurveyMission();
    else heroAction(routeKey);
  };
  const taskAction = openTaskActionModal;
  openTaskActionModal = function(routeKey, id) {
    const slot = routeTasksData[routeKey]?.slots.find(item => item.id === id);
    if (slot?.type === 'navigate_map' && !slot.isCompleted) openSurveyMission();
    else taskAction(routeKey, id);
  };
  const mark = markCommunityTarget;
  markCommunityTarget = function() {
    const slot = routeTasksData.dev.slots.find(task => task.type === 'navigate_map');
    if (!slot || !localRecords.some(record => record.building === currentSelectedBuildingId && record.status === 'approved')) return;
    mark();
  };
  // Reuse the existing map mission and its single-reward completion guard.
  const mission = { title: '完成一筆社區勘查', desc: '到地圖填寫社區資料，送店長核可後領取任務獎勵。' };
  Object.assign(formalRouteDefaults.dev.slots[0], mission);
  const liveMission = routeTasksData.dev.slots[0];
  if (!liveMission.isCompleted && liveMission.type === 'navigate_map') Object.assign(liveMission, mission);
  const renderRoutes = formalUpdateRouteData;
  formalUpdateRouteData = function() {
    renderRoutes();
    const first = routeTasksData.dev.slots.find(task => !task.isHidden && !task.isCompleted);
    if (first?.type === 'navigate_map') Object.assign(routeTasksData.dev.hero, {
      cond: '提交勘查資料並取得店長核可', actionText: '🗺️ 前往地圖填寫社區資料'
    });
  };
  switchBuildingSubtab('summary');
}

function setupCommunityReview() {
  const dialog = document.getElementById('mt-dialog');
  const preview = typeof requestFormalPreview === 'function';
  dialog.querySelector('.mt-notice').textContent = preview
    ? '公開示範。社區勘查、審核和額外任務都儲存在目前的瀏覽器。'
    : '社區勘查資料由本機服務儲存。額外任務仍是瀏覽器內的流程預覽。';
  const panel = document.createElement('section');
  panel.className = 'fl-panel fl-review';
  panel.innerHTML = `<h3>社區勘查審核</h3><form class="fl-review-login"><label>店長管理碼<input type="password" name="key" required autocomplete="off"></label><button class="fl-primary">開啟審核</button></form>
    <div class="fl-review-tools" hidden><button type="button" data-action="refresh">更新清單</button> <button type="button" data-action="logout">登出審核</button></div>
    <p class="fl-result" role="status"></p><div class="fl-review-list"></div>`;
  dialog.querySelector('.mt-compose').before(panel);
  const form = panel.querySelector('.fl-review-login');
  const tools = panel.querySelector('.fl-review-tools');
  if (preview) {
    form.hidden = true;
    tools.querySelector('[data-action="logout"]').remove();
  }
  const list = panel.querySelector('.fl-review-list');
  const result = panel.querySelector('.fl-result');
  function showQueue(records) {
    form.hidden = true;
    tools.hidden = false;
    list.innerHTML = records.length ? records.map(record => `<details class="fl-review-card">
      <summary>${buildingDatabase[record.building].name} · ${reviewStatus[record.status]} · 業務 ${record.profile.slice(0, 8)}</summary>
      ${communityValues(record.fields)}${record.feedback ? `<p class="fl-note">上次回饋：${managerEscape(record.feedback)}</p>` : ''}
      ${record.status === 'pending' ? `<form data-id="${record.id}" data-revision="${record.revision}"><label>審核回饋（退回必填）<textarea name="feedback" maxlength="500"></textarea></label>
      <button name="decision" value="approved" class="fl-primary">核可資料</button> <button name="decision" value="returned">退回補正</button></form>` : ''}</details>`).join('') : '<p>目前沒有社區送審資料。</p>';
  }
  function showLogin() { form.hidden = preview; tools.hidden = !preview; list.replaceChildren(); }
  async function refresh() {
    try { showQueue((await formalRequest('review')).records); result.textContent = ''; }
    catch (error) { showLogin(); result.textContent = error.status === 401 ? '' : localMessage(error); }
  }
  panel.addEventListener('submit', async event => {
    event.preventDefault();
    const entry = event.target;
    const button = event.submitter;
    const fields = new FormData(entry);
    if (button) button.disabled = true;
    try {
      const data = entry === form
        ? await formalRequest('review/login', { key: fields.get('key') })
        : await formalRequest('review', { id: entry.dataset.id, revision: Number(entry.dataset.revision), status: button?.value, feedback: fields.get('feedback') });
      form.reset();
      showQueue(data.records);
      result.textContent = entry === form ? '已開啟審核。' : '已儲存審核結果。';
      if (entry !== form) {
        localRecords = (await formalRequest('profile')).records;
        renderCommunityPanel();
      }
    } catch (error) {
      if (error.status === 401) showLogin();
      result.textContent = localMessage(error);
    } finally { if (button) button.disabled = false; }
  });
  tools.addEventListener('click', async event => {
    if (event.target.dataset.action === 'refresh') await refresh();
    if (event.target.dataset.action === 'logout') {
      try { await formalRequest('review/logout', {}); showLogin(); result.textContent = '已登出審核。'; }
      catch (error) { if (error.status === 401) showLogin(); result.textContent = localMessage(error); }
    }
  });
  new MutationObserver(() => { if (!dialog.hidden) refresh(); })
    .observe(dialog, { attributes: true, attributeFilter: ['hidden'] });
}

window.addEventListener('DOMContentLoaded', () => {
  document.querySelector('#quiz-container [onclick="autoFillRemainingQuestions()"]').hidden = true;
  const gate = document.createElement('dialog');
  gate.id = 'formal-profile-gate';
  gate.className = 'fl-dialog';
  gate.innerHTML = '<h2>確認使用進度</h2><p role="status"></p><button hidden>重新連線</button>';
  gate.addEventListener('cancel', event => event.preventDefault());
  gate.querySelector('button').onclick = loadFormalProfile;
  document.body.append(gate);
  const hint = document.createElement('p');
  hint.id = 'formal-profile-hint';
  hint.className = 'fl-profile-hint';
  document.querySelector('#app-shell header').append(hint);
  const confirm = confirmAndEnterApp;
  confirmAndEnterApp = async function() {
    if (!localProfileReady || onboardingBusy) return;
    if (!officialQuestions.every(q => formalQuizValid(q, userQuizAnswers[q.id]))) { confirm(); return; }
    const dev = currentSelectedDevCode;
    const sal = currentSelectedSalCode;
    onboardingBusy = true;
    const quiz = document.getElementById('screen-quiz-flow');
    quiz.inert = true;
    try {
      const data = await formalRequest('onboarding', { answers: userQuizAnswers, dev, sal });
      localRecords = data.records;
      savedCommunityDrafts = new Map(data.drafts.map(draft => [draft.building, draft]));
      currentSelectedDevCode = dev;
      currentSelectedSalCode = sal;
      confirm();
      hint.textContent = '已完成適性測驗';
      renderCommunityPanel();
      window.dispatchEvent(new Event('formal-profile-ready'));
    } catch (error) { showCustomToast(localMessage(error), '!'); }
    finally { onboardingBusy = false; quiz.inert = false; }
  };
  setupCommunityMap();
  setupCommunityReview();
  loadFormalProfile();
});
