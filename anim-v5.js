/* =========================================================
   V5 六段動畫：召喚（A）、融合（B）、升星（C）、任務完成（D）、升級（E）、職業覺醒（F）
   - 結果一律由既有邏輯決定；動畫只在拿到結果之後演出，結束後接回既有結果畫面。
   - 每段提供 playXxxAnimation(...) → Promise。
   - 右上角「跳過 ▶▶」直接到最後一格；prefers-reduced-motion 時直接顯示最後一格。
   - 只用 CSS（transform／opacity）與 SVG。
   ========================================================= */
const V5_REDUCED = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const V5_RARITY_COLOR = { SSR: '#F2B544', SR: '#A070E0', R: '#4C8FD6', N: '#8A7A66' };
let v5Chain = Promise.resolve();
let v5Holding = 0;
let v5Held = [];
let v5LastCost = 0;

const v5Wait = ms => new Promise(r => setTimeout(r, ms));

// 依序播放（避免兩段動畫重疊）；任務完成時先暫存升級，讓 D 在 E 之前
function v5Enqueue(fn, { front = false } = {}) {
  if (v5Holding) { if (front) v5Held.unshift(fn); else v5Held.push(fn); return Promise.resolve(); }
  const run = v5Chain.then(fn, fn);
  v5Chain = run.catch(() => {});
  return run;
}
function v5Hold() { v5Holding++; }
function v5Release() {
  v5Holding = Math.max(0, v5Holding - 1);
  if (!v5Holding) { const held = v5Held; v5Held = []; held.forEach(v5Enqueue); }
}

/* ---------- 播放器 ---------- */
// frames: [{ html, ms }]，最後一格等待使用者按鈕（data-v5-close / data-v5-action）
function v5Play(name, frames, { onFrame } = {}) {
  return new Promise(resolve => {
    const stage = document.createElement('div');
    stage.className = `v5-stage v5-${name}`;
    stage.setAttribute('role', 'dialog');
    stage.setAttribute('aria-modal', 'true');
    stage.innerHTML = '<div class="v5-screen"><button type="button" class="v5-skip">跳過 ▶▶</button><div class="v5-frame"></div></div>';
    document.body.appendChild(stage);
    const frameEl = stage.querySelector('.v5-frame');
    const skipBtn = stage.querySelector('.v5-skip');
    let index = -1, timer = null, done = false;

    const finish = action => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      stage.classList.add('is-leaving');
      setTimeout(() => stage.remove(), 220);
      resolve(action || 'close');
    };
    const show = i => {
      index = i;
      clearTimeout(timer);
      const frame = frames[i];
      frameEl.innerHTML = frame.html;
      frameEl.className = `v5-frame v5-f${i + 1}`;
      skipBtn.hidden = i === frames.length - 1;
      onFrame?.(i, frameEl, { next: () => index === i && show(i + 1), finish });
      if (i < frames.length - 1 && frame.ms) timer = setTimeout(() => show(i + 1), frame.ms);
    };
    skipBtn.addEventListener('click', () => show(frames.length - 1));
    stage.addEventListener('click', event => {
      const btn = event.target.closest('[data-v5-close], [data-v5-action]');
      if (btn) { finish(btn.dataset.v5Action || 'close'); return; }
      const adv = event.target.closest('[data-v5-next]');
      if (adv && index < frames.length - 1) show(index + 1);
    });
    stage.addEventListener('keydown', e => { if (e.key === 'Escape') show(frames.length - 1); });
    show(V5_REDUCED() ? frames.length - 1 : 0);
    skipBtn.focus({ preventScroll: true });
  });
}

const v5Rays = cls => `<div class="v5-rays ${cls || ''}" aria-hidden="true"></div>`;
const v5Img = (src, cls, alt = '') => src ? `<img class="${cls}" src="${v4Esc(src)}" alt="${v4Esc(alt)}">` : '';

