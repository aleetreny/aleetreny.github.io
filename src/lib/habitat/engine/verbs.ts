// What a person can do, and what it costs them.
//
// A verb is engine code, not narration. Each one carries physical preconditions —
// where you are, what you hold, who is present, what power there is — and a
// deterministic effect. Whoever is choosing, whether that is the routine policy
// or a model, only ever names a verb and a target. **The engine validates and
// executes.** Nothing that says it happened makes it happen.
//
// This is the working subset: the verbs a day is made of. The catalogue is a flat
// table on purpose, so the rest of the hundred and ten are additions rather than
// changes — a new verb is a new row, and nothing else moves.

import { ROOM_BY_ID, type RoomId } from '../rooms';
import { RESIDENT_BY_ID, type ResidentId } from '../residents';
import {
  bounded, nudge, placeInRoom, type Body, type Condition, type Happening, type WorldState,
} from './state';

export type VerbFamily =
  | 'body' | 'objects' | 'work' | 'talk' | 'affection' | 'commitment' | 'knowledge';

export type Intent = {
  verb: VerbName;
  actor: ResidentId;
  /** Where the verb wants to happen, for the ones that move somebody. */
  room?: RoomId;
  /** Who it is aimed at. */
  target?: ResidentId;
};

export type IntentDecodeResult =
  | { ok: true; intent: Intent }
  | { ok: false; error: string };

export type Outcome = {
  ok: boolean;
  /** Why not, when it did not. Kept because a refused intent is data: it is
   *  pressure, and pressure is what buys a person a thought. */
  refused?: string;
  happening?: Omit<Happening, 'day' | 'watch' | 'minute'>;
};

export type Verb = {
  name: string;
  family: VerbFamily;
  /** Charge cells the actor spends. Most things are free; making things is not. */
  cost?: number;
  /** Whether the actor must be somewhere in particular. */
  requires?: (state: WorldState, intent: Intent) => string | null;
  run: (state: WorldState, intent: Intent) => Omit<Happening, 'day' | 'watch' | 'minute'> | null;
};

const CATALOGUE = [
  'go', 'rest', 'sleep', 'eat', 'drink', 'wash',
  'work', 'dig', 'grow', 'cook', 'clean', 'inspect', 'repair', 'charge',
  'speak', 'ask', 'listen', 'joke', 'argue', 'confide',
  'greet', 'accompany', 'console', 'avoid', 'seek out',
  'observe', 'note', 'teach',
] as const;
export type VerbName = (typeof CATALOGUE)[number];

const INTENT_FIELDS = new Set(['verb', 'room', 'target']);

