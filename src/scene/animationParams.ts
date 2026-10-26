import type {
  CombinedCycleResult,
  ComponentId,
  StatePoint,
  StatePointId,
} from '../physics';

export type QualityMode = 'high' | 'low';
export type PipeColorMode = 'service' | 'temperature';
export type PipeServiceType = 'air' | 'flue-gas' | 'steam' | 'water';
export type ParticleStyle =
  | 'gas'
  | 'liquid-water'
  | 'wet-steam'
  | 'superheated-steam';

/**
 * Standard industrial piping service color palette (M3b/M3c).
 */
export const PIPE_SERVICE_COLORS: Record<PipeServiceType, string> = {
  air: '#38bdf8',
  'flue-gas': '#ef4444',
  steam: '#f97316',
  water: '#2563eb',
};

/**
 * Single-shaft combined cycle arrangement (M3c Correction 1):
 * Steam turbine – Generator – Compressor – Combustor – Gas turbine → axial exhaust diffuser → HRSG.
 * Generator is driven from the cold end of the Compressor and coupled to the Steam Turbine.
 * Condenser sits beside/below the Steam Turbine exhaust; Feedwater Pump sits on the front auxiliary skid row.
 */
export const COMPONENT_POSITIONS_3D: Record<ComponentId, [number, number, number]> = {
  steamTurbine: [-8.6, 0.85, -0.8],
  generator: [-5.2, 0.85, -0.8],
  compressor: [-1.6, 0.85, -0.8],
  combustor: [0.8, 0.85, -0.8],
  gasTurbine: [3.2, 0.85, -0.8],
  hrsg: [7.6, 0.85, -0.8],
  condenser: [-8.6, 0.35, 2.5],
  pump: [-2.2, 0.35, 2.5],
};

/**
 * Single continuous synchronous shaft geometry (3000 rpm, 50 Hz grid-synchronized)
 * running from Steam Turbine (-8.6) -> Generator (-5.2) -> Compressor (-1.6) -> Combustor (0.8) -> Gas Turbine (3.2),
 * terminating before the axial exhaust diffuser (x = 4.1).
 */
export const POWERTRAIN_SHAFT = {
  startX: -9.8,
  endX: 4.0,
  centerX: -2.9,
  length: 13.8,
  y: 0.85,
  z: -0.8,
  syncAngularSpeedRadPerSec: 7.5,
} as const;

export interface CameraShot {
  position: [number, number, number];
  target: [number, number, number];
}

export const CAMERA_OVERVIEW_SHOT: CameraShot = {
  position: [-0.2, 7.6, 14.8],
  target: [-0.2, 1.1, 0.2],
};

/**
 * Pre-computed camera close-up positions and look-at targets for Showcase Mode zoom.
 */
export const COMPONENT_CAMERA_SHOTS: Record<ComponentId, CameraShot> = {
  steamTurbine: {
    position: [-8.6, 2.7, 3.6],
    target: [-8.6, 0.85, -0.8],
  },
  generator: {
    position: [-5.2, 2.6, 3.6],
    target: [-5.2, 0.85, -0.8],
  },
  compressor: {
    position: [0.2, 3.1, 7.2],
    target: [0.2, 1.65, -0.8],
  },
  combustor: {
    position: [0.8, 2.5, 3.4],
    target: [0.8, 0.95, -0.8],
  },
  gasTurbine: {
    position: [1.2, 3.2, 5.4],
    target: [1.0, 1.55, -0.8],
  },
  hrsg: {
    position: [7.6, 3.4, 5.2],
    target: [7.6, 2.1, -0.8],
  },
  condenser: {
    position: [-8.6, 2.2, 6.4],
    target: [-8.6, 0.45, 2.5],
  },
  pump: {
    position: [-2.2, 2.0, 5.8],
    target: [-2.2, 0.45, 2.5],
  },
};

