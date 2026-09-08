"use strict";

// ---------- ÁUDIO SINTÉTICO (WebAudio) ----------
let audioCtx = null;
let audioEnabled = true;

function ensureAudio(){
  if(!audioEnabled) return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if(!AC) return null;
  if(!audioCtx) audioCtx = new AC();
  if(audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function nowAudio(){ const ac = ensureAudio(); return ac ? ac.currentTime : 0; }

function tone(freq, duration, type, gain, when, slideTo){
  const ac = ensureAudio(); if(!ac) return;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type || 'square';
  osc.frequency.setValueAtTime(freq, when);
  if(slideTo != null) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), when + duration);
  g.gain.setValueAtTime(0.0001, when);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain || 0.04), when + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  osc.connect(g); g.connect(ac.destination);
  osc.start(when); osc.stop(when + duration + 0.03);
}

let noiseBuffer = null;
function getNoiseBuffer(){
  const ac = ensureAudio(); if(!ac) return null;
  if(noiseBuffer) return noiseBuffer;
  noiseBuffer = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for(let i=0;i<data.length;i++) data[i] = (Math.random()*2-1) * (1 - i/data.length*0.15);
  return noiseBuffer;
}
function noiseBurst(duration, gain, when, hpFreq){
  const ac = ensureAudio(); if(!ac) return;
  const src = ac.createBufferSource(); src.buffer = getNoiseBuffer();
  const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = hpFreq || 180;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, when);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0001,gain||0.04), when+0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, when+duration);
  src.connect(hp); hp.connect(g); g.connect(ac.destination);
  src.start(when); src.stop(when+duration+0.05);
}

function playSfx(name){
  const ac = ensureAudio(); if(!ac) return;
  const t = ac.currentTime;
  switch(name){
    case 'pickup_box':
      tone(740,0.06,'square',0.03,t);
      tone(980,0.08,'square',0.028,t+0.05);
      tone(1240,0.10,'triangle',0.025,t+0.11);
      break;
    case 'item_ready':
      tone(540,0.05,'triangle',0.03,t);
      tone(810,0.08,'triangle',0.03,t+0.05);
      break;
    case 'use_turbo':
      tone(180,0.16,'sawtooth',0.035,t,520);
      noiseBurst(0.12,0.018,t,600);
      break;
    case 'use_bomb':
      tone(170,0.08,'square',0.03,t,120);
      break;
    case 'use_missile':
      tone(280,0.06,'square',0.03,t,430);
      tone(480,0.10,'sawtooth',0.02,t+0.03,700);
      break;
    case 'use_shield':
      tone(420,0.12,'triangle',0.03,t,760);
      tone(760,0.12,'triangle',0.02,t+0.05,980);
      break;
    case 'use_shock':
      tone(220,0.08,'sawtooth',0.03,t,600);
      tone(680,0.12,'square',0.02,t+0.02,320);
      noiseBurst(0.1,0.015,t+0.01,900);
      break;
    case 'bomb_explode':
      noiseBurst(0.18,0.05,t,120);
      tone(120,0.16,'sawtooth',0.03,t,55);
      break;
    case 'missile_explode':
      noiseBurst(0.14,0.035,t,180);
      tone(180,0.10,'square',0.028,t,70);
      tone(420,0.06,'triangle',0.015,t+0.01,160);
      break;
    case 'oil_spin':
      tone(260,0.05,'square',0.02,t,140);
      break;
    case 'electric_hit':
      tone(520,0.07,'square',0.018,t,220);
      tone(800,0.05,'square',0.015,t+0.02,360);
      break;
  }
}

window.addEventListener('pointerdown', ensureAudio, {passive:true});
window.addEventListener('keydown', ensureAudio);
