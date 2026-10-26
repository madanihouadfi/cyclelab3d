import { describe, expect, it } from 'vitest';
import {
  getSaturationByPressure,
  getSteamByPH,
  getSteamByPS,
  getSteamByPT,
  getWaterSaturationDome,
} from '../src/physics/steam';
import { KELVIN_OFFSET } from '../src/physics/constants';

function relativeError(actual: number, expected: number): number {
  return Math.abs(actual - expected) / Math.abs(expected);
}

describe('M2: IAPWS-IF97 Steam Property Verification (within 0.5%)', () => {
  it('matches saturated water/steam properties at 10 kPa within 0.5%', () => {
    const sat = getSaturationByPressure(10);

    expect(relativeError(sat.T_sat_C, 45.81)).toBeLessThan(0.005);
    expect(relativeError(sat.hf_kJkg, 191.81)).toBeLessThan(0.005);
    expect(relativeError(sat.sf_kJkgK, 0.6492)).toBeLessThan(0.005);
    expect(relativeError(sat.hg_kJkg, 2583.9)).toBeLessThan(0.005);
    expect(relativeError(sat.sg_kJkgK, 8.1488)).toBeLessThan(0.005);
  });

  it('matches superheated steam properties at 5 MPa (5000 kPa), 450 °C within 0.5%', () => {
    const sh = getSteamByPT(5000, 450 + KELVIN_OFFSET);

    expect(relativeError(sh.h_kJkg, 3317.2)).toBeLessThan(0.005);
    expect(relativeError(sh.s_kJkgK, 6.821)).toBeLessThan(0.005);
  });

  it('maintains consistency across PT -> PS -> PH backward solvers', () => {
    const sh = getSteamByPT(5000, 450 + KELVIN_OFFSET);
    const fromPS = getSteamByPS(5000, sh.s_kJkgK);
    const fromPH = getSteamByPH(5000, sh.h_kJkg);

    expect(relativeError(fromPS.h_kJkg, sh.h_kJkg)).toBeLessThan(0.001);
    expect(relativeError(fromPH.T_K, sh.T_K)).toBeLessThan(0.001);
  });

  it('generates a valid water saturation dome curve for the T-s diagram', () => {
    const dome = getWaterSaturationDome();
    expect(dome.length).toBeGreaterThan(20);
    for (const pt of dome) {
      expect(pt.T_K).toBeGreaterThan(273);
      expect(pt.T_K).toBeLessThanOrEqual(648);
      expect(pt.s_kJkgK).toBeGreaterThan(0);
      expect(pt.s_kJkgK).toBeLessThan(9.5);
    }
  });
});
