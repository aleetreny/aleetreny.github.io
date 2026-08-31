import { describe, expect, it } from 'vitest';
import { RESIDENTS } from '../residents';
import { ROOM_BY_ID, type RoomId } from '../rooms';
import { AXES } from '../weave';
import { CONDITIONS, genesisState, held, snapshotFrom } from './state';
import { advanceDay, advanceWatch, choose, run } from './tick';
import { attempt } from './verbs';

describe('a watch', () => {
  it('gives everybody exactly one go at it', () => {
    const s = genesisState();
    advanceWatch(s);
    expect(s.watch).toBe(2);
    for (const r of RESIDENTS) expect(s.bodies[r.id].doing.length).toBeGreaterThan(3);
  });

  it('never teleports anybody: a move is always to a connected room', () => {
    const s = genesisState();
    const before = Object.fromEntries(RESIDENTS.map((r) => [r.id, s.bodies[r.id].room]));
    advanceWatch(s);
    for (const r of RESIDENTS) {
      const from = before[r.id]!;
      const to = s.bodies[r.id].room;
      if (from === to) continue;
      expect(ROOM_BY_ID[from].connects, `${r.id} ${from}->${to}`).toContain(to);
    }
  });

  it('never puts anybody in the Breach, which has no air', () => {
    const { state } = run(genesisState(), 12);
    for (const r of RESIDENTS) expect(state.bodies[r.id].room).not.toBe('breach');
  });
});

describe('a day', () => {
  it('runs four watches and lands back on the first', () => {
    const s = genesisState();
    const day = s.day;
    advanceDay(s);
    expect(s.day).toBe(day + 1);
    expect(s.watch).toBe(1);
  });

  it('produces a record of things that happened', () => {
    const s = genesisState();
    advanceDay(s);
    expect(s.record.length).toBeGreaterThan(3);
    for (const e of s.record) {
      expect(e.text.length).toBeGreaterThan(8);
      expect(ROOM_BY_ID[e.room]).toBeDefined();
      expect(e.minute).toBeGreaterThanOrEqual(0);
      expect(e.minute).toBeLessThan(24 * 60);
    }
  });

  it('reads in order, so a day reads as a day', () => {
    const s = genesisState();
    advanceDay(s);
    const byWatch = s.record.map((e) => e.watch);
    expect([...byWatch].sort((a, b) => a - b)).toEqual(byWatch);
  });
});

describe('a month', () => {
  const { state, log } = run(genesisState(), 30);

  it('is deterministic, so the world can be replayed and debugged', () => {
    const again = run(genesisState(), 30);
    expect(again.log.map((e) => `${e.day}:${e.minute}:${e.text}`))
      .toEqual(log.map((e) => `${e.day}:${e.minute}:${e.text}`));
  });

  it('keeps everybody alive and nobody in a state nothing can reach', () => {
    for (const r of RESIDENTS) {
      const b = state.bodies[r.id];
      for (const key of CONDITIONS) {
        expect(b.condition[key], `${r.id} ${key}`).toBeGreaterThanOrEqual(0);
        expect(b.condition[key], `${r.id} ${key}`).toBeLessThanOrEqual(100);
      }
      expect(b.condition.fed, `${r.id} fed`).toBeGreaterThan(10);
    }
  });

  it('keeps every axis in range through thirty days of pushing them about', () => {
    for (const a of RESIDENTS) {
      for (const b of RESIDENTS) {
        if (a.id === b.id) continue;
        const set = held(state, a.id, b.id);
        for (const axis of AXES) {
          expect(set[axis], `${a.id}${b.id} ${axis}`).toBeGreaterThanOrEqual(0);
          expect(set[axis], `${a.id}${b.id} ${axis}`).toBeLessThanOrEqual(100);
        }
      }
    }
  });

  it('runs the reactor down and never back up', () => {
    let last = 1;
    const s = genesisState();
    for (let i = 0; i < 30; i += 1) {
      advanceDay(s);
      expect(s.reactor.output).toBeLessThan(last);
      last = s.reactor.output;
    }
  });

  it('lets nobody hoard their way out, because charge leaks', () => {
    const s = genesisState();
    const idle = 'S';
    s.bodies[idle].cells = 400;
    for (let i = 0; i < 30; i += 1) advanceDay(s);
    expect(s.bodies[idle].cells).toBeLessThan(400);
  });

  it('moves the weave because of what actually happened', () => {
    const before = genesisState();
    const pairs = RESIDENTS.flatMap((a) => RESIDENTS
      .filter((b) => b.id !== a.id)
      .map((b) => [a.id, b.id] as const));
    const moved = pairs.filter(([a, b]) => {
      const then = held(before, a, b);
      const now = held(state, a, b);
      return AXES.some((axis) => Math.abs(then[axis] - now[axis]) > 2);
    });
    expect(moved.length).toBeGreaterThan(20);
  });

  it('writes a record somebody would read', () => {
    const meetings = log.filter((e) => e.kind === 'meeting');
    expect(meetings.length).toBeGreaterThan(20);
    expect(new Set(meetings.map((e) => e.text)).size).toBeGreaterThan(8);
  });
});

