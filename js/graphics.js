"use strict";

// ---------- GRÁFICOS / DESEMPENHO ----------
// 'normal': passo adaptativo (prioriza FPS) | 'high': amostragem fina + neblina
let graphicsMode = 'medium';
let sceneryDensity = 'medium';
const GRAPHICS = {
  low:{mode7:'low', kartLod:0, objectLod:0, shadows:false, particles:0.45, maxObjects:45},
  medium:{mode7:'normal', kartLod:1, objectLod:1, shadows:true, particles:0.75, maxObjects:85},
  high:{mode7:'high', kartLod:2, objectLod:2, shadows:true, particles:1.0, maxObjects:130},
  ultra:{mode7:'high', kartLod:3, objectLod:3, shadows:true, particles:1.35, maxObjects:180}
};
const DENSITY_MULT={low:0.55,medium:1,high:1.45};
function setGraphicsMode(mode){
  graphicsMode = GRAPHICS[mode] ? mode : 'medium';
  mode7Preset = GRAPHICS[graphicsMode].mode7;
  adaptiveMode7 = graphicsMode!=='ultra';
  rebuildMode7Tables();
  document.querySelectorAll('[data-gfx]').forEach(b=>b.classList.toggle('active',b.dataset.gfx===graphicsMode));
}
function setSceneryDensity(v){ sceneryDensity=v; document.querySelectorAll('[data-density]').forEach(b=>b.classList.toggle('active',b.dataset.density===v)); }

// Buffer reutilizável do chão Mode 7 — render interno reduzido + upscale pixel-perfect
const FLOOR_H = H - HORIZON_Y;
const MODE7_PRESETS = {
  low:    { w:320, h:Math.max(96, Math.round(FLOOR_H*0.50)) },
  normal: { w:400, h:Math.max(120, Math.round(FLOOR_H*0.62)) },
  high:   { w:600, h:Math.max(160, Math.round(FLOOR_H*0.82)) }
};
let adaptiveMode7 = true;
let mode7Preset = 'normal';
let mode7Canvas = document.createElement('canvas');
let mode7Ctx = mode7Canvas.getContext('2d');
mode7Ctx.imageSmoothingEnabled = false;
let floorImgData = null;
let floorBuf32 = null;
let rowDepth = null, rowHalfWorld = null, rowFog = null, rowShade = null;

function rebuildMode7Tables(){
  const preset = MODE7_PRESETS[mode7Preset];
  mode7Canvas.width = preset.w;
  mode7Canvas.height = preset.h;
  mode7Ctx.imageSmoothingEnabled = false;
  floorImgData = mode7Ctx.createImageData(preset.w, preset.h);
  floorBuf32 = new Uint32Array(floorImgData.data.buffer);
  rowDepth = new Float32Array(preset.h);
  rowHalfWorld = new Float32Array(preset.h);
  rowFog = new Float32Array(preset.h);
  rowShade = new Float32Array(preset.h);
  const halfW = preset.w * 0.5;
  const camHFocal = BASE_CAM_HEIGHT * BASE_FOCAL;
  for(let row=0; row<preset.h; row++){
    const yNorm = (row + 1) / preset.h;
    const screenY = Math.max(1, yNorm * FLOOR_H);
    const depth = camHFocal / screenY;
    const scale = BASE_FOCAL / depth;
    rowDepth[row] = depth;
    rowHalfWorld[row] = halfW / scale;
    rowFog[row] = Math.max(0, Math.min(0.5, depth * 0.0004167));
    rowShade[row] = Math.max(0.55, Math.min(1, 1 - depth * 0.0003846));
  }
}
rebuildMode7Tables();

let showFps = false;
let fpsSmooth = 60;
let qualityCooldown = 0;
function updateAdaptiveQuality(dt){
  if(!adaptiveMode7 || cameraMode!=='mode7') return;
  qualityCooldown = Math.max(0, qualityCooldown-dt);
  if(qualityCooldown>0) return;
  let next = mode7Preset;
  if(fpsSmooth < 42) next = 'low';
  else if(fpsSmooth < 53 && mode7Preset==='high') next = 'normal';
  else if(fpsSmooth > 58 && (graphicsMode==='high'||graphicsMode==='ultra') && mode7Preset==='normal') next = 'high';
  else if(fpsSmooth > 56 && mode7Preset==='low') next = 'normal';
  if(next!==mode7Preset){
    mode7Preset = next;
    rebuildMode7Tables();
    qualityCooldown = 180;
  }
}
