import { PLANT_COMPONENTS, SLIDER_BOUNDS } from './constants';
import { getWaterSaturationDome } from './steam';
import type { CombinedCycleResult, StatePoint, StatePointId } from './types';

export interface FormattedStatePoint {
  id: StatePointId;
  idStr: `${StatePointId}`;
  fluid: StatePoint['fluid'];
  T_K: string;
  T_C: string;
  p_kPa: string;
  h_kJkg: string;
  s_kJkgK: string;
  mDot_kgs: string;
  quality: string;
}

export function formatStatePoint(sp: StatePoint): FormattedStatePoint {
  return {
    id: sp.id,
    idStr: `${sp.id}`,
    fluid: sp.fluid,
    T_K: sp.T_K.toFixed(2),
    T_C: sp.T_C.toFixed(2),
    p_kPa: sp.p_kPa.toFixed(1),
    h_kJkg: sp.h_kJkg.toFixed(1),
    s_kJkgK: sp.s_kJkgK.toFixed(4),
    mDot_kgs: sp.mDot_kgs.toFixed(2),
    quality: sp.quality !== null ? sp.quality.toFixed(3) : '—',
  };
}

export interface TsPlotPoint {
  id: StatePointId;
  x: number;
  y: number;
  T_K: number;
  formatted: FormattedStatePoint;
  cycle: 'brayton' | 'rankine';
}

export interface TsDiagramViewModel {
  viewBox: string;
  width: number;
  height: number;
  padLeft: number;
  padRight: number;
  padTop: number;
  padBottom: number;
  domePath: string;
  braytonPath: string;
  rankinePath: string;
  points: TsPlotPoint[];
  xTicks: Array<{ x: number; label: string }>;
  yTicks: Array<{ y: number; label: string }>;
}

/**
 * Compute all SVG paths, axis ticks, and point coordinates for the T-s diagram
 * purely from CombinedCycleResult.
 */