/* ---------- D 任務完成・開寶箱 ---------- */
function playQuestCompleteAnimation({ title = '', coins = 0, exp = 0, tier = 'wood' } = {}) {
  const chest = `<div class="v5-chest is-${tier}" aria-hidden="true"><i class="v5-chest-lid"></i><i class="v5-chest-body"></i></div>`;
  const rewards = `<div class="v5-rewards">${exp ? `<span class="is-exp">☆ +${exp} EXP</span>` : ''}${coins ? `<span class="is-coin">🪙 +${coins}</span>` : ''}</div>`;
  return v5Play('quest', [
    { ms: 600, html: `<p class="v5-caption v5-serif">${v4Esc(title)}</p><div class="v5-stamp v5-en">COMPLETE</div>` },
    { html: `<p class="v5-caption v5-serif">${v4Esc(title)}</p><button type="button" class="v5-chest-btn" data-v5-next aria-label="打開寶箱">${chest}</button><p class="v5-hint">點寶箱開啟</p>` },
    { html: `${v5Rays('is-gold')}<div class="v5-chest-open">${chest.replace('v5-chest ', 'v5-chest is-open ')}<div class="v5-beam"></div></div>${rewards}
      <button type="button" class="v4-btn-gold v5-btn" data-v5-fly>收下</button>` }
  ], {
    onFrame: (i, el, api) => {
      if (i !== 2) return;
      // D4：獎勵飛向 HUD，HUD 的 EXP 條與金幣已由既有邏輯更新
      el.querySelector('[data-v5-fly]')?.addEventListener('click', () => {
        el.querySelectorAll('.v5-rewards span').forEach(s => s.classList.add('is-fly'));
        setTimeout(() => api.finish('close'), V5_REDUCED() ? 0 : 520);
      }, { once: true });
    }
  });
}

/* ---------- E 升級 ---------- */
function playLevelUpAnimation({ from, to } = {}) {
  const art = v4ClassArt(v4DevCode());
  return v5Play('levelup', [
    { ms: 1600, html: `${v5Rays('is-teal')}<div class="v5-lv-title v5-en">LEVEL UP</div>${v5Img(art, 'v5-hero is-glow')}
      <div class="v5-lv-flip v5-en"><span class="is-old">Lv.${from}</span><b>→</b><span class="is-new">Lv.${to}</span></div>` },
    { html: `<div class="v5-lv-title v5-en">Lv.${to}</div><p class="v5-caption v5-serif">能力成長</p>
      <div class="v5-radar">${typeof v4RadarSVG === 'function' ? v4RadarSVG() : ''}</div>
      <button type="button" class="v4-btn-gold v5-btn" data-v5-close>繼續冒險</button>` }
  ]);
}

/* ---------- F 職業覺醒 ---------- */
function playAwakeningAnimation({ dev = 'A', sal = 'E' } = {}) {
  const codes = Object.keys(V4_CLASSES);
  const ring = codes.map((code, i) => `<span class="v5-wheel-item ${code === dev || code === sal ? 'is-pick' : ''}" style="--i:${i}">${v5Img(v4ClassArt(code), '')}</span>`).join('');
  return v5Play('awaken', [
    { ms: 1600, html: `<p class="v5-caption v5-serif">命運之輪轉動中…</p><div class="v5-wheel">${ring}</div>` },
    { ms: 1100, html: `<div class="v5-pillar"></div>${v5Img(v4ClassArt(dev), 'v5-hero is-silhouette')}` },
    { html: `<div class="v5-pillar"></div>${v5Img(v4ClassArt(dev), 'v5-hero is-reveal')}
      <p class="v5-awaken-name v5-serif">${v4ClassOf(dev).name}</p><p class="v5-hint">銷售之道：${v4ClassOf(sal).name}</p>
      <button type="button" class="v4-btn-gold v5-btn" data-v5-close>查看職業</button>` }
  ]);
}

