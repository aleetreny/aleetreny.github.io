import { describe, expect, it } from 'vitest';
import { demoEntries, demoSettings } from './demo';
import { parseBoard } from '../lib/board';

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

  it('keeps every entry reachable from the board and its link URLs valid', () => {
    const board = parseBoard(demoSettings.board);
    const groups = new Set<string>(board.groups.map((g) => g.id));
    // A dossier reaches the board either through a drawer's list or through a
    // card that opens it directly — a spotlight, a sticker, the `now` lines.
    // Belonging to no list is a real state, not a broken one, so the invariant
    // is reachability rather than membership.
    const opened = new Set<string>(
      board.cards.flatMap((card) => [card.open, card.current, card.next].filter(Boolean) as string[]),
    );
    for (const entry of demoEntries) {
      expect(groups.has(String(entry.metadata.group)) || opened.has(entry.slug)).toBe(true);
      for (const block of entry.blocks) {
        if (block.type !== 'links') continue;
        const items = block.props.items;
        if (!Array.isArray(items)) continue;
        for (const pair of items) {
          const href = Array.isArray(pair) ? pair[1] : '';
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