function hasOwn(value: object, key: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

/** Decode a model proposal without ever letting the model choose who is acting.
 *
 * This validates only the protocol boundary: known identifiers and no hidden
 * fields. Whether the proposal is possible in the current world remains solely
 * `attempt`'s decision. */
export function decodeIntentFor(actor: unknown, raw: unknown): IntentDecodeResult {
  if (typeof actor !== 'string' || !hasOwn(RESIDENT_BY_ID, actor)) {
    return { ok: false, error: 'unknown actor' };
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { ok: false, error: 'intent must be an object' };
  }
  const candidate = raw as Record<string, unknown>;
  const unexpected = Object.keys(candidate).find((key) => !INTENT_FIELDS.has(key));
  if (unexpected) return { ok: false, error: `unexpected field: ${unexpected}` };
  if (!hasOwn(candidate, 'verb') || typeof candidate.verb !== 'string'
    || !(CATALOGUE as readonly string[]).includes(candidate.verb)) {
    return { ok: false, error: 'unknown verb' };
  }
  if (hasOwn(candidate, 'room')
    && (typeof candidate.room !== 'string' || !hasOwn(ROOM_BY_ID, candidate.room))) {
    return { ok: false, error: 'unknown room' };
  }
  if (hasOwn(candidate, 'target')
    && (typeof candidate.target !== 'string' || !hasOwn(RESIDENT_BY_ID, candidate.target))) {
    return { ok: false, error: 'unknown target' };
  }

  const intent: Intent = {
    actor: actor as ResidentId,
    verb: candidate.verb as VerbName,
  };
  if (hasOwn(candidate, 'room')) intent.room = candidate.room as RoomId;
  if (hasOwn(candidate, 'target')) intent.target = candidate.target as ResidentId;
  return { ok: true, intent };
}

function body(state: WorldState, id: ResidentId): Body {
  return state.bodies[id];
}

function condition(b: Body, key: Condition, by: number): void {
  b.condition[key] = bounded(b.condition[key] + by);
}

function first(name: ResidentId): string {
  return RESIDENT_BY_ID[name].name.split(' ')[0]!;
}

/** Both of them must be standing in the same room for anything social to be
 *  possible. This is the precondition that stops a model from having two people
 *  talk across the habitat because it would be convenient. */
function together(state: WorldState, intent: Intent): string | null {
  if (!intent.target) return 'nobody named';
  if (intent.target === intent.actor) return 'alone';
  const a = body(state, intent.actor);
  const b = body(state, intent.target);
  if (a.room !== b.room) return 'not in the same room';
  return null;
}

/** How a conversation moves the six axes. Warm verbs move affection and trust,
 *  hard ones move resentment, and every one of them moves `accompanied`, because
 *  even an argument is company. */
function social(
  state: WorldState, intent: Intent,
  moves: Array<[Parameters<typeof nudge>[3], number, number]>,
  text: (a: string, b: string) => string,
  kind: Happening['kind'] = 'meeting',
): Omit<Happening, 'day' | 'watch' | 'minute'> {
  const { actor } = intent;
  const target = intent.target!;
  for (const [axis, fwd, bwd] of moves) {
    nudge(state, actor, target, axis, fwd);
    nudge(state, target, actor, axis, bwd);
  }
  // Enough that company actually answers loneliness. At nine it never did, so
  // the need stayed lit for everybody all the time and drowned out every other
  // reason a person might have to do anything.
  condition(body(state, actor), 'accompanied', 24);
  condition(body(state, target), 'accompanied', 24);
  return {
    room: body(state, actor).room,
    who: [actor, target],
    text: text(first(actor), first(target)),
    kind,
  };
}

export const VERBS: Record<VerbName, Verb> = {
  go: {
    name: 'go',
    family: 'body',
    requires: (state, intent) => {
      if (!intent.room) return 'nowhere named';
      const here = body(state, intent.actor).room;
      if (here === intent.room) return 'already there';
      // You can only walk to somewhere this room actually connects to.
      if (!ROOM_BY_ID[here].connects.includes(intent.room)) return 'no way through';
      if (intent.room === 'breach') return 'no air, and the suits are logged out';
      return null;
    },
    run: (state, intent) => {
      const b = body(state, intent.actor);
      placeInRoom(state, intent.actor, intent.room!);
      condition(b, 'rested', -2);
      return null;
    },
  },

  rest: {
    name: 'rest',
    family: 'body',
    run: (state, intent) => {
      condition(body(state, intent.actor), 'rested', 14);
      return null;
    },
  },

  sleep: {
    name: 'sleep',
    family: 'body',
    run: (state, intent) => {
      const b = body(state, intent.actor);
      condition(b, 'rested', 46);
      condition(b, 'well', 4);
      return null;
    },
  },

  eat: {
    name: 'eat',
    family: 'body',
    requires: (state, intent) => (
      body(state, intent.actor).room === 'common' ? null : 'nothing to eat here'
    ),
    run: (state, intent) => {
      const b = body(state, intent.actor);
      condition(b, 'fed', 46);
      return null;
    },
  },

  drink: {
    name: 'drink',
    family: 'body',
    run: (state, intent) => {
      condition(body(state, intent.actor), 'fed', 6);
      return null;
    },
  },

  wash: {
    name: 'wash',
    family: 'body',
    requires: (state, intent) => (
      body(state, intent.actor).room === 'well' ? null : 'no water here'
    ),
    run: (state, intent) => {
      condition(body(state, intent.actor), 'well', 8);
      return null;
    },
  },

  work: {
    name: 'work',
    family: 'work',
    run: (state, intent) => {
      const b = body(state, intent.actor);
      condition(b, 'rested', -9);
      b.cells += 1;
      return null;
    },
  },

  dig: {
    name: 'dig',
    family: 'work',
    requires: (state, intent) => (
      body(state, intent.actor).room === 'face' ? null : 'nothing to cut here'
    ),
    run: (state, intent) => {
      const b = body(state, intent.actor);
      condition(b, 'rested', -16);
      b.cells += 2;
      return { room: 'face', who: [intent.actor], text: 'Rock cut at the face.', kind: 'work' };
    },
  },

  grow: {
    name: 'grow',
    family: 'work',
    requires: (state, intent) => (
      body(state, intent.actor).room === 'hydroponics' ? null : 'nothing growing here'
    ),
    run: (state, intent) => {
      const b = body(state, intent.actor);
      condition(b, 'rested', -8);
      b.cells += 1;
      return null;
    },
  },

  cook: {
    name: 'cook',
    family: 'work',
    requires: (state, intent) => (
      body(state, intent.actor).room === 'common' ? null : 'no burners here'
    ),
    run: (state, intent) => {
      const b = body(state, intent.actor);
      condition(b, 'rested', -7);
      b.cells += 1;
      return null;
    },
  },

  clean: {
    name: 'clean',
    family: 'work',
    run: (state, intent) => {
      const b = body(state, intent.actor);
      condition(b, 'rested', -5);
      condition(b, 'well', 2);
      return null;
    },
  },

  inspect: {
    name: 'inspect',
    family: 'work',
    run: (state, intent) => {
      const b = body(state, intent.actor);
      condition(b, 'rested', -4);
      return {
        room: b.room,
        who: [intent.actor],
        text: `${ROOM_BY_ID[b.room].name} was walked through and looked over.`,
        kind: 'work',
      };
    },
  },

  repair: {
    name: 'repair',
    family: 'work',
    cost: 2,
    run: (state, intent) => {
      const b = body(state, intent.actor);
      condition(b, 'rested', -10);
      condition(b, 'safe', 5);
      return {
        room: b.room,
        who: [intent.actor],
        text: `Something in ${ROOM_BY_ID[b.room].name} was put back together.`,
        kind: 'work',
      };
    },
  },

  charge: {
    name: 'charge',
    family: 'work',
    requires: (state, intent) => (
      body(state, intent.actor).room === 'spine' ? null : 'no rack here'
    ),
    run: (state, intent) => {
      body(state, intent.actor).cells += 3;
      return null;
    },
  },

  speak: {
    name: 'speak',
    family: 'talk',
    requires: together,
    run: (state, intent) => social(state, intent, [
      ['trust', 1, 1], ['affection', 1, 1],
    ], (a, b) => `${a} and ${b} spoke.`),
  },

  ask: {
    name: 'ask',
    family: 'talk',
    requires: together,
    run: (state, intent) => social(state, intent, [
      ['trust', 2, 1], ['admiration', 0, 2],
    ], (a, b) => `${a} asked ${b} something, and ${b} answered.`),
  },

  listen: {
    name: 'listen',
    family: 'talk',
    requires: together,
    run: (state, intent) => social(state, intent, [
      ['trust', 1, 3], ['affection', 1, 2],
    ], (a, b) => `${b} talked and ${a} listened.`),
  },

  joke: {
    name: 'joke',
    family: 'talk',
    requires: together,
    run: (state, intent) => social(state, intent, [
      ['affection', 3, 3], ['resentment', -2, -2],
    ], (a, b) => `${a} made ${b} laugh.`),
  },

  argue: {
    name: 'argue',
    family: 'talk',
    requires: together,
    run: (state, intent) => social(state, intent, [
      ['resentment', 5, 5], ['trust', -2, -2], ['admiration', 0, 1],
    ], (a, b) => `${a} and ${b} argued.`),
  },

  confide: {
    name: 'confide',
    family: 'talk',
    requires: (state, intent) => {
      const near = together(state, intent);
      if (near) return near;
      // You do not tell somebody something that matters unless you already
      // trust them, which is the whole reason it means anything when you do.
      const t = state.axes.get(`${intent.actor}${intent.target}`)!.trust;
      return t >= 55 ? null : 'not that close';
    },
    run: (state, intent) => social(state, intent, [
      ['trust', 4, 6], ['affection', 3, 4],
    ], (a, b) => `${a} told ${b} something ${a} had told nobody.`),
  },

  greet: {
    name: 'greet',
    family: 'affection',
    requires: together,
    run: (state, intent) => social(state, intent, [['affection', 1, 1]],
      (a, b) => `${a} greeted ${b}.`),
  },

  accompany: {
    name: 'accompany',
    family: 'affection',
    requires: together,
    run: (state, intent) => social(state, intent, [
      ['affection', 2, 2], ['trust', 1, 1],
    ], (a, b) => `${a} sat with ${b} a while.`),
  },

  console: {
    name: 'console',
    family: 'affection',
    requires: (state, intent) => {
      const near = together(state, intent);
      if (near) return near;
      const t = body(state, intent.target!);
      const low = Math.min(t.condition.well, t.condition.accompanied, t.condition.safe);
      return low < 45 ? null : 'nothing the matter';
    },
    run: (state, intent) => {
      const out = social(state, intent, [
        ['affection', 3, 6], ['trust', 2, 5], ['debt', 0, 4],
      ], (a, b) => `${b} was in a bad way. ${a} stayed.`);
      const t = body(state, intent.target!);
      condition(t, 'safe', 12);
      condition(t, 'well', 6);
      return out;
    },
  },

  avoid: {
    name: 'avoid',
    family: 'affection',
    requires: together,
    run: (state, intent) => {
      nudge(state, intent.actor, intent.target!, 'affection', -2);
      nudge(state, intent.target!, intent.actor, 'resentment', 3);
      condition(body(state, intent.target!), 'accompanied', -4);
      return null;
    },
  },

  'seek out': {
    name: 'seek out',
    family: 'affection',
    requires: (state, intent) => {
      if (!intent.target) return 'nobody named';
      const a = body(state, intent.actor);
      const b = body(state, intent.target);
      if (a.room === b.room) return 'already there';
      if (!ROOM_BY_ID[a.room].connects.includes(b.room)) return 'too far to go looking';
      return null;
    },
    run: (state, intent) => {
      const a = body(state, intent.actor);
      placeInRoom(state, intent.actor, body(state, intent.target!).room);
      condition(a, 'rested', -3);
      nudge(state, intent.actor, intent.target!, 'affection', 1);
      return null;
    },
  },

  observe: {
    name: 'observe',
    family: 'knowledge',
    run: () => null,
  },

  note: {
    name: 'note',
    family: 'knowledge',
    requires: (state, intent) => (
      intent.actor === 'A' ? null : 'not their job, though nobody has said so'
    ),
    run: (state, intent) => ({
      room: body(state, intent.actor).room,
      who: [intent.actor],
      text: 'Something was written down that was not an event.',
      kind: 'note',
    }),
  },

  teach: {
    name: 'teach',
    family: 'knowledge',
    requires: together,
    run: (state, intent) => social(state, intent, [
      ['admiration', 0, 5], ['trust', 2, 3], ['debt', 0, 3],
    ], (a, b) => `${a} showed ${b} how something is done.`),
  },
};

export const VERB_NAMES = CATALOGUE;

/** Try an intent. Refusals are returned rather than thrown, because a refused
 *  intent is information: somebody wanted something and the world said no, and
 *  that is exactly the kind of thing that should cost them a thought later. */
export function attempt(state: WorldState, intent: Intent): Outcome {
  const verb = VERBS[intent.verb];
  if (!verb) return { ok: false, refused: 'no such verb' };
  const why = verb.requires?.(state, intent) ?? null;
  if (why) return { ok: false, refused: why };
  const cost = verb.cost ?? 0;
  const b = body(state, intent.actor);
  if (cost > 0 && b.cells < cost) return { ok: false, refused: 'not enough charge' };
  b.cells -= cost;
  const happening = verb.run(state, intent);
  return happening ? { ok: true, happening } : { ok: true };
}
