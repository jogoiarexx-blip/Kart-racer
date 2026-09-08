"use strict";

// ---------- FÍSICA ----------
function surfaceGripFor(r){
  const near=r.hintIndex||0;
  if(currentTrack.surface==='iceMix' && near>NP*0.34 && near<NP*0.52) return 0.055;
  if(currentTrack.surface==='sandEdge' && Math.abs(signedDistFromCenter(r.x,r.y,near))>ROAD_HW*0.72) return 0.075;
  return NORMAL_GRIP;
}

function updatePlayer(dt){
  const r=player;
  if(r.spinTimer>0){
    r.angle += .19*dt; r.vx*=.965; r.vy*=.965; r.speed=Math.hypot(r.vx,r.vy);
    moveAndCollideVector(r,dt); advanceProgress(r); return;
  }
  const accelInput=keys['ArrowUp']||keys['w']||keys['W'];
  const brakeInput=keys['ArrowDown']||keys['s']||keys['S'];
  const left=keys['ArrowLeft']||keys['a']||keys['A'];
  const right=keys['ArrowRight']||keys['d']||keys['D'];
  const driftKey=keys[' '];
  let turnAmt=(right?1:0)-(left?1:0);

  const fx=Math.cos(r.angle), fy=Math.sin(r.angle);
  let forwardSpeed=r.vx*fx+r.vy*fy;
  if(accelInput) forwardSpeed += ACCEL*dt;
  if(brakeInput) forwardSpeed -= BRAKE*dt;
  const slowMul=r.slowTimer>0?.62:1;
  const maxS=(r.boostTimer>0?MAX_SPEED_BOOST:MAX_SPEED)*slowMul;
  forwardSpeed=Math.max(-MAX_SPEED*.45,Math.min(maxS,forwardSpeed));

  const canDrift=driftKey&&turnAmt!==0&&Math.abs(forwardSpeed)>1.5;
  if(canDrift){
    if(!r.drift){ r.drift=true; r.driftDir=turnAmt; }
    r.driftTime+=dt; r.driftCharge=Math.min(100,r.driftCharge+1.25*dt);
  }else if(r.drift){
    if(r.driftCharge>55) r.boostTimer=Math.max(r.boostTimer,70);
    else if(r.driftCharge>22) r.boostTimer=Math.max(r.boostTimer,38);
    r.drift=false; r.driftTime=0; r.driftCharge=0;
  }

  const steerMul=r.drift?DRIFT_STEER:1;
  r.angle += turnAmt*TURN_RATE*steerMul*dt*(Math.min(Math.abs(forwardSpeed),MAX_SPEED)/MAX_SPEED)*Math.sign(forwardSpeed||1);

  const nfx=Math.cos(r.angle), nfy=Math.sin(r.angle);
  const rx=-nfy, ry=nfx;
  let lateral=r.vx*rx+r.vy*ry;
  const near=nearestWaypoint(r.x,r.y,r.hintIndex,16); r.hintIndex=near.i;
  const off=Math.abs(signedDistFromCenter(r.x,r.y,near.i))>ROAD_HW;
  const grip=off?OFFROAD_GRIP:(r.drift?DRIFT_GRIP:surfaceGripFor(r));
  lateral *= Math.max(0,1-grip*dt);
  forwardSpeed *= accelInput||brakeInput?1:Math.pow(ENGINE_DRAG,dt);
  if(off) forwardSpeed*=Math.max(.75,1-OFFTRACK_FRICTION*.18*dt);

  r.vx=nfx*forwardSpeed+rx*lateral;
  r.vy=nfy*forwardSpeed+ry*lateral;
  r.speed=Math.hypot(r.vx,r.vy)*Math.sign(forwardSpeed||1);
  if(r.boostTimer>0) r.boostTimer-=dt;
  if(r.boostTouchCooldown>0) r.boostTouchCooldown-=dt;
  moveAndCollideVector(r,dt);
  checkBoostAndItems(r);
  advanceProgress(r);
  if(r.lap>=TOTAL_LAPS&&!r.finished) r.finished=true;
}

