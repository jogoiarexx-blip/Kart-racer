"use strict";

// ---------- CÂMERA ----------
let cameraMode = 'mode7'; // 'top' | 'mode7' — 3D por padrão
const HORIZON_Y = Math.round(H*0.38);
const BASE_FOCAL = 110;
const BASE_CAM_BEHIND = 76;
// O ponto de contato do kart com o chão precisa coincidir com a projeção do mundo.
// O kart é desenhado com centro em H-92 e a sombra toca o chão ~25 px abaixo.
const PLAYER_GROUND_Y = H - 67;
const BASE_CAM_HEIGHT = ((PLAYER_GROUND_Y - HORIZON_Y) * BASE_CAM_BEHIND) / BASE_FOCAL;
let currentFocal = BASE_FOCAL;
let currentCamBehind = BASE_CAM_BEHIND;
let currentCamHeight = BASE_CAM_HEIGHT;
let cameraShake=0;
let camAngleSmooth = null;
