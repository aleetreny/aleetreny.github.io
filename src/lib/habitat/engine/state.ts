// The world, as it actually stands.
//
// Everything the habitat is at a given instant, and nothing else: no rendering,
// no narration, no model. The engine advances this and emits a record of what it
// did; the view reads a snapshot taken from it. Those are the only two ways out.
//
// The whole thing is deterministic. The seed lives in the state and every random
// draw is taken from a stream derived from (seed, day, watch), so a world can be
// replayed from any point and will do exactly what it did the first time. That
// matters more here than anywhere else in the project: a society nobody can replay
// is a society nobody can debug, and this one is supposed to run for years.

import { mulberry32 } from '../../world/rng';
import { isWalkable } from '../grid';
import { ROOMS, ROOM_BY_ID, type RoomId } from '../rooms';
import { RESIDENTS, type ResidentId } from '../residents';
import { AXES, edges, type Axis } from '../weave';
import type { Point } from '../grid';
import type { HabitatSnapshot } from '../snapshot';

/** The five slow conditions. Nought is dire, a hundred is fine. They move over
 *  days and weeks, and only matter when they degrade — which is when they start
 *  putting pressure on the person carrying them. */
export const CONDITIONS = ['rested', 'fed', 'well', 'safe', 'accompanied'] as const;
export type Condition = (typeof CONDITIONS)[number];

export type Body = {
  id: ResidentId;
  room: RoomId;
  at: Point;
  condition: Record<Condition, number>;
  /** Charge cells held. The universal commodity, and it leaks. */
  cells: number;
  /** How badly this person needs a thought of their own. When cognition is a
   *  scarce resource it goes to whoever has most of this. */
  pressure: number;
  /** The day they last had one. */
  thoughtOn: number;
  /** What they are doing this watch, in the present tense. */
  doing: string;
};

export type RoomBody = {
  id: RoomId;
  /** Whether anybody is paying to light it this watch. */
  lit: boolean;
};

export type Reactor = {
  /** Fraction of first-day output. It only ever falls. */
  output: number;
};

export type Happening = {
  day: number;
  watch: number;
  /** Minutes into the day, so the record sorts and reads as a clock. */
  minute: number;
  room: RoomId;
  who: readonly ResidentId[];
  /** What the engine did. Dry, and true by construction. */
  text: string;
  /** For filtering and for the view. */
  kind: 'work' | 'need' | 'meeting' | 'power' | 'note';
};

/** What one person holds towards another, on all six axes. Directed. */
export type AxisMatrix = Map<string, Record<Axis, number>>;

export type WorldState = {
  seed: number;
  day: number;
  watch: number;
  bodies: Record<ResidentId, Body>;
  rooms: Record<RoomId, RoomBody>;
  reactor: Reactor;
  axes: AxisMatrix;
  /** Only the current day's. Everything older belongs in storage, not memory. */
  record: Happening[];
};

/** A stream nobody else is drawing from, derived from where we are in time. */
export function streamFor(state: WorldState, salt: number): () => number {
  return mulberry32(state.seed * 31 + state.day * 977 + state.watch * 13 + salt);
}

export function axisKey(from: ResidentId, to: ResidentId): string {
  return `${from}${to}`;
}

export function held(state: WorldState, from: ResidentId, to: ResidentId): Record<Axis, number> {
  return state.axes.get(axisKey(from, to))!;
}

/** Where the ship's register expects somebody during a working watch. Several of
 *  these send a person somewhere they are no good, which is the point. */
export const POSTED: Record<ResidentId, RoomId> = {
  A: 'greatwall', B: 'hold', C: 'berths', D: 'dock', E: 'common',
  F: 'face', G: 'cabins', H: 'common', I: 'greatwall', J: 'spine',
  K: 'greatwall', L: 'hold', M: 'common', N: 'infirmary', O: 'well',
  P: 'common', Q: 'workshops', R: 'hold', S: 'common', T: 'common',
  U: 'infirmary', V: 'hydroponics', W: 'spine', X: 'face', Y: 'face',
};

/** Where somebody sleeps. Nine have dug their own; the rest are still in the
 *  cabins, in somebody else's room, among somebody else's things. */
export const SLEEPS: Record<ResidentId, RoomId> = Object.fromEntries(
  RESIDENTS.map((r) => [
    r.id,
    (['X', 'M', 'Q', 'G', 'P', 'O', 'U', 'V', 'Y'] as ResidentId[]).includes(r.id)
      ? 'diggings' : 'cabins',
  ]),
) as Record<ResidentId, RoomId>;

function pointKey(point: Point): string {
  return `${point.x}:${point.y}`;
}

/** Every tile where a body can safely be drawn. Places with something underfoot
 *  come first, then the rest of the walkable floor as overflow. Reading order is
 *  deliberate: together with the resident offset it makes placement replayable. */
function standingSpots(room: RoomId): Point[] {
  const { grid, legend } = ROOM_BY_ID[room];
  const supported: Point[] = [];
  const overflow: Point[] = [];
  for (let y = 0; y < grid.length; y += 1) {
    for (let x = 0; x < (grid[y]?.length ?? 0); x += 1) {
      if (!isWalkable(grid, legend, x, y)) continue;
      const point = { x, y };
      if (!isWalkable(grid, legend, x, y + 1)) supported.push(point);
      else overflow.push(point);
    }
  }
  return [...supported, ...overflow];
}

