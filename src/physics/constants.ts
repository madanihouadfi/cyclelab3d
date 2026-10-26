import type { ComponentId, CycleParameters, LawId, StatePointId } from './types';

/** Celsius to Kelvin offset [K] */
export const KELVIN_OFFSET = 273.15;

/** Slider bounds and defaults per SPEC.md section 4 */
export const SLIDER_BOUNDS = {
  T3_K: {
    min: 1100,
    max: 1700,
    step: 10,
    default: 1400,
  },
  rp: {
    min: 8,
    max: 30,
    step: 0.5,
    default: 15,
  },
} as const;

/** Default cycle parameters exactly matching SPEC.md section 4 */
export const DEFAULT_PARAMETERS: CycleParameters = {
  T1_K: 288.15, // 15 °C ambient
  p1_kPa: 101.325, // 1 atm in kPa
  rp: SLIDER_BOUNDS.rp.default, // 15
  T3_K: SLIDER_BOUNDS.T3_K.default, // 1400 K
  cp_air_kJkgK: 1.005, // kJ/(kg·K)
  k_air: 1.4, // -
  cp_gas_kJkgK: 1.15, // kJ/(kg·K)
  k_gas: 1.33, // -
  eta_comp: 0.85, // -
  eta_gt: 0.88, // -
  eta_st: 0.85, // -
  eta_pump: 0.85, // -
  eta_comb: 0.99, // -
  lhv_kJkg: 50000, // Natural gas lower heating value [kJ/kg]
  p_steam_kPa: 5000, // 5 MPa = 5000 kPa
  T_steam_K: 450 + KELVIN_OFFSET, // 450 °C = 723.15 K
  p_cond_kPa: 10, // 10 kPa
  pinch_K: 15, // 15 K pinch point
  mDot_air_kgs: 100, // 100 kg/s reference gas path mass flow rate
};

/** Reference entropy at ambient air state (T1, p1) [kJ/(kg·K)] */
export const AIR_REF_ENTROPY_kJkgK = 1.0;

/** Metadata for the 8 plant components per SPEC.md sections 5 & 6 */
export interface ComponentMeta {
  id: ComponentId;
  position3D: [number, number, number];
  inletStateId: StatePointId;
  outletStateId: StatePointId;
  secondaryInletStateId?: StatePointId;
  secondaryOutletStateId?: StatePointId;
  lawIds: LawId[];
}

export const PLANT_COMPONENTS: readonly ComponentMeta[] = [
  {
    id: 'compressor',
    position3D: [-6.5, 0.8, -1.5],
    inletStateId: 1,
    outletStateId: 2,
    lawIds: [1, 2, 3, 4, 5, 10],
  },
  {
    id: 'combustor',
    position3D: [-3.5, 2.2, -1.5],
    inletStateId: 2,
    outletStateId: 3,
    lawIds: [1, 3, 5, 8, 10],
  },
  {
    id: 'gasTurbine',
    position3D: [-0.5, 0.8, -1.5],
    inletStateId: 3,
    outletStateId: 4,
    lawIds: [1, 2, 3, 4, 5, 10],
  },
  {
    id: 'hrsg',
    position3D: [2.8, 1.5, -1.5],
    inletStateId: 4,
    outletStateId: 5,
    secondaryInletStateId: 7,
    secondaryOutletStateId: 8,
    lawIds: [1, 7, 10],
  },
  {
    id: 'steamTurbine',
    position3D: [2.8, 0.8, 2.2],
    inletStateId: 8,
    outletStateId: 9,
    lawIds: [1, 2, 6, 10],
  },
  {
    id: 'condenser',
    position3D: [6.0, 0.2, 2.2],
    inletStateId: 9,
    outletStateId: 6,
    lawIds: [1, 6, 10],
  },
  {
    id: 'pump',
    position3D: [6.0, 0.2, -0.2],
    inletStateId: 6,
    outletStateId: 7,
    lawIds: [1, 2, 6, 10],
  },
  {
    id: 'generator',
    position3D: [-0.5, 0.8, 2.2],
    inletStateId: 3,
    outletStateId: 4,
    secondaryInletStateId: 8,
    secondaryOutletStateId: 9,
    lawIds: [1, 5, 6, 9, 10],
  },
] as const;
