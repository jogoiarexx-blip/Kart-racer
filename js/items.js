"use strict";

// ---------- SISTEMA DE ITENS / POWER-UPS ----------
const ITEM_TYPES = {
  bomb:   {name:'BOMBA',        short:'B', color:'#ff5a45'},
  oil:    {name:'POÇA DE ÓLEO', short:'O', color:'#171717'},
  turbo:  {name:'TURBO',        short:'T', color:'#ffcf33'},
  shield: {name:'ESCUDO',       short:'S', color:'#4fdcff'},
  missile:{name:'MÍSSIL',       short:'M', color:'#ff7a35'},
  shock:  {name:'CHOQUE',       short:'⚡', color:'#ffe95a'}
};
const ITEM_POOL = ['bomb','oil','turbo','shield','missile','bomb','oil','turbo','shield','shock'];
let itemProjectiles=[];
let itemHazards=[];
let itemExplosions=[];
let itemPickups=[];
let itemMessage='';
let itemMessageTimer=0;
let useItemLock=false;

function randomItemFor(r){
  const pool = r.place>=3
    ? ['turbo','missile','bomb','shield','shock','turbo','missile','bomb','oil']
    : ITEM_POOL;
  return pool[(Math.random()*pool.length)|0];
}

function startItemRoulette(r){
  if(r.heldItem || r.itemRoulette>0) return;
  r.itemRoulette=42;
  r.rouletteItem=randomItemFor(r);
}

function finishItemRoulette(r){
  r.heldItem=r.rouletteItem||randomItemFor(r);
  r.rouletteItem=null;
  if(typeof playSfx==='function' && r.isPlayer) playSfx('item_ready');
  if(r.isPlayer){
    itemMessage=`ITEM: ${ITEM_TYPES[r.heldItem].name}`;
    itemMessageTimer=75;
  }
}

function spawnItemPickup(x,y,type){
  itemPickups.push({x,y,type:type||'box',life:24,max:24});
  if(typeof playSfx==='function') playSfx('pickup_box');
}

function setSpin(r,ticks,strength){
  if(r.shieldTimer>0){
    r.shieldTimer=Math.max(0,r.shieldTimer-45);
    return false;
  }
  r.spinTimer=Math.max(r.spinTimer||0,ticks);
  r.vx*=strength; r.vy*=strength;
  r.boostTimer=0;
  if(r.isPlayer) cameraShake=Math.max(cameraShake,7);
  return true;
}

function spawnExplosion(x,y,kind){
  const k = kind || 'bomb';
  const life = k==='shock' ? 34 : (k==='missile' ? 22 : 28);
  itemExplosions.push({x,y,life,max:life,kind:k,shock:k==='shock',seed:Math.random()*9999});
  if(typeof playSfx==='function'){
    if(k==='missile') playSfx('missile_explode');
    else if(k==='bomb') playSfx('bomb_explode');
  }
}

function explodeBomb(x,y,owner){
  spawnExplosion(x,y,'bomb');
  for(const r of racers){
    if(r===owner || r.finished) continue;
    const dx=r.x-x,dy=r.y-y,d2=dx*dx+dy*dy;
    if(d2<82*82){
      const d=Math.sqrt(d2)||1;
      if(setSpin(r,72,.28)){
        r.vx+=(dx/d)*1.7; r.vy+=(dy/d)*1.7;
      }
    }
  }
}

function nearestTargetAhead(owner,maxDist=480){
  let best=null,bestScore=Infinity;
  for(const r of racers){
    if(r===owner||r.finished)continue;
    const dx=r.x-owner.x,dy=r.y-owner.y;
    const d=Math.hypot(dx,dy);
    if(d>maxDist)continue;
    const ahead=dx*Math.cos(owner.angle)+dy*Math.sin(owner.angle);
    if(ahead<20)continue;
    if(d<bestScore){best=r;bestScore=d;}
  }
  return best;
}