/* ---------- A 召喚 ---------- */
function playSummonAnimation(results = [], { cost = 0 } = {}) {
  const list = results.map(r => ({ id: r.id, name: r.name, rarity: r.rarity || 'R', isNew: !r.isDuplicate, quote: r.quote || '', art: v4FigArt(r.id) }));
  const order = { SSR: 3, SR: 2, R: 1, N: 0 };
  const top = list.reduce((a, b) => (order[b.rarity] > order[a.rarity] ? b : a), list[0] || { rarity: 'R' });
  const ssr = list.find(r => r.rarity === 'SSR');
  const cards = list.map((r, i) => `<button type="button" class="v5-card r-${r.rarity.toLowerCase()}" style="--i:${i};--n:${list.length}" data-v5-card="${i}" aria-label="翻開第 ${i + 1} 張">
      <span class="v5-card-back"></span><span class="v5-card-face">${v5Img(r.art, '')}<b>${v4Esc(r.name)}</b><em class="v4-en">${r.rarity}</em>${r.isNew ? '<i class="v5-new">NEW</i>' : ''}</span></button>`).join('');
  const frames = [
    { ms: 800, html: `<div class="v5-circle"><i></i><i></i><i></i></div>${cost ? `<p class="v5-cost v5-en">🪙 −${cost}</p>` : ''}` },
    { ms: 800, html: `<div class="v5-circle is-dim"><i></i><i></i><i></i></div><div class="v5-pillar" style="--c:${V5_RARITY_COLOR[top.rarity]}"></div>` },
    { ms: 800, html: `<div class="v5-cards is-fly">${cards}</div>` },
    { html: `<div class="v5-cards">${cards}</div><div class="v5-actions"><button type="button" class="v4-btn-ghost v5-btn" data-v5-flipall>全部翻開</button>
      <button type="button" class="v4-btn-gold v5-btn" data-v5-next disabled>${ssr ? '看 SSR' : '查看結果'}</button></div>` }
  ];
  if (ssr) frames.push({ html: `${v5Rays('is-gold')}${v5Img(ssr.art, 'v5-hero is-pop')}${ssr.isNew ? '<i class="v5-new is-big v5-en">NEW</i>' : ''}
      <p class="v5-awaken-name v5-serif">${v4Esc(ssr.name)}</p><p class="v5-quote">${v4Esc(ssr.quote)}</p><button type="button" class="v4-btn-gold v5-btn" data-v5-next>查看結果</button>` });
  frames.push({ html: `<p class="v5-caption v5-serif">召喚完成</p><div class="v5-cards is-done">${cards}</div><button type="button" class="v4-btn-gold v5-btn" data-v5-close>查看結果</button>` });

  return v5Play('summon', frames, {
    onFrame: (i, el) => {
      const flipStage = 3;
      if (i < flipStage) return;
      const all = [...el.querySelectorAll('.v5-card')];
      if (i > flipStage) { all.forEach(c => c.classList.add('is-flipped')); return; }
      const nextBtn = el.querySelector('[data-v5-next]');
      const check = () => { if (all.every(c => c.classList.contains('is-flipped'))) nextBtn.disabled = false; };
      all.forEach(c => c.addEventListener('click', () => { c.classList.add('is-flipped'); check(); }));
      el.querySelector('[data-v5-flipall]')?.addEventListener('click', async () => {
        // 非 SSR 先翻、SSR 最後翻；每張 0.3 秒
        const sorted = all.filter(c => !c.classList.contains('r-ssr')).concat(all.filter(c => c.classList.contains('r-ssr')));
        for (const c of sorted) { if (!c.classList.contains('is-flipped')) { c.classList.add('is-flipped'); await v5Wait(V5_REDUCED() ? 0 : 120); } }
        check();
      });
    }
  });
}

