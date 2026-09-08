"use strict";

// ---------- INPUT ----------
const keys = {};
window.addEventListener('keydown', e=>{
  if(e.key==='c'||e.key==='C'){ cameraMode = (cameraMode==='top') ? 'mode7' : 'top'; }
  if(e.key==='g'||e.key==='G'){ const order=['low','medium','high','ultra']; setGraphicsMode(order[(order.indexOf(graphicsMode)+1)%order.length]); }
  if(e.key==='f'||e.key==='F'){ showFps = !showFps; }
  if((e.key==='e'||e.key==='E'||e.key==='x'||e.key==='X') && raceState==='racing' && !useItemLock){ useRacerItem(player); useItemLock=true; }
  keys[e.key]=true;
  if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," ","e","E","x","X"].includes(e.key)) e.preventDefault();
});
document.querySelectorAll('[data-gfx]').forEach(b=>b.addEventListener('click',()=>setGraphicsMode(b.dataset.gfx)));
document.querySelectorAll('[data-density]').forEach(b=>b.addEventListener('click',()=>setSceneryDensity(b.dataset.density)));
setGraphicsMode('medium');
setSceneryDensity('medium');

window.addEventListener('keyup',e=>{ if(['e','E','x','X'].includes(e.key)) useItemLock=false; });
