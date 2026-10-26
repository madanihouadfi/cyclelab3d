import { describe, expect, it } from 'vitest';
import { solveCombinedCycle } from '../src/physics/combined';
import { DEFAULT_PARAMETERS, PLANT_COMPONENTS, SLIDER_BOUNDS } from '../src/physics/constants';
import { evaluateComponentLaws } from '../src/physics/laws';
import type { ComponentId, LawId } from '../src/physics/types';

describe('M1 + M2: Combined Cycle Physics, Energy Balance & Pinch Detection', () => {
  it('computes valid default cycle state points (1-9) and efficiencies', () => {
    const res = solveCombinedCycle(DEFAULT_PARAMETERS);
    expect(res.ok).toBe(true);
    expect(res.error).toBeUndefined();

    // Check all 9 state points exist and have positive physical properties
    for (let id = 1; id <= 9; id++) {
      const sp = res.states[id as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9];
      expect(sp.T_K).toBeGreaterThan(280);
      expect(sp.p_kPa).toBeGreaterThan(0);
      expect(sp.h_kJkg).toBeGreaterThan(0);
      expect(sp.s_kJkgK).toBeGreaterThan(0);
      expect(sp.mDot_kgs).toBeGreaterThan(0);
    }

    // Efficiencies must be in realistic physical ranges
    expect(res.gtEfficiency).toBeGreaterThan(0.3);
    expect(res.gtEfficiency).toBeLessThan(0.5);
    expect(res.stEfficiency).toBeGreaterThan(0.25);
    expect(res.stEfficiency).toBeLessThan(0.45);
    expect(res.combinedEfficiency).toBeGreaterThan(res.gtEfficiency);
    expect(res.combinedEfficiency).toBeLessThan(0.65);

    // Law 9 identity: η_cc = η_GT + (1 - η_GT)·η_HRSG·η_ST must match W_net / Q_in
    expect(res.combinedEfficiencyLaw9).toBeCloseTo(res.combinedEfficiency, 6);
  });

  it('closes First-Law energy balance on every single component with error < 0.1%', () => {
    const res = solveCombinedCycle(DEFAULT_PARAMETERS);
    const componentIds: ComponentId[] = [
      'compressor',
      'combustor',
      'gasTurbine',
      'hrsg',
      'steamTurbine',
      'condenser',
      'pump',
      'generator',
    ];

    for (const id of componentIds) {
      const eb = res.energyBalances[id];
      expect(eb.closureErrorFraction).toBeLessThan(0.001);
      expect(eb.mDotIn_kgs).toBeCloseTo(eb.mDotOut_kgs, 6);
    }
  });

  it('detects HRSG pinch point / temperature approach violation and returns a clear error object without crashing', () => {
    // Low turbine inlet temperature (1100 K) + high pressure ratio (30) lowers T4 below required steam/pinch temperatures
    const violated = solveCombinedCycle({
      T3_K: 1100,
      rp: 30,
    });

    expect(violated.ok).toBe(false);
    expect(violated.error).toBeDefined();
    expect(violated.error?.code).toBe('PINCH_POINT_VIOLATION');
    expect(violated.error?.message.length).toBeGreaterThan(10);

    // Direct evaporator pinch violation (e.g., huge pinch requirement)
    const directPinch = solveCombinedCycle({
      T3_K: 1200,
      rp: 25,
      pinch_K: 150,
    });
    expect(directPinch.ok).toBe(false);
    expect(directPinch.error?.code).toBe('PINCH_POINT_VIOLATION');
  });

  it('covers all 10 thermodynamic laws across the 8 plant components', () => {
    const res = solveCombinedCycle(DEFAULT_PARAMETERS);
    const seenLaws = new Set<LawId>();

    for (const comp of PLANT_COMPONENTS) {
      const laws = evaluateComponentLaws(comp.id, res);
      expect(laws.length).toBeGreaterThan(0);
      for (const l of laws) {
        seenLaws.add(l.lawId);
        expect(l.liveEquation.length).toBeGreaterThan(3);
      }
    }

    expect(seenLaws.size).toBe(10);
  });

  it('handles extreme slider combinations smoothly without throwing or returning NaN', () => {
    const combinations = [
      { T3_K: SLIDER_BOUNDS.T3_K.min, rp: SLIDER_BOUNDS.rp.min },
      { T3_K: SLIDER_BOUNDS.T3_K.min, rp: SLIDER_BOUNDS.rp.max },
      { T3_K: SLIDER_BOUNDS.T3_K.max, rp: SLIDER_BOUNDS.rp.min },
      { T3_K: SLIDER_BOUNDS.T3_K.max, rp: SLIDER_BOUNDS.rp.max },
    ];

    for (const combo of combinations) {
      const res = solveCombinedCycle(combo);
      expect(Number.isNaN(res.netPower_MW)).toBe(false);
      expect(Number.isNaN(res.combinedEfficiency)).toBe(false);
    }
  });
});