function updateAI(r,dt){
  if(r.spinTimer>0){r.angle-=.17*dt;r.vx*=.965;r.vy*=.965;r.speed=Math.hypot(r.vx,r.vy);moveAndCollideVector(r,dt);advanceProgress(r);return;}
  const speedAbs=Math.hypot(r.vx,r.vy);
  const look=Math.max(4,Math.min(11,4+Math.floor(speedAbs*1.25)));
  const targetIdx=(r.wpIndex+look)%NP;
  const target=path[targetIdx], n=normals[targetIdx];
  const tx=target.x+n.x*r.aiOffset, ty=target.y+n.y*r.aiOffset;
  const desired=Math.atan2(ty-r.y,tx-r.x);
  let diff=desired-r.angle; while(diff>Math.PI)diff-=Math.PI*2; while(diff<-Math.PI)diff+=Math.PI*2;

  // previsão de curva usando diferença entre tangentes futuras
  const a=(r.wpIndex+look)%NP,b=(r.wpIndex+look+7)%NP;
  const ta=Math.atan2(path[(a+1)%NP].y-path[a].y,path[(a+1)%NP].x-path[a].x);
  const tb=Math.atan2(path[(b+1)%NP].y-path[b].y,path[(b+1)%NP].x-path[b].x);
  let curve=Math.abs(tb-ta); if(curve>Math.PI)curve=Math.PI*2-curve;
  const curveFactor=Math.max(.56,1-curve*.72);

  r.angle+=Math.max(-TURN_RATE*1.25*dt,Math.min(TURN_RATE*1.25*dt,diff*.12*dt));
  const lead=(player.lap*NP+player.wpIndex)-(r.lap*NP+r.wpIndex);
  const rubber=Math.max(-.10,Math.min(.12,lead*.0018));
  const slowMul=r.slowTimer>0?.62:1;
  const desiredSpeed=(MAX_SPEED*.94+rubber)*curveFactor*slowMul;
  let fwd=r.vx*Math.cos(r.angle)+r.vy*Math.sin(r.angle);
  fwd += (fwd<desiredSpeed?ACCEL*.78:-BRAKE*.22)*dt;
  if(r.boostTimer>0){ fwd=Math.min(MAX_SPEED_BOOST*.93,fwd+ACCEL*.7*dt); r.boostTimer-=dt; }
  const fx=Math.cos(r.angle),fy=Math.sin(r.angle),rx=-fy,ry=fx;
  let lateral=r.vx*rx+r.vy*ry; lateral*=Math.max(0,1-NORMAL_GRIP*.85*dt);
  r.vx=fx*fwd+rx*lateral; r.vy=fy*fwd+ry*lateral; r.speed=fwd;
  if(r.boostTouchCooldown>0)r.boostTouchCooldown-=dt;
  moveAndCollideVector(r,dt); checkBoostAndItems(r); advanceProgress(r);
}

function advanceWaypoint(r){
  const prevIdx = r.wpIndex;
  r.wpIndex = (r.wpIndex+1)%NP;
  if(r.wpIndex < prevIdx || (prevIdx > NP - 8 && r.wpIndex < 8)){
    r.lap++;
    if(r.isPlayer){
      const now=raceTicks; lastLapTicks=now-lapStartTick; lapStartTick=now;
      if(r.lap>0) bestLapTicks=Math.min(bestLapTicks,lastLapTicks);
      if(r.lap < TOTAL_LAPS) lapToastTimer=90;
    }
    if(r.lap >= TOTAL_LAPS && !r.finished){
      r.finished = true;
    }
  }
}


function advanceProgress(r){
  let guard=0;
  while(guard<12 && !r.finished){
    const target = path[r.wpIndex];
    const d2 = (target.x-r.x)*(target.x-r.x)+(target.y-r.y)*(target.y-r.y);
    if(d2 < 80*80){
      advanceWaypoint(r);
      guard++;
    } else break;
  }
}

