"use strict";

// ---------- RENDER: CÂMERA DE TOPO ----------
function drawTrackTop(camX, camY){
  const tile=40;
  const startX = Math.floor((camX-W/2)/tile)*tile;
  const startY = Math.floor((camY-H/2)/tile)*tile;
  for(let x=startX; x<camX+W/2; x+=tile){
    for(let y=startY; y<camY+H/2; y+=tile){
      const c = (Math.floor(x/tile)+Math.floor(y/tile))%2===0 ? currentTrack.theme.grass1 : currentTrack.theme.grass2;
      ctx.fillStyle=c;
      ctx.fillRect(x-camX+W/2, y-camY+H/2, tile, tile);
    }
  }

  ctx.fillStyle=currentTrack.theme.road;
  ctx.beginPath();
  for(let i=0;i<NP;i++){
    const p=path[i], n=normals[i];
    const x = p.x+n.x*ROAD_HW-camX+W/2, y = p.y+n.y*ROAD_HW-camY+H/2;
    if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  }
  for(let i=NP-1;i>=0;i--){
    const p=path[i], n=normals[i];
    const x = p.x-n.x*ROAD_HW-camX+W/2, y = p.y-n.y*ROAD_HW-camY+H/2;
    ctx.lineTo(x,y);
  }
  ctx.closePath();
  ctx.fill();

  ctx.lineWidth=6;
  for(let side of [1,-1]){
    ctx.beginPath();
    for(let i=0;i<NP;i+=2){
      const p=path[i], n=normals[i];
      const x = p.x+n.x*ROAD_HW*side-camX+W/2, y = p.y+n.y*ROAD_HW*side-camY+H/2;
      if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.closePath();
    ctx.strokeStyle = currentTrack.theme.curb;
    ctx.stroke();
  }

  ctx.strokeStyle=currentTrack.theme.line;
  ctx.lineWidth=3;
  ctx.setLineDash([10,14]);
  ctx.beginPath();
  for(let i=0;i<NP;i++){
    const p=path[i];
    const x=p.x-camX+W/2, y=p.y-camY+H/2;
    if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.setLineDash([]);

  const p0=path[0], n0=normals[0], sq=14;
  for(let s=-ROAD_HW; s<ROAD_HW; s+=sq){
    const cx = p0.x + n0.x*(s+sq/2), cy = p0.y + n0.y*(s+sq/2);
    const ddx = -n0.y, ddy = n0.x;
    ctx.fillStyle = (Math.floor((s+ROAD_HW)/sq)%2===0) ? '#fff':'#111';
    const x = cx-camX+W/2, y = cy-camY+H/2;
    ctx.save();
    ctx.translate(x,y);
    ctx.rotate(Math.atan2(ddy,ddx));
    ctx.fillRect(-6,-sq/2,12,sq);
    ctx.restore();
  }

  boostPads.forEach(idx=>{
    const p = path[idx];
    const x = p.x-camX+W/2, y = p.y-camY+H/2;
    ctx.save();
    ctx.translate(x,y);
    ctx.fillStyle='#ffde00';
    ctx.beginPath();
    ctx.moveTo(-14,10); ctx.lineTo(0,-14); ctx.lineTo(14,10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });
}

function drawKartTop(r, camX, camY){
  const x = r.x-camX+W/2, y = r.y-camY+H/2;
  ctx.save();
  ctx.translate(x,y);
  ctx.rotate(r.angle);

  ctx.fillStyle='rgba(0,0,0,0.35)';
  ctx.fillRect(-11,-8,22,17);

  ctx.fillStyle='#111';
  ctx.fillRect(-10,-10,6,5);
  ctx.fillRect(-10,5,6,5);
  ctx.fillRect(6,-10,6,5);
  ctx.fillRect(6,5,6,5);

  ctx.fillStyle=r.color;
  ctx.fillRect(-12,-7,24,14);
  ctx.fillStyle='rgba(255,255,255,0.35)';
  ctx.fillRect(-12,-2,24,3);
  ctx.fillStyle='#222';
  ctx.fillRect(6,-4,7,8);
  ctx.fillStyle='#fff';
  ctx.fillRect(11,-6,3,12);

  if(r.shieldTimer>0){ctx.strokeStyle='rgba(93,232,255,.85)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,22,0,Math.PI*2);ctx.stroke();}
  if(r.slowTimer>0){
    const phase=(performance.now()*0.02)%6.283;
    ctx.strokeStyle='rgba(120,232,255,.95)';
    ctx.lineWidth=2;
    for(let i=0;i<4;i++){
      const a=phase+i*Math.PI/2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a)*12,Math.sin(a)*12);
      ctx.lineTo(Math.cos(a+.18)*18,Math.sin(a+.18)*18);
      ctx.lineTo(Math.cos(a-.08)*24,Math.sin(a-.08)*24);
      ctx.stroke();
    }
  }

  if(r.boostTimer>0){
    ctx.fillStyle='#ffb703';
    ctx.beginPath();
    ctx.moveTo(-12,-4);
    ctx.lineTo(-22-Math.random()*6,0);
    ctx.lineTo(-12,4);
    ctx.closePath();
    ctx.fill();
  } else if(r.drift){
    ctx.fillStyle = r.driftTime>18 ? '#ff5c5c':'#8ecfff';
    ctx.beginPath();
    ctx.arc(-r.driftDir*4,-9,2,0,Math.PI*2);
    ctx.arc(-r.driftDir*4,9,2,0,Math.PI*2);
    ctx.fill();
  }

  ctx.restore();
}