export function buildTsDiagramViewModel(result: CombinedCycleResult): TsDiagramViewModel {
  const width = 580;
  const height = 340;
  const padLeft = 54;
  const padRight = 24;
  const padTop = 24;
  const padBottom = 44;

  const sMin = 0.0;
  const sMax = 9.0;
  const tMin = 250;
  const tMax = 1750;

  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const mapX = (s: number) => padLeft + ((s - sMin) / (sMax - sMin)) * plotW;
  const mapY = (T: number) => padTop + (1 - (T - tMin) / (tMax - tMin)) * plotH;

  const domePts = getWaterSaturationDome();
  const domePath = domePts
    .map(
      (pt, i) => `${i === 0 ? 'M' : 'L'} ${mapX(pt.s_kJkgK).toFixed(1)} ${mapY(pt.T_K).toFixed(1)}`,
    )
    .join(' ');

  const { states, hrsg } = result;
  const braytonIds: StatePointId[] = [1, 2, 3, 4, 5];
  const braytonPath = [
    ...braytonIds.map(
      (id, i) =>
        `${i === 0 ? 'M' : 'L'} ${mapX(states[id].s_kJkgK).toFixed(1)} ${mapY(states[id].T_K).toFixed(1)}`,
    ),
    `L ${mapX(states[1].s_kJkgK).toFixed(1)} ${mapY(states[1].T_K).toFixed(1)}`,
  ].join(' ');

  const rankineCoords: Array<{ s: number; T: number }> = [
    { s: states[6].s_kJkgK, T: states[6].T_K },
    { s: states[7].s_kJkgK, T: states[7].T_K },
    { s: hrsg.sf_boiler_kJkgK, T: hrsg.T_sat_K },
    { s: hrsg.sg_boiler_kJkgK, T: hrsg.T_sat_K },
    { s: states[8].s_kJkgK, T: states[8].T_K },
    { s: states[9].s_kJkgK, T: states[9].T_K },
    { s: states[6].s_kJkgK, T: states[6].T_K },
  ];
  const rankinePath = rankineCoords
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${mapX(pt.s).toFixed(1)} ${mapY(pt.T).toFixed(1)}`)
    .join(' ');

  const allIds: StatePointId[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const points: TsPlotPoint[] = allIds.map((id) => {
    const sp = states[id];
    return {
      id,
      x: Number(mapX(sp.s_kJkgK).toFixed(1)),
      y: Number(mapY(sp.T_K).toFixed(1)),
      T_K: sp.T_K,
      formatted: formatStatePoint(sp),
      cycle: id <= 5 ? 'brayton' : 'rankine',
    };
  });

  const sTickValues = [0, 2, 4, 6, 8];
  const xTicks = sTickValues.map((val) => ({
    x: Number(mapX(val).toFixed(1)),
    label: val.toFixed(1),
  }));

  const tTickValues = [300, 600, 900, 1200, 1500];
  const yTicks = tTickValues.map((val) => ({
    y: Number(mapY(val).toFixed(1)),
    label: val.toFixed(0),
  }));

  return {
    viewBox: `0 0 ${width} ${height}`,
    width,
    height,
    padLeft,
    padRight,
    padTop,
    padBottom,
    domePath,
    braytonPath,
    rankinePath,
    points,
    xTicks,
    yTicks,
  };
}

export interface CycleViewModel {
  sliders: {
    T3_min: number;
    T3_max: number;
    T3_step: number;
    T3_value: number;
    T3_displayK: string;
    T3_displayC: string;
    rp_min: number;
    rp_max: number;
    rp_step: number;
    rp_value: number;
    rp_display: string;
  };
  fixedParams: {
    etaComp: string;
    etaGt: string;
    etaSt: string;
    etaPump: string;
    etaComb: string;
    lhvKJkg: string;
    lhvMJkg: string;
    steamPressMPa: string;
    steamTempC: string;
    condPressKPa: string;
    pinchK: string;
    airMassFlow: string;
  };
  summary: {
    gtPowerMW: string;
    stPowerMW: string;
    netPowerMW: string;
    heatInputMW: string;
    gtEfficiencyPct: string;
    stEfficiencyPct: string;
    hrsgEfficiencyPct: string;
    ccEfficiencyPct: string;
    fuelMassFlow: string;
    steamMassFlow: string;
    pinchTempGasK: string;
    satTempSteamK: string;
  };
  formattedStates: Record<StatePointId, FormattedStatePoint>;
  componentsMeta: typeof PLANT_COMPONENTS;
}

/**
 * Format all numeric outputs from CombinedCycleResult into display strings
 * so UI components never contain hardcoded numbers.
 */
export function buildCycleViewModel(result: CombinedCycleResult): CycleViewModel {
  const { parameters, states } = result;
  const formattedStates = {
    1: formatStatePoint(states[1]),
    2: formatStatePoint(states[2]),
    3: formatStatePoint(states[3]),
    4: formatStatePoint(states[4]),
    5: formatStatePoint(states[5]),
    6: formatStatePoint(states[6]),
    7: formatStatePoint(states[7]),
    8: formatStatePoint(states[8]),
    9: formatStatePoint(states[9]),
  };

  return {
    sliders: {
      T3_min: SLIDER_BOUNDS.T3_K.min,
      T3_max: SLIDER_BOUNDS.T3_K.max,
      T3_step: SLIDER_BOUNDS.T3_K.step,
      T3_value: parameters.T3_K,
      T3_displayK: parameters.T3_K.toFixed(0),
      T3_displayC: (parameters.T3_K - 273.15).toFixed(0),
      rp_min: SLIDER_BOUNDS.rp.min,
      rp_max: SLIDER_BOUNDS.rp.max,
      rp_step: SLIDER_BOUNDS.rp.step,
      rp_value: parameters.rp,
      rp_display: parameters.rp.toFixed(1),
    },
    fixedParams: {
      etaComp: (parameters.eta_comp * 100).toFixed(0),
      etaGt: (parameters.eta_gt * 100).toFixed(0),
      etaSt: (parameters.eta_st * 100).toFixed(0),
      etaPump: (parameters.eta_pump * 100).toFixed(0),
      etaComb: (parameters.eta_comb * 100).toFixed(0),
      lhvKJkg: parameters.lhv_kJkg.toFixed(0),
      lhvMJkg: (parameters.lhv_kJkg / 1000).toFixed(1),
      steamPressMPa: (parameters.p_steam_kPa / 1000).toFixed(1),
      steamTempC: (parameters.T_steam_K - 273.15).toFixed(0),
      condPressKPa: parameters.p_cond_kPa.toFixed(0),
      pinchK: parameters.pinch_K.toFixed(0),
      airMassFlow: parameters.mDot_air_kgs.toFixed(0),
    },
    summary: {
      gtPowerMW: result.gtPower_MW.toFixed(2),
      stPowerMW: result.stPower_MW.toFixed(2),
      netPowerMW: result.netPower_MW.toFixed(2),
      heatInputMW: result.heatInput_MW.toFixed(2),
      gtEfficiencyPct: (result.gtEfficiency * 100).toFixed(2),
      stEfficiencyPct: (result.stEfficiency * 100).toFixed(2),
      hrsgEfficiencyPct: (result.hrsgEfficiency * 100).toFixed(2),
      ccEfficiencyPct: (result.combinedEfficiency * 100).toFixed(2),
      fuelMassFlow: result.fuelMassFlow_kgs.toFixed(2),
      steamMassFlow: result.steamMassFlow_kgs.toFixed(2),
      pinchTempGasK: result.hrsg.T_gas_pinch_K.toFixed(2),
      satTempSteamK: result.hrsg.T_sat_K.toFixed(2),
    },
    formattedStates,
    componentsMeta: PLANT_COMPONENTS,
  };
}
