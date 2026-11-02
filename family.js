// Experimental-only collectible IP fusion: two owned cards -> three output cards.
globalThis.familyIPCatalog = {
  founder_zhou: {name:'周先生',file:'family-founder_zhou.png',role:'founder',desc:'從獎池抽取的周先生 IP。可與王小姐 IP 各投入一張，融合產出 KEN、HOWARD、HENRY 三張 IP。'},
  founder_wang: {name:'王小姐',file:'family-founder_wang.png',role:'founder',desc:'從獎池抽取的王小姐 IP。可與周先生 IP 各投入一張，融合產出 KEN、HOWARD、HENRY 三張 IP。'},
  heir_ken: {name:'KEN',file:'family-heir_ken.png',role:'heir',desc:'由周先生 IP 與王小姐 IP 融合取得的限定收藏角色，可放入展示櫃。'},
  heir_howard: {name:'HOWARD',file:'family-heir_howard.png',role:'heir',desc:'由周先生 IP 與王小姐 IP 融合取得的限定收藏角色，可放入展示櫃。'},
  heir_henry: {name:'HENRY',file:'family-heir_henry.png',role:'heir',desc:'由周先生 IP 與王小姐 IP 融合取得的限定收藏角色，可放入展示櫃。'}
};
for(const [id,fig] of Object.entries(globalThis.familyIPCatalog)){
  executiveFigurineDatabase[id]={id,name:fig.name,titleBadge:fig.role==='founder'?'可投入融合的 IP':'融合限定 IP',rarity:'SSR',pool:fig.role==='founder'?'family':'fusion',familyRole:fig.role,maxStars:fig.role==='founder'?1:5,themeColor:'#08784b',bgGradient:'from-emerald-700 to-amber-500',desc:fig.desc+(fig.role==='heir'?' 重複融合取得專屬碎片，每 5 片升 1 星並解鎖新造型。':''),quote:'「承接初心，走出自己的新篇章。」'};
}
for(const [slug,names] of Object.entries({
  ken:['新銳觀察者','數據分析師','科技策劃者','全域指揮官','未來領航者'],
  howard:['新秀發言人','自信主講者','團隊號召者','王牌統帥','榮耀領袖'],
  henry:['沉著新星','敏銳行動者','精準執行者','瞬影王牌','極速決勝者']
})){
  const id=`heir_${slug}`;
  globalThis.characterEvolutionCatalog[id]={name:familyIPCatalog[id].name,names,
    files:names.map((_,index)=>`${slug}-${index+1}.png`),width:1024,height:1536};
}
const familyFounderIds=['founder_zhou','founder_wang'];
const familyHeirIds=['heir_ken','heir_howard','heir_henry'];
let familySelected={founder_zhou:false,founder_wang:false};
let familyLastFusion=false;
const FAMILY_FUSION_SUCCESS_RATE=.7;
const FAMILY_FUSION_DURATION_MS=5200;
let familyFusionBusy=false;

function setFamilyFusionStage(phase){
  const stage=document.getElementById('family-fusion-animation');
  stage.className=`family-fusion-animation phase-${phase}`;
  const text={gather:'預備！兩人同步站位…',dance:'左、右…同步步伐！',merge:'指尖相碰——融合！',resolve:'融合光芒綻放，結果即將揭曉…',failure:'融合失敗'};
  document.getElementById('family-animation-status').textContent=text[phase];
}
function resetFamilyFusionStage(){
  if(familyFusionBusy)return;
  document.getElementById('family-fusion-animation').classList.add('hidden');
  document.getElementById('family-fusion-controls').classList.remove('hidden');
  renderFamilyFusion();
}