/** Put one body in a room without ever putting it inside a wall, an object or
 *  another body. Movement changes rooms atomically: failure to find a tile is an
 *  invariant violation and leaves the body where it was. */
export function placeInRoom(state: WorldState, id: ResidentId, room: RoomId): void {
  const occupied = new Set(
    RESIDENTS
      .map((resident) => state.bodies[resident.id])
      .filter((body) => body.id !== id && body.room === room)
      .map((body) => pointKey(body.at)),
  );
  const spots = standingSpots(room);
  const ordinal = RESIDENTS.findIndex((resident) => resident.id === id);
  const start = spots.length === 0
    ? 0
    : (ordinal * 7 + state.day * 3 + state.watch) % spots.length;
  let at: Point | undefined;
  for (let offset = 0; offset < spots.length; offset += 1) {
    const candidate = spots[(start + offset) % spots.length]!;
    if (!occupied.has(pointKey(candidate))) {
      at = candidate;
      break;
    }
  }
  if (!at) throw new RangeError(`No unoccupied walkable tile remains in ${room}`);
  state.bodies[id].room = room;
  state.bodies[id].at = at;
}

/** Day one hundred, as the engine holds it. Built from the authored content, so
 *  the world the engine advances is the world the documents describe. */
export function genesisState(seed = 1): WorldState {
  const rand = mulberry32(seed);
  const bodies = Object.fromEntries(RESIDENTS.map((r) => {
    const room = POSTED[r.id];
    return [r.id, {
      id: r.id,
      room,
      // Replaced below once the complete population exists, so placement can
      // account for everybody already standing in the same room.
      at: { x: -1, y: -1 },
      condition: {
        rested: 60 + Math.floor(rand() * 30),
        fed: 62 + Math.floor(rand() * 30),
        well: 70 + Math.floor(rand() * 26),
        safe: 55 + Math.floor(rand() * 30),
        accompanied: 40 + Math.floor(rand() * 45),
      },
      cells: 8 + Math.floor(rand() * 10),
      pressure: Math.floor(rand() * 20),
      thoughtOn: 100 - Math.floor(rand() * 4),
      doing: 'at their post',
    } satisfies Body];
  })) as Record<ResidentId, Body>;

  const rooms = Object.fromEntries(ROOMS.map((r) => [
    r.id, { id: r.id, lit: r.id !== 'breach' } satisfies RoomBody,
  ])) as Record<RoomId, RoomBody>;

  const axes: AxisMatrix = new Map();
  for (const e of edges('now')) {
    axes.set(axisKey(e.from, e.to), { ...e.axes });
  }

  const state: WorldState = {
    seed,
    day: 100,
    watch: 1,
    bodies,
    rooms,
    reactor: { output: 0.94 },
    axes,
    record: [],
  };
  for (const resident of RESIDENTS) {
    placeInRoom(state, resident.id, POSTED[resident.id]);
  }
  return state;
}

/** Clamp anything that is meant to be a nought-to-a-hundred quantity. */
export function bounded(v: number): number {
  return Math.max(0, Math.min(100, v));
}

export function nudge(
  state: WorldState, from: ResidentId, to: ResidentId, axis: Axis, by: number,
): void {
  const set = state.axes.get(axisKey(from, to));
  if (!set) return;
  set[axis] = bounded(set[axis] + by);
}

/** How much of everything is between two people, in both directions. Used to
 *  decide who is worth crossing a room for. */
export function between(state: WorldState, a: ResidentId, b: ResidentId): number {
  const there = held(state, a, b);
  const back = held(state, b, a);
  return AXES.reduce((n, axis) => n + there[axis] + back[axis], 0) / (AXES.length * 2);
}

/** The world as the window is allowed to see it.
 *
 *  The only way out. The view has read a snapshot since the day it was written,
 *  which is what makes wiring a live world into it one function rather than a
 *  rewrite — and what will let the simulation move to a scheduler somewhere else
 *  without the frontend noticing. */
export function snapshotFrom(state: WorldState): HabitatSnapshot {
  const people = RESIDENTS.map((r) => {
    const b = state.bodies[r.id];
    return { id: r.id, room: b.room, at: b.at, doing: b.doing };
  });
  const occupants = new Map<RoomId, ResidentId[]>();
  for (const p of people) {
    const list = occupants.get(p.room) ?? [];
    list.push(p.id);
    occupants.set(p.room, list);
  }
  return {
    day: state.day,
    watch: Math.min(4, Math.max(1, state.watch)) as 1 | 2 | 3 | 4,
    power: state.reactor.output,
    rooms: ROOMS.map((r) => ({
      id: r.id,
      occupants: occupants.get(r.id) ?? [],
      lit: state.rooms[r.id].lit,
    })),
    people,
    // Closing watch IV advances the world to the next day while retaining the
    // completed record long enough for the persistence adapter to archive it.
    // Never label those previous-day entries as the new day's live record.
    record: state.record.filter((e) => e.day === state.day).map((e) => ({
      minute: e.minute, room: e.room, who: e.who, text: e.text,
    })),
  };
}
