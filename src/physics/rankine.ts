import { KELVIN_OFFSET } from './constants';
import { calcIdealGasEntropyChange } from './brayton';
import { getSaturationByPressure, getSteamByPH, getSteamByPS, getSteamByPT } from './steam';
import type { CycleParameters, HrsgResult, RankineCycleResult, StatePoint } from './types';

/**
 * Compute the water/steam specific states (6, 7, 8, 9) per unit mass before scaling by ṁ_s.
 */
export function calcUnitRankineStates(params: CycleParameters): {
  satCond: ReturnType<typeof getSaturationByPressure>;
  satBoiler: ReturnType<typeof getSaturationByPressure>;
  T6_K: number;
  h6_kJkg: number;
  s6_kJkgK: number;
  h7s_kJkg: number;
  T7_K: number;
  h7_kJkg: number;
  s7_kJkgK: number;
  T8_K: number;
  h8_kJkg: number;
  s8_kJkgK: number;
  h9s_kJkg: number;
  T9_K: number;
  h9_kJkg: number;
  s9_kJkgK: number;
  x9: number | null;
} {
  // State 6: Saturated liquid exiting condenser at p_cond_kPa
  const satCond = getSaturationByPressure(params.p_cond_kPa);
  const T6_K = satCond.T_sat_K;
  const h6_kJkg = satCond.hf_kJkg;
  const s6_kJkgK = satCond.sf_kJkgK;

  // State 7: Feedwater pump outlet at boiler pressure p_steam_kPa
  const isenPumpOut = getSteamByPS(params.p_steam_kPa, s6_kJkgK);
  const h7s_kJkg = isenPumpOut.h_kJkg;
  const h7_kJkg = h6_kJkg + (h7s_kJkg - h6_kJkg) / params.eta_pump;
  const actualPumpOut = getSteamByPH(params.p_steam_kPa, h7_kJkg);
  const T7_K = actualPumpOut.T_K;
  const s7_kJkgK = actualPumpOut.s_kJkgK;

  // Boiler drum saturation state at p_steam_kPa
  const satBoiler = getSaturationByPressure(params.p_steam_kPa);

  // State 8: Superheated live steam leaving HRSG at (p_steam_kPa, T_steam_K)
  const liveSteam = getSteamByPT(params.p_steam_kPa, params.T_steam_K);
  const T8_K = liveSteam.T_K;
  const h8_kJkg = liveSteam.h_kJkg;
  const s8_kJkgK = liveSteam.s_kJkgK;

  // State 9: Steam turbine exhaust at condenser pressure p_cond_kPa
  const isenStOut = getSteamByPS(params.p_cond_kPa, s8_kJkgK);
  const h9s_kJkg = isenStOut.h_kJkg;
  const h9_kJkg = h8_kJkg - params.eta_st * (h8_kJkg - h9s_kJkg);
  const actualStOut = getSteamByPH(params.p_cond_kPa, h9_kJkg);
  const T9_K = actualStOut.T_K;
  const s9_kJkgK = actualStOut.s_kJkgK;
  const x9 = actualStOut.quality;

  return {
    satCond,
    satBoiler,
    T6_K,
    h6_kJkg,
    s6_kJkgK,
    h7s_kJkg,
    T7_K,
    h7_kJkg,
    s7_kJkgK,
    T8_K,
    h8_kJkg,
    s8_kJkgK,
    h9s_kJkg,
    T9_K,
    h9_kJkg,
    s9_kJkgK,
    x9,
  };
}

/**
 * Solve the single-pressure HRSG energy balance with pinch point (Law 7)
 * and the bottoming Rankine steam cycle (Law 6).
 */
