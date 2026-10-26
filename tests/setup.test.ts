import { describe, expect, it } from 'vitest';
import en from '../src/i18n/en.json';
import fr from '../src/i18n/fr.json';

describe('M0: Dictionary setup', () => {
  it('has matching top-level keys in EN and FR dictionaries', () => {
    expect(Object.keys(en)).toEqual(Object.keys(fr));
    expect(en.disclaimer).toBe('Simplified educational model, not for plant design.');
    expect(fr.disclaimer).toBe('Modèle pédagogique simplifié, non destiné au dimensionnement industriel.');
  });
});
