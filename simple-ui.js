// A lighter presentation layer: keep features reachable through disclosure.
const appIcons={
  map:'<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2Z"/><path d="M9 3v16M15 5v16"/>',
  handbook:'<path d="M4 20h16M6 16v-5M12 16V4M18 16V8"/>',
  tasks:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2M9 11l2 2 4-4M9 17h6"/>',
  showcase:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 10v10M15 10v10"/>',
  academy:'<path d="M12 5c-3-2-7-2-10-1v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1Zm0 0v15"/>',
  building:'<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1M10 21v-3h4v3"/>'
};
function appIcon(name){return `<svg class="app-line-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${appIcons[name]}</svg>`;}
function simplifyPracticeCards(){
  for(const article of document.querySelectorAll('#hunter-quest-list .hunter-quest')){
    if(!article.querySelector('textarea')||article.querySelector('details'))continue;
    const parts=[...article.children].slice(1);
    const disclosure=document.createElement('details');disclosure.className='practice-disclosure';
    const summary=document.createElement('summary');summary.textContent='開始練習';disclosure.appendChild(summary);
    for(const part of parts)disclosure.appendChild(part);
    article.appendChild(disclosure);
  }
}
const simpleBaseMentorRefresh=mentorRefresh;
mentorRefresh=function(){simpleBaseMentorRefresh();simplifyPracticeCards();};
function setupSimpleInterface(){
  const navLabels={map:'商圈',handbook:'成長',tasks:'任務',showcase:'收藏',academy:'學院'};
  for(const [key,label] of Object.entries(navLabels)){
    const button=document.getElementById('nav-btn-'+key);button.innerHTML=appIcon(key)+`<span class="app-nav-label">${label}</span>`;button.setAttribute('aria-label',key==='map'?'商圈地圖':label);
  }
  const header=document.querySelector('header');header.querySelector('h1').innerHTML='信義新人夥伴';
  header.querySelector('p').classList.add('simple-hidden');
  const exp=document.getElementById('header-user-exp'),level=document.getElementById('header-user-level');
  const levelBox=exp.parentElement;const value=level.textContent,expValue=exp.textContent;
  levelBox.className='app-player-level';levelBox.innerHTML=`Lv.<span id="header-user-level">${value}</span><span id="header-user-exp" class="simple-hidden">${expValue}</span>`;
  const coins=document.getElementById('header-user-coins'),coinBox=coins.parentElement,coinValue=coins.textContent;
  coinBox.className='app-player-coins';coinBox.innerHTML=`<span id="header-user-coins">${coinValue}</span><span>幣</span>`;
  const adminEntry=header.querySelector('.ta-entry');
  if(adminEntry){
    const menu=document.createElement('details');menu.className='app-more-menu';
    const summary=document.createElement('summary');summary.textContent='···';summary.setAttribute('aria-label','更多選項');menu.appendChild(summary);
    const button=adminEntry.querySelector('button');button.textContent='測試後台';button.addEventListener('click',()=>{menu.open=false;});menu.appendChild(button);adminEntry.replaceWith(menu);
    document.addEventListener('click',event=>{if(menu.open&&!menu.contains(event.target))menu.open=false;});
  }
  for(const node of document.querySelectorAll('#tab-map [onclick^="selectMapBuilding"]>span'))node.innerHTML=appIcon('building');
  document.getElementById('custom-toast').classList.remove('opacity-100','translate-y-0');
  document.getElementById('custom-toast').classList.add('opacity-0','-translate-y-2');
  const overlay=document.getElementById('mentor-companion');
  overlay.addEventListener('click',event=>{if(event.target===overlay)mentorCloseCompanion();});
  overlay.addEventListener('keydown',event=>{
    if(event.key==='Escape'){event.preventDefault();mentorCloseCompanion();return;}
    if(event.key!=='Tab')return;
    const nodes=[...overlay.querySelectorAll('button:not(:disabled),input,select,textarea,summary,a[href]')].filter(n=>n.getClientRects().length),first=nodes[0],last=nodes[nodes.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  });
  simplifyPracticeCards();
}
window.addEventListener('DOMContentLoaded',setupSimpleInterface);