export interface PipeAnimationSegment {
  id: string;
  loop: 'gas' | 'steam';
  service: PipeServiceType;
  serviceColorHex: string;
  inletStateId: StatePointId;
  outletStateId: StatePointId;
  inletT_K: number;
  outletT_K: number;
  inletColorHex: string;
  outletColorHex: string;
  massFlow_kgs: number;
  particleSpeed: number;
  particleStyle: ParticleStyle;
  waypoints: [number, number, number][];
  valvePosition?: [number, number, number];
}

export interface CombustorGlowParams {
  normalizedTit: number;
  emissiveColorHex: string;
  emissiveIntensity: number;
  pointLightIntensity: number;
}

export interface HrsgTubeBankParams {
  superheaterTemp_K: number;
  evaporatorTemp_K: number;
  economizerTemp_K: number;
  superheaterColorHex: string;
  evaporatorColorHex: string;
  economizerColorHex: string;
  superheaterGlow: number;
  evaporatorGlow: number;
  economizerGlow: number;
}

export interface StackPlumeParams {
  stackTemperature_K: number;
  stackTemperature_C: number;
  normalizedStackTemp: number;
  opacity: number;
  riseSpeed: number;
  colorHex: string;
  stackTopPosition: [number, number, number];
}

export interface CoolingTowerPlumeParams {
  condenserHeatRejection_MW: number;
  opacity: number;
  riseSpeed: number;
  towerTopPosition: [number, number, number];
}

export interface HeatShimmerParams {
  exhaustTemp_K: number;
  stackTemp_K: number;
  exhaustIntensity: number;
  stackIntensity: number;
  diffuserTopPosition: [number, number, number];
  stackTopPosition: [number, number, number];
}

export interface TemperatureLegendTick {
  T_K: number;
  T_C: number;
  labelK: string;
  labelC: string;
  colorHex: string;
}

export interface SceneAnimationParams {
  shaftAngularSpeedRadPerSec: number;
  combustorGlow: CombustorGlowParams;
  hrsgTubeBanks: HrsgTubeBankParams;
  stackPlume: StackPlumeParams;
  coolingTowerPlume: CoolingTowerPlumeParams;
  heatShimmer: HeatShimmerParams;
  pipes: PipeAnimationSegment[];
  legendTicks: TemperatureLegendTick[];
}

/**
 * Smooth piecewise-linear color interpolation from cold (288 K) to hot (1700 K).
 */
export function temperatureToHexColor(T_K: number): string {
  const minT = 288.15;
  const maxT = 1700.0;
  const clamped = Math.max(minT, Math.min(maxT, T_K));
  const u = (clamped - minT) / (maxT - minT);

  const stops: { u: number; r: number; g: number; b: number }[] = [
    { u: 0.0, r: 0x38, g: 0xbd, b: 0xf8 }, // Cold sky-blue (288 K)
    { u: 0.33, r: 0x34, g: 0xd3, b: 0x99 }, // Warm teal-green (~754 K)
    { u: 0.67, r: 0xfb, g: 0x92, b: 0x3c }, // Hot amber-orange (~1234 K)
    { u: 1.0, r: 0xef, g: 0x44, b: 0x44 }, // Peak flame crimson (1700 K)
  ];

  let lower = stops[0];
  let upper = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (u >= stops[i].u && u <= stops[i + 1].u) {
      lower = stops[i];
      upper = stops[i + 1];
      break;
    }
  }

  const span = upper.u - lower.u || 1;
  const localT = (u - lower.u) / span;
  const r = Math.round(lower.r + (upper.r - lower.r) * localT);
  const g = Math.round(lower.g + (upper.g - lower.g) * localT);
  const b = Math.round(lower.b + (upper.b - lower.b) * localT);

  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Determines particle visual style from physics fluid type and steam quality x.
 */
export function resolveParticleStyle(state: StatePoint): ParticleStyle {
  if (state.fluid === 'air' || state.fluid === 'gas') {
    return 'gas';
  }
  if (state.fluid === 'water') {
    return 'liquid-water';
  }
  if (state.quality !== null && state.quality < 1.0) {
    return 'wet-steam';
  }
  return 'superheated-steam';
}

