import { describe, expect, it } from 'vitest';
import { CARD_GAGS, PHOTO_GAGS, PHOTO_GAG_KINDS, UV_GRAFFITI_COUNT } from './graffiti';

describe('night-shift graffiti', () => {
  it('ships at least twenty distinct, intentional retouches', () => {
    const all = [...PHOTO_GAGS, ...CARD_GAGS];
    expect(UV_GRAFFITI_COUNT).toBe(all.length);
    expect(all.length).toBeGreaterThanOrEqual(20);
    expect(new Set(all.map((gag) => gag.id)).size).toBe(all.length);
  });

  it('keeps every photo mark inside its photograph', () => {
    for (const gag of PHOTO_GAGS) {
      expect(PHOTO_GAG_KINDS).toContain(gag.kind);
      expect(gag.photo).toBeGreaterThanOrEqual(0);
      expect(gag.x).toBeGreaterThan(0.1);
      expect(gag.x).toBeLessThan(0.9);
      expect(gag.y).toBeGreaterThan(0.1);
      expect(gag.y).toBeLessThan(0.9);
      // A person far out in a landscape needs a genuinely small mark; the
      // minimum guards against invisible recipes without rejecting precision.
      expect(gag.scale).toBeGreaterThan(0.35);
      expect(gag.scale).toBeLessThanOrEqual(1.2);
    }
  });

  it('targets stable authored cards and gives every rewrite some copy', () => {
    const known = new Set(['hero', 'work', 'edu', 'lab', 'repos', 'hack', 'diary', 'vol', 'random', 'pod', 'contact']);
    for (const gag of CARD_GAGS) {
      expect(known.has(gag.card)).toBe(true);
      expect(gag.copyKey.startsWith('world.uv.gag.')).toBe(true);
      expect(gag.width).toBeGreaterThan(0.2);
      expect(gag.width).toBeLessThan(0.7);
    }
  });
});