describe('the seam where cognition goes', () => {
  it('returns an intent that names a verb and, when social, somebody', () => {
    const s = genesisState();
    const roll = () => 0.5;
    for (const r of RESIDENTS) {
      const intent = choose(s, r.id, roll);
      expect(intent.actor === r.id || intent.target === r.id).toBe(true);
      expect(typeof intent.verb).toBe('string');
    }
  });

  it('refuses an intent the world does not allow, rather than obeying it', () => {
    const s = genesisState();
    // Two people who are nowhere near each other cannot have a conversation,
    // whoever says they did.
    s.bodies.A.room = 'bridge';
    s.bodies.V.room = 'hydroponics';
    const out = attempt(s, { verb: 'speak', actor: 'A', target: 'V' });
    expect(out.ok).toBe(false);
    expect(out.refused).toBe('not in the same room');
  });

  it('refuses a walk through a wall', () => {
    const s = genesisState();
    s.bodies.A.room = 'bridge';
    const out = attempt(s, { verb: 'go', actor: 'A', room: 'hollow' as RoomId });
    expect(out.ok).toBe(false);
    expect(out.refused).toBe('no way through');
  });

  it('refuses to let somebody confide in a person they barely know', () => {
    const s = genesisState();
    s.bodies.C.room = 'common';
    s.bodies.O.room = 'common';
    const out = attempt(s, { verb: 'confide', actor: 'C', target: 'O' });
    expect(out.ok).toBe(false);
    expect(out.refused).toBe('not that close');
  });

  it('charges for what costs, and refuses when there is nothing to spend', () => {
    const s = genesisState();
    s.bodies.Q.cells = 0;
    expect(attempt(s, { verb: 'repair', actor: 'Q' }).refused).toBe('not enough charge');
    s.bodies.Q.cells = 5;
    expect(attempt(s, { verb: 'repair', actor: 'Q' }).ok).toBe(true);
    expect(s.bodies.Q.cells).toBe(3);
  });
});

describe('the way out', () => {
  it('hands the view a snapshot it already knows how to read', () => {
    const s = genesisState();
    run(s, 5);
    const snap = snapshotFrom(s);
    expect(snap.people).toHaveLength(25);
    expect(snap.rooms).toHaveLength(16);
    expect(snap.day).toBe(105);
    for (const room of snap.rooms) {
      const here = snap.people.filter((p) => p.room === room.id).map((p) => p.id);
      expect([...room.occupants].sort()).toEqual(here.sort());
    }
    for (const e of snap.record) {
      expect(e.minute).toBeGreaterThanOrEqual(0);
      expect(e.text.length).toBeGreaterThan(8);
    }
  });

  it('spreads the habitat out over a day instead of piling it into one room', () => {
    const s = genesisState();
    run(s, 12);
    const seen = new Set<string>();
    for (let w = 0; w < 4; w += 1) {
      for (const p of snapshotFrom(s).people) seen.add(p.room);
      advanceWatch(s);
    }
    // A watch is six hours and a doorway is a few steps. If walking costs a
    // whole shift the place collapses into a commute and everybody ends up in
    // the same three rooms.
    expect(seen.size).toBeGreaterThan(9);
  });

  it('writes a day worth reading: enough happening, in enough places', () => {
    const { log } = run(genesisState(), 30);
    expect(Math.round(log.length / 30)).toBeGreaterThan(12);
    expect(new Set(log.map((e) => e.room)).size).toBeGreaterThan(9);
  });
});
