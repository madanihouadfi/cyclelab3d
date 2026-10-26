import { calcIdealGasConstant } from './brayton';
import { PLANT_COMPONENTS } from './constants';
import type { CombinedCycleResult, ComponentId, LawId } from './types';

export interface LiveLawEvaluation {
  lawId: LawId;
  dictKey: `law${LawId}`;
  liveEquation: string;
}

/**
 * Evaluate all governing laws assigned to a component using the live CombinedCycleResult.
 * All numbers are derived strictly from the physics engine.
 */
export function evaluateComponentLaws(
  componentId: ComponentId,
  result: CombinedCycleResult,
): LiveLawEvaluation[] {
  const meta = PLANT_COMPONENTS.find((c) => c.id === componentId);
  if (!meta) return [];

  const { states, parameters, brayton, hrsg, rankine, energyBalances } = result;
  const eb = energyBalances[componentId];

  return meta.lawIds.map((lawId): LiveLawEvaluation => {
    const dictKey = `law${lawId}` as const;

    switch (lawId) {
      case 1: {
        // First law: Q - W = ṁ(h2 - h1)
        return {
          lawId,
          dictKey,
          liveEquation: `${eb.Q_MW.toFixed(2)} − (${eb.W_MW.toFixed(2)}) = ${eb.deltaH_MW.toFixed(2)} MW`,
        };
      }
      case 2: {
        // Second law, isentropic efficiency
        if (componentId === 'compressor') {
          const dh_s = parameters.cp_air_kJkgK * (brayton.T2s_K - states[1].T_K);
          const dh_a = states[2].h_kJkg - states[1].h_kJkg;
          return {
            lawId,
            dictKey,
            liveEquation: `η_c = ${dh_s.toFixed(1)} / ${dh_a.toFixed(1)} = ${(parameters.eta_comp * 100).toFixed(1)} %`,
          };
        }
        if (componentId === 'gasTurbine') {
          const dh_s = parameters.cp_gas_kJkgK * (states[3].T_K - brayton.T4s_K);
          const dh_a = states[3].h_kJkg - states[4].h_kJkg;
          return {
            lawId,
            dictKey,
            liveEquation: `η_GT = ${dh_a.toFixed(1)} / ${dh_s.toFixed(1)} = ${(parameters.eta_gt * 100).toFixed(1)} %`,
          };
        }
        if (componentId === 'steamTurbine') {
          const dh_s = states[8].h_kJkg - rankine.h9s_kJkg;
          const dh_a = states[8].h_kJkg - states[9].h_kJkg;
          return {
            lawId,
            dictKey,
            liveEquation: `η_ST = ${dh_a.toFixed(1)} / ${dh_s.toFixed(1)} = ${(parameters.eta_st * 100).toFixed(1)} %`,
          };
        }
        // pump
        const dh_s = rankine.h7s_kJkg - states[6].h_kJkg;
        const dh_a = states[7].h_kJkg - states[6].h_kJkg;
        return {
          lawId,
          dictKey,
          liveEquation: `η_p = ${dh_s.toFixed(2)} / ${dh_a.toFixed(2)} = ${(parameters.eta_pump * 100).toFixed(1)} %`,
        };
      }
      case 3: {
        // Ideal gas law
        const isAir = componentId === 'compressor';
        const cp = isAir ? parameters.cp_air_kJkgK : parameters.cp_gas_kJkgK;
        const k = isAir ? parameters.k_air : parameters.k_gas;
        const R = calcIdealGasConstant(cp, k);
        const cv = cp - R;
        return {
          lawId,
          dictKey,
          liveEquation: `cp = ${cp.toFixed(3)}, cv = ${cv.toFixed(3)}, R = ${R.toFixed(3)} kJ/(kg·K), k = ${k.toFixed(2)}`,
        };
      }
      case 4: {
        // Isentropic relations
        if (componentId === 'compressor') {
          return {
            lawId,
            dictKey,
            liveEquation: `T2s = ${states[1].T_K.toFixed(2)} · (${parameters.rp.toFixed(1)})^((1.40−1)/1.40) = ${brayton.T2s_K.toFixed(2)} K`,
          };
        }
        return {
          lawId,
          dictKey,
          liveEquation: `T4s = ${states[3].T_K.toFixed(2)} · (1/${parameters.rp.toFixed(1)})^((1.33−1)/1.33) = ${brayton.T4s_K.toFixed(2)} K`,
        };
      }
      case 5: {
        // Brayton cycle efficiency
        return {
          lawId,
          dictKey,
          liveEquation: `η_ideal = ${(result.idealBraytonEfficiency * 100).toFixed(2)} % | η_GT,actual = ${(result.gtEfficiency * 100).toFixed(2)} %`,
        };
      }
      case 6: {
        // Rankine cycle efficiency
        return {
          lawId,
          dictKey,
          liveEquation: `η_ST = (${rankine.w_st_kJkg.toFixed(1)} − ${rankine.w_pump_kJkg.toFixed(2)}) / ${rankine.q_in_steam_kJkg.toFixed(1)} = ${(result.stEfficiency * 100).toFixed(2)} %`,
        };
      }
      case 7: {
        // HRSG energy balance and pinch point
        return {
          lawId,
          dictKey,
          liveEquation: `Q_HRSG = ${hrsg.qHrsg_MW.toFixed(2)} MW | ΔT_pinch = ${hrsg.T_gas_pinch_K.toFixed(2)} − ${hrsg.T_sat_K.toFixed(2)} = ${hrsg.pinchDiff_K.toFixed(1)} K`,
        };
      }
      case 8: {
        // Combustion heat input
        return {
          lawId,
          dictKey,
          liveEquation: `Q_in = ${result.fuelMassFlow_kgs.toFixed(2)} kg/s · ${(parameters.lhv_kJkg / 1000).toFixed(1)} MJ/kg · ${parameters.eta_comb.toFixed(2)} = ${result.heatInput_MW.toFixed(2)} MW`,
        };
      }
      case 9: {
        // Combined cycle efficiency
        return {
          lawId,
          dictKey,
          liveEquation: `η_cc = ${(result.gtEfficiency * 100).toFixed(2)}% + (1 − ${(result.gtEfficiency * 100).toFixed(2)}%) · ${(result.hrsgEfficiency * 100).toFixed(2)}% · ${(result.stEfficiency * 100).toFixed(2)}% = ${(result.combinedEfficiencyLaw9 * 100).toFixed(2)} %`,
        };
      }
      case 10: {
        // Mass conservation
        return {
          lawId,
          dictKey,
          liveEquation: `Σṁ_in = ${eb.mDotIn_kgs.toFixed(2)} kg/s = Σṁ_out = ${eb.mDotOut_kgs.toFixed(2)} kg/s`,
        };
      }
    }
  });
}
