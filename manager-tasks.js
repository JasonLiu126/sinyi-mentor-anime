// Shared-device prototype. Role and member selection are previews, not authentication.
const managerTaskKey='sinyi-formal-manager-tasks-v1';
let managerTaskState={version:1,members:[{id:'self',name:'我（目前業務）'}],active:'self',tasks:[]};
let managerFilter='all',managerReturnFocus=null,managerStorageBlocked=false;
const managerEscape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const managerStatus={todo:'待完成',review:'待確認',done:'已完成',cancelled:'已取消'};
function managerLoad(){
  try{const value=JSON.parse(localStorage.getItem(managerTaskKey));
    if(!value)return;
    if(value.version!==1||!Array.isArray(value.members)||!Array.isArray(value.tasks)||!value.members.some(m=>m.id==='self'))throw Error();
    const validId=id=>typeof id==='string'&&/^(?:self|[a-f0-9-]{36})$/.test(id);
    if(value.members.some(m=>!validId(m.id)||typeof m.name!=='string')||value.tasks.some(t=>!Object.hasOwn(managerStatus,t.status)||!validId(t.id)||typeof t.title!=='string'||!value.members.some(m=>m.id===t.member)))throw Error();
    managerTaskState=value;if(!value.members.some(m=>m.id===value.active))managerTaskState.active='self';
  }catch{managerStorageBlocked=true;showCustomToast('店長任務存檔無法讀取，請先保留原瀏覽器資料。','!');}
}
function managerSave(next){
  if(managerStorageBlocked){showCustomToast('任務存檔異常，已停止寫入以保留原資料。','!');return false;}
  try{localStorage.setItem(managerTaskKey,JSON.stringify(next));managerTaskState=next;return true;}
  catch{showCustomToast('儲存失敗，尚未套用這次操作。請檢查瀏覽器儲存空間。','!');return false;}
}
function managerToday(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
function managerMember(id){return managerTaskState.members.find(m=>m.id===id)?.name||'未命名成員';}
function managerTaskCard(task,mode){
  const e=managerEscape,late=task.due&&task.due<managerToday()&&['todo','review'].includes(task.status);
  return `<article class="mt-card"><div class="mt-card-top"><span class="mt-status mt-${task.status}">${managerStatus[task.status]}</span><small>${e(managerMember(task.member))}${late?' · 已逾期':''}</small></div><h4>${e(task.title)}</h4><p class="mt-description">${e(task.description)}</p><p class="mt-meta">${e(task.category)} · ${task.due?'期限 '+e(task.due):'未設期限'}</p>${task.report?`<div class="mt-record"><b>業務回報</b><p>${e(task.report)}</p></div>`:''}${task.feedback?`<div class="mt-record"><b>店長回饋</b><p>${e(task.feedback)}</p></div>`:''}${mode==='manager'&&task.status==='review'?`<label>回饋（退回時必填）<textarea id="mt-feedback-${task.id}" rows="2" maxlength="500" placeholder="指出做得好的地方，或還需要補充什麼"></textarea></label><div class="mt-actions"><button data-mt-action="approve" data-id="${task.id}" class="mt-primary">確認完成</button><button data-mt-action="return" data-id="${task.id}">退回補充</button></div>`:''}${mode==='manager'&&['todo','review'].includes(task.status)?`<button class="mt-text-button" data-mt-action="cancel" data-id="${task.id}">取消此任務</button>`:''}${mode==='member'&&task.status==='todo'?`<details><summary>回報任務成果</summary><label>完成了什麼？<textarea id="mt-report-${task.id}" rows="3" minlength="4" maxlength="1000" placeholder="記下實際行動與收穫，至少 4 個字。請勿填寫客戶個資。"></textarea></label><button class="mt-primary" data-mt-action="submit" data-id="${task.id}">送交店長確認</button></details>`:''}</article>`;
}
function managerRender(){
  const e=managerEscape,s=managerTaskState;
  const picker=document.getElementById('mt-member-preview');picker.innerHTML=s.members.map(m=>`<option value="${e(m.id)}">${e(m.name)}</option>`).join('');picker.value=s.active;
  const assigned=s.tasks.filter(t=>t.member===s.active&&t.status!=='cancelled');
  document.getElementById('mt-member-list').innerHTML=assigned.length?assigned.slice().reverse().map(t=>managerTaskCard(t,'member')).join(''):'<p class="mt-empty">目前沒有額外任務。店長指派後，會顯示在這裡。</p>';
  document.getElementById('mt-pending-count').textContent=assigned.filter(t=>t.status==='todo').length+' 件待完成';
  document.getElementById('mt-assignees').innerHTML=s.members.map(m=>`<label class="mt-checkbox"><input type="checkbox" name="member" value="${e(m.id)}">${e(m.name)}</label>`).join('');
  const visible=s.tasks.filter(t=>managerFilter==='all'||t.status===managerFilter);
  document.getElementById('mt-manager-list').innerHTML=visible.length?visible.slice().reverse().map(t=>managerTaskCard(t,'manager')).join(''):'<p class="mt-empty">尚無這類任務，先指派一個小目標吧。</p>';
  document.getElementById('mt-stats').textContent=`待完成 ${s.tasks.filter(t=>t.status==='todo').length}　待確認 ${s.tasks.filter(t=>t.status==='review').length}　已完成 ${s.tasks.filter(t=>t.status==='done').length}`;
  document.querySelectorAll('[data-mt-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mtFilter===managerFilter)));
}
function managerCreate(event){
  event.preventDefault();const form=event.target,data=new FormData(form),members=data.getAll('member');
  const title=String(data.get('title')).trim(),description=String(data.get('description')).trim(),due=String(data.get('due')),category=String(data.get('category'));
  if(!title||!description||!members.length){showCustomToast('請填寫任務、完成條件，並至少選擇一位業務。','!');return;}
  if(due&&due<managerToday()){showCustomToast('請選擇今天或之後的期限。','!');return;}
  const next=structuredClone(managerTaskState),created=new Date().toISOString();
  for(const member of members){if(!next.members.some(m=>m.id===member))return;next.tasks.push({id:crypto.randomUUID(),title:title.slice(0,80),description:description.slice(0,1000),category,due,member,status:'todo',report:'',feedback:'',created});}
  if(!managerSave(next))return;form.reset();managerRender();showCustomToast(`已指派給 ${members.length} 位業務，可關閉後臺到任務頁查看。`,'✓');
}
function managerTransition(id,action){
  const next=structuredClone(managerTaskState),task=next.tasks.find(t=>t.id===id);if(!task)return;
  if(action==='submit'){
    if(task.member!==next.active||task.status!=='todo')return;
    const note=document.getElementById('mt-report-'+id).value.trim();if(note.length<4){showCustomToast('請用至少 4 個字描述成果。','!');return;}
    task.report=note.slice(0,1000);task.status='review';task.submitted=new Date().toISOString();
  }else if(['approve','return'].includes(action)){
    if(task.status!=='review')return;const feedback=document.getElementById('mt-feedback-'+id).value.trim();
    if(action==='return'&&!feedback){showCustomToast('請告訴業務需要補充什麼。','!');return;}
    task.feedback=feedback.slice(0,500);task.status=action==='approve'?'done':'todo';task.reviewed=new Date().toISOString();
  }else if(action==='cancel'){if(!['todo','review'].includes(task.status))return;task.status='cancelled';}else return;
  if(managerSave(next)){managerRender();showCustomToast({submit:'已送交店長確認。',approve:'已確認任務完成。',return:'已退回，業務可以補充後再次回報。',cancel:'已取消任務，保留指派紀錄。'}[action],'✓');}
}
function managerOpen(){
  closeTestAdmin();managerReturnFocus=document.querySelector('.ta-entry button');
  document.getElementById('mt-dialog').hidden=false;document.getElementById('app-shell').inert=true;managerRender();document.getElementById('mt-close').focus();
}
function managerClose(){document.getElementById('mt-dialog').hidden=true;document.getElementById('app-shell').inert=false;managerReturnFocus?.focus();}
function setupManagerTasks(){
  managerLoad();const e=managerEscape;
  const entry=document.createElement('button');entry.textContent='店長任務後臺';entry.addEventListener('click',managerOpen);document.getElementById('formal-feature-links').appendChild(entry);const memberEntry=document.createElement('button');memberEntry.textContent='業務指派任務';memberEntry.onclick=()=>{closeTestAdmin();switchTab('tab-tasks');document.querySelector('.mt-member-panel').scrollIntoView({block:'start'});};document.getElementById('formal-feature-links').appendChild(memberEntry);
  const panel=document.createElement('section');panel.className='mt-member-panel';panel.innerHTML=`<div class="mt-section-head"><div><small>店長指派</small><h3>額外任務</h3></div><span id="mt-pending-count"></span></div><details class="mt-preview"><summary>切換業務預覽</summary><label>目前查看的業務<select id="mt-member-preview"></select></label><p>僅供本機測試，並非登入或權限切換。</p></details><div id="mt-member-list"></div>`;document.getElementById('tasks-hero-card').after(panel);const direct=document.createElement('button');direct.className='ff-manager-entry';direct.textContent='店長任務';direct.setAttribute('aria-label','開啟店長任務後臺');direct.onclick=managerOpen;document.querySelector('.ta-entry').prepend(direct);
  const dialog=document.createElement('div');dialog.id='mt-dialog';dialog.className='formal-feature-modal';dialog.hidden=true;dialog.innerHTML=`<section class="mt-window" role="dialog" aria-modal="true" aria-labelledby="mt-title"><header class="mt-header"><div><small>帶領夥伴，一次一小步</small><h2 id="mt-title">店長任務後臺</h2></div><button id="mt-close" aria-label="關閉店長後臺">✕</button></header><div class="mt-body"><p class="mt-notice">本機流程預覽 · 資料只保存在這個瀏覽器，尚未連接真實業務帳號。</p><p id="mt-stats" class="mt-stats" role="status"></p><details class="mt-compose" open><summary>指派額外任務</summary><form id="mt-create"><label>任務名稱<input name="title" required maxlength="80" placeholder="例如：整理松智路社區的近期成交"></label><label>完成條件<textarea name="description" required maxlength="1000" rows="3" placeholder="例如：比較 3 筆近期成交，回報一個價格觀察與下一步。"></textarea></label><div class="mt-form-grid"><label>任務類型<select name="category"><option>商圈經營</option><option>客戶跟進</option><option>專業學習</option><option>其他任務</option></select></label><label>完成期限（選填）<input name="due" type="date"></label></div><fieldset><legend>指派對象（可複選）</legend><div id="mt-assignees"></div></fieldset><button type="submit" class="mt-primary">指派任務</button></form></details><details class="mt-team"><summary>管理測試成員</summary><form id="mt-add-member"><label>成員顯示名稱<input name="name" required maxlength="24" placeholder="輸入業務姓名或暱稱"></label><button type="submit">加入成員</button></form></details><h3>任務追蹤</h3><div class="mt-filters">${[['all','全部'],['todo','待完成'],['review','待確認'],['done','已完成'],['cancelled','已取消']].map(([key,label])=>`<button data-mt-filter="${key}" aria-pressed="false">${label}</button>`).join('')}</div><div id="mt-manager-list"></div></div></section>`;document.body.appendChild(dialog);
  document.getElementById('mt-close').addEventListener('click',managerClose);
  dialog.addEventListener('click',event=>{if(event.target===dialog)managerClose();});
  document.getElementById('mt-create').addEventListener('submit',managerCreate);
  document.getElementById('mt-add-member').addEventListener('submit',event=>{event.preventDefault();const name=event.target.elements.name.value.trim();if(!name)return;if(managerTaskState.members.some(m=>m.name===name)){showCustomToast('已經有同名成員。','!');return;}const next=structuredClone(managerTaskState);next.members.push({id:crypto.randomUUID(),name:name.slice(0,24)});if(managerSave(next)){event.target.reset();managerRender();}});
  document.getElementById('mt-member-preview').addEventListener('change',event=>{const next=structuredClone(managerTaskState);next.active=event.target.value;if(managerSave(next))managerRender();});
  document.addEventListener('click',event=>{const action=event.target.closest('[data-mt-action]'),filter=event.target.closest('[data-mt-filter]');if(action)managerTransition(action.dataset.id,action.dataset.mtAction);if(filter){managerFilter=filter.dataset.mtFilter;managerRender();}});
  dialog.addEventListener('keydown',event=>{if(event.key==='Escape'){managerClose();return;}if(event.key!=='Tab')return;const nodes=[...dialog.querySelectorAll('button,input,select,textarea,summary')].filter(n=>!n.disabled&&n.getClientRects().length),first=nodes[0],last=nodes.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}});
  window.addEventListener('storage',event=>{if(event.key===managerTaskKey){managerLoad();managerRender();}});managerRender();
}
window.addEventListener('DOMContentLoaded',setupManagerTasks);
