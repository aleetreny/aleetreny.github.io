import { describe, expect, it } from 'vitest';
import {
  CARD_GAGS, CARD_GAG_KINDS, PHOTO_GAGS, PHOTO_GAG_KINDS, UV_GRAFFITI_COUNT,
} from './graffiti';

describe('night-shift graffiti', () => {
  it('ships at least twenty distinct, intentional retouches', () => {
    const all = [...PHOTO_GAGS, ...CARD_GAGS];
    expect(UV_GRAFFITI_COUNT).toBe(all.length);
    expect(all.length).toBeGreaterThanOrEqual(20);
    expect(new Set(all.map((gag) => gag.id)).size).toBe(all.length);
  });

  it('calibrates one graphic intervention for every shipped photograph', () => {
    expect(PHOTO_GAGS).toHaveLength(14);
    expect(new Set(PHOTO_GAGS.map((gag) => gag.photo))).toEqual(new Set(Array.from({ length: 14 }, (_, index) => index)));
    for (const gag of PHOTO_GAGS) {
      expect(PHOTO_GAG_KINDS).toContain(gag.kind);
      expect(gag.photo).toBeGreaterThanOrEqual(0);
      expect(gag.anchors.length).toBeGreaterThan(0);
      for (const anchor of gag.anchors) {
        expect(anchor.x).toBeGreaterThan(0.05);
        expect(anchor.x).toBeLessThan(0.95);
        expect(anchor.y).toBeGreaterThan(0.1);
        expect(anchor.y).toBeLessThan(0.9);
        expect(anchor.scale).toBeGreaterThan(0.15);
        expect(anchor.scale).toBeLessThanOrEqual(0.7);
      }
    }
  });

  it('targets stable authored cards with graphic-only recipes', () => {
    const known = new Set(['hero', 'work', 'edu', 'lab', 'repos', 'hack', 'diary', 'vol', 'random', 'pod', 'contact']);
    for (const gag of CARD_GAGS) {
      expect(known.has(gag.card)).toBe(true);
      expect(CARD_GAG_KINDS).toContain(gag.kind);
      expect('copyKey' in gag).toBe(false);
      expect(gag.width).toBeGreaterThan(0.15);
      expect(gag.width).toBeLessThan(0.3);
    }
  });
});
