import { describe, expect, it } from 'vitest';
import { BLOCK_PALETTE, newBlock, propPairList, propString, propStringList } from './blocks';

describe('dossier blocks', () => {
  it('creates every palette block with sane defaults', () => {
    for (const { type } of BLOCK_PALETTE) {
      const block = newBlock(type, 3);
      expect(block.type).toBe(type);
      expect(block.position).toBe(3);
      expect(typeof block.id).toBe('string');
      expect(block.props).toBeTypeOf('object');
    }
  });

  it('reads props defensively', () => {
    const text = newBlock('text', 0);
    expect(propString(text, 'text')).toBeTypeOf('string');
    const list = newBlock('list', 0);
    expect(propStringList(list, 'items').length).toBeGreaterThan(0);
    const metrics = newBlock('metrics', 0);
    expect(propPairList(metrics, 'items')[0]).toHaveLength(2);
    expect(propString(text, 'missing')).toBe('');
    expect(propStringList(text, 'missing')).toEqual([]);
  });
});
