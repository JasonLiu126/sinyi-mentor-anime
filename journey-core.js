// Independent local-only hunter journey. One Taipei day rolls over at 04:00.
const hunterStorageKey='sinyi-rpg-formal-journey-v1';
let hunterReady=false,hunterState=null,hunterFilter='todo',hunterTimer=null,hunterFocusEnd=0,hunterFocusRemaining=600,hunterStorageBlocked=false;
const hunterRanks=['E','D','C','B','A','S'];
const hunterMilestones=[7,21,42,66];
function hunterDay(now=new Date()){
  const shifted=new Date(now.getTime()+4*60*60*1000); // UTC+8, minus four-hour reset offset.
  return shifted.toISOString().slice(0,10);
}
function hunterOrdinal(day){return Math.floor(Date.parse(day+'T00:00:00Z')/86400000);}
function hunterNewState(today=hunterDay()){
  return {version:1,start:today,name:'新夥伴',path:'community',days:{},milestones:[],game:null};
}
function hunterValidDate(s){return typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;}
function hunterValidate(raw){
  if(!raw||raw.version!==1||!hunterValidDate(raw.start)||typeof raw.name!=='string'||raw.name.length>24||!['community','district','social','network','company','market','luxury'].includes(raw.path)||!raw.days||typeof raw.days!=='object'||Array.isArray(raw.days)||!Array.isArray(raw.milestones))throw Error('成長存檔格式不正確');
  const result=hunterNewState(raw.start);result.name=raw.name;result.path=raw.path;if(['A','B','C','D','E','F'].includes(raw.quizDevRoute))result.quizDevRoute=raw.quizDevRoute;
  for(const [date,day] of Object.entries(raw.days)){
    if(!hunterValidDate(date)||hunterOrdinal(date)<hunterOrdinal(raw.start)||!day||!day.tasks||typeof day.tasks!=='object')throw Error('日誌格式不正確');
    const clean={tasks:{},journal:typeof day.journal==='string'?day.journal.slice(0,1000):'',mood:['steady','charged','tired'].includes(day.mood)?day.mood:'steady'};
    for(const [id,task] of Object.entries(day.tasks)){
      if(!['field','client','knowledge'].includes(id)||!task||!['done','skipped'].includes(task.status)||typeof task.note!=='string')throw Error('任務紀錄不正確');
      clean.tasks[id]={status:task.status,note:task.note.slice(0,500)};
      if(typeof task.title==='string')clean.tasks[id].title=task.title.slice(0,100);
      if(Number.isInteger(task.xp)&&task.xp>=15&&task.xp<=30)clean.tasks[id].xp=task.xp;
    }
    result.days[date]=clean;
  }
  result.milestones=[...new Set(raw.milestones.filter(n=>hunterMilestones.includes(n)))];
  if(raw.game)result.game=adminValidateState(raw.game);if(raw.runtime)result.runtime=formalValidateRuntime(raw.runtime);
  return result;
}
function hunterSave(){
  if(!hunterReady||hunterStorageBlocked)return false;
  try{hunterState.game=adminCapture();hunterState.runtime=formalCaptureRuntime();localStorage.setItem(hunterStorageKey,JSON.stringify(hunterState));document.getElementById('hunter-save-status').textContent='本機自動儲存 · 台北時間 04:00 換日';return true;}
  catch{document.getElementById('hunter-save-status').textContent='儲存失敗：請保持此頁開啟，瀏覽器儲存空間可能已滿。';return false;}
}
function hunterToday(){
  const date=hunterDay();return hunterState.days[date]||(hunterState.days[date]={tasks:{},journal:'',mood:'steady'});
}
function hunterJourneyDay(){return Math.max(1,Math.min(66,hunterOrdinal(hunterDay())-hunterOrdinal(hunterState.start)+1));}
function hunterCompletedDays(){return Object.entries(hunterState.days).filter(([date,d])=>date<=hunterDay()&&Object.values(d.tasks).filter(t=>t.status==='done').length>=2).map(([date])=>date).sort();}
function hunterStreak(){
  const days=new Set(hunterCompletedDays());let ordinal=hunterOrdinal(hunterDay());
  if(!days.has(hunterDay()))ordinal--;let count=0;
  while(days.has(new Date(ordinal*86400000).toISOString().slice(0,10))){count++;ordinal--;}
  return count;
}
function hunterStats(){
  const counts={field:0,client:0,knowledge:0};
  for(const [date,d] of Object.entries(hunterState.days))if(date<=hunterDay())for(const id of Object.keys(counts))if(d.tasks[id]?.status==='done')counts[id]++;
  return counts;
}
function hunterQuests(){
  const day=hunterJourneyDay(),stage=day<=7?0:day<=21?1:day<=42?2:3;
  const field={community:['觀察 1 棟社區','走訪 2 棟社區','整理 3 棟社區情報','完成 1 份商圈提案'],luxury:['研究 1 筆豪宅成交','比較 2 筆高總價物件','整理 3 筆競品優劣','完成 1 份豪宅鑑賞提案'],network:['整理 1 位人脈資料','關心 2 位既有客戶','整理 3 位客戶需求','完成 1 份人脈跟進計畫']};
  Object.assign(field,{district:['認識 1 家在地商店','走訪 2 處商圈節點','整理商圈生活機能','完成 1 份商圈經營計畫'],social:['選定 1 個社群內容主題','完成 1 則房產貼文草稿','整理 3 則社群互動觀察','完成 1 份社群內容企劃'],company:['整理 1 筆可回訪紀錄','更新 2 位舊客近況','整理 3 項舊客需求','完成 1 份舊客跟進計畫'],market:['觀察 1 筆市場新案','比較 2 筆市場物件','整理 3 項物件差異','完成 1 份市場開發提案']});
  return [
    {id:'field',icon:'⌖',name:field[hunterState.path][stage],stat:'洞察',xp:15+stage*5,coins:30,desc:'記錄一項今天實際發現的資訊，累積你的市場判斷力。'},
    {id:'client',icon:'◇',name:['主動關心 1 位客戶','跟進 2 位客戶需求','完成 1 次需求訪談','完成 1 份客製配案'][stage],stat:'交涉',xp:15+stage*5,coins:30,desc:'傾聽真實需求，留下本次互動與下一步。請勿填寫客戶個資。'},
    {id:'knowledge',icon:'✧',name:['專注學習 10 分鐘','專注學習 15 分鐘','拆解 1 個成交案例','演練 1 次成交說明'][stage],stat:'專業',xp:15+stage*5,coins:30,desc:'選擇稅務、法規或銷售實務，寫下一個學到的觀念。'}
  ];
}
function hunterEscape(text){return String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function hunterToast(message){showCustomToast(message,'✦');}
function hunterAnimate(title,detail){
  const node=document.getElementById('hunter-reward');node.querySelector('h2').textContent=title;node.querySelector('p').textContent=detail;node.classList.remove('hidden');node.querySelector('button').focus();
}
function hunterCloseReward(){document.getElementById('hunter-reward').classList.add('hidden');document.getElementById('hunter-quest-list')?.focus();}
function hunterSubmitQuest(id,status){
  if(adminBusy()){hunterToast('請等融合動畫完成後再領取任務。');return false;}
  const quest=hunterQuests().find(q=>q.id===id);if(!quest||!['done','skipped'].includes(status))return false;
  const day=hunterToday();if(day.tasks[id]?.status==='done')return false;
  const input=document.getElementById('hunter-note-'+id);const note=(input?.value||'').trim();
  if(status==='done'&&note.length<4){hunterToast('學長想聽聽你做了什麼。用至少 4 個字記下這一步，就能領取獎勵。');input?.focus();return false;}
  day.tasks[id]={status,note:note.slice(0,500),title:quest.name,xp:quest.xp};
  if(status==='done'){
    const oldLevel=Math.floor(currentUserTotalExp/60)+1;
    currentUserTotalExp+=quest.xp;currentUserLevel=Math.floor(currentUserTotalExp/60)+1;
    userCoins+=quest.coins+(currentUserLevel-oldLevel)*100;
    document.getElementById('header-user-level').innerText=currentUserLevel;document.getElementById('header-user-exp').innerText=currentUserTotalExp;updateCurrencyUI();
    hunterAnimate(currentUserLevel>oldLevel?'LEVEL UP':'QUEST COMPLETE',`${quest.stat} +1 · EXP +${quest.xp} · 金幣 +${quest.coins}${currentUserLevel>oldLevel?' · 升級獎勵 +100 金幣':''}`);
  }
  hunterSave();hunterRender();return true;
}
function hunterSetFilter(filter){if(!['todo','done','skipped'].includes(filter))return;hunterFilter=filter;hunterRender();}
function hunterClaimMilestone(n){
  if(adminBusy()||!hunterMilestones.includes(n)||hunterState.milestones.includes(n)||hunterCompletedDays().length<n)return false;
  hunterState.milestones.push(n);gachaTickets+=n===66?10:n===42?5:3;updateCurrencyUI();hunterSave();hunterRender();hunterAnimate('RANK BREAKTHROUGH',`累積達標 ${n} 天 · ${n===66?'已完成成長旅程':'突破新階段'} · 抽卡券 +${n===66?10:n===42?5:3}`);return true;
}
function hunterSaveJournal(){const day=hunterToday();day.journal=document.getElementById('hunter-journal').value.slice(0,1000);day.mood=document.getElementById('hunter-mood').value;hunterSave();hunterToast('今日成長日誌已保存。');}
function hunterSaveProfile(){
  const name=document.getElementById('hunter-name-input').value.trim();const path=document.getElementById('hunter-path-input').value;
  if(!name||name.length>24||!['community','district','social','network','company','market','luxury'].includes(path)){hunterToast('告訴學長你的暱稱，1～24 個字就好。');return;}
  hunterState.name=name;hunterState.path=path;hunterSave();document.getElementById('hunter-profile').classList.add('hidden');hunterRender();
}
function hunterOpenProfile(){document.getElementById('hunter-name-input').value=hunterState.name;document.getElementById('hunter-path-input').value=hunterState.path;document.getElementById('hunter-profile').classList.remove('hidden');document.getElementById('hunter-name-input').focus();}
function hunterToggleTimer(){
  if(hunterTimer){clearInterval(hunterTimer);hunterTimer=null;hunterFocusRemaining=Math.max(0,Math.ceil((hunterFocusEnd-Date.now())/1000));}
  else{if(hunterFocusRemaining<=0)hunterFocusRemaining=600;hunterFocusEnd=Date.now()+hunterFocusRemaining*1000;hunterTimer=setInterval(hunterTick,1000);}
  hunterTick();
}
function hunterTick(){
  if(hunterTimer){hunterFocusRemaining=Math.max(0,Math.ceil((hunterFocusEnd-Date.now())/1000));if(!hunterFocusRemaining){clearInterval(hunterTimer);hunterTimer=null;hunterToast('專注完成！寫下學習紀錄，領取今日專業任務獎勵。');}}
  const display=document.getElementById('hunter-timer');if(display)display.textContent=String(Math.floor(hunterFocusRemaining/60)).padStart(2,'0')+':'+String(hunterFocusRemaining%60).padStart(2,'0');
  const button=document.getElementById('hunter-timer-button');if(button)button.textContent=hunterTimer?'暫停專注':'開始專注';
}
