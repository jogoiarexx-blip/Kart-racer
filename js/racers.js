"use strict";

// ---------- RACERS ----------
function makeRacer(color, isPlayer){
  return { color, isPlayer, x:0, y:0, angle:0, speed:0, vx:0, vy:0,
    drift:false, driftTime:0, driftDir:0, driftCharge:0, boostTimer:0, boostTouchCooldown:0,
    wpIndex:2, lap:0, hintIndex:2, finished:false, place:0, raceScore:0,
    aiOffset:0, itemBoost:0, lastLapStamp:0,
    heldItem:null, rouletteItem:null, itemRoulette:0, itemUseCooldown:0,
    shieldTimer:0, spinTimer:0, slowTimer:0 };
}

const player = makeRacer('#3fa9f5', true);
const ai1 = makeRacer('#ff5c5c', false);
const ai2 = makeRacer('#5cff8a', false);
const ai3 = makeRacer('#ffd23f', false);
const racers = [player, ai1, ai2, ai3];

const MAX_SPEED = 4.6;
const MAX_SPEED_BOOST = 7.2;
const ACCEL = 0.09;
const BRAKE = 0.15;
const FRICTION = 0.02;
const OFFTRACK_FRICTION = 0.14;
const TURN_RATE = 0.045;
const NORMAL_GRIP = 0.22;
const DRIFT_GRIP = 0.065;
const OFFROAD_GRIP = 0.035;
const ENGINE_DRAG = 0.992;
const DRIFT_STEER = 1.55;
const KART_RADIUS = 16;
const KART_RADIUS2 = KART_RADIUS * 2;
const KART_RADIUS2_SQ = KART_RADIUS2 * KART_RADIUS2;
