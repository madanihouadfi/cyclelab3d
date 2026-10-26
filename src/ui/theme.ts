export type ThemeMode = 'dark' | 'light';

export type NavSectionId =
  | 'plant'
  | 'parameters'
  | 'laws'
  | 'calculations'
  | 'diagram'
  | 'results';

export type ViewMode = 'realistic' | 'xray' | 'temperature';

export interface ThemePalette {
  bg: string;
  panel: string;
  panelRaised: string;
  border: string;
  textPrimary: string;
  textMuted: string;
  accent: string;
  accentInk: string;
  primaryBtnBg: string;
  primaryBtnInk: string;
  warningText: string;
  warningBg: string;
  dangerText: string;
  dangerBg: string;
}

/**
 * Dark graphite theme (near-black background, dark grey floating panels, one teal accent)
 * and accessible Light theme with dark-teal accent meeting WCAG AA contrast.
 */
export const THEME_PALETTES: Record<ThemeMode, ThemePalette> = {
  dark: {
    bg: '#0a0c0f',
    panel: '#15181c',
    panelRaised: '#1c2025',
    border: '#262b31',
    textPrimary: '#e8ecef',
    textMuted: '#9aa3ad',
    accent: '#2dd4bf',
    accentInk: '#042f2a',
    primaryBtnBg: '#ffffff',
    primaryBtnInk: '#0a0c0f',
    warningText: '#fcd34d',
    warningBg: '#261f10',
    dangerText: '#fecaca',
    dangerBg: '#2d1215',
  },
  light: {
    bg: '#eef1f4',
    panel: '#ffffff',
    panelRaised: '#f3f5f8',
    border: '#d1d5db',
    textPrimary: '#111827',
    textMuted: '#4b5563',
    accent: '#0f766e',
    accentInk: '#ffffff',
    primaryBtnBg: '#111827',
    primaryBtnInk: '#ffffff',
    warningText: '#92400e',
    warningBg: '#fef3c7',
    dangerText: '#991b1b',
    dangerBg: '#fee2e2',
  },
};

/**
 * Parses a 6-digit hex color string (#rrggbb) into [r, g, b] in 0..255.
 */
export function parseHexRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return [r, g, b];
}

/**
 * Computes WCAG 2.1 relative luminance L in [0, 1].
 */
export function relativeLuminance(hex: string): number {
  const [r8, g8, b8] = parseHexRgb(hex);
  const toLinear = (c8: number) => {
    const s = c8 / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const r = toLinear(r8);
  const g = toLinear(g8);
  const b = toLinear(b8);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Computes WCAG 2.1 contrast ratio between two hex colors in [1, 21].
 */
export function contrastRatio(hexA: string, hexB: string): number {
  const la = relativeLuminance(hexA);
  const lb = relativeLuminance(hexB);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}