globalThis.renderFamilyAvatar=function(id,wh){
  const fig=globalThis.familyIPCatalog[id];
  return `<div class="${wh}" style="flex-shrink:0"><img src="./${fig.file}" alt="${fig.name}" style="width:100%;height:100%;object-fit:contain" /></div>`;
};
function familyCopyCount(id){const item=userWarehouse.find(item=>item.id===id);return item?item.copies??1:0;}
function addFamilyCard(id){
  const existing=userWarehouse.find(item=>item.id===id);
  const fragmentBonus=!!existing && executiveFigurineDatabase[id].familyRole==='heir' && existing.stars<5;
  if(existing){
    existing.copies=(existing.copies??1)+1;
    if(fragmentBonus)existing.fragments=(existing.fragments??0)+1;
  }
  else userWarehouse.push({id,stars:1,fragments:0,copies:1});
  return {...executiveFigurineDatabase[id],isDuplicate:!!existing,rewardLabel:`獲得 1 張 · 持有 ${familyCopyCount(id)} 張${fragmentBonus?' · +1 碎片':''}`};
}
function pullFamilyGacha(times=1){
  if(![1,10].includes(times))return;
  const cost=times===1?100:950;
  if(times===1&&gachaTickets>0)gachaTickets--;
  else if(userCoins>=cost)userCoins-=cost;
  else{showCustomToast(`抽取需要 ${cost} 幣，遊戲幣不足。`,'⚠️');return;}
  const results=[];
  for(let index=0;index<times;index++)results.push(addFamilyCard(familyFounderIds[Math.floor(Math.random()*2)]));
  updateCurrencyUI();renderWarehouseUI();renderFamilyFusion();showGachaRevealModal(results,'recruit');
}
function openFamilyFusion(){if(!familyFusionBusy)resetFamilyFusionStage();renderFamilyFusion();openModal('modal-family-fusion');}
function selectFamilyIngredient(id){
  if(familyFusionBusy)return;
  if(!familyFounderIds.includes(id))return;
  if(familyCopyCount(id)<1){showCustomToast('請先從獎池抽到這張 IP。','🔒');return;}
  familySelected[id]=!familySelected[id];renderFamilyFusion();
}
function consumeFamilyCard(id){
  const item=userWarehouse.find(item=>item.id===id);
  if((item.copies??1)>1)item.copies--;
  else{userWarehouse=userWarehouse.filter(item=>item.id!==id);userCabinetSlots=userCabinetSlots.map(slot=>slot===id?null:slot);}
}
function fuseFamilyIP(){
  if(familyFusionBusy)return;
  if(!familyFounderIds.every(id=>familySelected[id]&&familyCopyCount(id)>0)){
    showCustomToast('請先放入已收藏的周先生與王小姐 IP 各一張。','🔒');return;
  }
  // Commit input consumption once; animation callbacks cannot start another transaction.
  familyFusionBusy=true;
  const succeeded=Math.random()<FAMILY_FUSION_SUCCESS_RATE;
  familyFounderIds.forEach(consumeFamilyCard);
  familySelected={founder_zhou:false,founder_wang:false};familyLastFusion=false;
  renderWarehouseUI();render3x3CabinetGrid();renderFamilyFusion();
  document.getElementById('family-fusion-controls').classList.add('hidden');
  document.getElementById('family-fusion-close').disabled=true;
  document.getElementById('family-failure-details').classList.add('hidden');
  setFamilyFusionStage('gather');
  setTimeout(()=>setFamilyFusionStage('dance'),900);
  setTimeout(()=>setFamilyFusionStage('merge'),1800);
  setTimeout(()=>setFamilyFusionStage('resolve'),4200);
  setTimeout(()=>{
    familyFusionBusy=false;
    document.getElementById('family-fusion-close').disabled=false;
    if(succeeded){
      const results=familyHeirIds.map(addFamilyCard);familyLastFusion=true;
      renderWarehouseUI();renderFamilyFusion();resetFamilyFusionStage();
      closeModal('modal-family-fusion');showGachaRevealModal(results,'fusion');
      showCustomToast('融合成功！一次獲得 KEN、HOWARD、HENRY 三張 IP。','✨');
    }else{
      setFamilyFusionStage('failure');
      document.getElementById('family-failure-details').classList.remove('hidden');
      showCustomToast('融合失敗，本次兩張素材 IP 已消耗。','💨');
    }
  },FAMILY_FUSION_DURATION_MS);
}
function renderFamilyFusion(){
  const founders=document.getElementById('family-founders');if(!founders)return;
  founders.innerHTML=familyFounderIds.map(id=>{
    const copies=familyCopyCount(id),selected=familySelected[id]&&copies>0;
    return `<button type="button" class="family-founder-card ${selected?'is-selected':''}" onclick="selectFamilyIngredient('${id}')" ${copies?'':'disabled'} aria-pressed="${selected}" aria-label="${selected?'取回':'放入'}${executiveFigurineDatabase[id].name} IP"><span class="family-slot-status">${selected?'已放入 1 張':'待放入 IP'}</span>${getFigurineAvatarSVG(id,'md')}<b>${executiveFigurineDatabase[id].name}</b><span>倉庫持有 <strong>${copies}</strong> 張</span><small>${selected?'點擊取回':copies?'點擊放入一張':'請先到獎池抽取'}</small></button>`;
  }).join('');
  const ownedCount=familyHeirIds.filter(id=>familyCopyCount(id)>0).length;
  document.getElementById('family-collection-count').innerText=`${ownedCount} / 3`;
  document.getElementById('family-heirs').innerHTML=familyHeirIds.map(id=>`<div class="family-heir-card ${familyCopyCount(id)?'is-owned':''} ${familyLastFusion?'just-fused':''}"><span>${getFigurineAvatarSVG(id,'md')}</span><b>${executiveFigurineDatabase[id].name}</b><small>產出 ×1 · 持有 ${familyCopyCount(id)} 張</small></div>`).join('');
  const ready=familyFounderIds.every(id=>familySelected[id]&&familyCopyCount(id)>0);
  const btn=document.getElementById('family-fuse-button');btn.disabled=!ready;
  btn.disabled=familyFusionBusy||!ready;
  btn.innerText=familyFusionBusy?'能量融合中…':ready?'✨ 開始融合 · 成功率 70%':'請放入周先生與王小姐 IP';
}
window.addEventListener('DOMContentLoaded',renderFamilyFusion);
