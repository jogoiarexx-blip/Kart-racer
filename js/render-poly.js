"use strict";

// ---------- RENDER POLIGONAL HÍBRIDO / LOD ----------
function rotate2(x,y,a){ const c=Math.cos(a),s=Math.sin(a); return {x:x*c-y*s,y:x*s+y*c}; }
function projectLocal3D(px,py,pz,cam){
  const dx=px-cam.camX, dy=py-cam.camY;
  const ca=Math.cos(cam.camAngle), sa=Math.sin(cam.camAngle);
  const depth=dx*ca+dy*sa;
  if(depth<10) return null;
  const lateral=dx*(-sa)+dy*ca;
  const focal=currentFocal;
  const sc=focal/depth;
  return {x:W/2+lateral*sc,y:HORIZON_Y+(currentCamHeight-pz)*sc,scale:sc,depth,lateral};
}
function drawTri2D(a,b,c,fill,stroke){
  ctx.beginPath(); ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.closePath();
  ctx.fillStyle=fill;ctx.fill(); if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}
}
function lodForDepth(depth,base){
  if(graphicsMode==='low') return 0;
  if(depth<140) return Math.min(3,base);
  if(depth<300) return Math.min(2,base);
  if(depth<520) return Math.min(1,base);
  return 0;
}

// ---------- SPRITE REAL PARA ADVERSÁRIOS ----------
const aiKartFrameCache = new Map();
function normalizeAngle(a){ while(a>Math.PI)a-=Math.PI*2; while(a<-Math.PI)a+=Math.PI*2; return a; }
function racerSpriteFrame(r,cam){
  if(r.boostTimer>0) return ((Math.floor(performance.now()/90)&1)===0) ? PLAYER_KART_SHEET.frames.boost1 : PLAYER_KART_SHEET.frames.boost2;
  if(r.drift) return r.driftDir<0 ? PLAYER_KART_SHEET.frames.driftLeft : PLAYER_KART_SHEET.frames.driftRight;
  const rel=normalizeAngle(r.angle-cam.camAngle);
  if(rel < -0.42) return PLAYER_KART_SHEET.frames.leftHard;
  if(rel < -0.12) return PLAYER_KART_SHEET.frames.leftSoft;
  if(rel > 0.42) return PLAYER_KART_SHEET.frames.rightHard;
  if(rel > 0.12) return PLAYER_KART_SHEET.frames.rightSoft;
  return PLAYER_KART_SHEET.frames.idle;
}
function getTintedKartFrame(color,frame){
  const img=gameAssets.playerKart;
  if(!img || !img.complete || !img.naturalWidth) return null;
  const key=color+'|'+frame;
  if(aiKartFrameCache.has(key)) return aiKartFrameCache.get(key);
  const sw=Math.floor(img.naturalWidth/PLAYER_KART_SHEET.cols);
  const sh=Math.floor(img.naturalHeight/PLAYER_KART_SHEET.rows);
  const c=document.createElement('canvas'); c.width=sw; c.height=sh;
  const cctx=c.getContext('2d'); cctx.imageSmoothingEnabled=false;
  const col=frame%PLAYER_KART_SHEET.cols, row=Math.floor(frame/PLAYER_KART_SHEET.cols);
  cctx.drawImage(img,col*sw,row*sh,sw,sh,0,0,sw,sh);
  cctx.save();
  cctx.globalCompositeOperation='source-atop';
  cctx.globalAlpha=.34;
  cctx.fillStyle=color;
  cctx.fillRect(0,0,sw,sh);
  cctx.restore();
  aiKartFrameCache.set(key,c);
  return c;
}
function drawSpriteKart(r,cam,p){
  const frame=racerSpriteFrame(r,cam);
  const sprite=getTintedKartFrame(r.color,frame);
  if(!sprite) return false;
  const sc=Math.max(.22,p.scale*1.38);
  const size=Math.max(24,Math.min(110,112*sc));
  const dh=size*(sprite.height/sprite.width);
  if(GRAPHICS[graphicsMode].shadows){
    ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(p.x,p.y+3,size*.30,Math.max(2,size*.065),0,0,Math.PI*2);ctx.fill();
  }
  ctx.save();
  ctx.imageSmoothingEnabled=false;
  ctx.drawImage(sprite,p.x-size/2,p.y-dh*.68,size,dh);
  if(r.shieldTimer>0){ctx.strokeStyle='rgba(93,232,255,.82)';ctx.lineWidth=Math.max(2,size*.025);ctx.beginPath();ctx.ellipse(p.x,p.y-dh*.32,size*.48,dh*.45,0,0,Math.PI*2);ctx.stroke();}
  if(r.slowTimer>0){
    const phase=performance.now()*.015+(r.place||0);
    ctx.strokeStyle='rgba(120,232,255,.9)';ctx.lineWidth=Math.max(1,size*.018);
    for(let i=0;i<4;i++){
      const a=phase+i*Math.PI/2;
      ctx.beginPath();ctx.moveTo(p.x+Math.cos(a)*size*.18,p.y-dh*.32+Math.sin(a)*dh*.18);ctx.lineTo(p.x+Math.cos(a+.12)*size*.34,p.y-dh*.32+Math.sin(a+.12)*dh*.30);ctx.stroke();
    }
  }
  ctx.restore();
  return true;
}

