import { describe, it, expect } from 'vitest';
import { LANG_BCP47, normalizeLangKey } from '../lib/audio';

describe('Zero-Lag Audio Engine & Multi-Lingual Sync', () => {
  it('normalizes language inputs from codes, native labels, and English names', () => {
    expect(normalizeLangKey('kn')).toBe('ಕನ್ನಡ');
    expect(normalizeLangKey('Kannada')).toBe('ಕನ್ನಡ');
    expect(normalizeLangKey('ಕನ್ನಡ')).toBe('ಕನ್ನಡ');

    expect(normalizeLangKey('hi')).toBe('हिंदी');
    expect(normalizeLangKey('Hindi')).toBe('हिंदी');
    expect(normalizeLangKey('हिंदी')).toBe('हिंदी');

    expect(normalizeLangKey('en')).toBe('English');
    expect(normalizeLangKey('English')).toBe('English');

    expect(normalizeLangKey('ta')).toBe('தமிழ்');
    expect(normalizeLangKey('te')).toBe('తెలుగు');
    expect(normalizeLangKey('mr')).toBe('मराठी');
    expect(normalizeLangKey('bn')).toBe('বাংলা');
    expect(normalizeLangKey('gu')).toBe('ગુજરાતી');
    expect(normalizeLangKey('ml')).toBe('മലയാളം');
    expect(normalizeLangKey('pa')).toBe('ਪੰਜਾਬੀ');
  });

  it('maps all language variants to correct BCP47 voice tags', () => {
    expect(LANG_BCP47['en']).toBe('en-US');
    expect(LANG_BCP47['English']).toBe('en-US');

    expect(LANG_BCP47['kn']).toBe('kn-IN');
    expect(LANG_BCP47['ಕನ್ನಡ']).toBe('kn-IN');

    expect(LANG_BCP47['hi']).toBe('hi-IN');
    expect(LANG_BCP47['हिंदी']).toBe('hi-IN');

    expect(LANG_BCP47['ta']).toBe('ta-IN');
    expect(LANG_BCP47['te']).toBe('te-IN');
    expect(LANG_BCP47['mr']).toBe('mr-IN');
    expect(LANG_BCP47['bn']).toBe('bn-IN');
    expect(LANG_BCP47['gu']).toBe('gu-IN');
    expect(LANG_BCP47['ml']).toBe('ml-IN');
    expect(LANG_BCP47['pa']).toBe('pa-IN');
  });
});