export function solveHrsgAndRankine(
  params: CycleParameters,
  state1: StatePoint,
  state4: StatePoint,
): {
  hrsg: HrsgResult;
  rankine: RankineCycleResult;
} {
  const unit = calcUnitRankineStates(params);

  // Law 7: Evaporator pinch point constraint
  // ΔT_pinch = T_g,pinch - T_sat  =>  T_g,pinch = T_sat + ΔT_pinch
  const T_sat_K = unit.satBoiler.T_sat_K;
  const T_gas_pinch_K = T_sat_K + params.pinch_K;

  // Evaporator + Superheater energy balance:
  // ṁ_g · cp_g · (T4 - T_g,pinch) = ṁ_s · (h8 - hf_boiler)
  const mDot_g = state4.mDot_kgs;
  const deltaH_evap_sh = unit.h8_kJkg - unit.satBoiler.hf_kJkg;
  const rawSteamMassFlow_kgs =
    (mDot_g * params.cp_gas_kJkgK * (state4.T_K - T_gas_pinch_K)) / deltaH_evap_sh;
  const steamMassFlow_kgs = Math.max(0, rawSteamMassFlow_kgs);

  // Overall HRSG energy balance (Economizer + Evaporator + Superheater):
  // ṁ_g · cp_g · (T4 - T5) = ṁ_s · (h8 - h7)
  const q_in_steam_kJkg = unit.h8_kJkg - unit.h7_kJkg;
  const qHrsg_kW = steamMassFlow_kgs * q_in_steam_kJkg;
  const qHrsg_MW = qHrsg_kW / 1000;

  const deltaT_gas_total = qHrsg_kW / (mDot_g * params.cp_gas_kJkgK);
  const T5_K = state4.T_K - deltaT_gas_total;
  const p5_kPa = state4.p_kPa;
  const h5_kJkg = state4.h_kJkg - params.cp_gas_kJkgK * (state4.T_K - T5_K);
  const s5_kJkgK =
    state4.s_kJkgK +
    calcIdealGasEntropyChange(
      state4.T_K,
      state4.p_kPa,
      Math.max(T5_K, 100),
      p5_kPa,
      params.cp_gas_kJkgK,
      params.k_gas,
    );

  const state5: StatePoint = {
    id: 5,
    fluid: 'gas',
    T_K: T5_K,
    T_C: T5_K - KELVIN_OFFSET,
    p_kPa: p5_kPa,
    h_kJkg: h5_kJkg,
    s_kJkgK: s5_kJkgK,
    mDot_kgs: mDot_g,
    quality: null,
  };

  // HRSG heat recovery effectiveness η_HRSG = Q_HRSG / [Q_in · (1 - η_GT)] = (h4 - h5) / (h4 - h1)
  const availableExhaustEnthalpy = state4.h_kJkg - state1.h_kJkg;
  const hrsgEfficiency =
    availableExhaustEnthalpy > 0 ? (state4.h_kJkg - state5.h_kJkg) / availableExhaustEnthalpy : 0;

  const hrsg: HrsgResult = {
    T_sat_K,
    T_sat_C: unit.satBoiler.T_sat_C,
    hf_boiler_kJkg: unit.satBoiler.hf_kJkg,
    hg_boiler_kJkg: unit.satBoiler.hg_kJkg,
    sf_boiler_kJkgK: unit.satBoiler.sf_kJkgK,
    sg_boiler_kJkgK: unit.satBoiler.sg_kJkgK,
    T_gas_pinch_K,
    pinchDiff_K: T_gas_pinch_K - T_sat_K,
    superheaterApproach_K: state4.T_K - unit.T8_K,
    economizerApproach_K: T5_K - unit.T7_K,
    steamMassFlow_kgs,
    state5,
    qHrsg_MW,
    hrsgEfficiency,
  };

  // Build Steam StatePoints 6, 7, 8, 9
  const state6: StatePoint = {
    id: 6,
    fluid: 'water',
    T_K: unit.T6_K,
    T_C: unit.T6_K - KELVIN_OFFSET,
    p_kPa: params.p_cond_kPa,
    h_kJkg: unit.h6_kJkg,
    s_kJkgK: unit.s6_kJkgK,
    mDot_kgs: steamMassFlow_kgs,
    quality: 0,
  };

  const state7: StatePoint = {
    id: 7,
    fluid: 'water',
    T_K: unit.T7_K,
    T_C: unit.T7_K - KELVIN_OFFSET,
    p_kPa: params.p_steam_kPa,
    h_kJkg: unit.h7_kJkg,
    s_kJkgK: unit.s7_kJkgK,
    mDot_kgs: steamMassFlow_kgs,
    quality: null,
  };

  const state8: StatePoint = {
    id: 8,
    fluid: 'steam',
    T_K: unit.T8_K,
    T_C: unit.T8_K - KELVIN_OFFSET,
    p_kPa: params.p_steam_kPa,
    h_kJkg: unit.h8_kJkg,
    s_kJkgK: unit.s8_kJkgK,
    mDot_kgs: steamMassFlow_kgs,
    quality: null,
  };

  const state9: StatePoint = {
    id: 9,
    fluid: 'steam',
    T_K: unit.T9_K,
    T_C: unit.T9_K - KELVIN_OFFSET,
    p_kPa: params.p_cond_kPa,
    h_kJkg: unit.h9_kJkg,
    s_kJkgK: unit.s9_kJkgK,
    mDot_kgs: steamMassFlow_kgs,
    quality: unit.x9,
  };

  const w_pump_kJkg = unit.h7_kJkg - unit.h6_kJkg;
  const w_st_kJkg = unit.h8_kJkg - unit.h9_kJkg;
  const q_out_cond_kJkg = unit.h9_kJkg - unit.h6_kJkg;

  const pumpPower_MW = (steamMassFlow_kgs * w_pump_kJkg) / 1000;
  const stGrossPower_MW = (steamMassFlow_kgs * w_st_kJkg) / 1000;
  const stNetPower_MW = stGrossPower_MW - pumpPower_MW;
  const condenserHeatRejected_MW = (steamMassFlow_kgs * q_out_cond_kJkg) / 1000;

  // Law 6: Rankine cycle thermal efficiency η = (w_t - w_p) / q_in
  const stEfficiency = (w_st_kJkg - w_pump_kJkg) / q_in_steam_kJkg;

  const rankine: RankineCycleResult = {
    state6,
    state7,
    state8,
    state9,
    h7s_kJkg: unit.h7s_kJkg,
    h9s_kJkg: unit.h9s_kJkg,
    w_pump_kJkg,
    w_st_kJkg,
    q_in_steam_kJkg,
    q_out_cond_kJkg,
    pumpPower_MW,
    stGrossPower_MW,
    stNetPower_MW,
    condenserHeatRejected_MW,
    stEfficiency,
  };

  return { hrsg, rankine };
}
