"use strict";

// ---------- TRACK GENERATION / 5 CIRCUITOS ----------
const TRACKS = [
  {name:'GREEN VALLEY', difficulty:'★★☆☆☆', desc:'pista equilibrada e larga.', road:82, boosts:[10,60,130,210], theme:{grass1:'#2f9e44',grass2:'#268a3a',road:'#5b5b66',curb:'#d94848',line:'#f4e04d'}, points:[
    {x:500,y:120},{x:1050,y:180},{x:1400,y:480},{x:1250,y:820},{x:900,y:900},{x:800,y:600},{x:560,y:720},{x:250,y:950},{x:-80,y:650},{x:60,y:280},{x:280,y:150}
  ]},
  {name:'COAST RUN', difficulty:'★★★☆☆', desc:'retas longas e curvas abertas de alta velocidade.', road:76, boosts:[18,88,154,228], theme:{grass1:'#2aa7a1',grass2:'#238d88',road:'#626575',curb:'#f6f1d1',line:'#ffd166'}, points:[
    {x:250,y:180},{x:760,y:60},{x:1320,y:180},{x:1570,y:510},{x:1390,y:870},{x:980,y:1040},{x:560,y:930},{x:180,y:720},{x:-120,y:430},{x:20,y:170}
  ]},
  {name:'DESERT SNAKE', difficulty:'★★★★☆', desc:'sequência técnica de curvas em S e pouca margem para erro.', road:70, boosts:[30,104,176,250], theme:{grass1:'#b9874f',grass2:'#a77541',road:'#55535a',curb:'#e85d3f',line:'#fff1a8'}, points:[
    {x:420,y:90},{x:920,y:120},{x:1270,y:300},{x:1080,y:520},{x:1410,y:760},{x:1110,y:980},{x:720,y:790},{x:460,y:1040},{x:100,y:820},{x:300,y:560},{x:-30,y:330},{x:180,y:130}
  ]},
  {name:'MOUNTAIN RING', difficulty:'★★★★★', desc:'curvas fechadas, pista estreita e traçado de precisão.', road:64, boosts:[12,96,192,272], theme:{grass1:'#365c45',grass2:'#294b39',road:'#4b4d57',curb:'#d9d9d9',line:'#f6c945'}, points:[
    {x:500,y:70},{x:850,y:160},{x:1120,y:70},{x:1390,y:300},{x:1190,y:560},{x:1460,y:800},{x:1110,y:1010},{x:760,y:850},{x:520,y:1080},{x:190,y:850},{x:30,y:560},{x:250,y:360},{x:120,y:130}
  ]},
  {name:'NIGHT CIRCUIT', difficulty:'★★★★☆', desc:'circuito rápido com mudanças bruscas de direção.', road:72, boosts:[40,118,198,286], theme:{grass1:'#202248',grass2:'#191b3b',road:'#424555',curb:'#7ee7ff',line:'#ffdf5d'}, points:[
    {x:420,y:110},{x:930,y:80},{x:1390,y:260},{x:1480,y:590},{x:1260,y:880},{x:860,y:950},{x:620,y:700},{x:300,y:960},{x:-40,y:760},{x:120,y:500},{x:-60,y:260},{x:230,y:90}
  ]}
];

Object.assign(TRACKS[0], {skyTop:'#5fb8ff',skyBottom:'#c9ecff',horizon:'#3f7f5c',sun:'#fff2a8',objectType:'tree', surface:'asphalt'});
Object.assign(TRACKS[1], {skyTop:'#48bfe3',skyBottom:'#caf0f8',horizon:'#0077b6',sun:'#ffe29a',objectType:'palm', surface:'asphalt'});
Object.assign(TRACKS[2], {skyTop:'#f4a261',skyBottom:'#ffd6a5',horizon:'#c97a40',sun:'#fff0b3',objectType:'cactus', surface:'sandEdge'});
Object.assign(TRACKS[3], {skyTop:'#8ecae6',skyBottom:'#eaf7ff',horizon:'#526d5b',sun:'#ffffff',objectType:'pine', surface:'iceMix'});
Object.assign(TRACKS[4], {skyTop:'#090b2a',skyBottom:'#24245c',horizon:'#11152f',sun:'#dfe8ff',objectType:'neon', surface:'asphalt'});

