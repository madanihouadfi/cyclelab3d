import {
  DEFAULT_PARAMETERS,
  KELVIN_OFFSET,
  SLIDER_BOUNDS,
   solveCombinedCycle,
  type CombinedCycleResult,
  type ComponentId,
  type StatePointId,
} from '../physics';

export type QualityMode = 'high' | 'low';

export type ParticlePhaseStyle =
  | 'gas'
  | 'liquid-water'
  | 'wet-steam'
  | 'superheated-steam';

/**
 * Reference steam mass flow rate at default parameters [kg/s],
 * computed directly from the physics engine so nothing is hard-coded.
 */
const DEFAULT_STEAM_MDOT_KGS = solveCombinedCycle(DEFAULT_PARAMETERS).steamMassFlow_kgs;

/**
 * 3D positions of the 8 plant components.
 * Compressor, Gas Turbine, Steam Turbine, and Generator are aligned coaxially
 * along the single synchronous powertrain shaft at (y = 0.8, z = -1.0).
 */
export const COMPONENT_POSITIONS_3D: Record<ComponentId, [number, number, number]> = {
  compressor: [-6.6, 0.8, -1.0],
  combustor: [-4.4, 2.35, -1.0],
  gasTurbine: [-2.2, 0.8, -1.0],
  hrsg: [0.0, 1.5, -3.3],
  steamTurbine: [2.4, 0.8, -1.0],
  generator: [5.8, 0.8, -1.0],
  condenser: [2.4, 0.15, 2.1],
  pump: [-0.8, 0.15, 2.1],
};

/**
 * Single visible powertrain shaft geometry parameters.
 */
export const POWERTRAIN_SHAFT = {
  y: 0.8,
  z: -1.0,
  xStart: -7.9,
  xEnd: 6.9,
  get length(): number {
    return this.xEnd - this.xStart;
  },
  get centerX(): number {
    return (this.xStart + this.xEnd) / 2;
  },
  /** Constant visual angular speed representing 3000 rpm (50 Hz) grid synchronization [rad/s] */
  syncAngularSpeedRadPerSec: 5.5,
} as const;

/**
 * Map a temperature T_K [K] between ambient T1 (288.15 K) and max TIT (1700 K)
 * to an RGB hex color string on a cold-blue -> cyan -> yellow -> orange -> red scale.
 */