/* ---------- C 升星進化 ---------- */
function playStarUpAnimation({ id, from, to } = {}) {
  const info = v4FigInfo(id);
  const evo = v4Safe(() => globalThis.characterEvolutionCatalog[id], null) || v4Safe(() => globalThis.superSalesCatalog.find(f => f.id === id), null);
  const outfit = evo?.names?.[to - 1] || '';
  // 依星等取舊／新造型（托尼等拼圖式進化圖用 SVG 裁出對應那一格）
  const art = (n, cls) => v4FigArtHTML(id, { stars: n, cls, alt: info?.name || '' });
  const stars = n => Array.from({ length: info?.maxStars || 5 }, (_, k) => `<i class="${k < n ? 'on' : ''} ${k === to - 1 ? 'is-new' : ''}">★</i>`).join('');
  return v5Play('starup', [
    { ms: 1000, html: `<div class="v5-frags">${'<i>💎</i>'.repeat(5)}</div>${art(from, 'v5-hero')}<div class="v5-stars">${stars(to)}</div>` },
    { ms: 1100, html: `${art(from, 'v5-hero is-dissolve')}${art(to, 'v5-hero is-scan')}<div class="v5-stars">${stars(to)}</div>` },
    { html: `${v5Rays('is-purple')}${art(to, 'v5-hero')}<p class="v5-awaken-name v5-serif">${v4Esc(info?.name || '')}</p>
      <ul class="v5-gains"><li>星等 <b>${to}★</b></li>${outfit ? `<li>新外觀 <b>${v4Esc(outfit)}</b></li>` : ''}</ul>
      <div class="v5-actions"><button type="button" class="v4-btn-ghost v5-btn" data-v5-close>關閉</button><button type="button" class="v4-btn-gold v5-btn" data-v5-action="lobby">回到主城看看</button></div>` }
  ]);
}

/* ---------- B 融合 ---------- */
function playFusionAnimation({ success, results = [] } = {}) {
  if (!success) {
    return v5Play('fusion', [
      { html: `<div class="v5-failed v5-en">FAILED</div><p class="v5-caption v5-serif">融合失敗</p><p class="v5-hint">本次投入的素材 IP ×2 已消耗</p>
        <div class="v5-mentor v4-parch"><img src="${V4_ASSET}mentor_face.jpg" alt="阿義學長"><p>差一點點！再收集素材試一次吧。</p></div>
        <button type="button" class="v4-btn-gold v5-btn" data-v5-close>再試一次</button>` }
    ]);
  }
  const heroes = results.map((r, i) => `<span class="v5-heir" style="--i:${i}">${v5Img(v4FigArt(r.id), '')}<em class="v4-en">${r.rarity || 'SSR'}</em><b>${v4Esc(r.name)}</b></span>`).join('');
  return v5Play('fusion', [
    { ms: 1000, html: `<div class="v5-vortex"><i></i><i></i><span class="v5-orb is-a"></span><span class="v5-orb is-b"></span></div>` },
    { ms: 800, html: `<div class="v5-flash"></div><div class="v5-silhouettes">${heroes}</div>` },
    { html: `${v5Rays('is-gold')}<div class="v5-success v5-en">SUCCESS</div><div class="v5-heirs">${heroes}</div>
      <div class="v5-actions"><button type="button" class="v4-btn-ghost v5-btn" data-v5-close>收下</button><button type="button" class="v4-btn-gold v5-btn" data-v5-action="party">放到主城</button></div>` }
  ]);
}

/* ---------- 接到既有流程 ---------- */
function v5TierOf(slot) {
  const tag = String(slot?.tag || '');
  const n = parseInt((tag.match(/\d+/) || ['1'])[0], 10);
  if (tag.startsWith('隱藏') || n >= 3) return 'gold';
  return n === 2 ? 'silver' : 'wood';
}

