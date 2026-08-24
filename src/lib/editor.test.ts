import { describe, expect, it } from 'vitest';
import { createBlock, normalizeBlockPositions, slugify } from './editor';

describe('editor helpers', () => {
  it('creates stable URL slugs from Spanish titles', () => {
    expect(slugify('Optimización & Predicción 2026')).toBe('optimizacion-prediccion-2026');
  });

  it('normalizes positions after reordering', () => {
    const first = createBlock('text');
    const second = createBlock('metric');
    expect(normalizeBlockPositions([second, first]).map((block) => block.position)).toEqual([0, 1]);
  });

  it('uses the expected property shape for a new image block', () => {
    expect(createBlock('image').props).toEqual({ url: '', alt: '', assetId: '', mediaType: '' });
  });
});
