"use strict";

// ---------- MINIMAPA E HUD ----------
function getMinimapBounds(){
  if(mmBounds) return mmBounds;
  let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
  path.forEach(p=>{ minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y); });
  mmBounds = {minX,maxX,minY,maxY};
  return mmBounds;
}

function drawMinimap(){
  const mmX = W-150, mmY = 20, mmW=130, mmH=130;
  ctx.save();
  ctx.globalAlpha=0.85;
  ctx.fillStyle='#0b0b18';
  ctx.fillRect(mmX-6,mmY-6,mmW+12,mmH+12);
  ctx.strokeStyle='#fff';
  ctx.lineWidth=2;
  ctx.strokeRect(mmX-6,mmY-6,mmW+12,mmH+12);

  const {minX,maxX,minY,maxY} = getMinimapBounds();
  const scale = Math.min(mmW/(maxX-minX), mmH/(maxY-minY));
  const ox = mmX + (mmW-(maxX-minX)*scale)/2;
  const oy = mmY + (mmH-(maxY-minY)*scale)/2;

  ctx.strokeStyle='#888';
  ctx.lineWidth=3;
  ctx.beginPath();
  path.forEach((p,i)=>{
    const x = ox+(p.x-minX)*scale, y = oy+(p.y-minY)*scale;
    if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  });
  ctx.closePath();
  ctx.stroke();

  racers.forEach(r=>{
    const x = ox+(r.x-minX)*scale, y = oy+(r.y-minY)*scale;
    ctx.fillStyle=r.color;
    ctx.beginPath();
    ctx.arc(x,y, r.isPlayer?4:3, 0, Math.PI*2);
    ctx.fill();
  });
  ctx.globalAlpha=1;
  ctx.restore();
}

function ordinal(n){ return n+'º'; }
function formatTicks(t){ if(!Number.isFinite(t))return '--:--.---'; const ms=Math.floor(t*(1000/60)),m=Math.floor(ms/60000),sec=Math.floor((ms%60000)/1000),mmm=ms%1000; return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}.${String(mmm).padStart(3,'0')}`; }

function drawHUD(){
  ctx.save();
  ctx.font='bold 20px monospace';
  ctx.fillStyle='#fff';
  ctx.strokeStyle='#000';
  ctx.lineWidth=4;
  const lapTxt = `VOLTA ${Math.min(player.lap+1,TOTAL_LAPS)}/${TOTAL_LAPS}`;
  ctx.strokeText(lapTxt, 16, 32);
  ctx.fillText(lapTxt, 16, 32);

  const placeTxt = `${ordinal(player.place)} LUGAR`;
  ctx.strokeText(placeTxt, 16, 58);
  ctx.fillStyle = player.place===1 ? '#ffde00' : '#fff';
  ctx.fillText(placeTxt, 16, 58);

  ctx.font='bold 12px monospace';
  ctx.strokeStyle='#000'; ctx.lineWidth=3;
  ctx.strokeText(currentTrack.name,16,78);
  ctx.fillStyle='#ffde00'; ctx.fillText(currentTrack.name,16,78);

  ctx.font='bold 12px monospace';
  const timeTxt=`TEMPO ${formatTicks(raceTicks)}  •  MELHOR ${formatTicks(bestLapTicks)}`;
  ctx.strokeStyle='#000';ctx.lineWidth=3;ctx.strokeText(timeTxt,16,98);ctx.fillStyle='#bcd8ff';ctx.fillText(timeTxt,16,98);
  if(showFps){ const dbg=`FPS ${Math.round(fpsSmooth)} • M7 ${mode7Preset.toUpperCase()} • ${graphicsMode.toUpperCase()}`;ctx.strokeText(dbg,16,118);ctx.fillStyle='#8effa0';ctx.fillText(dbg,16,118); }


  ctx.font='bold 20px monospace';
  const spd = Math.hypot(player.vx,player.vy);
  const maxS = player.boostTimer>0?MAX_SPEED_BOOST:MAX_SPEED;
  const pct = Math.min(1, spd/maxS);
  ctx.fillStyle='#000';
  ctx.fillRect(14, H-34, 154, 18);
  ctx.fillStyle = player.boostTimer>0 ? '#ffb703' : '#3fa9f5';
  ctx.fillRect(16, H-32, 150*pct, 14);
  ctx.strokeStyle='#fff'; ctx.lineWidth=2;
  ctx.strokeRect(14, H-34, 154, 18);

  if(player.drift){
    ctx.font='bold 14px monospace';
    ctx.fillStyle = player.driftTime>18 ? '#ff5c5c' : '#8ecfff';
    ctx.fillText(`DRIFT ${Math.round(player.driftCharge)}%`,16,H-46);
  }

  // Slot de item atual
  const ix=W-82,iy=H-78,is=56;
  ctx.fillStyle='rgba(7,9,20,.86)';ctx.fillRect(ix-is/2,iy-is/2,is,is);
  ctx.strokeStyle=player.shieldTimer>0?'#5de8ff':'#fff';ctx.lineWidth=3;ctx.strokeRect(ix-is/2,iy-is/2,is,is);
  const hudItem=player.itemRoulette>0?player.rouletteItem:player.heldItem;
  if(hudItem)drawItemIcon(hudItem,ix,iy,42);
  else {ctx.fillStyle='#7e879b';ctx.font='bold 22px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('-',ix,iy);}
  ctx.font='bold 10px monospace';ctx.fillStyle='#fff';ctx.textAlign='center';ctx.fillText('ITEM  E / X',ix,H-40);
  if(itemMessageTimer>0){ctx.font='bold 14px monospace';ctx.fillStyle='#ffde00';ctx.strokeStyle='#000';ctx.lineWidth=3;ctx.textAlign='center';ctx.strokeText(itemMessage,W/2,H-145);ctx.fillText(itemMessage,W/2,H-145);}
  ctx.restore();
}

function drawOverlay(){
  const overlay = document.getElementById('overlay');
  if(raceState==='countdown'){
    const txt = countdownVal>0 ? String(countdownVal) : 'GO!';
    overlay.innerHTML = `<div class="big">${txt}</div>`;
  } else if(lapToastTimer>0){
    overlay.innerHTML = `<div class="toast">VOLTA ${player.lap+1}/${TOTAL_LAPS}!</div>`;
  } else {
    overlay.innerHTML='';
  }
}

function renderScene(){
  if(cameraMode==='mode7'){
    const {camX,camY,camAngle} = getCamera();
    drawMode7Floor(camX,camY,camAngle);
    drawTrackObjectsAndItems(camX,camY,camAngle);
    drawWorldItemsMode7(camX,camY,camAngle);
    const cam={camX,camY,camAngle};
    drawHybridWorld(cam);
    drawPlayerKartThirdPerson();
    spawnGfxParticles();
    drawGfxParticles();
  } else {
    drawTrackTop(player.x, player.y);
    racers.forEach(r=>drawKartTop(r, player.x, player.y));
    for(const b of itemBoxes){
      if(b.active){
        const x=b.x-player.x+W/2,y=b.y-player.y+H/2;
        ctx.save();
        ctx.globalAlpha=.28;
        ctx.fillStyle='#67dcff';
        ctx.beginPath();
        ctx.ellipse(x,y+10,12,5,0,0,Math.PI*2);
        ctx.fill();
        ctx.restore();
        drawItemIcon(null,x,y,28,{rotation:performance.now()*.002});
      }
    }
    drawWorldItemsTop(player.x,player.y);
  }
  drawMinimap();
  drawHUD();
}
