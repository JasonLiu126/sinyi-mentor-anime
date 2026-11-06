// Draggable companion port; formal theme is provided separately.
let mentorSuppressClickUntil=0;
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
