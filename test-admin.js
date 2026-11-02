// Local prototype test console. Each version has its own copy and storage key.
const adminEdition='anime';
const adminEditionLabel='動畫版';
const adminSnapshotKey='sinyi-rpg-test-snapshot-v1-'+adminEdition;
let adminUndoState=null;
let adminReturnFocus=null;

function adminInteger(value,min,max,label){
  const text=String(value).trim();
  if(!/^\d+$/.test(text))throw new Error(label+'請輸入整數。');
  const number=Number(text);
  if(!Number.isSafeInteger(number)||number<min||number>max)throw new Error(label+'範圍為 '+min+'～'+max+'。');
  return number;
}
function adminCapture(){
  return {exp:currentUserTotalExp,coins:userCoins,tickets:gachaTickets,pity:gachaPityCounter,
    warehouse:JSON.parse(JSON.stringify(userWarehouse)),slots:[...userCabinetSlots],theme:cabinetPedestalTheme};
}
function adminValidateState(value){
  if(!value||!Array.isArray(value.warehouse)||!Array.isArray(value.slots)||value.slots.length!==9)throw new Error('快照格式不正確。');
  const seen=new Set();
  const warehouse=value.warehouse.map(item=>{
    const fig=Object.hasOwn(executiveFigurineDatabase,item?.id)?executiveFigurineDatabase[item.id]:null;
    if(!fig||seen.has(item.id))throw new Error('快照包含無效或重複角色。');
    seen.add(item.id);
    const stars=adminInteger(item.stars,1,fig.maxStars||5,'角色星等');
    const result={id:item.id,stars,fragments:adminInteger(item.fragments??0,0,9999,'碎片'),equippedStars:adminInteger(item.equippedStars??stars,1,stars,'穿用造型')};
    if(fig.familyRole)result.copies=adminInteger(item.copies??1,1,9999,'IP 張數');
    return result;
  });
  const placed=new Set();
  const slots=value.slots.map(id=>{if(id===null)return null;if(!seen.has(id)||placed.has(id))throw new Error('快照陳列位置不正確。');placed.add(id);return id;});
  if(!['wood','marble','cyber'].includes(value.theme))throw new Error('快照場景不正確。');
  return {exp:adminInteger(value.exp,0,59999,'總 EXP'),coins:adminInteger(value.coins,0,999999999,'金幣'),tickets:adminInteger(value.tickets,0,99999,'抽卡券'),pity:adminInteger(value.pity,0,999999,'保底次數'),warehouse,slots,theme:value.theme};
}
function adminRestore(state){
  currentUserTotalExp=state.exp;currentUserLevel=Math.floor(state.exp/60)+1;
  userCoins=state.coins;gachaTickets=state.tickets;gachaPityCounter=state.pity;
  userWarehouse=JSON.parse(JSON.stringify(state.warehouse));userCabinetSlots=[...state.slots];cabinetPedestalTheme=state.theme;
}
function adminReport(message,error=false){
  const node=document.getElementById('test-admin-status');if(!node)return;
  node.textContent=message;node.className=error?'ta-status is-error':'ta-status';
}
function adminBusy(){return typeof familyFusionBusy!=='undefined'&&familyFusionBusy;}
function adminSync(){
  if(typeof lifeActiveStory!=='undefined'&&lifeActiveStory)endLifeStory(false);
  document.getElementById('header-user-level').innerText=Math.floor(currentUserTotalExp/60)+1;
  document.getElementById('header-user-exp').innerText=currentUserTotalExp;
  updateCurrencyUI();renderWarehouseUI();render3x3CabinetGrid();
  if(typeof renderFamilyFusion==='function')renderFamilyFusion();
  if(typeof activeEvolutionFigId!=='undefined')closeModal('modal-figurine-detail');
  adminRefresh();
}
function adminChange(callback,message){
  if(adminBusy()){adminReport('融合動畫進行中，請等結果揭曉後再調整。',true);return false;}
  const previous=adminCapture();
  try{callback();adminUndoState=previous;adminSync();adminReport(message);return true;}
  catch(error){adminRestore(previous);adminSync();adminReport(error.message,true);return false;}
}
function adminApplyPlayer(){
  try{
    const level=adminInteger(document.getElementById('ta-level').value,1,1000,'玩家等級');
    const progress=adminInteger(document.getElementById('ta-exp').value,0,59,'本級 EXP');
    const coins=adminInteger(document.getElementById('ta-coins').value,0,999999999,'金幣');
    const tickets=adminInteger(document.getElementById('ta-tickets').value,0,99999,'抽卡券');
    return adminChange(()=>{currentUserTotalExp=(level-1)*60+progress;currentUserLevel=level;userCoins=coins;gachaTickets=tickets;},'已套用玩家數值；測試調整不額外發升等獎勵。');
  }catch(error){adminReport(error.message,true);return false;}
}
function adminQuick(kind){
  if(!['coins','tickets','level'].includes(kind))return false;
  try{
    const value=kind==='coins'?adminInteger(userCoins+10000,0,999999999,'金幣'):kind==='tickets'?adminInteger(gachaTickets+10,0,99999,'抽卡券'):adminInteger(currentUserTotalExp+60,0,59999,'總 EXP');
    return adminChange(()=>{if(kind==='coins')userCoins=value;else if(kind==='tickets')gachaTickets=value;else {currentUserTotalExp=value;currentUserLevel=Math.floor(value/60)+1;}},kind==='coins'?'已增加 10,000 金幣。':kind==='tickets'?'已增加 10 張抽卡券。':'玩家已升 1 級，保留本級 EXP。');
  }catch(error){adminReport(error.message,true);return false;}
}
function adminSelectCharacter(){
  const id=document.getElementById('ta-character').value,fig=executiveFigurineDatabase[id];if(!fig)return;
  const item=userWarehouse.find(w=>w.id===id);
  const stars=document.getElementById('ta-stars');stars.max=fig.maxStars||5;stars.value=item?.stars||1;
  const fragments=document.getElementById('ta-fragments');fragments.value=item?.fragments||0;fragments.disabled=fig.familyRole==='founder';
  document.getElementById('ta-copies-group').hidden=!fig.familyRole;
  document.getElementById('ta-copies').value=item?.copies??1;
  document.getElementById('ta-character-help').textContent=(item?'已收藏':'尚未收藏，套用時會加入倉庫')+(fig.familyRole==='founder'?' · 融合素材固定 1 星，可調整張數。':fig.familyRole==='heir'?' · 融合角色可升至 5 星，可調整專屬碎片與張數。':' · 星等與穿用造型同步更新，碎片不扣除。');
}
function adminApplyCharacter(){
  try{
    const id=document.getElementById('ta-character').value,fig=executiveFigurineDatabase[id];if(!fig)throw new Error('請選擇有效角色。');
    const stars=adminInteger(document.getElementById('ta-stars').value,1,fig.maxStars||5,'角色星等');
    const fragments=fig.familyRole==='founder'?0:adminInteger(document.getElementById('ta-fragments').value,0,9999,'碎片');
    const copies=fig.familyRole?adminInteger(document.getElementById('ta-copies').value,1,9999,'IP 張數'):null;
    return adminChange(()=>{
      let item=userWarehouse.find(w=>w.id===id);if(!item){item={id};userWarehouse.push(item);}
      Object.assign(item,{stars,equippedStars:stars,fragments});if(copies!==null)item.copies=copies;
    },'已更新「'+fig.name+'」，可到收藏櫃查看造型。');
  }catch(error){adminReport(error.message,true);return false;}
}
function adminUnlockGeneral(){
  return adminChange(()=>{Object.values(executiveFigurineDatabase).filter(fig=>!fig.familyRole&&fig.pool!=='super').forEach(fig=>{if(!userWarehouse.some(w=>w.id===fig.id))userWarehouse.push({id:fig.id,stars:1,equippedStars:1,fragments:0});});},'一般 27 款 IP 已加入倉庫，原有角色數值保留。');
}
function adminMaxAllCharacters(){
  const targets=Object.values(executiveFigurineDatabase).filter(fig=>fig.familyRole!=='founder'&&(fig.maxStars||5)>1);
  return adminChange(()=>{
    for(const fig of targets){
      let item=userWarehouse.find(w=>w.id===fig.id);
      if(!item){
        item={id:fig.id,fragments:0};
        if(fig.familyRole)item.copies=1;
        userWarehouse.push(item);
      }
      item.stars=Math.min(5,fig.maxStars||5);
      item.equippedStars=item.stars;
    }
  },`已解鎖並將 ${targets.length} 款角色升至五星、換上最高階造型。融合素材維持固定一星；可按「還原上次修改」復原。`);
}
function adminGrantFusion(){
  if(typeof familyFounderIds==='undefined')return false;
  try{
    familyFounderIds.forEach(id=>adminInteger((userWarehouse.find(w=>w.id===id)?.copies??0)+5,1,9999,'IP 張數'));
    return adminChange(()=>{familyFounderIds.forEach(id=>{const item=userWarehouse.find(w=>w.id===id);if(item)item.copies=(item.copies??1)+5;else userWarehouse.push({id,stars:1,equippedStars:1,fragments:0,copies:5});});},'周先生、王小姐各增加 5 張，可測試融合。');
  }catch(error){adminReport(error.message,true);return false;}
}
function adminUndo(){
  if(!adminUndoState){adminReport('尚無可還原的修改。',true);return false;}
  const target=adminUndoState;
  if(adminChange(()=>adminRestore(target),'已還原上一次後台修改。')){adminUndoState=null;adminRefresh();return true;}return false;
}
function adminSaveSnapshot(){
  if(adminBusy()){adminReport('請等融合完成後再儲存快照。',true);return false;}
  try{localStorage.setItem(adminSnapshotKey,JSON.stringify({schema:1,edition:adminEdition,savedAt:new Date().toISOString(),state:adminCapture()}));adminRefreshSnapshot();adminReport('已儲存'+adminEditionLabel+'測試快照，重新整理後可手動讀取。');return true;}
  catch(error){adminReport('無法儲存快照：'+error.message,true);return false;}
}
function adminLoadSnapshot(){
  try{
    const raw=localStorage.getItem(adminSnapshotKey);if(!raw)throw new Error('這一版尚未儲存測試快照。');
    const data=JSON.parse(raw);if(data.schema!==1||data.edition!==adminEdition)throw new Error('快照不屬於目前版本。');
    const state=adminValidateState(data.state);return adminChange(()=>adminRestore(state),'已讀取'+adminEditionLabel+'快照。');
  }catch(error){adminReport(error.message,true);return false;}
}
function adminRefreshSnapshot(){
  const label=document.getElementById('ta-snapshot-info');
  try{const data=JSON.parse(localStorage.getItem(adminSnapshotKey)||'null');label.textContent=data?'目前快照：'+new Date(data.savedAt).toLocaleString('zh-TW',{timeZone:'Asia/Taipei'}):'此版本尚無快照。';}catch{label.textContent='瀏覽器儲存空間目前不可用。';}
}
function adminRefresh(){
  const select=document.getElementById('ta-character');if(!select)return;
  const selected=select.value;
  document.getElementById('ta-level').value=Math.floor(currentUserTotalExp/60)+1;
  document.getElementById('ta-exp').value=currentUserTotalExp%60;
  document.getElementById('ta-coins').value=userCoins;
  document.getElementById('ta-tickets').value=gachaTickets;
  select.innerHTML=Object.values(executiveFigurineDatabase).map(fig=>`<option value="${fig.id}">${fig.name}${userWarehouse.some(w=>w.id===fig.id)?' · 已收藏':' · 未收藏'}</option>`).join('');
  select.value=executiveFigurineDatabase[selected]?selected:'fig_muscle';adminSelectCharacter();
  document.getElementById('ta-undo').disabled=!adminUndoState;adminRefreshSnapshot();
}
function openTestAdmin(){
  adminReturnFocus=document.activeElement;adminRefresh();adminReport('目前控制：'+adminEditionLabel+'。設定只影響這個版本。');
  document.getElementById('test-admin-modal').classList.remove('hidden');document.querySelector('#test-admin-modal .ta-panel').scrollTop=0;document.getElementById('ta-level').focus();
}
function closeTestAdmin(){document.getElementById('test-admin-modal').classList.add('hidden');adminReturnFocus?.focus?.();}
window.addEventListener('DOMContentLoaded',()=>{
  const style=document.createElement('style');style.textContent=`
  .ta-entry{display:flex;justify-content:flex-end;margin-top:6px}.ta-entry button{font-size:10px;font-weight:900;border:1px solid #dbf6b980;background:#123e2d;color:#e6edc7;border-radius:20px;padding:4px 10px}
  #test-admin-modal{position:fixed;inset:0;z-index:100;background:#10251edb;display:flex;align-items:center;justify-content:center;padding:12px}#test-admin-modal.hidden{display:none}
  .ta-panel{width:100%;max-width:460px;max-height:90vh;overflow-y:auto;background:#f5f7ef;border:2px solid #213d31;border-radius:19px;box-shadow:5px 6px #0c241b;color:#294835;text-align:left}.ta-heading{position:sticky;top:0;z-index:3;display:flex;align-items:center;justify-content:space-between;background:#173f30;color:#fff3c8;padding:15px 17px}.ta-heading h2{font-size:18px;font-weight:900}.ta-heading small{font-size:9px;letter-spacing:1px;color:#bad5b5}.ta-heading button{font-size:20px;padding:3px 7px}.ta-body{padding:13px 15px}.ta-body section{border:1px solid #d1ddc7;border-radius:13px;padding:12px;margin-top:10px;background:white}.ta-body h3{font-size:12px;font-weight:900;margin-bottom:9px}.ta-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.ta-body label{display:flex;flex-direction:column;gap:4px;min-width:0;font-size:10px;font-weight:800}.ta-body input,.ta-body select{width:100%;min-width:0;border:1px solid #b7cbb2;border-radius:8px;padding:8px;color:#264832;background:#fff;font:14px/1.3 sans-serif}.ta-body input:disabled{background:#eef1e9;color:#92a18c}.ta-body button{font-size:10px;font-weight:900;border:1px solid #b7c9ad;border-radius:8px;padding:8px;background:#f3f8ed;color:#3a6246}.ta-body button:disabled{opacity:.4;cursor:default}.ta-body .ta-primary{background:#087647;border-color:#145337;color:#fff7d8;width:100%;margin-top:10px;padding:10px}.ta-actions{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}.ta-help{font-size:9px;color:#7e8c74;line-height:1.7;margin-top:7px}.ta-status{font-size:11px;color:#31593b;background:#e5f0d7;border:1px solid #c6dab6;border-radius:9px;padding:9px;line-height:1.7;position:sticky;top:70px;z-index:1}.ta-status.is-error{background:#fff0e8;color:#a44021;border-color:#e3b8a4}.ta-body [hidden]{display:none!important}#test-admin-modal :focus-visible{outline:3px solid #dca845;outline-offset:2px}
  `;document.head.appendChild(style);
  const entry=document.createElement('div');entry.className='ta-entry';entry.innerHTML='<button type="button" onclick="openTestAdmin()">⚙ 測試後台</button>';document.querySelector('header').appendChild(entry);
  const modal=document.createElement('div');modal.id='test-admin-modal';modal.className='hidden';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-labelledby','ta-title');
  modal.innerHTML=`<div class="ta-panel"><div class="ta-heading"><div><small>TEST CONSOLE · ${adminEditionLabel}</small><h2 id="ta-title">測試後台</h2></div><button onclick="closeTestAdmin()" aria-label="關閉測試後台">✕</button></div><div class="ta-body">
    <p id="test-admin-status" class="ta-status" role="status" aria-live="polite"></p>
    <section><h3>玩家等級與資源</h3><div class="ta-grid"><label>玩家等級<input id="ta-level" type="number" min="1" max="1000" step="1"></label><label>本級 EXP（0～59）<input id="ta-exp" type="number" min="0" max="59" step="1"></label><label>金幣<input id="ta-coins" type="number" min="0" max="999999999" step="1"></label><label>抽卡券<input id="ta-tickets" type="number" min="0" max="99999" step="1"></label></div><button class="ta-primary" onclick="adminApplyPlayer()">套用玩家數值</button><div class="ta-actions"><button onclick="adminQuick('coins')">＋10,000 金幣</button><button onclick="adminQuick('tickets')">＋10 張抽卡券</button><button onclick="adminQuick('level')">玩家升 1 級</button></div><p class="ta-help">每 60 EXP 升 1 級。測試調整不額外發升等獎勵；能力手冊各項分數不會連動修改。</p></section>
    <section><h3>一鍵角色測試</h3><button id="ta-max-all" class="ta-primary" onclick="adminMaxAllCharacters()">全部角色升至五星</button><p class="ta-help">一次解鎖所有可升星角色並換上五星造型，包含超業與融合產物。保留原有碎片與 IP 張數；周先生、王小姐維持固定一星。可用「還原上次修改」復原。</p></section>
    <section><h3>角色星等與碎片</h3><label>選擇角色<select id="ta-character" onchange="adminSelectCharacter()"></select></label><p id="ta-character-help" class="ta-help"></p><div class="ta-grid"><label>角色星等<input id="ta-stars" type="number" min="1" max="5" step="1"></label><label>角色碎片<input id="ta-fragments" type="number" min="0" max="9999" step="1"></label><label id="ta-copies-group" hidden>IP 持有張數<input id="ta-copies" type="number" min="1" max="9999" step="1"></label></div><button class="ta-primary" onclick="adminApplyCharacter()">套用角色數值／加入收藏</button><div class="ta-actions"><button onclick="adminUnlockGeneral()">解鎖全部一般 IP</button>${typeof superSalesIds!=='undefined'?'<button onclick="adminUnlockSuperSales()">解鎖全部超業 IP</button>':''}${typeof familyFounderIds!=='undefined'?'<button onclick="adminGrantFusion()">融合素材各＋5 張</button>':''}</div></section>
    <section><h3>測試快照</h3><div class="ta-actions"><button onclick="adminSaveSnapshot()">儲存目前快照</button><button onclick="adminLoadSnapshot()">讀取已存快照</button><button id="ta-undo" onclick="adminUndo()" disabled>還原上次修改</button></div><p id="ta-snapshot-info" class="ta-help"></p><p class="ta-help">兩版分開儲存在此瀏覽器。快照包含等級、資源、IP 與陳列；不包含任務、測評或劇情進度。重新整理後，開啟後台手動讀取。</p></section>
  </div></div>`;document.body.appendChild(modal);
  modal.addEventListener('keydown',event=>{
    if(event.key==='Escape'){closeTestAdmin();return;}
    if(event.key!=='Tab')return;
    const nodes=[...modal.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled)')].filter(node=>node.getClientRects().length);
    const first=nodes[0],last=nodes[nodes.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  });
});