function drawLowPolyKart(r,cam,isPlayer=false){
  const p=projectLocal3D(r.x,r.y,0,cam); if(!p||p.x<-120||p.x>W+120) return;
  // Próximo e médio alcance usa sprite real; muito longe volta ao low-poly barato.
  if(p.depth<560 && graphicsMode!=='low' && drawSpriteKart(r,cam,p)) return;
  const lod=lodForDepth(p.depth,GRAPHICS[graphicsMode].kartLod);
  const ang=r.angle-cam.camAngle; const sc=Math.max(0.35,p.scale*1.55);
  const baseX=p.x, baseY=p.y;
  if(GRAPHICS[graphicsMode].shadows){ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(baseX,baseY+4,28*sc,8*sc,0,0,Math.PI*2);ctx.fill();}
  const pts=[[-28,7],[28,7],[20,-18],[-20,-18],[-14,-32],[14,-32]].map(([x,y])=>{const q=rotate2(x,y,ang);return {x:baseX+q.x*sc,y:baseY+q.y*sc};});
  drawTri2D(pts[0],pts[1],pts[2],r.color,'rgba(0,0,0,.25)');
  drawTri2D(pts[0],pts[2],pts[3],r.color,'rgba(0,0,0,.25)');
  drawTri2D(pts[3],pts[2],pts[4],'rgba(255,255,255,.16)');
  drawTri2D(pts[2],pts[5],pts[4],'rgba(255,255,255,.10)');
  if(lod>=1){ctx.fillStyle='#111';for(const sx of [-22,22])ctx.fillRect(baseX+(sx-6)*sc,baseY-2*sc,12*sc,18*sc);ctx.fillStyle='#252525';ctx.fillRect(baseX-10*sc,baseY-29*sc,20*sc,12*sc);}
  if(lod>=2){ctx.fillStyle='#ffd2a6';ctx.beginPath();ctx.arc(baseX,baseY-37*sc,7*sc,0,Math.PI*2);ctx.fill();ctx.fillStyle='#e63946';ctx.fillRect(baseX-8*sc,baseY-43*sc,16*sc,4*sc);}
  if(r.boostTimer>0){ctx.fillStyle='#ffb703';ctx.beginPath();ctx.moveTo(baseX-8*sc,baseY+11*sc);ctx.lineTo(baseX,baseY+28*sc);ctx.lineTo(baseX+8*sc,baseY+11*sc);ctx.fill();}
}

// ---------- OBJETOS FIXOS DE PISTA ----------

