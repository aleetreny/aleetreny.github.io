import { describe, expect, it } from 'vitest';
import { demoEntries } from './demo';

describe('demo content', () => {
  it('contains only public entries with ordered blocks', () => {
    expect(demoEntries.length).toBeGreaterThan(0);
    for (const entry of demoEntries) {
      expect(entry.status).toBe('published');
      expect(entry.blocks.map((block) => block.position)).toEqual(
        [...entry.blocks].sort((a, b) => a.position - b.position).map((block) => block.position),
      );
    }
  });
});
