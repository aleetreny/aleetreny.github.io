import { describe, expect, it } from 'vitest';
import { drawerNumberFromKicker } from './BoardCards';

describe('drawer kickers', () => {
  it('keeps only the editable number from a legacy full kicker', () => {
    expect(drawerNumberFromKicker('drawer 01 — paid work')).toBe('01');
  });

  it('accepts a number-only kicker and safely ignores copy without one', () => {
    expect(drawerNumberFromKicker('12')).toBe('12');
    expect(drawerNumberFromKicker('professional experience')).toBe('');
  });
});
