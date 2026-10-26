import { AIR_REF_ENTROPY_kJkgK, KELVIN_OFFSET } from './constants';
import type { BraytonCycleResult, CycleParameters, StatePoint } from './types';

/**
 * Law 3: Ideal gas constant R = cp · (1 - 1/k) [kJ/(kg·K)]
 */
export function calcIdealGasConstant(cp_kJkgK: number, k: number): number {
  return cp_kJkgK * (1 - 1 / k);
}

/**
 * Law 4: Isentropic temperature ratio for an ideal gas with constant specific heats:
 * T_out,s / T_in = (p_out / p_in)^((k - 1) / k)
 */
export function calcIsentropicTemperature(
  T_in_K: number,
  p_in_kPa: number,
  p_out_kPa: number,
  k: number,
): number {
  const pressureRatio = p_out_kPa / p_in_kPa;
  return T_in_K * Math.pow(pressureRatio, (k - 1) / k);
}

/**
 * Law 3 & 4: Ideal gas entropy change Δs = cp·ln(T2/T1) - R·ln(p2/p1) [kJ/(kg·K)]
 */
export function calcIdealGasEntropyChange(
  T1_K: number,
  p1_kPa: number,
  T2_K: number,
  p2_kPa: number,
  cp_kJkgK: number,
  k: number,
): number {
  const R_kJkgK = calcIdealGasConstant(cp_kJkgK, k);
  return cp_kJkgK * Math.log(T2_K / T1_K) - R_kJkgK * Math.log(p2_kPa / p1_kPa);
}

/**
 * Law 5: Cold-air-standard ideal Brayton cycle thermal efficiency:
 * η_Brayton,ideal = 1 - 1 / rp^((k - 1) / k)
 */
export function calcIdealBraytonEfficiency(rp: number, k: number): number {
  return 1 - 1 / Math.pow(rp, (k - 1) / k);
}

/**
 * Create ambient air inlet state (State 1).
 */
export function createAmbientAirState(params: CycleParameters): StatePoint {
  const { T1_K, p1_kPa, cp_air_kJkgK, mDot_air_kgs } = params;
  return {
    id: 1,
    fluid: 'air',
    T_K: T1_K,
    T_C: T1_K - KELVIN_OFFSET,
    p_kPa: p1_kPa,
    h_kJkg: cp_air_kJkgK * T1_K,
    s_kJkgK: AIR_REF_ENTROPY_kJkgK,
    mDot_kgs: mDot_air_kgs,
    quality: null,
  };
}

/**
 * Axial Air Compressor (State 1 -> State 2).
 * Applies Laws 1, 2, 3, 4, 10.
 */
export function calcCompressor(
  state1: StatePoint,
  rp: number,
  eta_comp: number,
  cp_air_kJkgK: number,
  k_air: number,
): {
  state2: StatePoint;
  T2s_K: number;
  w_comp_kJkg: number;
  compPower_MW: number;
} {
  const p2_kPa = state1.p_kPa * rp;
  const T2s_K = calcIsentropicTemperature(state1.T_K, state1.p_kPa, p2_kPa, k_air);
  const T2_K = state1.T_K + (T2s_K - state1.T_K) / eta_comp;
  const h2_kJkg = state1.h_kJkg + cp_air_kJkgK * (T2_K - state1.T_K);
  const s2_kJkgK =
    state1.s_kJkgK +
    calcIdealGasEntropyChange(state1.T_K, state1.p_kPa, T2_K, p2_kPa, cp_air_kJkgK, k_air);

  const w_comp_kJkg = h2_kJkg - state1.h_kJkg;
  const compPower_MW = (state1.mDot_kgs * w_comp_kJkg) / 1000;

  const state2: StatePoint = {
    id: 2,
    fluid: 'air',
    T_K: T2_K,
    T_C: T2_K - KELVIN_OFFSET,
    p_kPa: p2_kPa,
    h_kJkg: h2_kJkg,
    s_kJkgK: s2_kJkgK,
    mDot_kgs: state1.mDot_kgs,
    quality: null,
  };

  return {
    state2,
    T2s_K,
    w_comp_kJkg,
    compPower_MW,
  };
}

/**
 * Combustion Chamber (State 2 -> State 3).
 * Isobaric heat addition (p3 = p2) to reach turbine inlet temperature T3_K.
 * Applies Laws 1, 3, 8, 10.
 */
