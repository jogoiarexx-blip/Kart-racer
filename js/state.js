"use strict";

// ---------- ESTADO ----------
let raceState = 'idle';
let countdownVal = 3;
let countdownTimer = 0;
let TOTAL_LAPS = 3;
let lapToastTimer = 0;
let raceTicks=0, lapStartTick=0, bestLapTicks=Infinity, lastLapTicks=0;

function resetRace(){
  const startFrame=getStartFrame();
  const p0=startFrame.p, fwd=startFrame.fwd, n0=startFrame.n;
  const startAngle=startFrame.angle;

  // Todos começam ATRÁS da faixa quadriculada, dentro da largura útil do asfalto.
  const lane = Math.min(30, ROAD_HW*0.28);
  const frontBack = 26;
  const rowGap = 48;
  const grid = [
    {r:player, lat:-lane, back:frontBack},
    {r:ai1,    lat: lane, back:frontBack},
    {r:ai2,    lat:-lane, back:frontBack+rowGap},
    {r:ai3,    lat: lane, back:frontBack+rowGap},
  ];

  grid.forEach(g=>{
    g.r.x = p0.x + n0.x*g.lat - fwd.x*g.back;
    g.r.y = p0.y + n0.y*g.lat - fwd.y*g.back;
    g.r.angle = startAngle;
    g.r.speed=0; g.r.vx=0; g.r.vy=0; g.r.lap=0; g.r.wpIndex=2;

    // Segurança extra: se uma spline muito fechada colocar a grade fora do asfalto,
    // recentraliza o kart no corredor da pista antes da contagem regressiva.
    let near = nearestWaypoint(g.r.x, g.r.y, 0, 12);
    let lateralDist = signedDistFromCenter(g.r.x, g.r.y, near.i);
    const safeHalfWidth = ROAD_HW*0.62;
    if(Math.abs(lateralDist)>safeHalfWidth){
      const pp=path[near.i], nn=normals[near.i];
      lateralDist=Math.max(-safeHalfWidth,Math.min(safeHalfWidth,lateralDist));
      g.r.x=pp.x+nn.x*lateralDist;
      g.r.y=pp.y+nn.y*lateralDist;
      near=nearestWaypoint(g.r.x,g.r.y,near.i,8);
    }

    g.r.hintIndex = near.i;
    g.r.finished=false; g.r.place=0; g.r.driftTime=0; g.r.drift=false; g.r.driftCharge=0; g.r.boostTimer=0; g.r.boostTouchCooldown=0; g.r.lastLapStamp=0;
    g.r.heldItem=null; g.r.rouletteItem=null; g.r.itemRoulette=0; g.r.itemUseCooldown=0; g.r.shieldTimer=0; g.r.spinTimer=0; g.r.slowTimer=0;
    g.r.aiOffset = g.r.isPlayer ? 0 : (Math.random()-0.5)*ROAD_HW*0.72;
  });

  currentCamBehind=BASE_CAM_BEHIND;
  currentFocal=BASE_FOCAL;
  currentCamHeight=BASE_CAM_HEIGHT;
  cameraShake=0;
  camAngleSmooth = startAngle;
  raceState='countdown';
  countdownVal=3;
  countdownTimer=0;
  lapToastTimer=0;
  raceTicks=0; lapStartTick=0; bestLapTicks=Infinity; lastLapTicks=0;
  if(typeof itemProjectiles!=='undefined'){ itemProjectiles.length=0; itemHazards.length=0; itemExplosions.length=0; itemPickups.length=0; itemMessage=''; itemMessageTimer=0; }
}