export function temperatureToHexColor(T_K: number): string {
  const minT = DEFAULT_PARAMETERS.T1_K;
  const maxT = SLIDER_BOUNDS.T3_K.max;
  const u = Math.max(0, Math.min(1, (T_K - minT) / (maxT - minT)));

  let r = 0;
  let g = 0;
  let b = 0;

  if (u < 0.25) {
    const k = u / 0.25;
    r = Math.round(30 + k * 10);
    g = Math.round(130 + k * 90);
    b = Math.round(245 - k * 20);
  } else if (u < 0.5) {
    const k = (u - 0.25) / 0.25;
    r = Math.round(40 + k * 205);
    g = Math.round(220 - k * 20);
    b = Math.round(225 - k * 175);
  } else if (u < 0.75) {
    const k = (u - 0.5) / 0.25;
    r = Math.round(245 + k * 10);
    g = Math.round(200 - k * 90);
    b = Math.round(50 - k * 20);
  } else {
    const k = (u - 0.75) / 0.25;
    r = 255;
    g = Math.round(110 - k * 65);
    b = Math.round(30 - k * 10);
  }

  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export interface LegendTick {
  fraction: number;
  labelK: string;
  labelC: string;
  colorHex: string;
}

/**
 * Build temperature legend ticks in both K and °C from physics bounds.
 */
export function getTemperatureLegendTicks(): LegendTick[] {
  const minT = DEFAULT_PARAMETERS.T1_K;
  const maxT = SLIDER_BOUNDS.T3_K.max;
  const fractions = [0, 0.33, 0.67, 1.0];

  return fractions.map((f) => {
    const T_K = minT + f * (maxT - minT);
    const T_C = T_K - KELVIN_OFFSET;
    return {
      fraction: f,
      labelK: `${T_K.toFixed(0)} K`,
      labelC: `${T_C.toFixed(0)} °C`,
      colorHex: temperatureToHexColor(T_K),
    };
  });
}

export interface PipeAnimationSegment {
  id: string;
  loop: 'gas' | 'steam';
  inletStateId: StatePointId;
  outletStateId: StatePointId;
  inletT_K: number;
  outletT_K: number;
  inletColorHex: string;
  outletColorHex: string;
  waypoints: Array<[number, number, number]>;
  /** Mass flow rate from physics [kg/s] */
  mDot_kgs: number;
  /** Loop-normalized particle speed [path-fractions / s] */
  particleSpeed: number;
  /** Fluid phase visual style */
  particleStyle: ParticlePhaseStyle;
  /** Steam quality x in [0, 1] when wet steam, null otherwise */
  vaporQuality: number | null;
}

export interface CombustorGlowParams {
  normalizedTit: number;
  coreColorHex: string;
  emissiveIntensity: number;
  haloOpacity: number;
  flameScale: number;
  pointLightIntensity: number;
}

export interface StackPlumeParams {
  stackTopPosition: [number, number, number];
  T5_K: number;
  normalizedStackTemp: number;
  riseSpeed: number;
  opacity: number;
  colorHex: string;
}

export interface SceneAnimationParams {
  shaftAngularSpeedRadPerSec: number;
  combustorGlow: CombustorGlowParams;
  stackPlume: StackPlumeParams;
  pipes: PipeAnimationSegment[];
  legendTicks: LegendTick[];
}

function classifyParticleStyle(
  fluid: 'air' | 'gas' | 'water' | 'steam',
  quality: number | null,
): ParticlePhaseStyle {
  if (fluid === 'water') {
    return 'liquid-water';
  }
  if (fluid === 'steam') {
    return quality !== null && quality < 0.999 ? 'wet-steam' : 'superheated-steam';
  }
  return 'gas';
}

/**
 * Compute all 3D scene animation parameters strictly from CombinedCycleResult.
 */
export function buildSceneAnimationParams(
  result: CombinedCycleResult,
  flowPlaying: boolean,
): SceneAnimationParams {
  const { states, parameters, ok } = result;
  const active = flowPlaying && ok;

  // 1. Constant synchronous shaft speed (3000 rpm / 50 Hz visual representation); stops only when paused or invalid
  const shaftAngularSpeedRadPerSec = active ? POWERTRAIN_SHAFT.syncAngularSpeedRadPerSec : 0;

  // 2. Combustor flame glow proportional to T3 slider
  const titMin = SLIDER_BOUNDS.T3_K.min;
  const titMax = SLIDER_BOUNDS.T3_K.max;
  const normalizedTit = Math.max(
    0,
    Math.min(1, (parameters.T3_K - titMin) / (titMax - titMin)),
  );
  const combustorGlow: CombustorGlowParams = {
    normalizedTit,
    coreColorHex: temperatureToHexColor(parameters.T3_K),
    emissiveIntensity: 0.4 + 1.5 * normalizedTit,
    haloOpacity: 0.22 + 0.48 * normalizedTit,
    flameScale: 0.85 + 0.35 * normalizedTit,
    pointLightIntensity: 0.8 + 2.6 * normalizedTit,
  };

  // 3. HRSG stack exhaust plume proportional to stack temperature T5
  const T5_K = states[5].T_K;
  const normalizedStackTemp = Math.max(
    0.08,
    Math.min(1, (T5_K - parameters.T1_K) / (650 - parameters.T1_K)),
  );
  const stackPlume: StackPlumeParams = {
    stackTopPosition: [0.0, 3.85, -3.3],
    T5_K,
    normalizedStackTemp,
    riseSpeed: active ? 0.35 + 0.85 * normalizedStackTemp : 0,
    opacity: 0.14 + 0.42 * normalizedStackTemp,
    colorHex: temperatureToHexColor(T5_K),
  };

  // 4. Separate mass-flow normalization for Gas loop vs Steam loop
  const gasSpeedFactor = active
    ? (states[1].mDot_kgs / DEFAULT_PARAMETERS.mDot_air_kgs) * 0.48
    : 0;
  const steamSpeedFactor =
    active && DEFAULT_STEAM_MDOT_KGS > 0
      ? (states[8].mDot_kgs / DEFAULT_STEAM_MDOT_KGS) * 0.48
      : 0;

  // 5. Pipe definitions with inlet -> outlet temperature gradients
  const rawPipes: Array<{
    id: string;
    loop: 'gas' | 'steam';
    inletStateId: StatePointId;
    outletStateId: StatePointId;
    streamStateId: StatePointId;
    waypoints: Array<[number, number, number]>;
  }> = [
    {
      id: 'pipe-1-air-inlet',
      loop: 'gas',
      inletStateId: 1,
      outletStateId: 1,
      streamStateId: 1,
      waypoints: [
        [-8.8, 0.8, -1.0],
        [-7.6, 0.8, -1.0],
        [-6.6, 0.8, -1.0],
      ],
    },
    {
      id: 'pipe-2-comp-to-comb',
      loop: 'gas',
      inletStateId: 1,
      outletStateId: 2,
      streamStateId: 2,
      waypoints: [
        [-6.6, 0.8, -1.0],
        [-5.6, 2.35, -1.0],
        [-4.4, 2.35, -1.0],
      ],
    },
    {
      id: 'pipe-3-comb-to-gt',
      loop: 'gas',
      inletStateId: 2,
      outletStateId: 3,
      streamStateId: 3,
      waypoints: [
        [-4.4, 2.35, -1.0],
        [-3.2, 2.35, -1.0],
        [-2.2, 0.8, -1.0],
      ],
    },
    {
      id: 'pipe-4-gt-to-hrsg',
      loop: 'gas',
      inletStateId: 3,
      outletStateId: 4,
      streamStateId: 4,
      waypoints: [
        [-2.2, 0.8, -1.0],
        [-1.2, 0.9, -2.3],
        [0.0, 1.0, -3.3],
      ],
    },
    {
      id: 'pipe-5-hrsg-stack',
      loop: 'gas',
      inletStateId: 4,
      outletStateId: 5,
      streamStateId: 5,
      waypoints: [
        [0.0, 1.8, -3.3],
        [0.0, 2.9, -3.3],
        [0.0, 3.85, -3.3],
      ],
    },
    {
      id: 'pipe-8-hrsg-to-st',
      loop: 'steam',
      inletStateId: 7,
      outletStateId: 8,
      streamStateId: 8,
      waypoints: [
        [0.0, 2.2, -3.3],
        [1.4, 1.6, -2.1],
        [2.4, 0.8, -1.0],
      ],
    },
    {
      id: 'pipe-9-st-to-cond',
      loop: 'steam',
      inletStateId: 8,
      outletStateId: 9,
      streamStateId: 9,
      waypoints: [
        [2.4, 0.8, -1.0],
        [2.4, 0.45, 0.6],
        [2.4, 0.15, 2.1],
      ],
    },
    {
      id: 'pipe-6-cond-to-pump',
      loop: 'steam',
      inletStateId: 9,
      outletStateId: 6,
      streamStateId: 6,
      waypoints: [
        [2.4, 0.15, 2.1],
        [0.8, 0.15, 2.1],
        [-0.8, 0.15, 2.1],
      ],
    },
    {
      id: 'pipe-7-pump-to-hrsg',
      loop: 'steam',
      inletStateId: 6,
      outletStateId: 7,
      streamStateId: 7,
      waypoints: [
        [-0.8, 0.15, 2.1],
        [-0.5, 0.4, -0.6],
        [0.0, 0.7, -3.3],
      ],
    },
  ];

  const pipes: PipeAnimationSegment[] = rawPipes.map((p) => {
    const inState = states[p.inletStateId];
    const outState = states[p.outletStateId];
    const streamState = states[p.streamStateId];

    return {
      id: p.id,
      loop: p.loop,
      inletStateId: p.inletStateId,
      outletStateId: p.outletStateId,
      inletT_K: inState.T_K,
      outletT_K: outState.T_K,
      inletColorHex: temperatureToHexColor(inState.T_K),
      outletColorHex: temperatureToHexColor(outState.T_K),
      waypoints: p.waypoints,
      mDot_kgs: streamState.mDot_kgs,
      particleSpeed: p.loop === 'gas' ? gasSpeedFactor : steamSpeedFactor,
      particleStyle: classifyParticleStyle(streamState.fluid, streamState.quality),
      vaporQuality: streamState.quality,
    };
  });

  return {
    shaftAngularSpeedRadPerSec,
    combustorGlow,
    stackPlume,
    pipes,
    legendTicks: getTemperatureLegendTicks(),
  };
}
