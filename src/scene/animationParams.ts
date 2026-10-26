import {
  DEFAULT_PARAMETERS,
  KELVIN_OFFSET,
  SLIDER_BOUNDS,
  solveCombinedCycle,
  temperatureToHexColor,
  type CombinedCycleResult,
  type ComponentId,
  type StatePointId,
} from '../physics';

export { temperatureToHexColor };

export type QualityMode = 'high' | 'low';
export type PipeColorMode = 'service' | 'temperature';
export type PipeServiceType = 'air' | 'flue-gas' | 'steam' | 'water';

export type ParticlePhaseStyle =
  | 'gas'
  | 'liquid-water'
  | 'wet-steam'
  | 'superheated-steam';

/**
 * Industrial pipe service colors per M3b specification:
 * - air: sky blue
 * - flue-gas: red hot exhaust gas
 * - steam: orange/red steam
 * - water: deep industrial water blue
 */
export const PIPE_SERVICE_COLORS: Record<PipeServiceType, string> = {
  air: '#38bdf8',
  'flue-gas': '#ef4444',
  steam: '#f97316',
  water: '#2563eb',
};

/**
 * Reference steam mass flow rate at default parameters [kg/s],
 * computed directly from the physics engine so nothing is hard-coded.
 */
const DEFAULT_STEAM_MDOT_KGS = solveCombinedCycle(DEFAULT_PARAMETERS).steamMassFlow_kgs;

/**
 * 3D positions of the 8 plant components.
 * Compressor, Gas Turbine, Steam Turbine, and Generator are aligned coaxially
 * along the single synchronous powertrain shaft at (y = 0.85, z = -1.0).
 */
export const COMPONENT_POSITIONS_3D: Record<ComponentId, [number, number, number]> = {
  compressor: [-6.8, 0.85, -1.0],
  combustor: [-4.5, 2.35, -1.0],
  gasTurbine: [-2.2, 0.85, -1.0],
  hrsg: [0.0, 1.85, -3.5],
  steamTurbine: [2.4, 0.85, -1.0],
  generator: [6.0, 0.85, -1.0],
  condenser: [2.4, 0.25, 2.2],
  pump: [-1.0, 0.25, 2.2],
};

export interface CameraShot {
  position: [number, number, number];
  target: [number, number, number];
}

export const CAMERA_OVERVIEW_SHOT: CameraShot = {
  position: [0.2, 7.2, 13.8],
  target: [0.0, 1.1, -0.8],
};

/**
 * Smooth camera close-up framing targets for each of the 8 components in Showcase / Focus mode.
 */
export const COMPONENT_CAMERA_SHOTS: Record<ComponentId, CameraShot> = {
  compressor: {
    position: [-8.6, 2.5, 2.6],
    target: [-6.8, 0.9, -1.0],
  },
  combustor: {
    position: [-4.5, 3.6, 2.2],
    target: [-4.5, 2.2, -1.0],
  },
  gasTurbine: {
    position: [-2.4, 2.45, 2.4],
    target: [-2.2, 0.95, -1.0],
  },
  hrsg: {
    position: [2.6, 3.4, 0.4],
    target: [0.0, 2.1, -3.5],
  },
  steamTurbine: {
    position: [2.4, 2.4, 2.5],
    target: [2.4, 0.9, -1.0],
  },
  generator: {
    position: [7.8, 2.5, 2.8],
    target: [6.0, 0.9, -1.0],
  },
  condenser: {
    position: [4.2, 1.8, 5.2],
    target: [2.4, 0.35, 2.2],
  },
  pump: {
    position: [-1.0, 1.6, 4.8],
    target: [-1.0, 0.3, 2.2],
  },
};

/**
 * Single visible powertrain shaft geometry parameters.
 */
