import { describe, expect, it } from 'vitest';
import { demoEntries, demoSettings } from './demo';
import { GROUP_SEQUENCE } from '../lib/board';

describe('demo content', () => {
  it('contains only published entries with ordered blocks', () => {
    expect(demoEntries.length).toBeGreaterThan(0);
    for (const entry of demoEntries) {
      expect(entry.status).toBe('published');
      expect(entry.blocks.map((block) => block.position)).toEqual(
        [...entry.blocks].sort((a, b) => a.position - b.position).map((block) => block.position),
      );
    }
  });

  it('assigns every entry to a documented drawer and keeps link URLs valid', () => {
    const groups = new Set<string>(GROUP_SEQUENCE);
    for (const entry of demoEntries) {
      expect(groups.has(String(entry.metadata.group))).toBe(true);
      const links = entry.metadata.links;
      if (Array.isArray(links)) {
        for (const link of links) {
          const href = Array.isArray(link) ? link[1] : '';
          expect(() => new URL(String(href))).not.toThrow();
        }
      }
    }
  });

  it('publishes public theme and board settings', () => {
    expect(demoSettings.theme).toBeTruthy();
    expect(demoSettings.board).toBeTruthy();
    expect(demoSettings['board.layout']).toBeDefined();
  });
});