const BASE_GAS_MASS_FLOW_KGS = 100.0;
const BASE_STEAM_MASS_FLOW_KGS = 13.03556283539533;
const BASE_PARTICLE_SPEED_UNITS = 0.48;

/**
 * Orthogonal (90-degree right-angle) pipe routes connecting all components in the M3c single-shaft layout.
 */
const PIPE_ROUTE_DEFINITIONS: {
  id: string;
  loop: 'gas' | 'steam';
  service: PipeServiceType;
  inletStateId: StatePointId;
  outletStateId: StatePointId;
  waypoints: [number, number, number][];
  valvePosition?: [number, number, number];
}[] = [
  {
    // 1. Elevated Air Intake Filter House louvers -> vertical silencer duct -> Compressor bellmouth -> Compressor HP discharge
    id: 'air-intake-to-comp',
    loop: 'gas',
    service: 'air',
    inletStateId: 1,
    outletStateId: 2,
    waypoints: [
      [-3.35, 3.32, -0.8],
      [-2.38, 3.32, -0.8],
      [-2.38, 0.85, -0.8],
      [-0.72, 0.85, -0.8],
    ],
  },
  {
    // 2. Compressor HP discharge -> Can-Annular Combustor cans -> Gas Turbine 4-stage expansion path
    id: 'comp-to-comb-to-gt',
    loop: 'gas',
    service: 'flue-gas',
    inletStateId: 2,
    outletStateId: 3,
    waypoints: [
      [-0.72, 0.85, -0.8],
      [0.05, 1.22, -0.8],
      [1.45, 1.22, -0.8],
      [2.32, 0.85, -0.8],
      [3.95, 0.85, -0.8],
    ],
  },
  {
    // 3. Gas Turbine exit -> Axial Exhaust Diffuser & Transition Hood -> HRSG Superheater inlet face
    id: 'gt-exhaust-to-hrsg',
    loop: 'gas',
    service: 'flue-gas',
    inletStateId: 4,
    outletStateId: 4,
    waypoints: [
      [3.95, 0.85, -0.8],
      [5.0, 1.15, -0.8],
      [6.05, 1.55, -0.8],
    ],
  },
  {
    // 4. HRSG internal gas path: Superheater (-X) -> Evaporator (mid) -> Economizer (+X) -> Exhaust Stack
    id: 'hrsg-gas-to-stack',
    loop: 'gas',
    service: 'flue-gas',
    inletStateId: 4,
    outletStateId: 5,
    waypoints: [
      [6.05, 1.55, -0.8],
      [7.55, 1.65, -0.8],
      [9.0, 1.75, -0.8],
      [9.0, 5.05, -0.8],
    ],
  },
  {
    // 5. Superheated Main Steam Line (Orthogonal overhead bridge):
    // Exits HRSG Superheater top header nozzle (x=6.55, y=3.45) -> rises to overhead pipe bridge (y=4.15) ->
    // turns 90° to rear pipe rack (z=-2.35) -> runs to Steam Turbine HP barrel (x=-7.95) -> drops into HP Steam Chest
    id: 'hrsg-superheater-to-st',
    loop: 'steam',
    service: 'steam',
    inletStateId: 8,
    outletStateId: 8,
    waypoints: [
      [6.55, 3.45, -0.8],
      [6.55, 4.15, -0.8],
      [6.55, 4.15, -2.35],
      [-7.95, 4.15, -2.35],
      [-7.95, 4.15, -0.8],
      [-7.95, 1.38, -0.8],
    ],
    valvePosition: [1.5, 4.15, -2.35],
  },
  {
    // 6. Steam Turbine LP Exhaust Hood (x=-9.25) -> Orthogonal 90° crossover trunk -> Condenser top steam dome neck
    id: 'st-exhaust-to-condenser',
    loop: 'steam',
    service: 'steam',
    inletStateId: 9,
    outletStateId: 9,
    waypoints: [
      [-9.25, 1.45, -0.8],
      [-9.25, 2.05, -0.8],
      [-9.25, 2.05, 2.5],
      [-9.25, 0.95, 2.5],
    ],
  },
  {
    // 7. Condenser hotwell outlet nozzle (x=-7.35, y=0.35) -> straight suction line -> Feedwater Pump axial suction flange (x=-2.85)
    id: 'condenser-to-pump',
    loop: 'steam',
    service: 'water',
    inletStateId: 6,
    outletStateId: 6,
    waypoints: [
      [-7.35, 0.35, 2.5],
      [-5.1, 0.35, 2.5],
      [-2.85, 0.35, 2.5],
    ],
    valvePosition: [-5.1, 0.35, 2.5],
  },
  {
    // 8. Feedwater Pump top discharge nozzle (x=-2.55) -> orthogonal run to HRSG Economizer inlet header (x=8.45) -> Economizer riser -> Steam Drum
    id: 'pump-to-hrsg-economizer',
    loop: 'steam',
    service: 'water',
    inletStateId: 7,
    outletStateId: 7,
    waypoints: [
      [-2.55, 0.72, 2.5],
      [-2.55, 1.15, 2.5],
      [8.45, 1.15, 2.5],
      [8.45, 1.15, 0.25],
      [8.45, 2.95, 0.25],
      [7.6, 3.85, -0.45],
    ],
    valvePosition: [3.2, 1.15, 2.5],
  },
];