window.addEventListener('DOMContentLoaded', () => {
  const wrap = (name, make) => {
    if (typeof window[name] !== 'function') return;
    const original = window[name];
    window[name] = make(original);
  };

  // D：任務被判定完成（含社區勘查開寶箱 → markCommunityTarget → submitCurrentTaskDemo）
  wrap('submitCurrentTaskDemo', original => function (...args) {
    const slot = v4Safe(() => activeTaskInModal.slot, null);
    const wasDone = !!slot?.isCompleted;
    v5Hold();
    let result;
    try { result = original.apply(this, args); }
    finally {
      if (slot && !wasDone && slot.isCompleted) {
        v5Enqueue(() => playQuestCompleteAnimation({ title: slot.title, coins: slot.rewardCoins || 150, exp: slot.rewardExp || 20, tier: v5TierOf(slot) }), { front: true });
      }
      v5Release();
    }
    return result;
  });

  // E：經驗條滿（整體等級提升）
  wrap('addCapabilityExp', original => function (...args) {
    const from = parseInt(document.getElementById('header-user-level')?.textContent || '1', 10);
    const result = original.apply(this, args);
    const to = parseInt(document.getElementById('header-user-level')?.textContent || '1', 10);
    if (to > from) v5Enqueue(() => playLevelUpAnimation({ from, to }));
    return result;
  });

  // F：最後一題完成後、職業揭曉之前
  wrap('navigateQuiz', original => function (step, ...rest) {
    const finishing = step > 0 && v4Safe(() => currentQuizIndex, 0) === v4Safe(() => officialQuestions.length - 1, 12);
    const result = original.call(this, step, ...rest);
    const valid = v4Safe(() => officialQuestions.every(q => formalQuizValid(q, userQuizAnswers[q.id])), true);
    if (finishing && valid) v5Enqueue(() => playAwakeningAnimation({ dev: v4Safe(() => currentSelectedDevCode, 'A'), sal: v4Safe(() => currentSelectedSalCode, 'D') }));
    return result;
  });

  // A 召喚／B 融合成功：結果已由既有邏輯產生，動畫播完才開既有結果畫面
  wrap('showGachaRevealModal', original => function (results, mode = 'gacha', ...rest) {
    const self = this;
    const list = Array.isArray(results) ? results : [];
    v5Enqueue(async () => {
      const cost = mode === 'gacha' ? v5LastCost : 0; // 於下一個 microtask 讀取，此時 pullExecutiveGacha 已回傳
      const action = mode === 'fusion' ? await playFusionAnimation({ success: true, results: list }) : await playSummonAnimation(list, { cost });
      original.call(self, results, mode, ...rest);
      v5DecorateReveal(mode, list);
      if (action === 'party' && list[0]) {
        v4PartySet([list[0].id, ...v4PartyGet().filter(id => id !== list[0].id)]);
        showCustomToast(`${list[0].name} 成為隊長，回主城看看吧！`, '🏰');
      }
    });
  });

  // A1：記下這次實際扣掉的金幣（用券時為 0）
  wrap('pullExecutiveGacha', original => function (...args) {
    const before = v4Safe(() => userCoins, 0);
    v5LastCost = 0;
    const result = original.apply(this, args);
    v5LastCost = Math.max(0, before - v4Safe(() => userCoins, before));
    return result;
  });

  // B 融合失敗
  wrap('setFamilyFusionStage', original => function (stage, ...rest) {
    const result = original.call(this, stage, ...rest);
    if (stage === 'failure') v5Enqueue(() => playFusionAnimation({ success: false }));
    return result;
  });

  // C 升星
  wrap('upgradeFigurineStars', original => function (figId, ...rest) {
    const before = v4Safe(() => userWarehouse.find(w => w.id === figId).stars, 0);
    const result = original.call(this, figId, ...rest);
    const after = v4Safe(() => userWarehouse.find(w => w.id === figId).stars, 0);
    if (after > before) {
      v5Enqueue(async () => {
        const action = await playStarUpAnimation({ id: figId, from: before, to: after });
        if (action === 'lobby') { closeModal('modal-figurine-detail'); switchTab('tab-lobby'); }
      });
    }
    return result;
  });
});

// A6：既有結果畫面補「再十連」「編入隊伍」
function v5DecorateReveal(mode, list) {
  const modal = document.getElementById('modal-gacha-reveal');
  const panel = modal?.firstElementChild;
  if (!panel) return;
  panel.querySelector('.v5-reveal-actions')?.remove();
  if (mode !== 'gacha') return;
  const row = document.createElement('div');
  row.className = 'v5-reveal-actions';
  row.innerHTML = `<button type="button" class="v4-btn-red" data-again>再${list.length >= 10 ? '十連' : '抽一次'}</button><button type="button" class="v4-btn-ghost" data-party>編入隊伍</button>`;
  row.querySelector('[data-again]').onclick = () => { closeModal('modal-gacha-reveal'); pullExecutiveGacha(list.length >= 10 ? 10 : 1); };
  row.querySelector('[data-party]').onclick = () => { closeModal('modal-gacha-reveal'); switchTab('tab-showcase'); document.getElementById('v4-party')?.scrollIntoView({ block: 'start' }); };
  panel.appendChild(row);
}
