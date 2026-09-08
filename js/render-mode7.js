"use strict";

// ---------- RENDER: CÂMERA MODE 7 (pseudo-3D) ----------
function getCamera(){
  if(camAngleSmooth===null)camAngleSmooth=player.angle;
  let diff=player.angle-camAngleSmooth; while(diff>Math.PI)diff-=Math.PI*2; while(diff<-Math.PI)diff+=Math.PI*2;
  const speedPct=Math.min(1,Math.hypot(player.vx,player.vy)/MAX_SPEED_BOOST);
  const follow=player.drift?.105:.16;
  camAngleSmooth+=diff*follow;
  const targetBehind=BASE_CAM_BEHIND+speedPct*22+(player.boostTimer>0?12:0);
  currentCamBehind+=(targetBehind-currentCamBehind)*.08;
  const targetFocal=BASE_FOCAL-(player.boostTimer>0?10:0)-speedPct*4;
  currentFocal+=(targetFocal-currentFocal)*.09;
  // Mantém o kart visualmente apoiado exatamente sobre a posição real no chão.
  currentCamHeight=((PLAYER_GROUND_Y-HORIZON_Y)*currentCamBehind)/Math.max(1,currentFocal);
  const forward={x:Math.cos(camAngleSmooth),y:Math.sin(camAngleSmooth)};
  const right={x:-forward.y,y:forward.x};
  const driftOffset=player.drift?player.driftDir*10:0;
  const shakeX=cameraShake>0?(Math.random()-.5)*cameraShake:0, shakeY=cameraShake>0?(Math.random()-.5)*cameraShake:0;
  const camX=player.x-forward.x*currentCamBehind+right.x*driftOffset+shakeX;
  const camY=player.y-forward.y*currentCamBehind+right.y*driftOffset+shakeY;
  return {camX,camY,camAngle:camAngleSmooth,forward};
}

function drawMode7Floor(camX,camY,camAngle){
  // Céu simples no canvas principal; o chão é rasterizado em resolução interna menor.
  const skyGrad = ctx.createLinearGradient(0,0,0,HORIZON_Y);
  skyGrad.addColorStop(0,currentTrack.skyTop);
  skyGrad.addColorStop(1,currentTrack.skyBottom);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0,0,W,HORIZON_Y);
  ctx.fillStyle=currentTrack.sun;
  ctx.beginPath(); ctx.arc(W-90,48,24,0,Math.PI*2); ctx.fill();
  ctx.fillStyle=currentTrack.horizon;
  ctx.beginPath();
  ctx.moveTo(0,HORIZON_Y);
  const parallax = camAngle*18;
  for(let x=0;x<=W;x+=80){
    ctx.lineTo(x, HORIZON_Y-18-Math.sin((x+parallax)*0.01)*10);
  }
  ctx.lineTo(W,HORIZON_Y); ctx.closePath(); ctx.fill();

  const preset = MODE7_PRESETS[mode7Preset];
  const rw = preset.w, rh = preset.h;
  const buf32 = floorBuf32;
  const tex = TEX_DATA;
  const texW = TEX_W, texH = TEX_H, texOx = TEX_OX, texOy = TEX_OY;
  const highQ = graphicsMode==='high' || graphicsMode==='ultra';
  const cosA = Math.cos(camAngle), sinA = Math.sin(camAngle);
  const fx = cosA, fy = sinA, rx = -sinA, ry = cosA;
  const halfW = rw * 0.5;
  const fogR = 201, fogG = 236, fogB = 255;

  for(let row=0; row<rh; row++){
    const behindScale = currentCamBehind / BASE_CAM_BEHIND;
    const depth = rowDepth[row] * behindScale;
    const halfWidthWorld = rowHalfWorld[row] * behindScale * (BASE_FOCAL / Math.max(1,currentFocal));
    const centerX = camX + fx * depth, centerY = camY + fy * depth;
    let wx = centerX - rx * halfWidthWorld;
    let wy = centerY - ry * halfWidthWorld;
    const stepX = (2 * rx * halfWidthWorld) / rw;
    const stepY = (2 * ry * halfWidthWorld) / rw;
    const fogT = highQ ? rowFog[row] : 0;
    const shade = highQ ? 1 : rowShade[row];
    const invFog = 1 - fogT;
    const base = row * rw;

    for(let x=0; x<rw; x++){
      const px = (wx - texOx) | 0, py = (wy - texOy) | 0;
      let r,g,b;
      if(px>=0 && px<texW && py>=0 && py<texH){
        const idx = (py * texW + px) << 2;
        r=tex[idx]; g=tex[idx+1]; b=tex[idx+2];
      } else {
        const even = (((wx/40)|0)+((wy/40)|0))&1;
        if(even){ r=0x2f;g=0x9e;b=0x44; } else { r=0x26;g=0x8a;b=0x3a; }
      }
      if(highQ){
        r=(r*invFog+fogR*fogT)|0;
        g=(g*invFog+fogG*fogT)|0;
        b=(b*invFog+fogB*fogT)|0;
      } else {
        r=(r*shade)|0; g=(g*shade)|0; b=(b*shade)|0;
      }
      buf32[base+x]=(255<<24)|(b<<16)|(g<<8)|r;
      wx += stepX; wy += stepY;
    }
  }
  mode7Ctx.putImageData(floorImgData,0,0);
  ctx.save();
  ctx.imageSmoothingEnabled=false;
  ctx.drawImage(mode7Canvas,0,0,rw,rh,0,HORIZON_Y,W,FLOOR_H);
  ctx.restore();
}

