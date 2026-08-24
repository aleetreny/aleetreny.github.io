import { describe, expect, it } from 'vitest';
import { BLOCK_TYPES, insertAfterId, newBlock, propPairList, propString, propStringList, reorderById, updateById } from './blocks';

describe('dossier blocks', () => {
  it('creates every palette block with sane defaults', () => {
    for (const type of BLOCK_TYPES) {
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

  it('reorders a block around its drop target', () => {
    const blocks = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
    expect(reorderById(blocks, 'a', 'c').map((block) => block.id)).toEqual(['b', 'a', 'c', 'd']);
    expect(reorderById(blocks, 'd', 'b', true).map((block) => block.id)).toEqual(['a', 'b', 'd', 'c']);
    expect(reorderById(blocks, 'b', 'b')).toBe(blocks);
  });

  it('inserts a block immediately after its target', () => {
    const blocks = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    expect(insertAfterId(blocks, 'b', { id: 'new' }).map((block) => block.id)).toEqual(['a', 'b', 'new', 'c']);
    expect(insertAfterId(blocks, 'missing', { id: 'new' }).map((block) => block.id)).toEqual(['a', 'b', 'c', 'new']);
  });

  it('ignores a late update for a deleted block', () => {
    const remaining = [{ id: 'a', text: 'Still here' }];
    expect(updateById(remaining, 'deleted', (block) => ({ ...block, text: 'Stale edit' }))).toBe(remaining);
  });
});
