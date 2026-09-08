"use strict";

// ---------- ASSETS VISUAIS ----------
// Um único modelo de kart por enquanto, com 10 frames em uma grade 5x2.
const gameAssets = {
  playerKart: new Image(),
  items: {}
};

gameAssets.playerKart.src = 'assets/sprites/player-kart.png';

const ITEM_FILES = {
  box: 'assets/sprites/items/item-box.png',
  bomb: 'assets/sprites/items/bomb.png',
  oil: 'assets/sprites/items/oil.png',
  missile: 'assets/sprites/items/missile.png',
  shield: 'assets/sprites/items/shield.png',
  turbo: 'assets/sprites/items/turbo.png',
  shock: 'assets/sprites/items/shock.png'
};
for(const [key,src] of Object.entries(ITEM_FILES)){
  const img = new Image();
  img.src = src;
  gameAssets.items[key] = img;
}

const PLAYER_KART_SHEET = {
  cols: 5,
  rows: 2,
  frames: {
    idle: 0,
    leftSoft: 1,
    leftHard: 2,
    rightSoft: 3,
    rightHard: 4,
    driftLeft: 5,
    driftRight: 6,
    boost1: 7,
    boost2: 8,
    brake: 9
  }
};

function getPlayerKartFrame(){
  const left = keys['ArrowLeft'] || keys['a'] || keys['A'];
  const right = keys['ArrowRight'] || keys['d'] || keys['D'];
  const brake = keys['ArrowDown'] || keys['s'] || keys['S'];
  const speed = Math.hypot(player.vx || 0, player.vy || 0);

  if(player.boostTimer > 0){
    return ((Math.floor(performance.now() / 90) & 1) === 0)
      ? PLAYER_KART_SHEET.frames.boost1
      : PLAYER_KART_SHEET.frames.boost2;
  }

  if(player.drift){
    return player.driftDir < 0
      ? PLAYER_KART_SHEET.frames.driftLeft
      : PLAYER_KART_SHEET.frames.driftRight;
  }

  if(brake && speed > 0.8) return PLAYER_KART_SHEET.frames.brake;

  if(left){
    return speed > MAX_SPEED * 0.62
      ? PLAYER_KART_SHEET.frames.leftHard
      : PLAYER_KART_SHEET.frames.leftSoft;
  }
  if(right){
    return speed > MAX_SPEED * 0.62
      ? PLAYER_KART_SHEET.frames.rightHard
      : PLAYER_KART_SHEET.frames.rightSoft;
  }
  return PLAYER_KART_SHEET.frames.idle;
}

const ITEM_STRIP = {
  cols: 4,
  animSpeed: {
    box: 90,
    bomb: 120,
    oil: 130,
    missile: 85,
    shield: 100,
    turbo: 85,
    shock: 90
  }
};

function isItemStripReady(type){
  const img = gameAssets.items[type];
  return !!(img && img.complete && img.naturalWidth > 0);
}

function getItemAnimFrame(type, tick){
  const t = tick != null ? tick : performance.now();
  const speed = ITEM_STRIP.animSpeed[type] || 100;
  return Math.floor(t / speed) % ITEM_STRIP.cols;
}

function getItemStripCell(type, frame){
  const img = gameAssets.items[type];
  if(!img || !isItemStripReady(type)) return null;
  const sw = img.naturalWidth / ITEM_STRIP.cols;
  const sh = img.naturalHeight;
  const col = ((frame|0) % ITEM_STRIP.cols + ITEM_STRIP.cols) % ITEM_STRIP.cols;
  return { img, sx: col * sw, sy: 0, sw, sh };
}

function drawItemSprite(type, x, y, size, opts){
  opts = opts || {};
  if(type == null) type = 'box';
  const cell = getItemStripCell(type, opts.frame != null ? opts.frame : getItemAnimFrame(type, opts.tick));
  if(!cell) return false;
  const alpha = opts.alpha == null ? 1 : opts.alpha;
  const rotation = opts.rotation || 0;
  const scaleX = opts.scaleX == null ? 1 : opts.scaleX;
  const scaleY = opts.scaleY == null ? 1 : opts.scaleY;
  const offsetY = opts.offsetY || 0;
  const dw = size;
  const dh = size * (cell.sh / cell.sw);
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.imageSmoothingEnabled = false;
  ctx.translate(x, y + offsetY);
  if(rotation) ctx.rotate(rotation);
  if(scaleX !== 1 || scaleY !== 1) ctx.scale(scaleX, scaleY);
  ctx.drawImage(cell.img, cell.sx, cell.sy, cell.sw, cell.sh, -dw/2, -dh/2, dw, dh);
  ctx.restore();
  return true;
}
