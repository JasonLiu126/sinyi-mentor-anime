// Owned-IP carousel. Browsing never changes ownership, equipped tiers or cabinet slots.
let cabinetCarouselId=null;
let cabinetCarouselFilter='all';
const cabinetCarouselFilters=['all','chen','tony','super','family'];

function getCabinetCarouselItems(){
  const seen=new Set();
  return userWarehouse.filter(item=>{
    const fig=executiveFigurineDatabase[item.id];
    if(!fig||seen.has(item.id))return false;
    seen.add(item.id);
    if(cabinetCarouselFilter==='all')return true;
    if(cabinetCarouselFilter==='family')return !!fig.familyRole;
    return fig.pool===cabinetCarouselFilter || (cabinetCarouselFilter==='chen'&&item.id.startsWith('fig_'));
  });
}
function getCabinetCarouselSelection(){
  const items=getCabinetCarouselItems();
  const index=Math.max(0,items.findIndex(item=>item.id===cabinetCarouselId));
  cabinetCarouselId=items[index]?.id??null;
  return {items,index,item:items[index]??null};
}
function filterCabinetCarousel(filter){
  if(!cabinetCarouselFilters.includes(filter))return;
  cabinetCarouselFilter=filter;renderCabinetCarousel(true);
}
function selectCabinetCarousel(id){
  if(!getCabinetCarouselItems().some(item=>item.id===id))return;
  cabinetCarouselId=id;renderCabinetCarousel(true);
}
function moveCabinetCarousel(step){
  const {items,index}=getCabinetCarouselSelection();
  if(!items.length||!Number.isInteger(step))return;
  cabinetCarouselId=items[((index+step)%items.length+items.length)%items.length].id;
  renderCabinetCarousel(true,Math.sign(step));
}
function openCabinetCarouselWardrobe(){
  const {item}=getCabinetCarouselSelection();
  if(item)openFigurineDetailModal(item.id);
}
function getCabinetSwipeDirection(dx,dy){
  return Math.abs(dx)>=40 && Math.abs(dx)>Math.abs(dy)*1.3 ? (dx<0?1:-1) : 0;
}
function renderCabinetCarousel(scrollSelected=false,direction=0){
  const stage=document.getElementById('carousel-stage');if(!stage)return;
  const {items,index,item}=getCabinetCarouselSelection();
  document.querySelectorAll('#carousel-filters button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.filter===cabinetCarouselFilter)));
  const total=items.length,fig=item?executiveFigurineDatabase[item.id]:null;
  const offsets=total===0?[]:total===1?[0]:total===2?[0,1]:total===3?[-1,0,1]:total===4?[-1,0,1,2]:[-2,-1,0,1,2];
  stage.classList.toggle('is-empty',!total);
  stage.innerHTML=total?`<div class="carousel-orbit" aria-hidden="true"></div><div class="carousel-floor" aria-hidden="true"></div>`+offsets.map(offset=>{
    const candidate=items[((index+offset)%total+total)%total],character=executiveFigurineDatabase[candidate.id];
    const distance=Math.abs(offset),scale=distance===0?1:distance===1?.57:.35;
    const shift=distance===2?Math.sign(offset)*70:offset*51;
    return `<button type="button" class="carousel-figure ${offset===0?'is-center':'is-neighbor'} distance-${distance}" style="--shift:${shift}%;--scale:${scale};--layer:${30-distance*10}" onclick="${offset===0?'openCabinetCarouselWardrobe()':`selectCabinetCarousel('${candidate.id}')`}" aria-label="${offset===0?'查看':'切換到'}${character.name}${offset===0?'的造型衣櫃':''}" ${offset===0?'aria-current="true"':''}><span class="carousel-art">${getFigurineAvatarSVG(candidate.id,'lg')}</span><span class="carousel-plinth" aria-hidden="true"></span>${offset!==0?`<span class="carousel-side-name">${character.name}</span>`:''}</button>`;
  }).join(''):`<div class="carousel-empty"><span>✦</span><b>這一區還沒有收藏角色</b><small>抽到 IP 後，就能在這裡展示與換裝。</small></div>`;
  document.getElementById('carousel-position').textContent=total?`${String(index+1).padStart(2,'0')} / ${String(total).padStart(2,'0')}`:'0 / 0';
  document.getElementById('carousel-total').textContent=`已收藏 ${userWarehouse.filter(w=>executiveFigurineDatabase[w.id]).length} 款`;
  document.getElementById('carousel-name').textContent=fig?.name??'等待新夥伴登場';
  const category=fig?(fig.category==='super'?`超業 · ${fig.owner==='dingyuan'?'鼎元':'婉嫣'}`:fig.familyRole?'傳承 IP':fig.pool==='tony'?'托尼宇宙':'陳總宇宙'):'';
  document.getElementById('carousel-category').textContent=category;
  document.getElementById('carousel-rarity').textContent=fig?.rarity??'';
  document.getElementById('carousel-rarity').dataset.rarity=fig?.rarity??'';
  const stars=item?.stars??0,equipped=item?getEquippedFigurineStars(item.id):0;
  document.getElementById('carousel-stars').textContent='★'.repeat(stars)+'☆'.repeat(Math.max(0,5-stars));
  document.getElementById('carousel-stars').setAttribute('aria-label',`${stars} 星`);
  document.getElementById('carousel-outfit').textContent=fig?`${characterEvolutionCatalog[item.id]?.names[equipped-1]??fig.titleBadge}${equipped!==stars?' · 穿用 '+equipped+' 星造型':''}`:'';
  document.getElementById('carousel-quote').textContent=fig?.quote??'下一位值得珍藏的角色，正在等你。';
  document.getElementById('carousel-wardrobe').disabled=!item;
  for(const id of ['carousel-prev','carousel-next'])document.getElementById(id).disabled=total<2;
  document.getElementById('carousel-thumbnails').innerHTML=items.map(w=>`<button type="button" onclick="selectCabinetCarousel('${w.id}')" aria-label="展示${executiveFigurineDatabase[w.id].name}" aria-current="${w.id===cabinetCarouselId}" title="${executiveFigurineDatabase[w.id].name}"><span>${getFigurineAvatarSVG(w.id,'sm')}</span><small>${executiveFigurineDatabase[w.id].name}</small></button>`).join('');
  const center=document.querySelector('#carousel-stage .is-center');
  if(scrollSelected&&center?.animate&&!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){
    center.animate([{transform:`translateX(calc(-50% + ${direction*32}px)) scale(.94)`,opacity:.45},{transform:'translateX(-50%) scale(1)',opacity:1}],{duration:240,easing:'cubic-bezier(.2,.8,.2,1)'});
  }
  if(scrollSelected){
    const strip=document.getElementById('carousel-thumbnails');
    const selected=document.querySelector('#carousel-thumbnails [aria-current="true"]');
    if(selected)strip.scrollTo({left:strip.scrollLeft+selected.getBoundingClientRect().left-strip.getBoundingClientRect().left-(strip.clientWidth-selected.offsetWidth)/2,behavior:'smooth'});
  }
}
function initCabinetCarousel(){
  const stage=document.getElementById('carousel-stage');if(!stage)return;
  let start=null,dragging=false,suppressClickUntil=0;
  stage.addEventListener('pointerdown',event=>{
    if(event.isPrimary===false||event.button>0)return;
    start={x:event.clientX,y:event.clientY,id:event.pointerId};dragging=false;
  });
  stage.addEventListener('pointermove',event=>{
    if(!start||start.id!==event.pointerId)return;
    const dx=event.clientX-start.x,dy=event.clientY-start.y;
    if(!dragging&&Math.abs(dx)>12&&Math.abs(dx)>Math.abs(dy)*1.3){dragging=true;stage.setPointerCapture?.(event.pointerId);stage.classList.add('is-dragging');}
    if(dragging){stage.style.setProperty('--drag',Math.max(-42,Math.min(42,dx*.35))+'px');}
  });
  function end(event,canceled=false){
    if(!start||event.pointerId!==start.id)return;
    const direction=canceled?0:getCabinetSwipeDirection(event.clientX-start.x,event.clientY-start.y);
    if(dragging||direction)suppressClickUntil=Date.now()+350;
    start=null;dragging=false;stage.classList.remove('is-dragging');stage.style.removeProperty('--drag');
    if(direction)moveCabinetCarousel(direction);
  }
  stage.addEventListener('pointerup',event=>end(event));stage.addEventListener('pointercancel',event=>end(event,true));
  stage.addEventListener('lostpointercapture',()=>{start=null;dragging=false;stage.classList.remove('is-dragging');stage.style.removeProperty('--drag');});
  stage.addEventListener('click',event=>{if(Date.now()<suppressClickUntil){event.preventDefault();event.stopImmediatePropagation();}},true);
  stage.addEventListener('keydown',event=>{
    if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();moveCabinetCarousel(event.key==='ArrowRight'?1:-1);}
  });
  renderCabinetCarousel();
}
window.addEventListener('DOMContentLoaded',initCabinetCarousel);