function lerpPt(a,b,t){ return {x:a.x+(b.x-a.x)*t, y:a.y+(b.y-a.y)*t}; }
function centripetalPoint(p0,p1,p2,p3,t,alpha){
  function knot(ti,pi,pj){ const dx=pj.x-pi.x,dy=pj.y-pi.y; return ti+Math.pow(Math.max(dx*dx+dy*dy,.0001),alpha/2); }
  const t0=0,t1=knot(t0,p0,p1),t2=knot(t1,p1,p2),t3=knot(t2,p2,p3),tt=t1+(t2-t1)*t;
  const A1=lerpPt(p0,p1,(tt-t0)/(t1-t0)),A2=lerpPt(p1,p2,(tt-t1)/(t2-t1)),A3=lerpPt(p2,p3,(tt-t2)/(t3-t2));
  const B1=lerpPt(A1,A2,(tt-t0)/(t2-t0)),B2=lerpPt(A2,A3,(tt-t1)/(t3-t1));
  return lerpPt(B1,B2,(tt-t1)/(t2-t1));
}
function buildPath(points,segPerSpan){
  const out=[],n=points.length;
  for(let i=0;i<n;i++){
    const p0=points[(i-1+n)%n],p1=points[i],p2=points[(i+1)%n],p3=points[(i+2)%n];
    for(let j=0;j<segPerSpan;j++) out.push(centripetalPoint(p0,p1,p2,p3,j/segPerSpan,.5));
  }
  return out;
}

let currentTrackIndex=0;
let currentTrack=TRACKS[0];
let path=[];
let NP=0;
let ROAD_HW=82;
let HARD_WALL=137;
let normals=[];
let boostPads=[];
let boostZones=[];
let trackObjects=[];
let trackBarriers=[];
let itemBoxes=[];

function getStartFrame(){
  const p0=path[0];
  const pPrev=path[(NP-2+NP)%NP];
  const pNext=path[2%NP];
  const tx=pNext.x-pPrev.x, ty=pNext.y-pPrev.y;
  const len=Math.hypot(tx,ty)||1;
  const fwd={x:tx/len,y:ty/len};
  return {p:p0,fwd,n:{x:-fwd.y,y:fwd.x},angle:Math.atan2(fwd.y,fwd.x)};
}

function signedDistFromCenter(x, y, i){
  const p = path[i], n = normals[i];
  return (x - p.x) * n.x + (y - p.y) * n.y;
}

function nearestWaypoint(x, y, hintIndex, searchRadius){
  let bestI = 0, bestD = Infinity;
  const hint = hintIndex != null ? hintIndex : 0;
  const r0 = searchRadius || 14;
  for(let k = -r0; k <= r0; k++){
    const i = (hint + k + NP) % NP;
    const p = path[i];
    const dx = p.x - x, dy = p.y - y;
    const d = dx * dx + dy * dy;
    if(d < bestD){ bestD = d; bestI = i; }
  }
  if(bestD > 280 * 280){
    const r1 = Math.min(NP >> 1, r0 * 4);
    for(let k = -r1; k <= r1; k++){
      const i = (hint + k + NP) % NP;
      const p = path[i];
      const dx = p.x - x, dy = p.y - y;
      const d = dx * dx + dy * dy;
      if(d < bestD){ bestD = d; bestI = i; }
    }
  }
  if(bestD > 500 * 500){
    for(let i = 0; i < NP; i++){
      const p = path[i];
      const dx = p.x - x, dy = p.y - y;
      const d = dx * dx + dy * dy;
      if(d < bestD){ bestD = d; bestI = i; }
    }
  }
  return { i: bestI, d2: bestD };
}

