import { solvePH, solvePS, solvePT, solvePx, solveTx } from 'iapws-if97';
import { KELVIN_OFFSET } from './constants';

export interface SaturationProperties {
  /** Saturation pressure [kPa] */
  p_kPa: number;
  /** Saturation temperature [K] */
  T_sat_K: number;
  /** Saturation temperature [°C] */
  T_sat_C: number;
  /** Saturated liquid specific enthalpy hf [kJ/kg] */
  hf_kJkg: number;
  /** Saturated vapor specific enthalpy hg [kJ/kg] */
  hg_kJkg: number;
  /** Latent heat of vaporization hfg = hg - hf [kJ/kg] */
  hfg_kJkg: number;
  /** Saturated liquid specific entropy sf [kJ/(kg·K)] */
  sf_kJkgK: number;
  /** Saturated vapor specific entropy sg [kJ/(kg·K)] */
  sg_kJkgK: number;
  /** Saturated liquid specific volume vf [m³/kg] */
  vf_m3kg: number;
  /** Saturated vapor specific volume vg [m³/kg] */
  vg_m3kg: number;
}

export interface SteamPointProperties {
  /** Pressure [kPa] */
  p_kPa: number;
  /** Temperature [K] */
  T_K: number;
  /** Temperature [°C] */
  T_C: number;
  /** Specific enthalpy [kJ/kg] */
  h_kJkg: number;
  /** Specific entropy [kJ/(kg·K)] */
  s_kJkgK: number;
  /** Specific volume [m³/kg] */
  v_m3kg: number;
  /** Vapor quality x [-] in [0, 1] for two-phase states, null for single-phase */
  quality: number | null;
}

/**
 * Compute saturation properties (liquid f and vapor g) at a given pressure p_kPa [kPa]
 * using IAPWS-IF97 Region 4 equations.
 */
export function getSaturationByPressure(p_kPa: number): SaturationProperties {
  const p_MPa = p_kPa / 1000;
  const satLiquid = solvePx(p_MPa, 0);
  const satVapor = solvePx(p_MPa, 1);

  return {
    p_kPa,
    T_sat_K: satLiquid.temperature,
    T_sat_C: satLiquid.temperature - KELVIN_OFFSET,
    hf_kJkg: satLiquid.enthalpy,
    hg_kJkg: satVapor.enthalpy,
    hfg_kJkg: satVapor.enthalpy - satLiquid.enthalpy,
    sf_kJkgK: satLiquid.entropy,
    sg_kJkgK: satVapor.entropy,
    vf_m3kg: satLiquid.specificVolume,
    vg_m3kg: satVapor.specificVolume,
  };
}

/**
 * Compute single-phase (subcooled liquid or superheated steam) properties
 * given pressure p_kPa [kPa] and temperature T_K [K] using IAPWS-IF97.
 */
export function getSteamByPT(p_kPa: number, T_K: number): SteamPointProperties {
  const p_MPa = p_kPa / 1000;
  const state = solvePT(p_MPa, T_K);
  return {
    p_kPa,
    T_K: state.temperature,
    T_C: state.temperature - KELVIN_OFFSET,
    h_kJkg: state.enthalpy,
    s_kJkgK: state.entropy,
    v_m3kg: state.specificVolume,
    quality: state.quality,
  };
}

/**
 * Compute water/steam state given pressure p_kPa [kPa] and specific entropy s_kJkgK [kJ/(kg·K)].
 * Automatically handles two-phase wet steam (Region 4) as well as single-phase (Regions 1 & 2).
 */
export function getSteamByPS(p_kPa: number, s_kJkgK: number): SteamPointProperties {
  const p_MPa = p_kPa / 1000;
  const state = solvePS(p_MPa, s_kJkgK);
  return {
    p_kPa,
    T_K: state.temperature,
    T_C: state.temperature - KELVIN_OFFSET,
    h_kJkg: state.enthalpy,
    s_kJkgK: state.entropy,
    v_m3kg: state.specificVolume,
    quality: state.quality,
  };
}

/**
 * Compute water/steam state given pressure p_kPa [kPa] and specific enthalpy h_kJkg [kJ/kg].
 */
export function getSteamByPH(p_kPa: number, h_kJkg: number): SteamPointProperties {
  const p_MPa = p_kPa / 1000;
  const state = solvePH(p_MPa, h_kJkg);
  return {
    p_kPa,
    T_K: state.temperature,
    T_C: state.temperature - KELVIN_OFFSET,
    h_kJkg: state.enthalpy,
    s_kJkgK: state.entropy,
    v_m3kg: state.specificVolume,
    quality: state.quality,
  };
}

export interface TsPoint {
  T_K: number;
  s_kJkgK: number;
}

/**
 * Generate the water/steam saturation dome curve (liquid line + critical point + vapor line)
 * on the (T, s) plane using IAPWS-IF97 saturation equations.
 */
export function getWaterSaturationDome(): TsPoint[] {
  const liquidBranch: TsPoint[] = [];
  const vaporBranch: TsPoint[] = [];
  // Temperatures from 285 K (~12 °C) up to near the critical temperature (647.096 K)
  const tempsK = [
    285, 300, 318.96, 340, 365, 390, 415, 440, 465, 490, 515, 537.09, 560, 585, 605, 625, 640,
    646.5,
  ];

  for (const T_K of tempsK) {
    const liq = solveTx(T_K, 0);
    const vap = solveTx(T_K, 1);
    liquidBranch.push({ T_K, s_kJkgK: liq.entropy });
    vaporBranch.push({ T_K, s_kJkgK: vap.entropy });
  }

  // Critical point of water (IAPWS-IF97: Tc = 647.096 K, sc ≈ 4.4120 kJ/(kg·K))
  const criticalPoint: TsPoint = { T_K: 647.096, s_kJkgK: 4.412 };

  return [...liquidBranch, criticalPoint, ...vaporBranch.reverse()];
}
