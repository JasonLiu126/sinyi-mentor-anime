// Temporary catalog visibility; ownership, upgrades and cabinet assignments are retained.
globalThis.hideChenCharacters=true;
window.addEventListener('DOMContentLoaded',()=>{
  for(const selector of ['#pool-btn-chen','#pool-btn-all','#carousel-filters [data-filter="chen"]']){
    const button=document.querySelector(selector);if(button)button.hidden=true;
  }
});