function drawObjectSprite(key, p, sc, opts){
  const img = typeof getScenerySprite === 'function' ? getScenerySprite(key) : null;
  if(!img) return false;
  opts = opts || {};
  const scaleMul = opts.scaleMul == null ? 1 : opts.scaleMul;
  const width = Math.max(14, img.naturalWidth * sc * scaleMul * (opts.widthMul || 1));
  const height = Math.max(14, img.naturalHeight * sc * scaleMul * (opts.heightMul || 1));
  return drawWorldSpriteImage(img, p.x, p.y + (opts.offsetY || 0), width, height, {
    anchorX: opts.anchorX == null ? 0.5 : opts.anchorX,
    anchorY: opts.anchorY == null ? 1 : opts.anchorY,
    rotation: opts.rotation || 0,
    flipX: !!opts.flipX,
    alpha: opts.alpha == null ? 1 : opts.alpha
  });
}

function signSpriteKeyForObject(obj){
  if(currentTrackIndex === 4) return 'signChecker';
  const flip = (obj.x + obj.y) % 2 > 1;
  return flip ? 'signLeft' : 'signRight';
}

function barrierCurvatureAt(index){
  const a=path[(index-4+NP)%NP], b=path[index], c=path[(index+4)%NP];
  const abx=b.x-a.x, aby=b.y-a.y, bcx=c.x-b.x, bcy=c.y-b.y;
  const cross = abx*bcy - aby*bcx;
  if(cross > 1800) return 1;
  if(cross < -1800) return -1;
  return 0;
}