export const POWERTRAIN_SHAFT = {
  y: 0.85,
  z: -1.0,
  xStart: -8.2,
  xEnd: 7.2,
  get length(): number {
    return this.xEnd - this.xStart;
  },
  get centerX(): number {
    return (this.xStart + this.xEnd) / 2;
  },
  /** Constant visual angular speed representing 3000 rpm (50 Hz) grid synchronization [rad/s] */
  syncAngularSpeedRadPerSec: 5.5,
} as const;

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
  service: PipeServiceType;
  serviceColorHex: string;
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

function classifyPipeService(stateId: StatePointId): PipeServiceType {
  if (stateId === 1 || stateId === 2) return 'air';
  if (stateId === 3 || stateId === 4 || stateId === 5) return 'flue-gas';
  if (stateId === 8 || stateId === 9) return 'steam';
  return 'water';
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
    stackTopPosition: [0.0, 4.45, -3.5],
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

  // 5. Pipe definitions with inlet -> outlet temperature gradients & service classification
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
        [-9.0, 0.85, -1.0],
        [-7.8, 0.85, -1.0],
        [-6.8, 0.85, -1.0],
      ],
    },
    {
      id: 'pipe-2-comp-to-comb',
      loop: 'gas',
      inletStateId: 1,
      outletStateId: 2,
      streamStateId: 2,
      waypoints: [
        [-6.1, 1.1, -1.0],
        [-5.4, 2.35, -1.0],
        [-4.5, 2.35, -1.0],
      ],
    },
    {
      id: 'pipe-3-comb-to-gt',
      loop: 'gas',
      inletStateId: 2,
      outletStateId: 3,
      streamStateId: 3,
      waypoints: [
        [-4.5, 2.35, -1.0],
        [-3.4, 2.35, -1.0],
        [-2.7, 1.1, -1.0],
      ],
    },
    {
      id: 'pipe-4-gt-to-hrsg',
      loop: 'gas',
      inletStateId: 3,
      outletStateId: 4,
      streamStateId: 4,
      waypoints: [
        [-1.5, 0.85, -1.0],
        [-0.8, 1.1, -2.3],
        [0.0, 1.2, -3.5],
      ],
    },
    {
      id: 'pipe-5-hrsg-stack',
      loop: 'gas',
      inletStateId: 4,
      outletStateId: 5,
      streamStateId: 5,
      waypoints: [
        [0.0, 2.2, -3.5],
        [0.0, 3.4, -3.5],
        [0.0, 4.45, -3.5],
      ],
    },
    {
      id: 'pipe-8-hrsg-to-st',
      loop: 'steam',
      inletStateId: 7,
      outletStateId: 8,
      streamStateId: 8,
      waypoints: [
        [0.0, 2.5, -3.5],
        [1.4, 1.85, -2.2],
        [2.4, 0.85, -1.0],
      ],
    },
    {
      id: 'pipe-9-st-to-cond',
      loop: 'steam',
      inletStateId: 8,
      outletStateId: 9,
      streamStateId: 9,
      waypoints: [
        [2.4, 0.85, -1.0],
        [2.4, 0.5, 0.6],
        [2.4, 0.25, 2.2],
      ],
    },
    {
      id: 'pipe-6-cond-to-pump',
      loop: 'steam',
      inletStateId: 9,
      outletStateId: 6,
      streamStateId: 6,
      waypoints: [
        [2.4, 0.25, 2.2],
        [0.7, 0.25, 2.2],
        [-1.0, 0.25, 2.2],
      ],
    },
    {
      id: 'pipe-7-pump-to-hrsg',
      loop: 'steam',
      inletStateId: 6,
      outletStateId: 7,
      streamStateId: 7,
      waypoints: [
        [-1.0, 0.25, 2.2],
        [-0.6, 0.55, -0.6],
        [0.0, 0.85, -3.5],
      ],
    },
  ];

  const pipes: PipeAnimationSegment[] = rawPipes.map((p) => {
    const inState = states[p.inletStateId];
    const outState = states[p.outletStateId];
    const streamState = states[p.streamStateId];
    const service = classifyPipeService(p.streamStateId);

    return {
      id: p.id,
      loop: p.loop,
      service,
      serviceColorHex: PIPE_SERVICE_COLORS[service],
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
