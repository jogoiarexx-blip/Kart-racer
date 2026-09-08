"use strict";

// ---------- MENU PRINCIPAL ----------
const startScreen = document.getElementById('startScreen');
const menuPages = [...document.querySelectorAll('.menuPage')];
const mainMenuButtons = [...document.querySelectorAll('[data-menu]')];
let menuIndex = 0;

function showMenuPage(id){
  menuPages.forEach(p=>p.classList.toggle('active', p.id===id));
  if(id==='pageMain'){
    menuIndex = Math.max(0, Math.min(menuIndex, mainMenuButtons.length-1));
    updateMenuSelection();
  }
}
function updateMenuSelection(){
  mainMenuButtons.forEach((b,i)=>b.classList.toggle('selected',i===menuIndex));
}
function syncChoice(selector, attr, value){
  document.querySelectorAll(selector).forEach(b=>b.classList.toggle('active',b.dataset[attr]===String(value)));
}
function returnToMainMenu(){
  raceState='idle';
  document.getElementById('endScreen').style.display='none';
  startScreen.style.display='block';
  showMenuPage('pageMain');
}

document.getElementById('btnTracks').addEventListener('click',()=>showMenuPage('pageTracks'));
document.getElementById('btnOptions').addEventListener('click',()=>showMenuPage('pageOptions'));
document.getElementById('btnControls').addEventListener('click',()=>showMenuPage('pageControls'));
document.getElementById('btnCredits').addEventListener('click',()=>showMenuPage('pageCredits'));
document.querySelectorAll('[data-back]').forEach(b=>b.addEventListener('click',()=>showMenuPage('pageMain')));
document.querySelectorAll('[data-track]').forEach(b=>b.addEventListener('click',()=>{
  const idx=Number(b.dataset.track);
  rebuildTrack(idx);
  document.querySelectorAll('[data-track]').forEach(x=>x.classList.toggle('active',Number(x.dataset.track)===idx));
  document.getElementById('trackInfo').textContent=`${currentTrack.name} • Dificuldade: ${currentTrack.difficulty} • ${currentTrack.desc}`;
}));

document.querySelectorAll('[data-laps]').forEach(b=>b.addEventListener('click',()=>{ TOTAL_LAPS=Number(b.dataset.laps); syncChoice('[data-laps]','laps',TOTAL_LAPS); }));
document.querySelectorAll('[data-camera]').forEach(b=>b.addEventListener('click',()=>{ cameraMode=b.dataset.camera; syncChoice('[data-camera]','camera',cameraMode); }));
document.getElementById('btnFpsOff').addEventListener('click',()=>{ showFps=false; document.getElementById('btnFpsOff').classList.add('active'); document.getElementById('btnFpsOn').classList.remove('active'); });
document.getElementById('btnFpsOn').addEventListener('click',()=>{ showFps=true; document.getElementById('btnFpsOn').classList.add('active'); document.getElementById('btnFpsOff').classList.remove('active'); });
mainMenuButtons.forEach((b,i)=>{ b.addEventListener('mouseenter',()=>{menuIndex=i;updateMenuSelection();}); b.addEventListener('focus',()=>{menuIndex=i;updateMenuSelection();}); });

window.addEventListener('keydown',e=>{
  if(startScreen.style.display==='none') return;
  const main=document.getElementById('pageMain').classList.contains('active');
  if(main && (e.key==='ArrowDown'||e.key==='s'||e.key==='S')){ e.preventDefault(); menuIndex=(menuIndex+1)%mainMenuButtons.length; updateMenuSelection(); }
  else if(main && (e.key==='ArrowUp'||e.key==='w'||e.key==='W')){ e.preventDefault(); menuIndex=(menuIndex-1+mainMenuButtons.length)%mainMenuButtons.length; updateMenuSelection(); }
  else if(main && e.key==='Enter'){ e.preventDefault(); mainMenuButtons[menuIndex].click(); }
  else if(!main && e.key==='Escape'){ e.preventDefault(); showMenuPage('pageMain'); }
});
updateMenuSelection();
window.addEventListener('keyup', e=>{ keys[e.key]=false; });
window.addEventListener('blur', ()=>{ for(const k in keys) keys[k]=false; });