function drawPolyObject(obj,cam){
  const p=projectLocal3D(obj.x,obj.y,0,cam); if(!p||p.x<-160||p.x>W+160||p.depth>900||p.y<HORIZON_Y-8) return;
  const lod=lodForDepth(p.depth,GRAPHICS[graphicsMode].objectLod); const sc=Math.max(.16,p.scale*(obj.scale||1));
  if(obj.type==='tree'){
    if(drawObjectSprite('tree', p, sc, {scaleMul:0.34})) return;
  } else if(obj.type==='pine'){
    if(drawObjectSprite('pine', p, sc, {scaleMul:0.34})) return;
  } else if(obj.type==='palm'){
    if(drawObjectSprite('palm', p, sc, {scaleMul:0.34})) return;
  } else if(obj.type==='cactus'){
    if(drawObjectSprite('cactus', p, sc, {scaleMul:0.30})) return;
  } else if(obj.type==='bush'){
    if(drawObjectSprite((currentTrackIndex===0||currentTrackIndex===3)?'bush':'flowers', p, sc, {scaleMul:0.30})) return;
  } else if(obj.type==='rock'){
    const key = ((obj.x + obj.y) & 1) ? 'rock' : 'boulder';
    if(drawObjectSprite(key, p, sc, {scaleMul:key==='boulder'?0.27:0.22})) return;
  } else if(obj.type==='sign'){
    if(drawObjectSprite(signSpriteKeyForObject(obj), p, sc, {scaleMul:0.20})) return;
  } else if(obj.type==='lamp'){
    if(drawObjectSprite('lamp', p, sc, {scaleMul:0.26})) return;
  } else if(obj.type==='neon'){
    if(drawObjectSprite('neonBarrier', p, sc, {scaleMul:0.22})) return;
  }

  // Fallback vetorial para os casos ainda sem sprite dedicado ou se a imagem falhar.
  if(obj.type==='tree'||obj.type==='pine'||obj.type==='palm'){
    if(GRAPHICS[graphicsMode].shadows&&p.depth<420){ctx.fillStyle='rgba(0,0,0,.18)';ctx.beginPath();ctx.ellipse(p.x+10*sc,p.y+5*sc,18*sc,5*sc,0,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle=obj.type==='palm'?'#7f5a34':'#6b4423';ctx.fillRect(p.x-3*sc,p.y-34*sc,6*sc,34*sc);
    if(obj.type==='palm'){
      ctx.fillStyle='#33b86b';for(let a=0;a<5;a++){ctx.save();ctx.translate(p.x,p.y-34*sc);ctx.rotate(-.8+a*.4);ctx.fillRect(0,-3*sc,22*sc,6*sc);ctx.restore();}
    }else if(lod===0){ctx.fillStyle=obj.type==='pine'?'#1d6b3b':'#2f9e44';ctx.beginPath();ctx.moveTo(p.x,p.y-58*sc);ctx.lineTo(p.x-17*sc,p.y-25*sc);ctx.lineTo(p.x+17*sc,p.y-25*sc);ctx.fill();}
    else{const layers=obj.type==='pine'?lod+2:lod+1;for(let i=0;i<layers;i++){const yy=p.y-(38+i*12)*sc,ww=(obj.type==='pine'?(22-i*2):(18+i*3))*sc;ctx.fillStyle=i%2?'#237a3f':'#2f9e44';ctx.beginPath();ctx.moveTo(p.x,yy-18*sc);ctx.lineTo(p.x-ww,yy+12*sc);ctx.lineTo(p.x+ww,yy+12*sc);ctx.fill();}}
  } else if(obj.type==='cactus'){
    ctx.fillStyle='#2f9e44';ctx.fillRect(p.x-5*sc,p.y-42*sc,10*sc,42*sc);if(lod>=1){ctx.fillRect(p.x-14*sc,p.y-30*sc,9*sc,6*sc);ctx.fillRect(p.x+5*sc,p.y-22*sc,11*sc,6*sc);}
  } else if(obj.type==='building'||obj.type==='neon'){
    const h=(obj.h||70)*sc,w=(obj.w||36)*sc;ctx.fillStyle=obj.type==='neon'?'#1c214a':'#4a4f63';ctx.fillRect(p.x-w/2,p.y-h,w,h);
    if(lod>=1){ctx.fillStyle=obj.type==='neon'?'#7ee7ff':'#ffd166';for(let yy=p.y-h+9*sc;yy<p.y-5*sc;yy+=12*sc)for(let xx=p.x-w/2+7*sc;xx<p.x+w/2-4*sc;xx+=12*sc)ctx.fillRect(xx,yy,4*sc,5*sc);}
  } else if(obj.type==='rock'){
    const a={x:p.x-14*sc,y:p.y},b={x:p.x+14*sc,y:p.y},c={x:p.x+8*sc,y:p.y-20*sc},d={x:p.x-7*sc,y:p.y-24*sc};drawTri2D(a,b,c,'#777');drawTri2D(a,c,d,'#8b8b8b');
  } else if(obj.type==='sign'){
    ctx.fillStyle='#7c5734';ctx.fillRect(p.x-2*sc,p.y-24*sc,4*sc,24*sc);ctx.fillStyle='#f4e04d';ctx.fillRect(p.x-12*sc,p.y-36*sc,24*sc,14*sc);ctx.strokeStyle='#a23333';ctx.lineWidth=Math.max(1,1.4*sc);ctx.strokeRect(p.x-12*sc,p.y-36*sc,24*sc,14*sc);
  } else if(obj.type==='lamp'){
    ctx.fillStyle='#6a7087';ctx.fillRect(p.x-2*sc,p.y-52*sc,4*sc,52*sc);ctx.fillStyle='#98d9ff';ctx.beginPath();ctx.arc(p.x,p.y-56*sc,5*sc,0,Math.PI*2);ctx.fill();
  } else if(obj.type==='bush'){
    ctx.fillStyle='#2f8a3f';ctx.beginPath();ctx.arc(p.x-6*sc,p.y-7*sc,8*sc,0,Math.PI*2);ctx.arc(p.x+1*sc,p.y-10*sc,10*sc,0,Math.PI*2);ctx.arc(p.x+10*sc,p.y-7*sc,7*sc,0,Math.PI*2);ctx.fill();
  }
}

function barrierColor(style){
  if(currentTrackIndex===4) return style?'#7ee7ff':'#ff4fd8';
  if(currentTrackIndex===3) return style?'#e8eef7':'#9ba7b8';
  if(currentTrackIndex===2) return style?'#f2d29a':'#d05d3d';
  return style?'#f4f4f4':'#d94848';
}
function drawTracksideBarriers(cam){
  if(!trackBarriers || graphicsMode==='low') return;
  const maxBarrier = graphicsMode==='ultra' ? 220 : graphicsMode==='high' ? 180 : 120;
  let drawn = 0;
  for(const b of trackBarriers){
    if(drawn >= maxBarrier) break;
    const p=projectLocal3D(b.x,b.y,0,cam);
    if(!p||p.depth>520||p.x<-100||p.x>W+100||p.y<HORIZON_Y-5) continue;
    const curve = barrierCurvatureAt(b.index);
    const spriteKey = currentTrackIndex===4 ? 'neonBarrier' : (curve<0 ? 'guardrail-left' : curve>0 ? 'guardrail-right' : 'guardrail-straight');
    const imgKey = spriteKey==='guardrail-left' ? 'guardrailLeft' : spriteKey==='guardrail-right' ? 'guardrailRight' : spriteKey==='neonBarrier' ? 'neonBarrier' : 'guardrailStraight';
    const sc=Math.max(0.14,p.scale);
    const used = drawObjectSprite(imgKey, p, sc, {scaleMul:0.22, flipX:b.side<0, anchorY:0.92});
    if(!used){
      const postH=Math.max(3,20*p.scale);
      ctx.strokeStyle='#6d7480';ctx.lineWidth=Math.max(1,3*p.scale);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x,p.y-postH);ctx.stroke();
      ctx.fillStyle=barrierColor(b.style);ctx.fillRect(p.x-3*p.scale,p.y-postH,6*p.scale,4*p.scale);
    }
    drawn++;
  }
}

// Cena unificada: objetos e adversários compartilham depth-sort.
function drawWorldScene(cam){
  drawTracksideBarriers(cam);
  const maxObj=Math.floor(GRAPHICS[graphicsMode].maxObjects*DENSITY_MULT[sceneryDensity]);
  const queue=[];
  let objCount=0;
  for(const o of trackObjects){
    const p=projectLocal3D(o.x,o.y,0,cam);
    if(p&&p.depth<900){queue.push({kind:'object',o,p});objCount++;}
  }
  for(const r of [ai1,ai2,ai3]){
    const p=projectLocal3D(r.x,r.y,0,cam);
    if(p) queue.push({kind:'kart',r,p});
  }
  queue.sort((a,b)=>b.p.depth-a.p.depth);
  let shownObjects=0;
  for(const it of queue){
    if(it.kind==='object'){
      if(shownObjects++>=maxObj) continue;
      drawPolyObject(it.o,cam);
    }else{
      drawLowPolyKart(it.r,cam,false);
    }
  }
}
function drawHybridWorld(cam){ drawWorldScene(cam); }

let gfxParticles=[];
function spawnGfxParticles(){
  if(raceState!=='racing' || cameraMode!=='mode7') return;
  const cfg=GRAPHICS[graphicsMode];
  const moving=Math.abs(player.speed)>1.2;
  if(!moving) return;
  const count=Math.random()<0.32*cfg.particles ? 1 : 0;
  for(let i=0;i<count;i++){
    const type=currentTrackIndex===2?'dust':currentTrackIndex===3?'snow':currentTrackIndex===4?'spark':'smoke';
    gfxParticles.push({x:W/2+(Math.random()-.5)*70,y:H-62+Math.random()*15,vx:(Math.random()-.5)*1.8,vy:-.6-Math.random()*1.2,life:20+Math.random()*20,type,size:2+Math.random()*4});
  }
  const max=Math.floor(90*cfg.particles);if(gfxParticles.length>max)gfxParticles.splice(0,gfxParticles.length-max);
}
function drawGfxParticles(){
  for(let i=gfxParticles.length-1;i>=0;i--){const p=gfxParticles[i];p.x+=p.vx;p.y+=p.vy;p.life--;p.size*=.985;if(p.life<=0){gfxParticles.splice(i,1);continue;}ctx.globalAlpha=Math.min(1,p.life/16);ctx.fillStyle=p.type==='dust'?'#d89b5b':p.type==='snow'?'#fff':p.type==='spark'?'#7ee7ff':'#c7c7c7';ctx.fillRect(p.x,p.y,p.size,p.size);}ctx.globalAlpha=1;
}