function useRacerItem(r){
  if(!r.heldItem || r.itemUseCooldown>0 || r.itemRoulette>0) return false;
  const type=r.heldItem;
  r.heldItem=null;
  r.itemUseCooldown=24;
  const fx=Math.cos(r.angle),fy=Math.sin(r.angle);
  if(type==='turbo'){
    r.boostTimer=Math.max(r.boostTimer,120);
  } else if(type==='shield'){
    r.shieldTimer=Math.max(r.shieldTimer,240);
  } else if(type==='oil'){
    itemHazards.push({type:'oil',x:r.x-fx*34,y:r.y-fy*34,radius:26,life:720,owner:r});
  } else if(type==='bomb'){
    itemProjectiles.push({type:'bomb',x:r.x+fx*34,y:r.y+fy*34,vx:fx*5.5+r.vx*.4,vy:fy*5.5+r.vy*.4,life:105,owner:r});
  } else if(type==='missile'){
    itemProjectiles.push({type:'missile',x:r.x+fx*38,y:r.y+fy*38,vx:fx*6.4,vy:fy*6.4,life:150,owner:r,target:nearestTargetAhead(r,700)});
  } else if(type==='shock'){
    for(const other of racers){
      if(other===r||other.finished)continue;
      if(other.shieldTimer>0){other.shieldTimer=Math.max(0,other.shieldTimer-60);continue;}
      other.slowTimer=Math.max(other.slowTimer||0,105);
      other.vx*=.58;other.vy*=.58;
    }
    spawnExplosion(r.x,r.y,'shock');
  }
  if(typeof playSfx==='function'){
    if(type==='turbo') playSfx('use_turbo');
    else if(type==='shield') playSfx('use_shield');
    else if(type==='bomb') playSfx('use_bomb');
    else if(type==='missile') playSfx('use_missile');
    else if(type==='shock') playSfx('use_shock');
  }
  if(r.isPlayer){
    itemMessage=`USOU: ${ITEM_TYPES[type].name}`;
    itemMessageTimer=52;
  }
  return true;
}

function updateItemSystem(dt){
  if(itemMessageTimer>0)itemMessageTimer-=dt;
  for(const r of racers){
    if(r.itemUseCooldown>0)r.itemUseCooldown-=dt;
    if(r.itemRoulette>0){
      r.itemRoulette-=dt;
      if(((r.itemRoulette|0)%5)===0)r.rouletteItem=randomItemFor(r);
      if(r.itemRoulette<=0)finishItemRoulette(r);
    }
    if(r.shieldTimer>0)r.shieldTimer-=dt;
    if(r.slowTimer>0)r.slowTimer-=dt;
    if(r.spinTimer>0)r.spinTimer-=dt;
  }

  for(let i=itemProjectiles.length-1;i>=0;i--){
    const p=itemProjectiles[i];
    if(p.type==='missile'){
      if(!p.target||p.target.finished) p.target=nearestTargetAhead(p.owner,760);
      if(p.target){
        const desired=Math.atan2(p.target.y-p.y,p.target.x-p.x);
        let a=Math.atan2(p.vy,p.vx),d=desired-a;
        while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;
        a+=Math.max(-.095,Math.min(.095,d));
        const sp=6.8;p.vx=Math.cos(a)*sp;p.vy=Math.sin(a)*sp;
      }
    }
    p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;
    let hit=false;
    for(const r of racers){
      if(r===p.owner||r.finished)continue;
      const dx=r.x-p.x,dy=r.y-p.y;
      if(dx*dx+dy*dy<27*27){
        if(p.type==='bomb') explodeBomb(p.x,p.y,p.owner);
        else { setSpin(r,82,.22); if(typeof playSfx==='function') playSfx('electric_hit'); spawnExplosion(p.x,p.y,'missile'); }
        hit=true;break;
      }
    }
    if(p.type==='bomb' && p.life<=0){ explodeBomb(p.x,p.y,p.owner); hit=true; }
    if(p.type==='missile' && p.life<=0){ spawnExplosion(p.x,p.y,'missile'); hit=true; }
    if(hit)itemProjectiles.splice(i,1);
  }

  for(let i=itemHazards.length-1;i>=0;i--){
    const h=itemHazards[i];h.life-=dt;
    for(const r of racers){
      if(r===h.owner||r.finished)continue;
      const dx=r.x-h.x,dy=r.y-h.y;
      if(dx*dx+dy*dy<h.radius*h.radius){
        if(setSpin(r,48,.42)){
          if(typeof playSfx==='function') playSfx('oil_spin');
          r.angle+= (Math.random()-.5)*.9;
          h.life=0;
        }
      }
    }
    if(h.life<=0)itemHazards.splice(i,1);
  }

  for(let i=itemExplosions.length-1;i>=0;i--){
    itemExplosions[i].life-=dt;
    if(itemExplosions[i].life<=0)itemExplosions.splice(i,1);
  }

  for(let i=itemPickups.length-1;i>=0;i--){
    itemPickups[i].life-=dt;
    if(itemPickups[i].life<=0)itemPickups.splice(i,1);
  }

  for(const r of [ai1,ai2,ai3]){
    if(!r.heldItem||r.itemUseCooldown>0||r.spinTimer>0)continue;
    const ahead=nearestTargetAhead(r,420);
    if(r.heldItem==='turbo' && Math.hypot(r.vx,r.vy)<MAX_SPEED*.93) useRacerItem(r);
    else if(r.heldItem==='shield' && (r.place<=2||Math.random()<.006)) useRacerItem(r);
    else if(r.heldItem==='oil' && Math.random()<.012) useRacerItem(r);
    else if((r.heldItem==='bomb'||r.heldItem==='missile') && ahead) useRacerItem(r);
    else if(r.heldItem==='shock' && r.place>=3) useRacerItem(r);
  }
}

