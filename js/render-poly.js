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
  return {x:W/2+lateral*sc,y:HORIZON_Y+(currentCamHeight-pz)*sc,scale:sc,depth};
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
function drawLowPolyKart(r,cam,isPlayer=false){
  const p=projectLocal3D(r.x,r.y,0,cam); if(!p||p.x<-120||p.x>W+120) return;
  const lod=lodForDepth(p.depth,GRAPHICS[graphicsMode].kartLod);
  const ang=r.angle-cam.camAngle; const sc=Math.max(0.35,p.scale*1.55);
  const baseX=p.x, baseY=p.y;
  if(GRAPHICS[graphicsMode].shadows){ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(baseX,baseY+4,28*sc,8*sc,0,0,Math.PI*2);ctx.fill();}
  const pts=[[-28,7],[28,7],[20,-18],[-20,-18],[-14,-32],[14,-32]].map(([x,y])=>{const q=rotate2(x,y,ang);return {x:baseX+q.x*sc,y:baseY+q.y*sc};});
  drawTri2D(pts[0],pts[1],pts[2],r.color,'rgba(0,0,0,.25)');
  drawTri2D(pts[0],pts[2],pts[3],r.color,'rgba(0,0,0,.25)');
  drawTri2D(pts[3],pts[2],pts[4],'rgba(255,255,255,.16)');
  drawTri2D(pts[2],pts[5],pts[4],'rgba(255,255,255,.10)');
  if(lod>=1){
    ctx.fillStyle='#111'; for(const sx of [-22,22]){ctx.fillRect(baseX+(sx-6)*sc,baseY-2*sc,12*sc,18*sc);}
    ctx.fillStyle='#252525';ctx.fillRect(baseX-10*sc,baseY-29*sc,20*sc,12*sc);
  }
  if(lod>=2){
    ctx.fillStyle='#ffd2a6';ctx.beginPath();ctx.arc(baseX,baseY-37*sc,7*sc,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#e63946';ctx.fillRect(baseX-8*sc,baseY-43*sc,16*sc,4*sc);
  }
  if(lod>=3){
    ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=Math.max(1,sc);ctx.strokeRect(baseX-18*sc,baseY-15*sc,36*sc,12*sc);
  }
  if(r.slowTimer>0){
    const phase = performance.now()*0.015 + (r.place||0);
    ctx.strokeStyle='rgba(120,232,255,.9)';
    ctx.lineWidth=Math.max(1,1.5*sc);
    for(let i=0;i<5;i++){
      const a = phase + i*(Math.PI*2/5);
      ctx.beginPath();
      ctx.moveTo(baseX+Math.cos(a)*12*sc,baseY-18*sc+Math.sin(a)*8*sc);
      ctx.lineTo(baseX+Math.cos(a+.12)*22*sc,baseY-18*sc+Math.sin(a+.12)*14*sc);
      ctx.lineTo(baseX+Math.cos(a-.06)*29*sc,baseY-18*sc+Math.sin(a-.06)*20*sc);
      ctx.stroke();
    }
  }
  if(r.boostTimer>0){ctx.fillStyle='#ffb703';ctx.beginPath();ctx.moveTo(baseX-8*sc,baseY+11*sc);ctx.lineTo(baseX,baseY+28*sc);ctx.lineTo(baseX+8*sc,baseY+11*sc);ctx.fill();}
}
function drawPolyObject(obj,cam){
  const p=projectLocal3D(obj.x,obj.y,0,cam); if(!p||p.x<-100||p.x>W+100||p.depth>900) return;
  const lod=lodForDepth(p.depth,GRAPHICS[graphicsMode].objectLod); const sc=Math.max(.25,p.scale*(obj.scale||1));
  if(obj.type==='tree'||obj.type==='pine'||obj.type==='palm'){
    if(GRAPHICS[graphicsMode].shadows&&p.depth<420){ctx.fillStyle='rgba(0,0,0,.18)';ctx.beginPath();ctx.ellipse(p.x+10*sc,p.y+5*sc,18*sc,5*sc,0,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle='#6b4423';ctx.fillRect(p.x-3*sc,p.y-34*sc,6*sc,34*sc);
    if(lod===0){ctx.fillStyle=obj.type==='pine'?'#1d6b3b':'#2f9e44';ctx.beginPath();ctx.moveTo(p.x,p.y-58*sc);ctx.lineTo(p.x-17*sc,p.y-25*sc);ctx.lineTo(p.x+17*sc,p.y-25*sc);ctx.fill();}
    else {const layers=lod+1; for(let i=0;i<layers;i++){const yy=p.y-(38+i*12)*sc, ww=(21-i*2)*sc;ctx.fillStyle=i%2?'#237a3f':'#2f9e44';ctx.beginPath();ctx.moveTo(p.x,yy-18*sc);ctx.lineTo(p.x-ww,yy+12*sc);ctx.lineTo(p.x+ww,yy+12*sc);ctx.fill();}}
  } else if(obj.type==='cactus'){
    ctx.fillStyle='#2f9e44';ctx.fillRect(p.x-5*sc,p.y-42*sc,10*sc,42*sc); if(lod>=1){ctx.fillRect(p.x-14*sc,p.y-30*sc,9*sc,6*sc);ctx.fillRect(p.x+5*sc,p.y-22*sc,11*sc,6*sc);}
  } else if(obj.type==='building'||obj.type==='neon'){
    const h=(obj.h||70)*sc,w=(obj.w||36)*sc;ctx.fillStyle=obj.type==='neon'?'#1c214a':'#4a4f63';ctx.fillRect(p.x-w/2,p.y-h,w,h);
    if(lod>=1){ctx.fillStyle=obj.type==='neon'?'#7ee7ff':'#ffd166'; for(let yy=p.y-h+9*sc;yy<p.y-5*sc;yy+=12*sc) for(let xx=p.x-w/2+7*sc;xx<p.x+w/2-4*sc;xx+=12*sc) ctx.fillRect(xx,yy,4*sc,5*sc);}
  } else if(obj.type==='rock'){
    const a={x:p.x-14*sc,y:p.y},b={x:p.x+14*sc,y:p.y},c={x:p.x+8*sc,y:p.y-20*sc},d={x:p.x-7*sc,y:p.y-24*sc};drawTri2D(a,b,c,'#777');drawTri2D(a,c,d,'#8b8b8b');
  }
}
function drawHybridWorld(cam){
  if(typeof trackObjects==='undefined') return;
  const maxObj=Math.floor(GRAPHICS[graphicsMode].maxObjects*DENSITY_MULT[sceneryDensity]);
  const arr=[]; for(const o of trackObjects){const p=projectLocal3D(o.x,o.y,0,cam); if(p&&p.depth<900) arr.push({o,p});}
  arr.sort((a,b)=>b.p.depth-a.p.depth); let shown=0; for(const it of arr){ if(shown++>=maxObj) break; drawPolyObject(it.o,cam); }
}


let gfxParticles=[];
function spawnGfxParticles(){
  if(raceState!=='racing' || cameraMode!=='mode7') return;
  const cfg=GRAPHICS[graphicsMode];
  const moving=Math.abs(player.speed)>1.2;
  if(!moving) return;
  const count=Math.random()<0.32*cfg.particles ? 1 : 0;
  for(let i=0;i<count;i++){
    const type = currentTrackIndex===2?'dust':currentTrackIndex===3?'snow':currentTrackIndex===4?'spark':'smoke';
    gfxParticles.push({x:W/2+(Math.random()-.5)*70,y:H-62+Math.random()*15,vx:(Math.random()-.5)*1.8,vy:-.6-Math.random()*1.2,life:20+Math.random()*20,type,size:2+Math.random()*4});
  }
  const max=Math.floor(90*cfg.particles); if(gfxParticles.length>max) gfxParticles.splice(0,gfxParticles.length-max);
}
function drawGfxParticles(){
  for(let i=gfxParticles.length-1;i>=0;i--){const p=gfxParticles[i];p.x+=p.vx;p.y+=p.vy;p.life--;p.size*=.985;if(p.life<=0){gfxParticles.splice(i,1);continue;}
    ctx.globalAlpha=Math.min(1,p.life/16);
    ctx.fillStyle=p.type==='dust'?'#d89b5b':p.type==='snow'?'#fff':p.type==='spark'?'#7ee7ff':'#c7c7c7';
    ctx.fillRect(p.x,p.y,p.size,p.size);
  } ctx.globalAlpha=1;
}