function objectClearanceForType(type){
  if(type==='building' || type==='neon' || type==='lamp') return ROAD_HW + 110;
  if(type==='rock') return ROAD_HW + 78;
  if(type==='sign' || type==='bush') return ROAD_HW + 58;
  return ROAD_HW + 86;
}
function objectScaleForType(type, seed){
  if(type==='building') return 1.05 + seed * 0.45;
  if(type==='neon') return 1.0 + seed * 0.38;
  if(type==='tree' || type==='pine' || type==='palm') return 0.92 + seed * 0.42;
  if(type==='cactus') return 0.86 + seed * 0.36;
  if(type==='rock' || type==='bush') return 0.82 + seed * 0.28;
  return 0.88 + seed * 0.24;
}
function pointSegmentDistanceSq(px,py,ax,ay,bx,by){
  const abx=bx-ax, aby=by-ay;
  const len2=abx*abx+aby*aby || 1;
  const t=Math.max(0,Math.min(1,((px-ax)*abx+(py-ay)*aby)/len2));
  const qx=ax+abx*t, qy=ay+aby*t;
  const dx=px-qx, dy=py-qy;
  return dx*dx+dy*dy;
}
function minDistanceToTrackSq(x,y){
  let best=Infinity;
  for(let i=0;i<NP;i++){
    const a=path[i], b=path[(i+1)%NP];
    const d2=pointSegmentDistanceSq(x,y,a.x,a.y,b.x,b.y);
    if(d2<best) best=d2;
  }
  return best;
}
function isObjectTooCloseToTrack(x, y, margin){
  return minDistanceToTrackSq(x,y) < margin*margin;
}
function canPlaceTrackObject(x,y,minGap){
  for(const o of trackObjects){
    const dx=o.x-x, dy=o.y-y;
    if(dx*dx+dy*dy < minGap*minGap) return false;
  }
  return true;
}
function pickTracksideTypes(trackIndex, i, side){
  switch(trackIndex){
    case 0: return i % 7 === 0 ? ['tree','bush'] : (i % 11 === 0 ? ['sign'] : ['tree']);
    case 1: return i % 6 === 0 ? ['palm','rock'] : (i % 10 === 0 ? ['sign'] : ['palm']);
    case 2: return i % 5 === 0 ? ['cactus','rock'] : (i % 9 === 0 ? ['sign'] : ['cactus']);
    case 3: return i % 6 === 0 ? ['pine','rock'] : (i % 10 === 0 ? ['sign'] : ['pine']);
    case 4: return i % 4 === 0 ? ['building','neon'] : (i % 8 === 0 ? ['lamp'] : ['neon']);
  }
  return [currentTrack.objectType];
}
function tryPlaceTrackObject(type, baseIndex, side, baseDist){
  for(let attempt=0; attempt<5; attempt++){
    const idx = (baseIndex + attempt * 2) % NP;
    const p = path[idx], n = normals[idx];
    const outward = baseDist + attempt * 18 + ((idx * 13) % 18);
    const jitter = (attempt - 2) * 10;
    const x = p.x + n.x * outward * side + (-n.y) * jitter;
    const y = p.y + n.y * outward * side + ( n.x) * jitter;
    const clearance = objectClearanceForType(type);
    if(isObjectTooCloseToTrack(x, y, clearance)) continue;
    if(!canPlaceTrackObject(x, y, type==='building' ? 90 : 54)) continue;
    const seed = ((idx * 37 + side * 17 + attempt * 11) % 100) / 100;
    const sc = objectScaleForType(type, seed);
    const obj = {type,x,y,scale:sc,w:34+(idx%5)*7,h:56+(idx%6)*12};
    if(type==='sign') { obj.w = 22; obj.h = 32; }
    if(type==='lamp') { obj.w = 16; obj.h = 62; }
    if(type==='bush') { obj.w = 28; obj.h = 22; }
    if(type==='rock') { obj.w = 28; obj.h = 26; }
    trackObjects.push(obj);
    return true;
  }
  return false;
}

function rebuildTrack(index){
  currentTrackIndex=index; currentTrack=TRACKS[index];
  path=buildPath(currentTrack.points,16); NP=path.length; ROAD_HW=currentTrack.road; HARD_WALL=ROAD_HW+55;
  normals=path.map((p,i)=>{ const q=path[(i+1)%NP],dx=q.x-p.x,dy=q.y-p.y,len=Math.hypot(dx,dy)||1; return {x:-dy/len,y:dx/len}; });
  boostPads=currentTrack.boosts.map(i=>i%NP);
  boostZones=boostPads.map(i=>({x:path[i].x,y:path[i].y,r:34,cooldown:0}));

  trackObjects=[];
  trackBarriers=[];
  // Barreiras/guard-rails ancorados nas bordas da pista.
  const barrierStep = 4;
  for(let i=0;i<NP;i+=barrierStep){
    const p=path[i], n=normals[i];
    for(const side of [-1,1]){
      const edge=ROAD_HW+12;
      trackBarriers.push({
        index:i, side,
        x:p.x+n.x*edge*side,
        y:p.y+n.y*edge*side,
        style:(Math.floor(i/barrierStep)+(side>0?1:0))%2
      });
    }
  }
  const objStep = Math.max(6, Math.floor(NP/20));
  for(let i=0;i<NP;i+=objStep){
    for(const side of [-1,1]){
      const baseDist = ROAD_HW + 86 + ((i*19 + (side>0?7:0)) % 44);
      const types = pickTracksideTypes(currentTrackIndex, i, side);
      types.forEach((type, idx) => {
        tryPlaceTrackObject(type, (i + idx * 2) % NP, side, baseDist + idx * 26);
      });
    }
  }

  itemBoxes=[];
  for(let k=0;k<5;k++){
    const i=Math.floor((k+0.5)*NP/5)%NP,p=path[i],n=normals[i];
    itemBoxes.push({x:p.x+n.x*((k%2?1:-1)*ROAD_HW*0.28),y:p.y+n.y*((k%2?1:-1)*ROAD_HW*0.28),active:true,respawn:0});
  }
  mmBounds=null;
  buildWorldTexture();
}

