"use strict";

// ---------- LOOP PRINCIPAL — fixed timestep 60 Hz ----------
let lastTime=0;
let accumulator=0;
const FIXED_MS = 1000/60;
const FIXED_DT = 1; // preserva a escala antiga da física
const MAX_FRAME_MS = 100;

function fixedUpdate(){
  if(raceState==='countdown'){
    countdownTimer += FIXED_DT;
    if(countdownTimer>=60){
      countdownTimer=0;
      countdownVal--;
      if(countdownVal<0) raceState='racing';
    }
  } else if(raceState==='racing'){
    raceTicks++; cameraShake*=.82; if(cameraShake<.1)cameraShake=0;
    for(const box of itemBoxes){ if(!box.active&&box.respawn>0){box.respawn--;if(box.respawn<=0)box.active=true;} }
    updatePlayer(FIXED_DT);
    updateItemSystem(FIXED_DT);
    updateAI(ai1,FIXED_DT); updateAI(ai2,FIXED_DT); updateAI(ai3,FIXED_DT);
    resolveKartCollisions();
    computeStandings();
    if(lapToastTimer>0) lapToastTimer -= FIXED_DT;
    if(player.finished) endRace();
  }
}

function loop(t){
  if(!lastTime) lastTime=t;
  const rawElapsed = Math.min(MAX_FRAME_MS, Math.max(0, t-lastTime));
  lastTime=t;

  const instFps = 1000/Math.max(1,rawElapsed);
  fpsSmooth += (instFps-fpsSmooth)*0.08;
  updateAdaptiveQuality(rawElapsed/FIXED_MS);

  accumulator += rawElapsed;
  let steps=0;
  while(accumulator>=FIXED_MS && steps<6){
    fixedUpdate();
    accumulator -= FIXED_MS;
    steps++;
  }
  if(steps===6) accumulator=0;

  ctx.clearRect(0,0,W,H);
  renderScene();
  drawOverlay();
  requestAnimationFrame(loop);
}

function endRace(){
  raceState='finished';
  computeStandings();
  document.getElementById('endScreen').style.display='flex';
  document.getElementById('endPlace').textContent =
    player.place===1 ? 'VOCÊ VENCEU A CORRIDA! 🏆' : `Você terminou em ${ordinal(player.place)} lugar.`;
  document.getElementById('endTitle').textContent = player.place===1 ? 'VITÓRIA!' : 'CHEGADA!';
}

document.getElementById('btnStart').addEventListener('click', ()=>{
  startScreen.style.display='none';
  resetRace();
});
document.getElementById('btnAgain').addEventListener('click', ()=>{
  document.getElementById('endScreen').style.display='none';
  resetRace();
});
document.getElementById('btnMenu').addEventListener('click', returnToMainMenu);

requestAnimationFrame(loop);
