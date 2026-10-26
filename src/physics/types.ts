/**
 * Pure TypeScript data structures and types for CycleLab 3D thermodynamic calculations.
 * Units (SI per SPEC.md section 4):
 * - Temperature: K (and °C for display convenience)
 * - Pressure: kPa
 * - Specific enthalpy: kJ/kg
 * - Specific entropy: kJ/(kg·K)
 * - Mass flow rate: kg/s
 * - Thermal / mechanical power: MW
 */

export type FluidType = 'air' | 'gas' | 'water' | 'steam';

export type StatePointId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type ComponentId =
  | 'compressor'
  | 'combustor'
  | 'gasTurbine'
  | 'hrsg'
  | 'steamTurbine'
  | 'condenser'
  | 'pump'
  | 'generator';

export type LawId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface StatePoint {
  id: StatePointId;
  fluid: FluidType;
  /** Absolute temperature [K] */
  T_K: number;
  /** Celsius temperature [°C] */
  T_C: number;
  /** Absolute pressure [kPa] */
  p_kPa: number;
  /** Specific enthalpy [kJ/kg] */
  h_kJkg: number;
  /** Specific entropy [kJ/(kg·K)] */
  s_kJkgK: number;
  /** Mass flow rate [kg/s] */
  mDot_kgs: number;
  /** Vapor quality x [-] for two-phase / saturated states, null for single-phase gas/subcooled/superheated */
  quality: number | null;
}

export interface CycleParameters {
  /** Ambient air inlet temperature T1 [K] */
  T1_K: number;
  /** Ambient air inlet pressure p1 [kPa] */
  p1_kPa: number;
  /** Compressor pressure ratio rp = p2 / p1 [-] */
  rp: number;
  /** Gas turbine inlet temperature T3 (TIT) [K] */
  T3_K: number;
  /** Air isobaric specific heat cp,a [kJ/(kg·K)] */
  cp_air_kJkgK: number;
  /** Air specific heat ratio k_a = cp/cv [-] */
  k_air: number;
  /** Hot combustion gas isobaric specific heat cp,g [kJ/(kg·K)] */
  cp_gas_kJkgK: number;
  /** Hot combustion gas specific heat ratio k_g = cp/cv [-] */
  k_gas: number;
  /** Compressor isentropic efficiency η_c [-] */
  eta_comp: number;
  /** Gas turbine isentropic efficiency η_GT [-] */
  eta_gt: number;
  /** Steam turbine isentropic efficiency η_ST [-] */
  eta_st: number;
  /** Feedwater pump isentropic efficiency η_p [-] */
  eta_pump: number;
  /** Combustor thermal efficiency η_comb [-] */
  eta_comb: number;
  /** Fuel Lower Heating Value (LHV) [kJ/kg] */
  lhv_kJkg: number;
  /** Live superheated steam pressure p8 [kPa] */
  p_steam_kPa: number;
  /** Live superheated steam temperature T8 [K] */
  T_steam_K: number;
  /** Condenser pressure p6 = p9 [kPa] */
  p_cond_kPa: number;
  /** HRSG evaporator pinch point temperature difference ΔT_pinch [K] */
  pinch_K: number;
  /** Gas path mass flow rate ṁ_g [kg/s] */
  mDot_air_kgs: number;
}

export type PhysicsErrorCode =
  | 'PINCH_POINT_VIOLATION'
  | 'GAS_EXHAUST_BELOW_STEAM_TEMP'
  | 'NEGATIVE_COMBUSTION_HEAT'
  | 'NEGATIVE_GT_WORK'
  | 'STACK_TEMP_BELOW_FEEDWATER';

export interface PhysicsError {
  code: PhysicsErrorCode;
  message: string;
  details: Record<string, number>;
}

export interface ComponentEnergyBalance {
  componentId: ComponentId;
  /** Heat transfer rate into control volume Q [MW] */
  Q_MW: number;
  /** Shaft work rate out of control volume W [MW] */
  W_MW: number;
  /** Enthalpy flux change ṁ·(h_out - h_in) [MW] */
  deltaH_MW: number;
  /** Relative First-Law closure error |Q - W - deltaH| / max(|Q|, |W|, |deltaH|) [-] */
  closureErrorFraction: number;
  /** Mass flow entering [kg/s] */
  mDotIn_kgs: number;
  /** Mass flow leaving [kg/s] */
  mDotOut_kgs: number;
}

export interface BraytonCycleResult {
  state1: StatePoint;
  state2: StatePoint;
  state3: StatePoint;
  state4: StatePoint;
  /** Isentropic compressor discharge temperature T2s [K] */
  T2s_K: number;
  /** Isentropic gas turbine exhaust temperature T4s [K] */
  T4s_K: number;
  /** Specific compressor work input wc = h2 - h1 [kJ/kg] */
  w_comp_kJkg: number;
  /** Specific combustor heat input q_in = h3 - h2 [kJ/kg] */
  q_in_kJkg: number;
  /** Specific gas turbine work output wt = h3 - h4 [kJ/kg] */
  w_turb_kJkg: number;
  /** Specific net Brayton work w_net = wt - wc [kJ/kg] */
  w_net_kJkg: number;
  /** Compressor shaft power absorbed W_c [MW] */
  compPower_MW: number;
  /** Gas turbine gross shaft power W_t [MW] */
  turbGrossPower_MW: number;
  /** Gas turbine net power output W_GT,net = W_t - W_c [MW] */
  gtNetPower_MW: number;
  /** Combustor thermal power input Q_in [MW] */
  heatInput_MW: number;
  /** Fuel mass flow rate ṁ_f = Q_in / (LHV · η_comb) [kg/s] */
  fuelMassFlow_kgs: number;
  /** Fuel-to-air mass flow ratio ṁ_fuel / ṁ_air [-] */
  fuelAirRatio: number;
  /** Fuel-to-air mass flow ratio in percent (ṁ_fuel / ṁ_air) * 100 [%] */
  fuelAirRatioPct: number;
  /** Actual Brayton thermal efficiency η_GT = W_GT,net / Q_in [-] */
  gtEfficiency: number;
  /** Cold-air-standard ideal Brayton efficiency η_ideal = 1 - 1 / rp^((k_a - 1)/k_a) [-] */
  idealBraytonEfficiency: number;
}

