import { DEFAULT_PARAMETERS } from './constants';
import { solveBraytonCycle } from './brayton';
import { solveHrsgAndRankine } from './rankine';
import type {
  CombinedCycleResult,
  ComponentEnergyBalance,
  ComponentId,
  CycleParameters,
  PhysicsError,
  StatePoint,
  StatePointId,
} from './types';

function computeClosureError(Q_MW: number, W_MW: number, deltaH_MW: number): number {
  const residual = Math.abs(Q_MW - W_MW - deltaH_MW);
  const scale = Math.max(Math.abs(Q_MW), Math.abs(W_MW), Math.abs(deltaH_MW), 1e-9);
  return residual / scale;
}

/**
 * Solve the complete Combined Cycle Power Plant (Brayton + HRSG + Rankine)
 * from partial or complete CycleParameters.
 */
export function solveCombinedCycle(
  partialParams: Partial<CycleParameters> = {},
): CombinedCycleResult {
  const parameters: CycleParameters = {
    ...DEFAULT_PARAMETERS,
    ...partialParams,
  };

  const brayton = solveBraytonCycle(parameters);
  const { hrsg, rankine } = solveHrsgAndRankine(parameters, brayton.state1, brayton.state4);

  const states: Record<StatePointId, StatePoint> = {
    1: brayton.state1,
    2: brayton.state2,
    3: brayton.state3,
    4: brayton.state4,
    5: hrsg.state5,
    6: rankine.state6,
    7: rankine.state7,
    8: rankine.state8,
    9: rankine.state9,
  };

  // First-Law Energy Balance (Law 1: Q - W = ṁ·(h_out - h_in)) & Continuity (Law 10) for every component
  const compDeltaH = (states[1].mDot_kgs * (states[2].h_kJkg - states[1].h_kJkg)) / 1000;
  const combDeltaH = (states[2].mDot_kgs * (states[3].h_kJkg - states[2].h_kJkg)) / 1000;
  const gtDeltaH = (states[3].mDot_kgs * (states[4].h_kJkg - states[3].h_kJkg)) / 1000;
  // HRSG: Adiabatic heat exchanger (Q_ext = 0, W = 0); gas enthalpy drop equals steam enthalpy rise
  const hrsgGasDrop_MW = (states[4].mDot_kgs * (states[4].h_kJkg - states[5].h_kJkg)) / 1000;
  const hrsgSteamRise_MW = (states[7].mDot_kgs * (states[8].h_kJkg - states[7].h_kJkg)) / 1000;
  const stDeltaH = (states[8].mDot_kgs * (states[9].h_kJkg - states[8].h_kJkg)) / 1000;
  const condDeltaH = (states[9].mDot_kgs * (states[6].h_kJkg - states[9].h_kJkg)) / 1000;
  const pumpDeltaH = (states[6].mDot_kgs * (states[7].h_kJkg - states[6].h_kJkg)) / 1000;

  const gtPower_MW = brayton.gtNetPower_MW;
  const stPower_MW = rankine.stNetPower_MW;
  const netPower_MW = gtPower_MW + stPower_MW;

  const energyBalances: Record<ComponentId, ComponentEnergyBalance> = {
    compressor: {
      componentId: 'compressor',
      Q_MW: 0,
      W_MW: -brayton.compPower_MW,
      deltaH_MW: compDeltaH,
      closureErrorFraction: computeClosureError(0, -brayton.compPower_MW, compDeltaH),
      mDotIn_kgs: states[1].mDot_kgs,
      mDotOut_kgs: states[2].mDot_kgs,
    },
    combustor: {
      componentId: 'combustor',
      Q_MW: brayton.heatInput_MW,
      W_MW: 0,
      deltaH_MW: combDeltaH,
      closureErrorFraction: computeClosureError(brayton.heatInput_MW, 0, combDeltaH),
      mDotIn_kgs: states[2].mDot_kgs,
      mDotOut_kgs: states[3].mDot_kgs,
    },
    gasTurbine: {
      componentId: 'gasTurbine',
      Q_MW: 0,
      W_MW: brayton.turbGrossPower_MW,
      deltaH_MW: gtDeltaH,
      closureErrorFraction: computeClosureError(0, brayton.turbGrossPower_MW, gtDeltaH),
      mDotIn_kgs: states[3].mDot_kgs,
      mDotOut_kgs: states[4].mDot_kgs,
    },
    hrsg: {
      componentId: 'hrsg',
      Q_MW: hrsgGasDrop_MW,
      W_MW: 0,
      deltaH_MW: hrsgSteamRise_MW,
      closureErrorFraction: computeClosureError(hrsgGasDrop_MW, 0, hrsgSteamRise_MW),
      mDotIn_kgs: states[4].mDot_kgs + states[7].mDot_kgs,
      mDotOut_kgs: states[5].mDot_kgs + states[8].mDot_kgs,
    },
    steamTurbine: {
      componentId: 'steamTurbine',
      Q_MW: 0,
      W_MW: rankine.stGrossPower_MW,
      deltaH_MW: stDeltaH,
      closureErrorFraction: computeClosureError(0, rankine.stGrossPower_MW, stDeltaH),
      mDotIn_kgs: states[8].mDot_kgs,
      mDotOut_kgs: states[9].mDot_kgs,
    },
    condenser: {
      componentId: 'condenser',
      Q_MW: -rankine.condenserHeatRejected_MW,
      W_MW: 0,
      deltaH_MW: condDeltaH,
      closureErrorFraction: computeClosureError(-rankine.condenserHeatRejected_MW, 0, condDeltaH),
      mDotIn_kgs: states[9].mDot_kgs,
      mDotOut_kgs: states[6].mDot_kgs,
    },
    pump: {
      componentId: 'pump',
      Q_MW: 0,
      W_MW: -rankine.pumpPower_MW,
      deltaH_MW: pumpDeltaH,
      closureErrorFraction: computeClosureError(0, -rankine.pumpPower_MW, pumpDeltaH),
      mDotIn_kgs: states[6].mDot_kgs,
      mDotOut_kgs: states[7].mDot_kgs,
    },
    generator: {
      componentId: 'generator',
      Q_MW: 0,
      W_MW: netPower_MW,
      deltaH_MW: -(gtPower_MW + stPower_MW),
      closureErrorFraction: computeClosureError(0, netPower_MW, -(gtPower_MW + stPower_MW)),
      mDotIn_kgs: states[3].mDot_kgs + states[8].mDot_kgs,
      mDotOut_kgs: states[4].mDot_kgs + states[9].mDot_kgs,
    },
  };

  const heatInput_MW = brayton.heatInput_MW;
  const gtEfficiency = brayton.gtEfficiency;
  const stEfficiency = rankine.stEfficiency;
  const hrsgEfficiency = hrsg.hrsgEfficiency;
  const combinedEfficiency = heatInput_MW > 0 ? netPower_MW / heatInput_MW : 0;
  // Law 9: η_cc = η_GT + (1 − η_GT)·η_HRSG·η_ST
  const combinedEfficiencyLaw9 = gtEfficiency + (1 - gtEfficiency) * hrsgEfficiency * stEfficiency;

  // Detect thermodynamic violations and return a clear error object (never crash)
  let error: PhysicsError | undefined;

  if (brayton.q_in_kJkg <= 0) {
    error = {
      code: 'NEGATIVE_COMBUSTION_HEAT',
      message: `Compressor outlet temperature T2 (${states[2].T_K.toFixed(1)} K) exceeds or equals turbine inlet temperature T3 (${states[3].T_K.toFixed(1)} K).`,
      details: {
        T2_K: states[2].T_K,
        T3_K: states[3].T_K,
      },
    };
  } else if (brayton.gtNetPower_MW <= 0) {
    error = {
      code: 'NEGATIVE_GT_WORK',
      message: `Compressor power (${brayton.compPower_MW.toFixed(2)} MW) exceeds gas turbine gross power (${brayton.turbGrossPower_MW.toFixed(2)} MW).`,
      details: {
        compPower_MW: brayton.compPower_MW,
        turbGrossPower_MW: brayton.turbGrossPower_MW,
      },
    };
  } else if (
    states[4].T_K <= hrsg.T_gas_pinch_K ||
    states[4].T_K < states[8].T_K + parameters.pinch_K ||
    states[5].T_K < states[7].T_K
  ) {
    error = {
      code: 'PINCH_POINT_VIOLATION',
      message: `HRSG pinch / temperature approach violation: gas turbine exhaust T4 (${states[4].T_K.toFixed(1)} K) is insufficient for steam at T8 (${states[8].T_K.toFixed(1)} K) and drum Tsat (${hrsg.T_sat_K.toFixed(1)} K) with pinch ΔT = ${parameters.pinch_K} K.`,
      details: {
        T4_K: states[4].T_K,
        T8_K: states[8].T_K,
        T_sat_K: hrsg.T_sat_K,
        T_gas_pinch_K: hrsg.T_gas_pinch_K,
        pinch_K: parameters.pinch_K,
        T5_K: states[5].T_K,
        T7_K: states[7].T_K,
      },
    };
  }

  return {
    ok: error === undefined,
    error,
    parameters,
    states,
    brayton,
    hrsg,
    rankine,
    gtPower_MW,
    stPower_MW,
    netPower_MW,
    heatInput_MW,
    gtEfficiency,
    idealBraytonEfficiency: brayton.idealBraytonEfficiency,
    stEfficiency,
    hrsgEfficiency,
    combinedEfficiency,
    combinedEfficiencyLaw9,
    fuelMassFlow_kgs: brayton.fuelMassFlow_kgs,
    steamMassFlow_kgs: hrsg.steamMassFlow_kgs,
    energyBalances,
  };
}
