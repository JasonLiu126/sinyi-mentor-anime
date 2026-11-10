const trainingStageLabels = ['房地交易試算', '出售費用與憑證', '自住優惠查證'];
const trainingPassed = new Set();
const trainingPending = new Set();
let legacyPending = null;
let publicTrainingPlayback;

function loadTraining() {
  try {
    const saved = JSON.parse(localStorage.getItem('sinyi-formal-training-v1'));
    if (!saved || !Array.isArray(saved.passed)) return;
    const valid = id => Number.isInteger(id) && id >= 0 && id < trainingStageLabels.length;
    for (const id of saved.passed.filter(valid)) trainingPassed.add(id + 1);
    legacyPending = valid(saved.pending) ? saved.pending + 1 : null;
  } catch { showCustomToast('無法讀取小學堂補課進度。', '!'); }
}

function renderTrainingNodes() {
  const active = currentSchoolDomain === 'tax' && currentSchoolRouteIndex === 0;
  trainingStageLabels.forEach((label, index) => {
    const stage = index + 1;
    const node = document.querySelector(`[onclick="launchSchoolStage(${stage})"]`);
    const caption = node.lastElementChild;
    caption.dataset.originalLabel ??= caption.textContent;
    const badge = node.firstElementChild;
    badge.dataset.originalLabel ??= badge.textContent;
    caption.textContent = active ? label : caption.dataset.originalLabel;
    badge.textContent = active
      ? trainingPending.has(stage) || legacyPending === stage ? '待補課' : trainingPassed.has(stage) ? '✓ 通過' : '待挑戰'
      : badge.dataset.originalLabel;
    node.setAttribute('aria-label', `第 ${stage} 關 ${caption.textContent}`);
  });
}

const trainingRequest = (id, action, data = {}) => formalRequest(`training/stages/${id}/${action}`, data);

async function showTrainingLesson(id) {
  if (!isQuizCompleted) return;
  const dialog = document.getElementById('fl-training-dialog');
  publicTrainingPlayback?.destroy();
  publicTrainingPlayback = null;
  if (!dialog.open) dialog.showModal();
  const content = dialog.querySelector('.fl-training-content');
  dialog.querySelector('h2').textContent = '第 ' + id + ' 關';
  const loading = document.createElement('p');
  loading.textContent = '正在載入關卡…';
  content.replaceChildren(loading);
  try {
    const lesson = await trainingRequest(id, 'open', { resumeRemediation: legacyPending === id });
    if (!dialog.open || !content.contains(loading)) return;
    if (legacyPending === id) legacyPending = null;
    renderTrainingLesson(id, content, lesson);
  } catch (error) {
    if (content.contains(loading)) loading.textContent = localMessage(error);
  }
}

function renderTrainingLesson(id, content, lesson) {
  content.closest('dialog').querySelector('h2').textContent = `第 ${id} 關 · ${lesson.title}`;
  if (lesson.state === 'remediation') {
    trainingPending.add(id);
    renderTrainingNodes();
    if (lesson.youtube) showPublicTrainingRemediation(id, content, lesson);
    else showTrainingRemediation(id, content, lesson.duration, lesson.clipLabel);
    return;
  }
  trainingPending.delete(id);
  renderTrainingNodes();
  content.innerHTML = `<p>${managerEscape(lesson.question)}</p><div class="fl-answer">${lesson.options.map((text, i) =>
    `<button type="button" data-option="${i}">${managerEscape(text)}</button>`).join('')}</div><p class="fl-result" role="status"></p>`;
  const options = content.querySelector('.fl-answer');
  options.addEventListener('click', async event => {
    const option = event.target.closest('[data-option]');
    if (!option) return;
    const buttons = options.querySelectorAll('button');
    buttons.forEach(button => { button.disabled = true; });
    try {
      const result = await trainingRequest(id, 'answer', { option: Number(option.dataset.option) });
      if (result.state === 'passed') trainingPassed.add(id);
      if (result.state === 'remediation') trainingPending.add(id);
      renderTrainingNodes();
      if (!content.contains(options)) return;
      if (result.state === 'remediation') return renderTrainingLesson(id, content, result);
      content.innerHTML = '<p role="status">答對了。</p>';
    } catch (error) {
      if (content.contains(options)) content.querySelector('.fl-result').textContent = localMessage(error);
      buttons.forEach(button => { button.disabled = false; });
    }
  });
}

async function retryTrainingLesson(id, content, retry, status) {
  retry.disabled = true;
  try {
    const lesson = await trainingRequest(id, 'retry');
    if (!content.contains(retry)) return;
    publicTrainingPlayback?.destroy();
    publicTrainingPlayback = null;
    renderTrainingLesson(id, content, lesson);
  } catch (error) {
    status.textContent = localMessage(error);
    retry.disabled = false;
  }
}