export interface HrsgResult {
  /** Drum saturation temperature at boiler pressure p8 [K] */
  T_sat_K: number;
  /** Drum saturation temperature at boiler pressure p8 [°C] */
  T_sat_C: number;
  /** Saturated liquid enthalpy at p8 [kJ/kg] */
  hf_boiler_kJkg: number;
  /** Saturated vapor enthalpy at p8 [kJ/kg] */
  hg_boiler_kJkg: number;
  /** Saturated liquid entropy at p8 [kJ/(kg·K)] */
  sf_boiler_kJkgK: number;
  /** Saturated vapor entropy at p8 [kJ/(kg·K)] */
  sg_boiler_kJkgK: number;
  /** Flue gas temperature at evaporator pinch point T_g,pinch = T_sat + ΔT_pinch [K] */
  T_gas_pinch_K: number;
  /** Actual pinch temperature difference ΔT_pinch = T_g,pinch - T_sat [K] */
  pinchDiff_K: number;
  /** Superheater hot-end temperature approach T4 - T8 [K] */
  superheaterApproach_K: number;
  /** Economizer cold-end temperature approach T5 - T7 [K] */
  economizerApproach_K: number;
  /** Steam mass flow rate ṁ_s [kg/s] */
  steamMassFlow_kgs: number;
  /** HRSG stack gas state (State 5) */
  state5: StatePoint;
  /** Total thermal power transferred in HRSG Q_HRSG [MW] */
  qHrsg_MW: number;
  /** HRSG heat recovery effectiveness η_HRSG = (h4 - h5) / (h4 - h1) [-] */
  hrsgEfficiency: number;
}

export interface RankineCycleResult {
  state6: StatePoint;
  state7: StatePoint;
  state8: StatePoint;
  state9: StatePoint;
  /** Isentropic pump outlet enthalpy h7s [kJ/kg] */
  h7s_kJkg: number;
  /** Isentropic steam turbine exhaust enthalpy h9s [kJ/kg] */
  h9s_kJkg: number;
  /** Specific pump work input wp = h7 - h6 [kJ/kg] */
  w_pump_kJkg: number;
  /** Specific steam turbine work output wt = h8 - h9 [kJ/kg] */
  w_st_kJkg: number;
  /** Specific HRSG heat added to water/steam q_in,s = h8 - h7 [kJ/kg] */
  q_in_steam_kJkg: number;
  /** Specific condenser heat rejected q_out,s = h9 - h6 [kJ/kg] */
  q_out_cond_kJkg: number;
  /** Pump power absorbed W_p [MW] */
  pumpPower_MW: number;
  /** Steam turbine gross power W_ST,gross [MW] */
  stGrossPower_MW: number;
  /** Steam cycle net power output W_ST,net = W_ST,gross - W_p [MW] */
  stNetPower_MW: number;
  /** Condenser thermal heat rejection rate Q_cond [MW] */
  condenserHeatRejected_MW: number;
  /** Rankine cycle thermal efficiency η_ST = (w_t - w_p) / q_in,s [-] */
  stEfficiency: number;
}

export interface CombinedCycleResult {
  ok: boolean;
  error?: PhysicsError;
  parameters: CycleParameters;
  states: Record<StatePointId, StatePoint>;
  brayton: BraytonCycleResult;
  hrsg: HrsgResult;
  rankine: RankineCycleResult;
  /** Gas turbine net power [MW] */
  gtPower_MW: number;
  /** Steam cycle net power [MW] */
  stPower_MW: number;
  /** Total plant net power W_net = W_GT,net + W_ST,net [MW] */
  netPower_MW: number;
  /** Total fuel thermal heat input Q_in [MW] */
  heatInput_MW: number;
  /** Brayton cycle thermal efficiency η_GT [-] */
  gtEfficiency: number;
  /** Cold-air-standard ideal Brayton efficiency [-] */
  idealBraytonEfficiency: number;
  /** Rankine cycle thermal efficiency η_ST [-] */
  stEfficiency: number;
  /** HRSG heat recovery efficiency η_HRSG [-] */
  hrsgEfficiency: number;
  /** Combined cycle efficiency η_cc = W_net / Q_in [-] */
  combinedEfficiency: number;
  /** Combined cycle efficiency from Law 9: η_GT + (1 - η_GT)·η_HRSG·η_ST [-] */
  combinedEfficiencyLaw9: number;
  /** Fuel mass flow rate [kg/s] */
  fuelMassFlow_kgs: number;
  /** Fuel-to-air mass flow ratio ṁ_fuel / ṁ_air [-] */
  fuelAirRatio: number;
  /** Fuel-to-air mass flow ratio in percent (ṁ_fuel / ṁ_air) * 100 [%] */
  fuelAirRatioPct: number;
  /** Steam mass flow rate [kg/s] */
  steamMassFlow_kgs: number;
  /** Component-by-component First-Law and Continuity verification */
  energyBalances: Record<ComponentId, ComponentEnergyBalance>;
}