export function calcCombustor(
  state2: StatePoint,
  T3_K: number,
  cp_gas_kJkgK: number,
  k_gas: number,
  lhv_kJkg: number,
  eta_comb: number,
): {
  state3: StatePoint;
  q_in_kJkg: number;
  heatInput_MW: number;
  fuelMassFlow_kgs: number;
} {
  const p3_kPa = state2.p_kPa;
  const q_in_kJkg = cp_gas_kJkgK * (T3_K - state2.T_K);
  const h3_kJkg = state2.h_kJkg + q_in_kJkg;
  const s3_kJkgK =
    state2.s_kJkgK +
    calcIdealGasEntropyChange(state2.T_K, state2.p_kPa, T3_K, p3_kPa, cp_gas_kJkgK, k_gas);

  const heatInput_MW = (state2.mDot_kgs * q_in_kJkg) / 1000;
  // Law 8: Q_in = ṁ_f · LHV · η_comb  (where Q_in in kW is state2.mDot_kgs * q_in_kJkg)
  const fuelMassFlow_kgs = (state2.mDot_kgs * q_in_kJkg) / (lhv_kJkg * eta_comb);

  const state3: StatePoint = {
    id: 3,
    fluid: 'gas',
    T_K: T3_K,
    T_C: T3_K - KELVIN_OFFSET,
    p_kPa: p3_kPa,
    h_kJkg: h3_kJkg,
    s_kJkgK: s3_kJkgK,
    mDot_kgs: state2.mDot_kgs,
    quality: null,
  };

  return {
    state3,
    q_in_kJkg,
    heatInput_MW,
    fuelMassFlow_kgs,
  };
}

/**
 * Gas Turbine (State 3 -> State 4).
 * Adiabatic expansion from p3 down to ambient/HRSG pressure p4 = p1.
 * Applies Laws 1, 2, 3, 4, 10.
 */
export function calcGasTurbine(
  state3: StatePoint,
  p4_kPa: number,
  eta_gt: number,
  cp_gas_kJkgK: number,
  k_gas: number,
): {
  state4: StatePoint;
  T4s_K: number;
  w_turb_kJkg: number;
  turbGrossPower_MW: number;
} {
  const T4s_K = calcIsentropicTemperature(state3.T_K, state3.p_kPa, p4_kPa, k_gas);
  const T4_K = state3.T_K - eta_gt * (state3.T_K - T4s_K);
  const w_turb_kJkg = cp_gas_kJkgK * (state3.T_K - T4_K);
  const h4_kJkg = state3.h_kJkg - w_turb_kJkg;
  const s4_kJkgK =
    state3.s_kJkgK +
    calcIdealGasEntropyChange(state3.T_K, state3.p_kPa, T4_K, p4_kPa, cp_gas_kJkgK, k_gas);

  const turbGrossPower_MW = (state3.mDot_kgs * w_turb_kJkg) / 1000;

  const state4: StatePoint = {
    id: 4,
    fluid: 'gas',
    T_K: T4_K,
    T_C: T4_K - KELVIN_OFFSET,
    p_kPa: p4_kPa,
    h_kJkg: h4_kJkg,
    s_kJkgK: s4_kJkgK,
    mDot_kgs: state3.mDot_kgs,
    quality: null,
  };

  return {
    state4,
    T4s_K,
    w_turb_kJkg,
    turbGrossPower_MW,
  };
}

/**
 * Complete Gas-Side Brayton Cycle calculation (States 1 -> 2 -> 3 -> 4).
 */
export function solveBraytonCycle(params: CycleParameters): BraytonCycleResult {
  const state1 = createAmbientAirState(params);

  const comp = calcCompressor(
    state1,
    params.rp,
    params.eta_comp,
    params.cp_air_kJkgK,
    params.k_air,
  );

  const comb = calcCombustor(
    comp.state2,
    params.T3_K,
    params.cp_gas_kJkgK,
    params.k_gas,
    params.lhv_kJkg,
    params.eta_comb,
  );

  const turb = calcGasTurbine(
    comb.state3,
    params.p1_kPa,
    params.eta_gt,
    params.cp_gas_kJkgK,
    params.k_gas,
  );

  const w_net_kJkg = turb.w_turb_kJkg - comp.w_comp_kJkg;
  const gtNetPower_MW = turb.turbGrossPower_MW - comp.compPower_MW;
  const gtEfficiency = comb.heatInput_MW > 0 ? gtNetPower_MW / comb.heatInput_MW : 0;
  const idealBraytonEfficiency = calcIdealBraytonEfficiency(params.rp, params.k_air);

  return {
    state1,
    state2: comp.state2,
    state3: comb.state3,
    state4: turb.state4,
    T2s_K: comp.T2s_K,
    T4s_K: turb.T4s_K,
    w_comp_kJkg: comp.w_comp_kJkg,
    q_in_kJkg: comb.q_in_kJkg,
    w_turb_kJkg: turb.w_turb_kJkg,
    w_net_kJkg,
    compPower_MW: comp.compPower_MW,
    turbGrossPower_MW: turb.turbGrossPower_MW,
    gtNetPower_MW,
    heatInput_MW: comb.heatInput_MW,
    fuelMassFlow_kgs: comb.fuelMassFlow_kgs,
    gtEfficiency,
    idealBraytonEfficiency,
  };
}
