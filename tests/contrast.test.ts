import { describe, expect, it } from 'vitest';
import { contrastRatio, THEME_PALETTES } from '../src/ui/theme';

describe('M6b Accessibility: WCAG AA Contrast Verification (Dark & Light Themes)', () => {
  it('meets WCAG AA (>= 4.5:1) for all normal text and button pairs in Dark Graphite theme', () => {
    const dark = THEME_PALETTES.dark;
    expect(contrastRatio(dark.textPrimary, dark.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(dark.textPrimary, dark.panel)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(dark.textPrimary, dark.panelRaised)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(dark.textMuted, dark.panel)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(dark.textMuted, dark.panelRaised)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(dark.accent, dark.panel)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(dark.accent, dark.panelRaised)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(dark.accentInk, dark.accent)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(dark.primaryBtnInk, dark.primaryBtnBg)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(dark.warningText, dark.warningBg)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(dark.dangerText, dark.dangerBg)).toBeGreaterThanOrEqual(4.5);
  });

  it('meets WCAG AA (>= 4.5:1) for all normal text and button pairs in Light theme', () => {
    const light = THEME_PALETTES.light;
    expect(contrastRatio(light.textPrimary, light.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(light.textPrimary, light.panel)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(light.textPrimary, light.panelRaised)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(light.textMuted, light.panel)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(light.textMuted, light.panelRaised)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(light.accent, light.panel)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(light.accent, light.panelRaised)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(light.accentInk, light.accent)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(light.primaryBtnInk, light.primaryBtnBg)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(light.warningText, light.warningBg)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(light.dangerText, light.dangerBg)).toBeGreaterThanOrEqual(4.5);
  });
});