function drawItemVectorFallback(type,x,y,size){
  ctx.save();ctx.translate(x,y);
  if(type==='bomb'){
    ctx.fillStyle='#202331';ctx.beginPath();ctx.arc(0,3,size*.31,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#efb24b';ctx.lineWidth=Math.max(2,size*.06);ctx.beginPath();ctx.moveTo(size*.18,-size*.18);ctx.quadraticCurveTo(size*.35,-size*.42,size*.46,-size*.27);ctx.stroke();
    ctx.fillStyle='#ff5a45';ctx.beginPath();ctx.arc(size*.46,-size*.27,size*.07,0,Math.PI*2);ctx.fill();
  } else if(type==='oil'){
    ctx.fillStyle='rgba(18,18,22,.92)';ctx.beginPath();ctx.ellipse(0,8,size*.42,size*.22,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(120,80,160,.45)';ctx.beginPath();ctx.ellipse(-size*.1,4,size*.18,size*.07,-.2,0,Math.PI*2);ctx.fill();
  } else if(type==='turbo'){
    ctx.fillStyle='#ffcf33';ctx.beginPath();ctx.moveTo(size*.05,-size*.42);ctx.lineTo(-size*.28,size*.03);ctx.lineTo(-size*.05,size*.03);ctx.lineTo(-size*.17,size*.43);ctx.lineTo(size*.32,-size*.08);ctx.lineTo(size*.08,-size*.08);ctx.closePath();ctx.fill();
  } else if(type==='shield'){
    ctx.strokeStyle='#5de8ff';ctx.lineWidth=Math.max(3,size*.1);ctx.beginPath();ctx.arc(0,0,size*.34,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='rgba(255,255,255,.85)';ctx.lineWidth=Math.max(1,size*.035);ctx.beginPath();ctx.arc(-size*.08,-size*.08,size*.25,Math.PI*.9,Math.PI*1.65);ctx.stroke();
  } else if(type==='missile'){
    ctx.rotate(-.3);ctx.fillStyle='#e6e7ea';ctx.fillRect(-size*.28,-size*.11,size*.48,size*.22);ctx.fillStyle='#ff5a45';ctx.beginPath();ctx.moveTo(size*.2,-size*.11);ctx.lineTo(size*.43,0);ctx.lineTo(size*.2,size*.11);ctx.closePath();ctx.fill();ctx.fillStyle='#ffb02e';ctx.beginPath();ctx.moveTo(-size*.28,-size*.08);ctx.lineTo(-size*.45,0);ctx.lineTo(-size*.28,size*.08);ctx.closePath();ctx.fill();
  } else if(type==='shock'){
    ctx.fillStyle='#ffe95a';ctx.beginPath();ctx.moveTo(size*.05,-size*.45);ctx.lineTo(-size*.24,size*.02);ctx.lineTo(0,size*.02);ctx.lineTo(-size*.1,size*.44);ctx.lineTo(size*.34,-size*.08);ctx.lineTo(size*.08,-size*.08);ctx.closePath();ctx.fill();
  } else {
    ctx.fillStyle='#fff';ctx.font=`bold ${size*.65}px monospace`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('?',0,0);
  }
  ctx.restore();
}

function drawItemIcon(type,x,y,size,opts){
  opts = opts || {};
  const spriteType = type == null ? 'box' : type;
  if(typeof drawItemSprite === 'function'){
    if(drawItemSprite(spriteType, x, y, size, opts)) return;
  }
  drawItemVectorFallback(type,x,y,size);
}

function drawExplosionFxScreen(x,y,size,phase,kind){
  ctx.save();
  const alpha = Math.max(0,1-phase);
  ctx.globalAlpha = alpha;
  if(kind==='shock'){
    ctx.strokeStyle = '#78e8ff';
    ctx.lineWidth = Math.max(2,size*.12);
    ctx.beginPath();
    ctx.arc(x,y,size*(.35+.8*phase),0,Math.PI*2);
    ctx.stroke();
    ctx.strokeStyle = '#ffe95a';
    ctx.lineWidth = Math.max(2,size*.08);
    for(let i=0;i<6;i++){
      const a = i*Math.PI/3 + phase*2;
      ctx.beginPath();
      ctx.moveTo(x+Math.cos(a)*size*.25,y+Math.sin(a)*size*.25);
      ctx.lineTo(x+Math.cos(a+.15)*size*.58,y+Math.sin(a+.15)*size*.58);
      ctx.lineTo(x+Math.cos(a-.08)*size*.48,y+Math.sin(a-.08)*size*.48);
      ctx.stroke();
    }
  } else if(kind==='missile'){
    ctx.fillStyle = '#ff5a45';
    ctx.beginPath(); ctx.arc(x,y,size*(.26+.45*phase),0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#ffd34d';
    ctx.beginPath(); ctx.arc(x,y,size*(.11+.25*(1-phase)),0,Math.PI*2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,245,200,.95)';
    ctx.lineWidth = Math.max(1,size*.055);
    for(let i=0;i<8;i++){
      const a = i*(Math.PI*2/8) + phase*2.2;
      const r1 = size*(.12 + .08*Math.sin(i+phase*4));
      const r2 = size*(.42 + .28*phase + (i%2?size*.003:0));
      ctx.beginPath();
      ctx.moveTo(x+Math.cos(a)*r1, y+Math.sin(a)*r1);
      ctx.lineTo(x+Math.cos(a)*r2, y+Math.sin(a)*r2);
      ctx.stroke();
    }
    ctx.strokeStyle='rgba(120,120,120,.45)';
    ctx.lineWidth=Math.max(1,size*.03);
    ctx.beginPath();
    ctx.arc(x,y,size*(.34+.42*phase),0,Math.PI*2);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#ff7b21';
    ctx.beginPath(); ctx.arc(x,y,size*(.32+.62*phase),0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#ffd34d';
    ctx.beginPath(); ctx.arc(x,y,size*(.16+.36*(1-phase)),0,Math.PI*2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.9)';
    ctx.lineWidth = Math.max(1,size*.05);
    for(let i=0;i<7;i++){
      const a = i*(Math.PI*2/7) + phase*1.8;
      ctx.beginPath();
      ctx.moveTo(x+Math.cos(a)*size*.2, y+Math.sin(a)*size*.2);
      ctx.lineTo(x+Math.cos(a)*size*(.55+.3*phase), y+Math.sin(a)*size*(.55+.3*phase));
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawPickupFxScreen(x,y,size,phase){
  const rise = phase * size * .9;
  const pulse = 1 + phase * .45;
  drawItemIcon(null,x,y-rise,size*pulse,{frame:Math.floor(phase*8)%4,rotation:phase*5.5,alpha:Math.max(0,.95-phase)});
  ctx.save();
  ctx.globalAlpha = Math.max(0,.8-phase);
  ctx.strokeStyle='#c5fbff';
  ctx.lineWidth=Math.max(1,size*.06);
  ctx.beginPath();
  ctx.arc(x,y-rise,size*(.24+.46*phase),0,Math.PI*2);
  ctx.stroke();
  for(let i=0;i<4;i++){
    const a = phase*5 + i*(Math.PI/2);
    const px = x + Math.cos(a)*size*(.25+.35*phase);
    const py = y - rise + Math.sin(a)*size*(.08+.25*phase);
    ctx.fillStyle = i%2 ? '#fff2a8' : '#67dcff';
    ctx.fillRect(px,py,Math.max(2,size*.08),Math.max(2,size*.08));
  }
  ctx.restore();
}

function drawWorldItemsMode7(camX,camY,camAngle){
  const arr=[];
  for(const h of itemHazards){const p=projectMode7(h.x,h.y,camX,camY,camAngle);if(p&&p.depth<850)arr.push({kind:'hazard',o:h,p});}
  for(const q of itemProjectiles){const p=projectMode7(q.x,q.y,camX,camY,camAngle);if(p&&p.depth<900)arr.push({kind:'projectile',o:q,p});}
  for(const e of itemExplosions){const p=projectMode7(e.x,e.y,camX,camY,camAngle);if(p&&p.depth<900)arr.push({kind:'explosion',o:e,p});}
  for(const c of itemPickups){const p=projectMode7(c.x,c.y,camX,camY,camAngle);if(p&&p.depth<900)arr.push({kind:'pickup',o:c,p});}
  arr.sort((a,b)=>b.p.depth-a.p.depth);
  for(const e of arr){
    if(e.p.x<-90||e.p.x>W+90)continue;
    if(e.kind==='hazard'){
      const s=Math.max(12,52*e.p.scale);
      drawItemIcon('oil',e.p.x,e.p.y,s,{frame:getItemAnimFrame('oil')});
    } else if(e.kind==='projectile'){
      const s=Math.max(14,40*e.p.scale);
      const rot = e.o.type==='missile' ? Math.atan2(e.o.vy,e.o.vx) : 0;
      drawItemIcon(e.o.type,e.p.x,e.p.y-s*.18,s,{rotation:rot,frame:getItemAnimFrame(e.o.type)});
    } else if(e.kind==='explosion'){
      const phase = 1 - (e.o.life / e.o.max);
      const s = Math.max(14,(100*e.p.scale)+18);
      drawExplosionFxScreen(e.p.x,e.p.y-s*.15,s,phase,e.o.kind||'bomb');
    } else if(e.kind==='pickup'){
      const phase = 1 - (e.o.life / e.o.max);
      const s = Math.max(16,54*e.p.scale);
      drawPickupFxScreen(e.p.x,e.p.y-s*.25,s,phase);
    }
  }
}

function drawWorldItemsTop(camX,camY){
  for(const h of itemHazards){const x=h.x-camX+W/2,y=h.y-camY+H/2;drawItemIcon('oil',x,y,28);}
  for(const p of itemProjectiles){const x=p.x-camX+W/2,y=p.y-camY+H/2;const rot=p.type==='missile'?Math.atan2(p.vy,p.vx):0;drawItemIcon(p.type,x,y,24,{rotation:rot});}
  for(const e of itemExplosions){const x=e.x-camX+W/2,y=e.y-camY+H/2;const phase=1-(e.life/e.max);drawExplosionFxScreen(x,y,54,phase,e.kind||'bomb');}
  for(const c of itemPickups){const x=c.x-camX+W/2,y=c.y-camY+H/2;const phase=1-(c.life/c.max);drawPickupFxScreen(x,y,36,phase);}
}
