import { describe, expect, it } from 'vitest';
import {
  calcIdealBraytonEfficiency,
  calcIdealGasConstant,
  calcIsentropicTemperature,
  solveBraytonCycle,
} from '../src/physics/brayton';
import { DEFAULT_PARAMETERS } from '../src/physics/constants';

describe('M1: Gas-Side Brayton Cycle Physics', () => {
  it('computes ideal Brayton efficiency formula η = 1 - 1 / rp^((k-1)/k) accurately', () => {
    const rp = 15;
    const k = 1.4;
    const expected = 1 - 1 / Math.pow(15, 0.4 / 1.4); // 0.538941...
    const actual = calcIdealBraytonEfficiency(rp, k);
    expect(actual).toBeCloseTo(expected, 8);
  });

  it('computes isentropic temperature relation T2s/T1 = (p2/p1)^((k-1)/k) accurately', () => {
    const T1 = 288.15;
    const p1 = 101.325;
    const p2 = p1 * 15;
    const k = 1.4;
    const T2s = calcIsentropicTemperature(T1, p1, p2, k);
    expect(T2s / T1).toBeCloseTo(Math.pow(15, 0.4 / 1.4), 8);

    // Reversible expansion back to p1 returns to T1
    const T1_back = calcIsentropicTemperature(T2s, p2, p1, k);
    expect(T1_back).toBeCloseTo(T1, 8);
  });

  it('satisfies ideal gas relation cp - cv = R and k = cp / cv', () => {
    const cp = DEFAULT_PARAMETERS.cp_air_kJkgK;
    const k = DEFAULT_PARAMETERS.k_air;
    const R = calcIdealGasConstant(cp, k);
    const cv = cp - R;
    expect(cp / cv).toBeCloseTo(k, 8);
  });

  it('closes First-Law energy balance Q - W = ṁ(h_out - h_in) on compressor, combustor, and gas turbine within 0.1%', () => {
    const brayton = solveBraytonCycle(DEFAULT_PARAMETERS);
    const { state1, state2, state3, state4 } = brayton;

    // Compressor: Q = 0, W = -compPower_MW
    const compDeltaH_MW = (state1.mDot_kgs * (state2.h_kJkg - state1.h_kJkg)) / 1000;
    const compError = Math.abs(0 - -brayton.compPower_MW - compDeltaH_MW) / brayton.compPower_MW;
    expect(compError).toBeLessThan(0.001);

    // Combustor: Q = heatInput_MW, W = 0
    const combDeltaH_MW = (state2.mDot_kgs * (state3.h_kJkg - state2.h_kJkg)) / 1000;
    const combError = Math.abs(brayton.heatInput_MW - 0 - combDeltaH_MW) / brayton.heatInput_MW;
    expect(combError).toBeLessThan(0.001);

    // Gas Turbine: Q = 0, W = turbGrossPower_MW
    const gtDeltaH_MW = (state3.mDot_kgs * (state4.h_kJkg - state3.h_kJkg)) / 1000;
    const gtError =
      Math.abs(0 - brayton.turbGrossPower_MW - gtDeltaH_MW) / brayton.turbGrossPower_MW;
    expect(gtError).toBeLessThan(0.001);
  });
});