/**
 * Pure mapping function that derives all 3D scene animation parameters from `CombinedCycleResult`.
 */
export function buildSceneAnimationParams(
  result: CombinedCycleResult,
  flowPlaying: boolean,
): SceneAnimationParams {
  const isActive = flowPlaying && result.ok;

  // Constant synchronous speed (3000 rpm, 50 Hz) when active; 0 when paused or invalid
  const shaftAngularSpeedRadPerSec = isActive
    ? POWERTRAIN_SHAFT.syncAngularSpeedRadPerSec
    : 0;

  // Combustor glow driven by T3_K (slider range 1100 K to 1700 K)
  const T3_K = result.states[3].T_K;
  const normalizedTit = Math.max(0, Math.min(1, (T3_K - 1100) / (1700 - 1100)));
  const combustorGlow: CombustorGlowParams = {
    normalizedTit,
    emissiveColorHex: temperatureToHexColor(T3_K),
    emissiveIntensity: 0.45 + normalizedTit * 1.45,
    pointLightIntensity: 0.9 + normalizedTit * 2.4,
  };

  // Correction 2: HRSG tube bank colors in gas flow order (Superheater -> Evaporator -> Economizer)
  // Scale gas temperature across the HRSG operating window (360 K stack to 820 K exhaust) so hot/mid/cool zones are clearly distinct
  const hrsgTempToHex = (T_K: number) => {
    const u = Math.max(0, Math.min(1, (T_K - 360) / (820 - 360)));
    return temperatureToHexColor(288.15 + u * (1700 - 288.15));
  };
  const T4_K = result.states[4].T_K;
  const T5_K = result.states[5].T_K;
  const T_evap_K = result.hrsg.T_gas_pinch_K;
  const hrsgTubeBanks: HrsgTubeBankParams = {
    superheaterTemp_K: T4_K,
    evaporatorTemp_K: T_evap_K,
    economizerTemp_K: T5_K,
    superheaterColorHex: hrsgTempToHex(T4_K),
    evaporatorColorHex: hrsgTempToHex(T_evap_K),
    economizerColorHex: hrsgTempToHex(T5_K),
    superheaterGlow: Math.max(0.35, Math.min(1.15, (T4_K - 600) / 320)),
    evaporatorGlow: Math.max(0.25, Math.min(0.85, (T_evap_K - 440) / 320)),
    economizerGlow: Math.max(0.18, Math.min(0.55, (T5_K - 320) / 320)),
  };

  // HRSG stack exhaust plume driven by T5_K
  const T5_C = T5_K - 273.15;
  const normalizedStackTemp = Math.max(0, Math.min(1, (T5_K - 340) / (650 - 340)));
  const stackPlume: StackPlumeParams = {
    stackTemperature_K: T5_K,
    stackTemperature_C: T5_C,
    normalizedStackTemp,
    opacity: result.ok ? 0.16 + normalizedStackTemp * 0.34 : 0.05,
    riseSpeed: isActive ? 0.5 + normalizedStackTemp * 0.75 : 0,
    colorHex: normalizedStackTemp > 0.55 ? '#cbd5e1' : '#94a3b8',
    stackTopPosition: [9.0, 4.85, -0.8],
  };

  // Cooling tower steam plume driven by real condenser heat rejection Q_cond from src/physics
  const qCond_MW = result.rankine.condenserHeatRejected_MW;
  const normCond = Math.max(0.15, Math.min(1, qCond_MW / 35.0));
  const coolingTowerPlume: CoolingTowerPlumeParams = {
    condenserHeatRejection_MW: qCond_MW,
    opacity: result.ok ? 0.22 + normCond * 0.32 : 0.05,
    riseSpeed: isActive ? 0.42 + normCond * 0.55 : 0,
    towerTopPosition: [-12.2, 3.1, 2.5],
  };

  // Heat shimmer above GT axial exhaust diffuser (T4_K) and HRSG stack (T5_K)
  const heatShimmer: HeatShimmerParams = {
    exhaustTemp_K: T4_K,
    stackTemp_K: T5_K,
    exhaustIntensity: isActive ? Math.max(0.2, Math.min(1, (T4_K - 650) / 400)) : 0,
    stackIntensity: isActive ? Math.max(0.15, Math.min(0.8, (T5_K - 350) / 300)) : 0,
    diffuserTopPosition: [5.0, 2.1, -0.8],
    stackTopPosition: [9.0, 5.1, -0.8],
  };

  // Correction 3: Separate normalization for gas and steam loops
  const pipes: PipeAnimationSegment[] = PIPE_ROUTE_DEFINITIONS.map((route) => {
    const inState = result.states[route.inletStateId];
    const outState = result.states[route.outletStateId];
    const massFlow = outState.mDot_kgs;
    const baseFlow =
      route.loop === 'gas' ? BASE_GAS_MASS_FLOW_KGS : BASE_STEAM_MASS_FLOW_KGS;
    const normalizedFlow = baseFlow > 0 ? massFlow / baseFlow : 0;

    return {
      id: route.id,
      loop: route.loop,
      service: route.service,
      serviceColorHex: PIPE_SERVICE_COLORS[route.service],
      inletStateId: route.inletStateId,
      outletStateId: route.outletStateId,
      inletT_K: inState.T_K,
      outletT_K: outState.T_K,
      inletColorHex: temperatureToHexColor(inState.T_K),
      outletColorHex: temperatureToHexColor(outState.T_K),
      massFlow_kgs: massFlow,
      particleSpeed: isActive ? BASE_PARTICLE_SPEED_UNITS * normalizedFlow : 0,
      particleStyle: resolveParticleStyle(outState),
      waypoints: route.waypoints,
      valvePosition: route.valvePosition,
    };
  });

  const tickTempsK = [288.15, 754.0, 1234.0, 1700.0];
  const legendTicks: TemperatureLegendTick[] = tickTempsK.map((T_K) => {
    const T_C = T_K - 273.15;
    return {
      T_K,
      T_C,
      labelK: `${Math.round(T_K)} K`,
      labelC: `${Math.round(T_C)} °C`,
      colorHex: temperatureToHexColor(T_K),
    };
  });

  return {
    shaftAngularSpeedRadPerSec,
    combustorGlow,
    hrsgTubeBanks,
    stackPlume,
    coolingTowerPlume,
    heatShimmer,
    pipes,
    legendTicks,
  };
}