function showPublicTrainingRemediation(id, content, lesson) {
  content.innerHTML = `<p>看完${managerEscape(lesson.youtube.label)}，就能再答一次。</p>
    <div data-player></div>
    <button type="button" data-retry disabled>回到題目</button>
    <p class="fl-result" role="status"></p>`;
  const container = content.querySelector('[data-player]');
  const retry = content.querySelector('[data-retry]');
  const status = content.querySelector('.fl-result');
  retry.onclick = () => retryTrainingLesson(id, content, retry, status);
  status.textContent = '正在載入公開影片…';
  const useRecap = () => {
    if (!content.contains(container)) return;
    publicTrainingPlayback?.destroy();
    publicTrainingPlayback = null;
    showTrainingRemediation(id, content, lesson.duration, '備用補課短片');
    content.querySelector('.fl-result').textContent = '公開影片無法播放，可以看備用短片完成補課。';
  };
  trainingRequest(id, 'play').then(() => {
    if (!content.contains(container) || !content.closest('dialog').open) return;
    publicTrainingPlayback = mountPublicTrainingVideo(container, lesson.youtube, {
      onReady: () => { status.textContent = ''; },
      onError: useRecap,
      onIncomplete: () => { status.textContent = '請重新播放並完整看完補課片段。'; },
      onComplete: () => {
        retry.disabled = false;
        status.textContent = '補課完成，可以回到題目。';
      }
    });
  }).catch(useRecap);
}

function showTrainingRemediation(id, content, duration, clipLabel = '原課程片段') {
  content.innerHTML = `<p>這題需要補課。看完 ${duration} 秒的${managerEscape(clipLabel)}，就能再答一次。</p>
    <video playsinline preload="none" aria-label="補課短片"></video>
    <button type="button" data-play class="fl-primary">播放短片</button>
    <button type="button" data-retry disabled>回到題目</button>
    <p class="fl-result" role="status"></p>`;
  const video = content.querySelector('video');
  const play = content.querySelector('[data-play]');
  const retry = content.querySelector('[data-retry]');
  const status = content.querySelector('.fl-result');
  let furthest = 0;
  video.addEventListener('contextmenu', event => event.preventDefault());
  video.addEventListener('ratechange', () => { if (video.playbackRate !== 1) video.playbackRate = 1; });
  video.addEventListener('timeupdate', () => {
    if (!video.seeking) furthest = Math.max(furthest, video.currentTime);
  });
  video.addEventListener('seeking', () => { if (video.currentTime > furthest + 0.25) video.currentTime = furthest; });
  video.addEventListener('play', () => { play.textContent = '暫停短片'; });
  video.addEventListener('pause', () => { play.textContent = '繼續播放'; });
  video.addEventListener('ended', () => {
    const played = video.played;
    if (played.length === 1 && played.start(0) < 0.2 && played.end(0) >= video.duration - 0.3) {
      retry.disabled = false;
      play.disabled = true;
      status.textContent = '補課完成，可以回到題目。';
    } else {
      furthest = 0;
      video.currentTime = 0;
      status.textContent = '請從頭完整觀看。';
    }
  });
  video.addEventListener('error', () => { status.textContent = '短片暫時無法播放，請重新載入後再試。'; });
  play.onclick = async () => {
    if (!video.paused) { video.pause(); return; }
    play.disabled = true;
    try {
      if (!video.getAttribute('src')) {
        const media = await trainingRequest(id, 'play');
        if (!content.contains(video)) return;
        video.src = media.url;
      }
      await video.play();
    } catch { status.textContent = '短片暫時無法播放，請再試一次。'; }
    finally { play.disabled = false; }
  };
  retry.onclick = () => retryTrainingLesson(id, content, retry, status);
}

window.addEventListener('DOMContentLoaded', () => {
  loadTraining();
  const baseLaunch = launchSchoolStage;
  launchSchoolStage = function(stage) {
    if (currentSchoolDomain === 'tax' && currentSchoolRouteIndex === 0 && trainingStageLabels[stage - 1]) {
      return showTrainingLesson(stage);
    }
    return baseLaunch(stage);
  };
  const baseRenderRoutes = renderSchoolRoutes;
  renderSchoolRoutes = function() { baseRenderRoutes(); renderTrainingNodes(); };
  for (let stage = 1; stage <= trainingStageLabels.length; stage++) {
    const node = document.querySelector(`[onclick="launchSchoolStage(${stage})"]`);
    node.tabIndex = 0;
    node.setAttribute('role', 'button');
    node.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); node.click(); }
    });
  }
  const dialog = document.createElement('dialog');
  dialog.id = 'fl-training-dialog';
  dialog.className = 'fl-dialog';
  dialog.innerHTML = '<div class="fl-heading"><h2></h2><button type="button">返回小學堂</button></div><div class="fl-panel fl-training-content"></div>';
  document.body.append(dialog);
  dialog.querySelector('button').onclick = () => dialog.close();
  dialog.addEventListener('close', () => {
    if (dialog.open) return;
    publicTrainingPlayback?.destroy();
    publicTrainingPlayback = null;
    dialog.querySelector('video')?.pause();
    dialog.querySelector('.fl-training-content').replaceChildren();
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) return;
    dialog.querySelector('video')?.pause();
    publicTrainingPlayback?.pause();
  });
  renderTrainingNodes();
  window.addEventListener('formal-profile-ready', async () => {
    if (!isQuizCompleted) return;
    try {
      const { stages } = await formalRequest('training/progress');
      for (const { stage, passed, pending } of stages) {
        if (passed) trainingPassed.add(stage);
        if (pending) trainingPending.add(stage);
        if (legacyPending === stage) legacyPending = null;
      }
      renderTrainingNodes();
    } catch (error) { showCustomToast(localMessage(error), '!'); }
  });
});