function projectMode7(wx,wy,camX,camY,camAngle){
  const forward = {x:Math.cos(camAngle), y:Math.sin(camAngle)};
  const right = {x:-Math.sin(camAngle), y:Math.cos(camAngle)};
  const dx=wx-camX, dy=wy-camY;
  const depth = dx*forward.x+dy*forward.y;
  const lateral = dx*right.x+dy*right.y;
  if(depth<15) return null;
  const scale = currentFocal/depth;
  return { x: W/2+lateral*scale, y: HORIZON_Y+currentCamHeight*scale, scale, depth };
}

function drawMode7Billboards(camX,camY,camAngle){
  const projected=racers.filter(r=>!r.isPlayer).map(r=>({r,proj:projectMode7(r.x,r.y,camX,camY,camAngle)})).filter(o=>o.proj).sort((a,b)=>b.proj.depth-a.proj.depth);
  for(const {r,proj} of projected){
    if(proj.x<-90||proj.x>W+90)continue; const w=48*proj.scale,h=34*proj.scale;if(w<1.2)continue;
    let rel=r.angle-camAngle;while(rel>Math.PI)rel-=Math.PI*2;while(rel<-Math.PI)rel+=Math.PI*2;
    const dir=Math.round(rel/(Math.PI/4)); const lean=Math.sin(dir*Math.PI/4)*w*.12;
    ctx.save();ctx.translate(proj.x+lean,proj.y);ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(0,0,w*.52,Math.max(1,h*.14),0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#111';ctx.fillRect(-w*.48,-h*.44,w*.16,h*.46);ctx.fillRect(w*.32,-h*.44,w*.16,h*.46);
    ctx.fillStyle=r.color;ctx.beginPath();ctx.moveTo(-w*.42,-h*.1);ctx.lineTo(-w*.28,-h*.72);ctx.lineTo(w*.28,-h*.72);ctx.lineTo(w*.42,-h*.1);ctx.closePath();ctx.fill();
    ctx.fillStyle='#242424';ctx.fillRect(-w*.18,-h*.82,w*.36,h*.26);ctx.fillStyle='#ffd2a6';ctx.beginPath();ctx.arc(0,-h*.9,Math.max(1,h*.12),0,Math.PI*2);ctx.fill();
    if(r.boostTimer>0){ctx.fillStyle='#ffb703';ctx.beginPath();ctx.moveTo(-w*.25,0);ctx.lineTo(-w*.1,h*.38);ctx.lineTo(0,0);ctx.fill();ctx.beginPath();ctx.moveTo(w*.25,0);ctx.lineTo(w*.1,h*.38);ctx.lineTo(0,0);ctx.fill();}
    if(r.shieldTimer>0){ctx.strokeStyle='rgba(93,232,255,.8)';ctx.lineWidth=Math.max(2,w*.045);ctx.beginPath();ctx.arc(0,-h*.38,w*.62,0,Math.PI*2);ctx.stroke();}
    ctx.restore();
  }
}


function drawPixelBillboard(obj,proj){
  const s=Math.max(2,proj.scale*obj.scale*34); ctx.save(); ctx.translate(proj.x,proj.y);
  if(obj.type==='tree'||obj.type==='pine'){ ctx.fillStyle='#5b3a20';ctx.fillRect(-s*.08,-s*.45,s*.16,s*.45);ctx.fillStyle=obj.type==='pine'?'#1f6b45':'#2e8b45';ctx.beginPath();ctx.moveTo(0,-s*1.15);ctx.lineTo(-s*.48,-s*.35);ctx.lineTo(s*.48,-s*.35);ctx.closePath();ctx.fill(); }
  else if(obj.type==='palm'){ ctx.fillStyle='#8b5a2b';ctx.fillRect(-s*.06,-s*.72,s*.12,s*.72);ctx.fillStyle='#2ca25f';for(let a=0;a<5;a++){ctx.save();ctx.rotate((a-2)*.45);ctx.fillRect(0,-s*.82,s*.45,s*.12);ctx.restore();} }
  else if(obj.type==='cactus'){ctx.fillStyle='#2f8f55';ctx.fillRect(-s*.1,-s*.8,s*.2,s*.8);ctx.fillRect(-s*.32,-s*.58,s*.23,s*.12);ctx.fillRect(s*.09,-s*.42,s*.25,s*.12);}
  else { ctx.fillStyle='#17172d';ctx.fillRect(-s*.28,-s*.8,s*.56,s*.8);ctx.fillStyle='#50e3ff';ctx.fillRect(-s*.2,-s*.65,s*.4,s*.12);ctx.fillStyle='#ff4fd8';ctx.fillRect(-s*.2,-s*.42,s*.4,s*.1); }
  ctx.restore();
}

function drawTrackObjectsAndItems(camX,camY,camAngle){
  // Na V3 o cenário é desenhado uma única vez pelo renderer poligonal.
  // Aqui ficam somente as caixas de item, evitando objetos duplicados/billboards sobrepostos.
  const arr=[];
  for(const b of itemBoxes){
    if(!b.active)continue;
    const p=projectMode7(b.x,b.y,camX,camY,camAngle);
    if(p&&p.depth<900&&p.x>-80&&p.x<W+80)arr.push({p,item:b});
  }
  arr.sort((a,b)=>b.p.depth-a.p.depth);
  for(const e of arr){
    const s=Math.max(14,48*e.p.scale);
    const rot=performance.now()*.002 + e.p.depth*.001;
    const pulse=1+Math.sin(performance.now()*.006+e.p.depth*.01)*.08;
    ctx.save();
    ctx.globalAlpha=0.32;
    ctx.fillStyle='#67dcff';
    ctx.beginPath();
    ctx.ellipse(e.p.x,e.p.y+s*.08,s*.26,s*.12,0,0,Math.PI*2);
    ctx.fill();
    ctx.restore();
    drawItemIcon(null,e.p.x,e.p.y-s*.28,s,{rotation:rot,scaleX:pulse,scaleY:pulse});
  }
}

function drawPlayerKartThirdPerson(){
  const img = gameAssets.playerKart;
  const steer = (keys['ArrowLeft']||keys['a']||keys['A']?-1:0) +
                (keys['ArrowRight']||keys['d']||keys['D']?1:0);
  const speedPct = Math.min(1, Math.hypot(player.vx||0,player.vy||0) / MAX_SPEED_BOOST);
  const driftLean = player.drift ? player.driftDir * 10 : steer * 4;
  const bob = raceState==='racing' ? Math.sin(performance.now()*0.018) * speedPct * 1.25 : 0;
  const cx = W/2 + driftLean;
  const cy = H - 101 + bob;

  ctx.save();
  ctx.translate(cx,cy);

  // Sombra continua sendo gerada em tempo real para manter o kart assentado no chão.
  ctx.fillStyle='rgba(0,0,0,0.34)';
  ctx.beginPath();
  ctx.ellipse(0,43,67,13,0,0,Math.PI*2);
  ctx.fill();

  if(img.complete && img.naturalWidth > 0){
    const frame = getPlayerKartFrame();
    const col = frame % PLAYER_KART_SHEET.cols;
    const row = Math.floor(frame / PLAYER_KART_SHEET.cols);
    const sw = img.naturalWidth / PLAYER_KART_SHEET.cols;
    const sh = img.naturalHeight / PLAYER_KART_SHEET.rows;
    const sx = col * sw;
    const sy = row * sh;

    // Mantém o pixel-art nítido. A folha possui espaço transparente entre os sprites.
    ctx.imageSmoothingEnabled = false;
    const baseSize = graphicsMode==='low' ? 174 : (graphicsMode==='ultra' ? 202 : 188);
    const dw = baseSize;
    const dh = baseSize * (sh / sw);

    // Leve reação à direção, sem distorcer o sprite.
    ctx.rotate(steer*0.006 + (player.drift ? player.driftDir*0.012 : 0));
    ctx.drawImage(img, sx, sy, sw, sh, -dw/2, -dh*0.64, dw, dh);
  } else {
    // Fallback mínimo caso o PNG ainda esteja carregando.
    ctx.fillStyle=player.color;
    ctx.fillRect(-48,-36,96,60);
    ctx.fillStyle='#111';
    ctx.fillRect(-56,-6,15,32);
    ctx.fillRect(41,-6,15,32);
    ctx.fillStyle='#fff';
    ctx.fillRect(-26,-18,52,6);
  }

  if(player.shieldTimer>0){
    const pulse=1+Math.sin(performance.now()*.012)*.04;
    ctx.strokeStyle='rgba(93,232,255,.82)';ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(0,-8,96*pulse,72*pulse,0,0,Math.PI*2);ctx.stroke();
  }
  if(player.slowTimer>0){
    const phase = performance.now()*0.018;
    ctx.strokeStyle='rgba(120,232,255,.92)';
    ctx.lineWidth=3;
    for(let i=0;i<5;i++){
      const a=phase+i*(Math.PI*2/5);
      ctx.beginPath();
      ctx.moveTo(Math.cos(a)*38, -8 + Math.sin(a)*24);
      ctx.lineTo(Math.cos(a+.1)*58, -10 + Math.sin(a+.1)*34);
      ctx.lineTo(Math.cos(a-.05)*78, -14 + Math.sin(a-.05)*42);
      ctx.stroke();
    }
  }

  ctx.restore();
}
