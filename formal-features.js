// Functional port from the anime edition. Existing formal screens and styles stay intact.
let formalReturnFocus=null,formalDrafts=new Map();
let formalMentorQuestId='';
const formalQuizKey='sinyi-rpg-formal-aptitude-v1';
let formalQuizReady=false,formalQuizBlocked=false;
function formalCaptureRuntime(){return {routes:Object.fromEntries(Object.entries(routeTasksData).map(([key,route])=>[key,route.slots.map(s=>({id:s.id,done:!!s.isCompleted,ongoing:!!s.isOngoing}))])),scores:Object.fromEntries(Object.entries(handbookDatabase).map(([key,group])=>[key,Object.fromEntries(group.items.map(i=>[i.key,i.score]))]))};}
function formalValidateRuntime(raw){
  if(!raw||!raw.routes||!raw.scores)throw Error('進度格式不正確');
  const clean={routes:{},scores:{}};
  for(const [key,route] of Object.entries(routeTasksData)){const rows=raw.routes[key];if(!Array.isArray(rows)||rows.length!==route.slots.length||new Set(rows.map(r=>r.id)).size!==rows.length)throw Error('任務進度不正確');clean.routes[key]=rows.map(r=>{if(!route.slots.some(s=>s.id===r.id)||typeof r.done!=='boolean'||typeof r.ongoing!=='boolean')throw Error('任務進度不正確');return {id:r.id,done:r.done,ongoing:r.ongoing};});}
  for(const [key,group] of Object.entries(handbookDatabase)){clean.scores[key]={};for(const item of group.items){const n=raw.scores[key]?.[item.key];if(!Number.isSafeInteger(n)||n<0||n>9999999)throw Error('能力分數不正確');clean.scores[key][item.key]=n;}}
  return clean;
}
function formalRestoreRuntime(raw){
  const runtime=formalValidateRuntime(raw);
  for(const [key,rows] of Object.entries(runtime.routes)){
    const route=routeTasksData[key];for(const row of rows){const slot=route.slots.find(s=>s.id===row.id);slot.isCompleted=row.done;slot.isOngoing=row.ongoing;if(row.done)slot.desc='✅ 已圓滿完成該任務檢核與日報登錄';}
    if(!rows.some(r=>r.done))continue;
    const next=route.slots.find(s=>!s.isCompleted&&!s.isHidden);
    if(next){Object.assign(route.hero,{title:next.title,desc:`目標：${next.desc}，點擊下方按鈕即可開啟檢核與執行。`,badge:`${next.tag}｜進行中`,time:'接取於 剛才',cond:'完成該課題各項指標登錄',reward:`🪙 ${next.rewardCoins||150} 盲盒幣 ｜ 經驗 EXP +${next.rewardExp||20}`,actionText:`📋 立即執行【${next.tag}】`});}
    else Object.assign(route.hero,{title:`恭喜！【${key==='dev'?'社區深耕':key==='sal'?'既有人脈':'冒險基本功'}】今日挑戰全數達成！`,badge:'🏆 路線全通關',time:'本日進度達標',desc:'你已奠定紮實的新人實戰經驗，可前往「修練學院」或「信義地圖」探索更多案源。',cond:'本日所有挑戰皆已通關領獎',reward:'✨ 達成每日大滿貫成就！',actionText:'🎓 前往修練學院對練'});
  }
  for(const [key,scores] of Object.entries(runtime.scores))for(const item of handbookDatabase[key].items)item.score=scores[item.key];
  renderHandbookUI();switchRoute(currentActiveRouteKey);
}
function formalOpen(id){
  formalReturnFocus=document.activeElement;closeTestAdmin();
  document.getElementById(id).classList.remove('hidden');
  document.getElementById('app-shell').inert=true;
  document.getElementById(id).querySelector('button')?.focus();
  if(id==='formal-journey-modal')document.getElementById('mentor-float')?.setAttribute('aria-expanded','true');
}
function formalClose(id){document.getElementById(id).classList.add('hidden');if(id==='formal-journey-modal')document.getElementById('mentor-float')?.setAttribute('aria-expanded','false');const remaining=[...document.querySelectorAll('.formal-feature-modal')].filter(n=>!n.hidden&&!n.classList.contains('hidden')).sort((a,b)=>Number(getComputedStyle(b).zIndex)-Number(getComputedStyle(a).zIndex));document.getElementById('app-shell').inert=remaining.length>0;if(remaining.length)remaining[0].querySelector('button')?.focus();else formalReturnFocus?.focus();}
function hunterHome(){hunterRender();formalOpen('formal-journey-modal');}
function formalMentorToggle(){if(Date.now()<mentorSuppressClickUntil)return;if(document.getElementById('formal-journey-modal').classList.contains('hidden'))hunterHome();else formalClose('formal-journey-modal');}
function formalMentorBegin(){const context=mentorContext();if(context.target==='busy'){formalMentorOpen('busy');return;}hunterSetFilter(context.target==='skipped'?'skipped':'todo');const input=context.target==='journal'?document.getElementById('hunter-journal'):document.querySelector('#hunter-quest-list textarea');if(input){for(let p=input.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;input.scrollIntoView({block:'center',behavior:'smooth'});input.focus({preventScroll:true});}}
function formalMentorUseAdvice(){formalClose('formal-mentor-modal');hunterHome();hunterSetFilter('todo');const input=document.getElementById('hunter-note-'+formalMentorQuestId)||document.querySelector('#hunter-quest-list textarea');if(input){input.scrollIntoView({block:'center'});input.focus({preventScroll:true});}}
function hunterAnimate(title,detail){showCustomToast(detail,title==='LEVEL UP'?'⬆':'✓');}
function hunterRender(){
  if(!hunterState)return;
  for(const input of document.querySelectorAll('#hunter-quest-list textarea'))formalDrafts.set(hunterDay()+'/'+input.id,input.value);
  const today=hunterToday(),quests=hunterQuests().filter(q=>(today.tasks[q.id]?.status||'todo')===hunterFilter);
  document.getElementById('formal-journey-summary').textContent=`第 ${hunterJourneyDay()} / 66 天 · 已達標 ${hunterCompletedDays().length} 天 · 連續 ${hunterStreak()} 天`;
  document.getElementById('formal-daily-count').textContent=`今日完成 ${Object.values(today.tasks).filter(t=>t.status==='done').length} / 3 項（完成 2 項即可達標）`;
  document.getElementById('hunter-quest-list').innerHTML=quests.map(q=>{const task=today.tasks[q.id],done=task?.status==='done';return `<article><h3>${hunterEscape(done?(task.title||q.name):q.name)}</h3><p>${hunterEscape(q.desc)}</p><small>EXP +${done?(task.xp||15):q.xp} · 金幣 +30</small>${done?`<p>✓ ${hunterEscape(task.note)}</p>`:`<label>行動紀錄<textarea id="hunter-note-${q.id}" maxlength="500" rows="2" placeholder="記下一項實際行動或收穫，至少 4 字。">${hunterEscape(formalDrafts.get(hunterDay()+'/hunter-note-'+q.id)||task?.note||'')}</textarea></label><div class="ff-actions"><button onclick="hunterSubmitQuest('${q.id}','done')">${task?.status==='skipped'?'補做並領取獎勵':'完成並領取獎勵'}</button><button onclick="hunterSubmitQuest('${q.id}','skipped')" ${task?.status==='skipped'?'disabled':''}>今日略過</button><button onclick="formalMentorOpen('${q.id==='client'?'opening':'start'}','${q.id}')">學長提示</button></div>`}</article>`;}).join('')||'<p>目前沒有這類練習。</p>';
  const stats=hunterStats();document.getElementById('formal-stats').textContent=`洞察 ${stats.field} · 交涉 ${stats.client} · 專業 ${stats.knowledge}`;
  document.getElementById('hunter-milestones').innerHTML=hunterMilestones.map(n=>`<button onclick="hunterClaimMilestone(${n})" ${hunterState.milestones.includes(n)||hunterCompletedDays().length<n?'disabled':''}>${n} 天 · ${hunterState.milestones.includes(n)?'已領取':`抽卡券 +${n===66?10:n===42?5:3}`}</button>`).join('');
  const completed=new Set(hunterCompletedDays());document.getElementById('hunter-calendar').innerHTML=Array.from({length:66},(_,i)=>{const date=new Date((hunterOrdinal(hunterState.start)+i)*86400000).toISOString().slice(0,10);return `<span class="${completed.has(date)?'ff-secured':''}" title="${date}">${i+1}</span>`;}).join('');
  const journal=document.getElementById('hunter-journal');if(document.activeElement!==journal)journal.value=today.journal;
  if(document.activeElement!==document.getElementById('hunter-mood'))document.getElementById('hunter-mood').value=today.mood;
  const context=mentorContext();document.getElementById('formal-mentor-next').textContent=context.title+' '+context.body;
  hunterTick();
}
function formalMentorOpen(topic='start',questId=''){
  if(!Object.hasOwn(mentorTopics,topic))return;
  const data=mentorTopics[topic],quest=hunterQuests().find(q=>q.id===questId);
  formalMentorQuestId=quest?.id||'';
  let steps=data.steps;
  if(quest&&topic==='start'){
    if(quest.id==='knowledge')steps=['從修練學院選一個今天想弄懂的小主題，先設定 10 分鐘專注。','用自己的話記住一個重點，再想想：客戶可能會怎麼問？','回來記下一句收穫，或一個想再請教店長的問題。'];
    if(quest.id==='field')steps=hunterState.path==='luxury'?['先找一筆公開的豪宅物件或成交資料，記下它的特色。','比較位置、格局與服務機能，選一點你覺得有差異的地方。','用一句話說明：這個特色適合哪一種居住需求？']:hunterState.path==='network'?['從自己熟悉的一位人脈開始，先整理你記得的需求。','想一個自然的關心切入點，先了解近況，不急著推銷。','寫下你想了解的一個問題，作為下一次聯繫的起點。']:['選一棟附近社區，從外觀、周邊機能與公開資訊開始認識。','觀察一個細節：出入口、生活機能，或社區的特色。','用一句話記下發現，再留一個明天想繼續了解的問題。'];
  }

  document.getElementById('formal-mentor-content').innerHTML=`<h3>${hunterEscape(data.title)}</h3><p>${quest?'本次練習：'+hunterEscape(quest.name)+'。':''}${hunterEscape(data.body)}</p><ol>${steps.map(s=>`<li>${hunterEscape(s)}</li>`).join('')}</ol><blockquote>${hunterEscape(data.line)}</blockquote>`;
  formalOpen('formal-mentor-modal');
}
function formalQuizValid(q,answer){const keys=q.options.map(o=>o.key);return q.type==='single'?keys.includes(answer):Array.isArray(answer)&&answer.length===q.targetCount&&new Set(answer).size===answer.length&&answer.every(k=>keys.includes(k));}
function formalQuizSave(){if(!formalQuizReady||formalQuizBlocked)return;try{localStorage.setItem(formalQuizKey,JSON.stringify({version:1,answers:userQuizAnswers,index:currentQuizIndex,complete:officialQuestions.every(q=>formalQuizValid(q,userQuizAnswers[q.id]))&&isQuizCompleted,accessGranted:isQuizCompleted,dev:currentSelectedDevCode,sal:currentSelectedSalCode}));}catch{showCustomToast('測驗尚未儲存，請保持頁面開啟。','!');}}
function formalQuizOpen(restart=false){
  closeTestAdmin();
  for(const modal of document.querySelectorAll('.formal-feature-modal')){if(modal.id==='mt-dialog')modal.hidden=true;else modal.classList.add('hidden');}
  document.getElementById('app-shell').inert=false;document.getElementById('mentor-float')?.setAttribute('aria-expanded','false');
  for(const id of ['tasks','map','handbook','showcase','academy'])document.getElementById('tab-'+id).classList.add('hidden');
  if(restart){userQuizAnswers={};currentQuizIndex=0;}else if(isQuizCompleted)currentQuizIndex=0;
  document.getElementById('screen-quiz-flow').classList.remove('hidden');renderQuizQuestion();
  document.getElementById('app-main-scroll').scrollTo({top:0});
  const title=document.getElementById('quiz-question-title');title.setAttribute('tabindex','-1');title.focus({preventScroll:true});
}
function formalMakeModal(id,title,body){const node=document.createElement('div');node.id=id;node.className='formal-feature-modal hidden';node.setAttribute('role','dialog');node.setAttribute('aria-modal','true');node.setAttribute('aria-labelledby',id+'-title');node.innerHTML=`<div class="ff-panel"><div class="ff-heading"><h2 id="${id}-title">${title}</h2><button onclick="formalClose('${id}')" aria-label="關閉${title}">✕</button></div><div class="ff-body">${body}</div></div>`;document.body.appendChild(node);node.addEventListener('click',e=>{if(e.target===node)formalClose(id);});node.addEventListener('keydown',e=>{if(e.key==='Escape'){formalClose(id);return;}if(e.key!=='Tab')return;const a=[...node.querySelectorAll('button,input,textarea,select,summary')].filter(n=>!n.disabled&&n.getClientRects().length);if(e.shiftKey&&document.activeElement===a[0]){e.preventDefault();a.at(-1)?.focus();}else if(!e.shiftKey&&document.activeElement===a.at(-1)){e.preventDefault();a[0]?.focus();}});return node;}
window.addEventListener('DOMContentLoaded',()=>{
  const links=document.createElement('section');links.id='formal-feature-links';links.innerHTML='<h3>成長與帶教功能</h3><div class="ta-actions"><button onclick="hunterHome()">66 天成長練習</button><button onclick="formalMentorOpen()">學長引導</button><button onclick="formalQuizOpen()">適性測驗</button></div>';document.querySelector('#test-admin-modal .ta-body').prepend(links);
  formalMakeModal('formal-journey-modal','阿義學長',`<div class="ff-mentor-intro"><img src="./mentor-chibi.png" alt="Q 版阿義學長"><div><b>每一小步，學長陪你走</b><p>今天先完成一件小事。</p></div></div><p id="formal-journey-summary"></p><p id="formal-daily-count"></p><p id="formal-mentor-next"></p><div class="ff-actions"><button onclick="formalMentorBegin()">學長帶我開始</button><button onclick="formalMentorOpen()">有點卡住，找學長聊聊</button></div><div class="ff-actions"><button onclick="hunterOpenProfile()">暱稱與練習方向</button><button onclick="hunterSetFilter('todo')">待完成</button><button onclick="hunterSetFilter('done')">已完成</button><button onclick="hunterSetFilter('skipped')">已略過</button></div><div id="hunter-quest-list"></div><details><summary>成長紀錄與獎勵</summary><p id="formal-stats"></p><div id="hunter-calendar"></div><div id="hunter-milestones" class="ff-actions"></div></details><details><summary>日誌與專注計時</summary><label>今日狀態<select id="hunter-mood"><option value="steady">平穩前進</option><option value="charged">充滿能量</option><option value="tired">需要休息</option></select></label><label>成長日誌<textarea id="hunter-journal" maxlength="1000"></textarea></label><button onclick="hunterSaveJournal()">保存日誌</button><p id="hunter-timer">10:00</p><button id="hunter-timer-button" onclick="hunterToggleTimer()">開始專注</button></details><p id="hunter-save-status">本機自動儲存 · 台北時間 04:00 換日</p>`);
  formalMakeModal('hunter-profile','個人設定','<label>暱稱<input id="hunter-name-input" maxlength="24"></label><label>練習方向<select id="hunter-path-input"><option value="community">社區經營</option><option value="luxury">豪宅專研</option><option value="network">人脈經營</option></select></label><button onclick="hunterSaveProfile()">儲存設定</button>');
  formalMakeModal('formal-mentor-modal','學長引導',`<div class="ff-actions">${Object.entries(mentorTopics).map(([id,t])=>`<button onclick="formalMentorOpen('${id}')">${hunterEscape(t.label)}</button>`).join('')}</div><div id="formal-mentor-content"></div><button onclick="formalMentorUseAdvice()">好，我先試試這一步</button><p>本機情境小抄；實際案件請與店長確認。</p>`);
  formalMakeModal('formal-member-modal','業務指派任務','<div id="formal-member-tasks"></div>');
  hunterState=hunterNewState();try{const raw=localStorage.getItem(hunterStorageKey);if(raw)hunterState=hunterValidate(JSON.parse(raw));if(hunterState.game)adminRestore(hunterState.game);if(hunterState.runtime)formalRestoreRuntime(hunterState.runtime);}catch{hunterStorageBlocked=true;document.getElementById('hunter-save-status').textContent='存檔無法讀取，原資料未覆寫。';}if(hunterState.game)adminSync();hunterReady=true;
  const currency=updateCurrencyUI;updateCurrencyUI=function(){currency();hunterSave();hunterRender();};
  const warehouse=renderWarehouseUI;renderWarehouseUI=function(){warehouse();hunterSave();};
  const capability=addCapabilityExp;addCapabilityExp=function(...args){const value=capability(...args);hunterSave();return value;};
  window.addEventListener('pagehide',()=>{hunterSave();formalQuizSave();});
  let renderedDay=hunterDay();setInterval(()=>{if(document.visibilityState==='visible'&&renderedDay!==hunterDay()){renderedDay=hunterDay();hunterRender();}},30000);
  try{const raw=localStorage.getItem(formalQuizKey);if(raw){const saved=JSON.parse(raw);if(saved.version!==1||!saved.answers||!Number.isInteger(saved.index)||saved.index<0||saved.index>5||!Object.hasOwn(devStyleDefinitions,saved.dev)||!Object.hasOwn(salStyleDefinitions,saved.sal))throw Error();for(const q of officialQuestions){const a=saved.answers[q.id];if(a===undefined)continue;if(q.type==='single'?!q.options.some(o=>o.key===a):!Array.isArray(a)||a.some(k=>!q.options.some(o=>o.key===k))||new Set(a).size!==a.length||a.length>q.targetCount)throw Error();}userQuizAnswers=saved.answers;currentQuizIndex=saved.index;currentSelectedDevCode=saved.dev;currentSelectedSalCode=saved.sal;isQuizCompleted=saved.accessGranted===true||saved.complete===true;if(isQuizCompleted){document.getElementById('screen-quiz-flow').classList.add('hidden');document.getElementById('bottom-navbar').classList.remove('hidden');switchTab('tab-tasks');}renderSelectedRouteRecommendations();}}catch{formalQuizBlocked=true;showCustomToast('測驗存檔無法讀取，本次不覆寫原資料。','!');}
  if(!formalQuizBlocked){try{if(!localStorage.getItem(formalQuizKey))userQuizAnswers={};}catch{formalQuizBlocked=true;}}formalQuizReady=true;
  const quizRender=renderQuizQuestion;renderQuizQuestion=function(){quizRender();formalQuizSave();};
  const quizNavigate=navigateQuiz;navigateQuiz=function(step){if(step>0&&!formalQuizValid(officialQuestions[currentQuizIndex],userQuizAnswers[officialQuestions[currentQuizIndex].id])){showCustomToast('請先完成目前題目。','!');return;}quizNavigate(step);formalQuizSave();};
  const confirm=confirmAndEnterApp;confirmAndEnterApp=function(){const missing=officialQuestions.findIndex(q=>!formalQuizValid(q,userQuizAnswers[q.id]));if(missing!==-1){currentQuizIndex=missing;renderQuizQuestion();document.getElementById('quiz-container').scrollIntoView({block:'start'});showCustomToast('請先完成全部 6 題，再確認路線。','!');return;}confirm();formalQuizSave();};
  const select=selectCustomRoute;selectCustomRoute=function(type,code){select(type,code);formalQuizSave();};
  const float=document.createElement('button');float.id='mentor-float';float.className='ff-mentor-float';float.setAttribute('aria-label','開啟阿義學長');float.setAttribute('aria-expanded','false');float.title='阿義學長 · 點開陪伴與練習，可拖曳移動';float.innerHTML='<img src="./mentor-chibi.png" alt="阿義學長"><span>阿義學長</span>';float.onclick=formalMentorToggle;document.getElementById('app-shell').appendChild(float);mentorInitFloat();
  const quizEntry=document.createElement('section');quizEntry.className='ff-quiz-entry';quizEntry.innerHTML='<div><b>業務適性測驗</b><p>查看起步方向，或重新作答。</p></div><button onclick="formalQuizOpen()">開啟適性測驗</button>';document.getElementById('tab-handbook').prepend(quizEntry);
  const restart=document.createElement('button');restart.id='formal-quiz-restart';restart.textContent='重新作答';restart.className='ff-quiz-restart';restart.onclick=()=>formalQuizOpen(true);document.getElementById('screen-quiz-flow').firstElementChild.appendChild(restart);
  const mentorQuiz=document.createElement('button');mentorQuiz.textContent='適性測驗';mentorQuiz.onclick=()=>formalQuizOpen();document.querySelector('#formal-journey-modal .ff-actions').appendChild(mentorQuiz);
  const directQuiz=document.createElement('button');directQuiz.id='formal-quiz-direct';directQuiz.type='button';directQuiz.textContent='適性測驗';directQuiz.onclick=()=>formalQuizOpen();document.querySelector('.ta-entry').prepend(directQuiz);
  renderQuizQuestion();hunterRender();
  // A bookmarkable route opens the test even when this browser has a completed result.
  if(new URLSearchParams(location.search).get('view')==='aptitude')formalQuizOpen();
});
