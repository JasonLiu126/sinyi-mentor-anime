// Contextual, local guidance cards from 阿義. No remote AI or customer data sent.
let mentorTopic='start',mentorReturnFocus=null,mentorIsOpen=false,mentorQuestId='';
const mentorDrafts=new Map();
let mentorRenderedDay=hunterDay();
let mentorDockIsOpen=false,mentorReturnTab='tab-map',mentorReturnScroll=0;
let mentorSuppressClickUntil=0;
let mentorPopupReturnFocus=null;
function mentorRememberPage(){
  const visible=['tab-map','tab-tasks','tab-handbook','tab-showcase','tab-academy','screen-quiz-flow'].find(id=>!document.getElementById(id).classList.contains('hidden'));
  if(visible){mentorReturnTab=visible;mentorReturnScroll=document.getElementById('app-main-scroll').scrollTop;}
}
function mentorUpdateDock(open){
  mentorDockIsOpen=open;
  const button=document.getElementById('mentor-float');if(button){button.setAttribute('aria-expanded',String(open));button.setAttribute('aria-label',open?'收起學長，回到剛才的畫面':'開啟信義學長陪伴畫面');}
}
function mentorToggleHome(){if(Date.now()<mentorSuppressClickUntil)return;if(mentorDockIsOpen)mentorReturnToPage();else hunterHome();}
function mentorReturnToPage(){
  mentorCloseCompanion();
}
function mentorCloseCompanion(restoreFocus=true){
  document.getElementById('mentor-companion').classList.add('hidden');
  document.getElementById('tab-awakening').classList.add('hidden');
  document.getElementById('app-shell').inert=false;
  document.getElementById('app-shell').removeAttribute('inert');
  mentorUpdateDock(false);
  if(restoreFocus)(mentorPopupReturnFocus||document.getElementById('mentor-float')).focus();
}
const mentorTopics={
  start:{label:'不知道先做什麼',title:'先做一件小事，就算開始。',body:'第一天不用急著變成超業。我會把今天拆成小步驟，你先選一件最容易開始的。',steps:['看看今天的第一個任務，不用一次做完三個。','先花 5～10 分鐘行動；留意一個你以前沒發現的細節。','回來用自己的話寫下收穫，我們就能看見你的進步。'],line:'今天先完成一次觀察就好，我陪你把第一步走穩。'},
  opening:{label:'不敢跟客戶開口',title:'不用一開始就談成交。',body:'先讓對方知道你是誰，再用一個容易回答的問題，把話題打開。',steps:['先打招呼、簡單介紹自己，先徵詢對方是否方便。','用一個開放問題了解需求，不急著推薦物件。','記下自己聽懂的重點，約定下一次可以聯繫的時間。'],line:'「您好，我是信義房屋的新夥伴。現在方便聊一下您最近關注的居住需求嗎？」'},
  rejection:{label:'被拒絕，有點挫折',title:'被拒絕，不代表你不適合。',body:'很多關係需要時間。先把這次經驗留成下一次能用的小線索，不用把拒絕當成對自己的評價。',steps:['先停一下、喝口水，讓情緒慢下來。','分清楚：對方沒需求、時機不對，還是開場需要調整？','寫下一個下次想改的小地方。今天願意嘗試，本身就是進步。'],line:'「了解，謝謝您願意聽我說。之後如果有需要，我再提供您參考資訊。」'},
  busy:{label:'今天只有一點時間',title:'今天走小步，也是在前進。',body:'把目標縮小，保留參與感。今天沒做完，不會扣掉你已累積的能力。',steps:['挑一件今天能做的小事：觀察一個社區細節，或整理一個客戶需求。','利用短時間寫下實際發現，不必把筆記寫成報告。','其餘任務可以先略過；狀態回來後，今天仍能補做。'],line:'先選一件容易的。比起勉強做很多，更重要的是願意繼續。'}
};
function mentorContext(){
  const day=hunterToday(),done=Object.values(day.tasks).filter(t=>t.status==='done').length;
  const next=hunterQuests().find(q=>!day.tasks[q.id]);
  const skipped=hunterQuests().find(q=>day.tasks[q.id]?.status==='skipped');
  const mood=day.mood;
  if(done===3)return {title:'今天的三件事，你都做到了。',body:'這些不是打勾而已，是你真的累積的現場經驗。記下一個收穫，今天就可以好好收工了。',action:'回顧今天的收穫',target:'journal'};
  if(mood==='tired')return {title:'累的時候，我們就走小步一點。',body:'今天先選一件最容易開始的事。需要時可以略過，明天再接著來，你的努力都會留下。',action:'學長，給我一點建議',target:'busy'};
  if(done>=2)return {title:'今天的節奏，你已經抓到了。',body:'你已完成兩件事，連續紀錄也留下來了。還有餘力就多練一點，想休息也沒關係。',action:next?'看看最後一個小任務':'回顧今天的收穫',target:next?'quest':'journal'};
  if(done===1)return {title:'第一步完成了，這就很值得。',body:'再挑一件小事，我們把今天的成長接起來。不急，我陪你慢慢找到自己的節奏。',action:'繼續下一個小任務',target:'quest'};
  if(!next&&skipped)return {title:'今天先休息一下，也沒關係。',body:'任務先略過沒有關係。如果待會有一點空檔，仍然可以回來補做。',action:'看看今天略過的任務',target:'skipped'};
  return {title:'今天，我們先把一件小事做好。',body:next?`先從「${next.name}」開始。不用追求完美，帶回一個你真的觀察到的細節就好。`:'我幫你把今天拆成幾個小練習，一件一件來就好。',action:'學長帶我開始',target:'quest'};
}
function mentorRefresh(){
  if(!hunterState)return;
  document.getElementById('hunter-player-name').textContent=hunterState.name;
  const context=mentorContext();
  document.getElementById('mentor-suggestion-title').textContent=context.title;
  document.getElementById('mentor-suggestion-body').textContent=context.body;
  document.getElementById('mentor-next-action').textContent=context.action+' →';
  const level=Math.floor(currentUserTotalExp/60)+1;
  document.getElementById('hunter-rank').textContent=level>=26?'獨當一面':level>=16?'穩健成長':level>=6?'漸入佳境':'新手起步';
  document.getElementById('hunter-path').textContent={community:'社區經營',luxury:'豪宅專研',network:'人脈經營'}[hunterState.path];
  const journey=hunterJourneyDay();document.getElementById('hunter-chapter').textContent=journey<=7?'先熟悉，再前進':journey<=21?'找到自己的節奏':journey<=42?'把練習變成實力':'一步步，獨當一面';
  const done=Object.values(hunterToday().tasks).filter(t=>t.status==='done').length;
  document.getElementById('hunter-daily-status').textContent=done>=2?'今天的連續紀錄，已經好好留下了。':'完成 2 件小事，就能為今天留下一格成長紀錄。';
  for(const article of document.querySelectorAll('.hunter-quest')){
    if(article.querySelector('.mentor-task-help'))continue;
    const input=article.querySelector('textarea');if(!input)continue;
    const id=input.id.replace('hunter-note-','');
    const help=document.createElement('button');help.className='mentor-task-help';help.type='button';help.textContent='學長，這一步怎麼做？';help.setAttribute('onclick',`mentorOpen('${id==='client'?'opening':'start'}','${id}')`);article.appendChild(help);
  }
}
function mentorScroll(id){
  const target=document.getElementById(id);if(!target)return;
  for(let p=target.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;
  target.scrollIntoView({behavior:'smooth',block:'start'});if(target.matches('textarea,input,button'))target.focus({preventScroll:true});
}
function mentorBegin(){
  const target=mentorContext().target;
  if(target==='busy'){mentorOpen('busy');return;}
  if(target==='journal'){mentorScroll('hunter-journal');return;}
  hunterSetFilter(target==='skipped'?'skipped':'todo');
  const first=document.querySelector('#hunter-quest-list textarea');if(first)mentorScroll(first.id);else mentorScroll('hunter-quest-list');
}
function mentorOpen(topic='start',questId=''){
  if(!Object.hasOwn(mentorTopics,topic))return false;
  if(!mentorIsOpen)mentorReturnFocus=document.activeElement;
  mentorIsOpen=true;mentorTopic=topic;
  const data=mentorTopics[topic];
  document.getElementById('mentor-help-title').textContent=data.title;
  const q=questId?hunterQuests().find(q=>q.id===questId):null;
  mentorQuestId=q?.id||'';
  document.getElementById('mentor-help-body').textContent=q?`這次要練習「${q.name}」。${data.body}`:data.body;
  let steps=data.steps;
  if(q&&topic==='start'){
    if(q.id==='knowledge')steps=['從修練學院選一個今天想弄懂的小主題，先設定 10 分鐘專注。','用自己的話記住一個重點，再想想：客戶可能會怎麼問？','回來記下一句收穫，或一個想再請教店長的問題。'];
    if(q.id==='field')steps=hunterState.path==='luxury'?['先找一筆公開的豪宅物件或成交資料，記下它的特色。','比較位置、格局與服務機能，選一點你覺得有差異的地方。','用一句話說明：這個特色適合哪一種居住需求？']:hunterState.path==='network'?['從自己熟悉的一位人脈開始，先整理你記得的需求。','想一個自然的關心切入點，先了解近況，不急著推銷。','寫下你想了解的一個問題，作為下一次聯繫的起點。']:['選一棟附近社區，從外觀、周邊機能與公開資訊開始認識。','觀察一個細節：出入口、生活機能，或社區的特色。','用一句話記下發現，再留一個明天想繼續了解的問題。'];
  }
  document.getElementById('mentor-help-steps').innerHTML=steps.map((step,i)=>`<li><b>${i+1}</b><span>${hunterEscape(step)}</span></li>`).join('');
  document.getElementById('mentor-help-line').textContent=data.line;
  document.querySelectorAll('[data-mentor-topic]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mentorTopic===topic)));
  document.getElementById('mentor-help').classList.remove('hidden');document.getElementById('mentor-help-close').focus();return true;
}
function mentorClose(){document.getElementById('mentor-help').classList.add('hidden');mentorIsOpen=false;mentorReturnFocus?.focus();}
function mentorUseAdvice(){const requested=mentorQuestId;mentorClose();hunterHome();const next=hunterQuests().find(q=>q.id===requested&&hunterToday().tasks[q.id]?.status!=='done')||hunterQuests().find(q=>!hunterToday().tasks[q.id]);hunterSetFilter(next&&hunterToday().tasks[next.id]?.status==='skipped'?'skipped':'todo');if(next)mentorScroll('hunter-note-'+next.id);else mentorScroll('hunter-journal');}
const mentorBaseRender=hunterRender;
hunterHome=function(){
  if(!mentorDockIsOpen){mentorRememberPage();mentorPopupReturnFocus=document.activeElement;}
  document.getElementById('tab-awakening').classList.remove('hidden');
  document.getElementById('mentor-companion').classList.remove('hidden');
  document.getElementById('app-shell').inert=true;
  document.getElementById('app-shell').setAttribute('inert','');
  mentorUpdateDock(true);hunterRender();
  if(document.getElementById('mentor-companion-scroll'))document.getElementById('mentor-companion-scroll').scrollTop=0;
  document.getElementById('mentor-companion-close').focus();
};
hunterRender=function(){
  const date=hunterDay();
  for(const input of document.querySelectorAll('#hunter-quest-list textarea'))mentorDrafts.set(mentorRenderedDay+'/'+input.id,input.value);
  mentorBaseRender();
  mentorRenderedDay=date;
  for(const input of document.querySelectorAll('#hunter-quest-list textarea')){const draft=mentorDrafts.get(date+'/'+input.id);if(draft!==undefined)input.value=draft;}
  if(hunterState)mentorRefresh();
};
const mentorBaseAnimate=hunterAnimate;
hunterAnimate=function(title,detail){
  const heading=title==='LEVEL UP'?'你又往前進了一步！':title==='RANK BREAKTHROUGH'?'這一路的努力，都算數。':'做到了！這一步很值得。';
  mentorBaseAnimate(heading,'阿義學長：我看見你的努力了。'+detail);
};
window.addEventListener('DOMContentLoaded',()=>{
  if(hunterState.name==='新晉獵人'){hunterState.name='新夥伴';hunterSave();}
  document.getElementById('nav-btn-map').innerHTML='<span class="text-xl">🗺️</span><span class="text-[9px] font-bold">商圈地圖</span>';
  document.getElementById('nav-btn-map').setAttribute('onclick',"switchTab('tab-map')");
  const mentorPreviousSwitch=switchTab;switchTab=function(id){if(mentorDockIsOpen)mentorCloseCompanion(false);mentorPreviousSwitch(id);};
  const mentorPreviousQuiz=hunterOpenQuiz;hunterOpenQuiz=function(){if(mentorDockIsOpen)mentorCloseCompanion(false);mentorPreviousQuiz();};
  mentorInitFloat();
  document.getElementById('mentor-help').addEventListener('keydown',event=>{
    if(event.key==='Escape'){mentorClose();return;}if(event.key!=='Tab')return;
    const buttons=[...document.getElementById('mentor-help').querySelectorAll('button:not(:disabled)')],first=buttons[0],last=buttons[buttons.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  });
  // Keep diary mood meaningful to the mentor without issuing rewards.
  document.getElementById('hunter-mood').addEventListener('change',()=>{hunterToday().mood=document.getElementById('hunter-mood').value;hunterSave();mentorRefresh();});
  mentorRefresh();
});
function mentorInitFloat(){
  const button=document.getElementById('mentor-float'),shell=button.parentElement;
  let drag=null;
  function bounds(){return {x:Math.max(8,shell.clientWidth-button.offsetWidth-8),minY:8,maxY:Math.max(8,shell.clientHeight-document.getElementById('bottom-navbar').offsetHeight-button.offsetHeight-12)};}
  function place(x,y,snap=false){const b=bounds();button.style.left=(snap?(x>shell.clientWidth/2?b.x:8):Math.max(8,Math.min(b.x,x)))+'px';button.style.top=Math.max(b.minY,Math.min(b.maxY,y))+'px';button.style.right='auto';button.style.bottom='auto';}
  button.addEventListener('pointerdown',event=>{
    if(event.button!==0)return;
    const rect=button.getBoundingClientRect(),parent=shell.getBoundingClientRect();
    drag={pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,x:rect.left-parent.left,y:rect.top-parent.top,moved:false};
    button.setPointerCapture(event.pointerId);
  });
  button.addEventListener('pointermove',event=>{
    if(!drag||drag.pointerId!==event.pointerId)return;
    const dx=event.clientX-drag.startX,dy=event.clientY-drag.startY;
    if(!drag.moved&&Math.hypot(dx,dy)<6)return;
    if(!drag.moved){drag.moved=true;button.setPointerCapture(event.pointerId);}
    event.preventDefault();place(drag.x+dx,drag.y+dy);
  });
  function finish(event){if(!drag||drag.pointerId!==event.pointerId)return;if(drag.moved){mentorSuppressClickUntil=Date.now()+400;place(drag.x+event.clientX-drag.startX,drag.y+event.clientY-drag.startY,true);}drag=null;}
  button.addEventListener('pointerup',finish);button.addEventListener('pointercancel',event=>{if(drag?.moved)mentorSuppressClickUntil=Date.now()+400;drag=null;});
  window.addEventListener('resize',()=>{if(button.style.top){const r=button.getBoundingClientRect(),p=shell.getBoundingClientRect();place(r.left-p.left,r.top-p.top,true);}});
}