// ---------- TEXTURA DO MUNDO (usada pela câmera Mode 7) ----------
let TEX_OX=0, TEX_OY=0, TEX_W=0, TEX_H=0, TEX_DATA=null;

function buildWorldTexture(){
  let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
  path.forEach(p=>{ minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y); });
  const pad = 300;
  TEX_OX = minX-pad; TEX_OY = minY-pad;
  TEX_W = Math.ceil(maxX-minX+pad*2); TEX_H = Math.ceil(maxY-minY+pad*2);

  const tex = document.createElement('canvas');
  tex.width = TEX_W; tex.height = TEX_H;
  const tctx = tex.getContext('2d');

  const tile=40;
  for(let x=0;x<TEX_W;x+=tile){
    for(let y=0;y<TEX_H;y+=tile){
      const c = (Math.floor((x+TEX_OX)/tile)+Math.floor((y+TEX_OY)/tile))%2===0 ? currentTrack.theme.grass1 : currentTrack.theme.grass2;
      tctx.fillStyle=c;
      tctx.fillRect(x,y,tile,tile);
    }
  }

  tctx.fillStyle=currentTrack.theme.road;
  tctx.beginPath();
  for(let i=0;i<NP;i++){
    const p=path[i], n=normals[i];
    const x=p.x+n.x*ROAD_HW-TEX_OX, y=p.y+n.y*ROAD_HW-TEX_OY;
    if(i===0) tctx.moveTo(x,y); else tctx.lineTo(x,y);
  }
  for(let i=NP-1;i>=0;i--){
    const p=path[i], n=normals[i];
    const x=p.x-n.x*ROAD_HW-TEX_OX, y=p.y-n.y*ROAD_HW-TEX_OY;
    tctx.lineTo(x,y);
  }
  tctx.closePath(); tctx.fill();

  tctx.lineWidth=6;
  for(let side of [1,-1]){
    tctx.beginPath();
    for(let i=0;i<NP;i+=2){
      const p=path[i], n=normals[i];
      const x=p.x+n.x*ROAD_HW*side-TEX_OX, y=p.y+n.y*ROAD_HW*side-TEX_OY;
      if(i===0) tctx.moveTo(x,y); else tctx.lineTo(x,y);
    }
    tctx.closePath();
    tctx.strokeStyle=currentTrack.theme.curb;
    tctx.stroke();
  }

  tctx.strokeStyle=currentTrack.theme.line;
  tctx.lineWidth=3;
  tctx.setLineDash([10,14]);
  tctx.beginPath();
  for(let i=0;i<NP;i++){
    const p=path[i];
    const x=p.x-TEX_OX, y=p.y-TEX_OY;
    if(i===0) tctx.moveTo(x,y); else tctx.lineTo(x,y);
  }
  tctx.closePath(); tctx.stroke(); tctx.setLineDash([]);

  const startFrame=getStartFrame(), p0=startFrame.p, n0=startFrame.n, sq=14;
  for(let s=-ROAD_HW; s<ROAD_HW; s+=sq){
    const cx = p0.x+n0.x*(s+sq/2)-TEX_OX, cy = p0.y+n0.y*(s+sq/2)-TEX_OY;
    const ddx=startFrame.fwd.x, ddy=startFrame.fwd.y;
    tctx.fillStyle=(Math.floor((s+ROAD_HW)/sq)%2===0)?'#fff':'#111';
    tctx.save(); tctx.translate(cx,cy); tctx.rotate(Math.atan2(ddy,ddx)); tctx.fillRect(-6,-sq/2,12,sq); tctx.restore();
  }

  boostPads.forEach(idx=>{
    const p = path[idx];
    const x = p.x-TEX_OX, y = p.y-TEX_OY;
    tctx.save();
    tctx.translate(x,y);
    tctx.fillStyle='#ffde00';
    tctx.beginPath();
    tctx.moveTo(-14,10); tctx.lineTo(0,-14); tctx.lineTo(14,10);
    tctx.closePath(); tctx.fill();
    tctx.restore();
  });

  TEX_DATA = tctx.getImageData(0,0,TEX_W,TEX_H).data;
}
let mmBounds = null;
rebuildTrack(0);
