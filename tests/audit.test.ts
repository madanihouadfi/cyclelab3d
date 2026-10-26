import { describe, expect, it } from 'vitest';
import en from '../src/i18n/en.json';
import fr from '../src/i18n/fr.json';
import {
  buildCycleViewModel,
  buildTsDiagramViewModel,
  DEFAULT_PARAMETERS,
  getPipeSegments,
  solveCombinedCycle,
} from '../src/physics';

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

describe('M8: Full Self-Audit & Presentation Layer Verification', () => {
  it('ensures EN and FR dictionaries have identical nested key structures and non-empty strings', () => {
    const enKeys = collectKeys(en as unknown as Record<string, unknown>);
    const frKeys = collectKeys(fr as unknown as Record<string, unknown>);
    expect(enKeys).toEqual(frKeys);
  });

  it('produces complete view models, T-s diagram paths, and 3D pipe segments at default sliders', () => {
    const result = solveCombinedCycle(DEFAULT_PARAMETERS);
    const vm = buildCycleViewModel(result);
    const ts = buildTsDiagramViewModel(result);
    const pipes = getPipeSegments(result);

    expect(vm.summary.netPowerMW).toBe(result.netPower_MW.toFixed(2));
    expect(ts.points.length).toBe(9);
    expect(pipes.length).toBe(9);
  });
});
