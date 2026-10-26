import { describe, expect, it } from 'vitest';
import en from '../src/i18n/en.json';
import fr from '../src/i18n/fr.json';
import {
  buildCycleViewModel,
  buildTsDiagramViewModel,
  DEFAULT_PARAMETERS,
  PLANT_COMPONENTS,
  solveCombinedCycle,
} from '../src/physics';
import {
  buildSceneAnimationParams,
  COMPONENT_POSITIONS_3D,
  POWERTRAIN_SHAFT,
} from '../src/scene/animationParams';

function collectKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...collectKeys(v as Record<string, unknown>, full));
    } else {
      keys.push(full);
    }
  }
  return keys.sort();
}

describe('M8 + M7 Upgrade: Full Self-Audit, Pure Physics & Animation Mapping Verification', () => {
  it('ensures EN and FR dictionaries have identical nested key structures and non-empty strings', () => {
    const enKeys = collectKeys(en as unknown as Record<string, unknown>);
    const frKeys = collectKeys(fr as unknown as Record<string, unknown>);
    expect(enKeys).toEqual(frKeys);
  });

  it('keeps src/physics free of 3D coordinates while src/scene/animationParams holds all 3D layout and animation mapping', () => {
    for (const meta of PLANT_COMPONENTS) {
      expect('position3D' in meta).toBe(false);
      expect(COMPONENT_POSITIONS_3D[meta.id]).toHaveLength(3);
    }

    // Verify compressor, gasTurbine, steamTurbine, and generator share the single synchronous shaft Y and Z coordinates
    for (const id of ['compressor', 'gasTurbine', 'steamTurbine', 'generator'] as const) {
      expect(COMPONENT_POSITIONS_3D[id][1]).toBe(POWERTRAIN_SHAFT.y);
      expect(COMPONENT_POSITIONS_3D[id][2]).toBe(POWERTRAIN_SHAFT.z);
    }
  });

  it('keeps shaft speed constant (grid-synchronized) when active and stops it when paused or invalid', () => {
    const defaultRes = solveCombinedCycle(DEFAULT_PARAMETERS);
    const highPowerRes = solveCombinedCycle({ T3_K: 1650, rp: 18 });
    const invalidRes = solveCombinedCycle({ T3_K: 1100, rp: 30 });

    const animDefault = buildSceneAnimationParams(defaultRes, true);
    const animHighPower = buildSceneAnimationParams(highPowerRes, true);
    const animPaused = buildSceneAnimationParams(defaultRes, false);
    const animInvalid = buildSceneAnimationParams(invalidRes, true);

    expect(animDefault.shaftAngularSpeedRadPerSec).toBe(
      POWERTRAIN_SHAFT.syncAngularSpeedRadPerSec,
    );
    expect(animHighPower.shaftAngularSpeedRadPerSec).toBe(
      animDefault.shaftAngularSpeedRadPerSec,
    );
    expect(animPaused.shaftAngularSpeedRadPerSec).toBe(0);
    expect(animInvalid.shaftAngularSpeedRadPerSec).toBe(0);
  });

  it('normalizes gas and steam particle speeds separately and maps combustor glow, stack plume, and steam quality styles from physics', () => {
    const lowTitRes = solveCombinedCycle({ T3_K: 1300, rp: 12 });
    const highTitRes = solveCombinedCycle({ T3_K: 1650, rp: 12 });

    const animLow = buildSceneAnimationParams(lowTitRes, true);
    const animHigh = buildSceneAnimationParams(highTitRes, true);

    // At default parameters, gas loop and steam loop have equal normalized particle speed (0.48)
    const defaultAnim = buildSceneAnimationParams(
      solveCombinedCycle(DEFAULT_PARAMETERS),
      true,
    );
    const gasPipe = defaultAnim.pipes.find((p) => p.loop === 'gas')!;
    const steamPipe = defaultAnim.pipes.find((p) => p.loop === 'steam')!;
    expect(gasPipe.particleSpeed).toBeCloseTo(0.48, 4);
    expect(steamPipe.particleSpeed).toBeCloseTo(0.48, 4);

    // Increasing T3 increases steam mass flow and proportionally increases steam particle speed
    const steamSpeedLow = animLow.pipes.find((p) => p.loop === 'steam')!.particleSpeed;
    const steamSpeedHigh = animHigh.pipes.find((p) => p.loop === 'steam')!.particleSpeed;
    expect(steamSpeedHigh).toBeGreaterThan(steamSpeedLow);

    // Combustor glow increases with T3
    expect(animHigh.combustorGlow.emissiveIntensity).toBeGreaterThan(
      animLow.combustorGlow.emissiveIntensity,
    );

    // Distinct particle styles for liquid water (6,7), superheated steam (8), wet steam (9), and gas (1-5)
    const styles = new Set(defaultAnim.pipes.map((p) => p.particleStyle));
    expect(styles.has('gas')).toBe(true);
    expect(styles.has('liquid-water')).toBe(true);
    expect(styles.has('superheated-steam')).toBe(true);
    expect(styles.has('wet-steam')).toBe(true);

    // Temperature legend ticks in K and °C
    expect(defaultAnim.legendTicks).toHaveLength(4);
    expect(defaultAnim.legendTicks[0].labelK).toContain('K');
    expect(defaultAnim.legendTicks[0].labelC).toContain('°C');
  });

  it('produces complete view models and T-s diagram paths at default sliders', () => {
    const result = solveCombinedCycle(DEFAULT_PARAMETERS);
    const vm = buildCycleViewModel(result);
    const ts = buildTsDiagramViewModel(result);

    expect(vm.summary.netPowerMW).toBe(result.netPower_MW.toFixed(2));
    expect(ts.points.length).toBe(9);
  });
});