function moveAndCollideVector(r,dt){
  r.x+=r.vx*dt; r.y+=r.vy*dt;
  const near=nearestWaypoint(r.x,r.y,r.hintIndex,16); r.hintIndex=near.i;
  const pi=path[near.i],ni=normals[near.i];
  const dist=(r.x-pi.x)*ni.x+(r.y-pi.y)*ni.y,absDist=Math.abs(dist);
  if(absDist>HARD_WALL){
    const dir=dist>0?1:-1;
    r.x=pi.x+ni.x*dir*HARD_WALL; r.y=pi.y+ni.y*dir*HARD_WALL;
    const vn=r.vx*ni.x+r.vy*ni.y;
    r.vx-=1.35*vn*ni.x; r.vy-=1.35*vn*ni.y;
    r.vx*=.72; r.vy*=.72; if(r.isPlayer)cameraShake=Math.max(cameraShake,5);
  }
}

function checkBoostAndItems(r){
  if(r.boostTouchCooldown<=0){
    for(const z of boostZones){
      const dx=r.x-z.x,dy=r.y-z.y;
      if(dx*dx+dy*dy<z.r*z.r){ r.boostTimer=Math.max(r.boostTimer,48); r.boostTouchCooldown=28; break; }
    }
  }
  if(!r.heldItem && r.itemRoulette<=0){
    for(const box of itemBoxes){
      if(!box.active)continue;
      const dx=r.x-box.x,dy=r.y-box.y;
      if(dx*dx+dy*dy<28*28){ box.active=false; box.respawn=420; spawnItemPickup(box.x, box.y, 'box'); startItemRoulette(r); break; }
    }
  }
}

// Colisão kart↔kart: separação circular + impulso leve (4 karts = 6 pares)
function resolveKartCollisions(){
  const n = racers.length;
  for(let i = 0; i < n; i++){
    const a = racers[i];
    if(a.finished) continue;
    for(let j = i + 1; j < n; j++){
      const b = racers[j];
      if(b.finished) continue;
      const dx = b.x - a.x, dy = b.y - a.y;
      const d2 = dx * dx + dy * dy;
      if(d2 >= KART_RADIUS2_SQ || d2 < 1e-6) continue;
      const dist = Math.sqrt(d2);
      const overlap = KART_RADIUS2 - dist;
      const nx = dx / dist, ny = dy / dist;
      const push = overlap * 0.5;
      a.x -= nx * push; a.y -= ny * push;
      b.x += nx * push; b.y += ny * push;
      const ax = Math.cos(a.angle) * a.speed, ay = Math.sin(a.angle) * a.speed;
      const bx = Math.cos(b.angle) * b.speed, by = Math.sin(b.angle) * b.speed;
      const rel = (ax - bx) * nx + (ay - by) * ny;
      if(rel >= 0) continue;
      const impulse=rel*.35;
      a.vx+=nx*impulse*.35; a.vy+=ny*impulse*.35;
      b.vx-=nx*impulse*.35; b.vy-=ny*impulse*.35;
      a.speed=Math.hypot(a.vx,a.vy); b.speed=Math.hypot(b.vx,b.vy); if(a.isPlayer||b.isPlayer)cameraShake=Math.max(cameraShake,3.5);
    }
  }
}

function computeStandings(){
  racers.forEach(r=>{
    const i=r.wpIndex,p=path[i],q=path[(i+1)%NP],dx=q.x-p.x,dy=q.y-p.y,len2=dx*dx+dy*dy||1;
    const frac=Math.max(0,Math.min(1,((r.x-p.x)*dx+(r.y-p.y)*dy)/len2));
    r.raceScore=r.lap*NP+i+frac;
  });
  const sorted = [...racers].sort((a,b)=>b.raceScore-a.raceScore);
  sorted.forEach((r,idx)=>{ r.place = idx+1; });
}
