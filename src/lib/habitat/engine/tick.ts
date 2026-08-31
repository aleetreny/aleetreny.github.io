// The world advancing.
//
// Four watches to a day, inherited from the ship. Inside a watch the engine does
// not run a script: it lets everybody act, and what comes out is whatever their
// bodies, their posts and the people standing next to them make likely. The
// record is emitted from state that actually changed, never from a description of
// something that was supposed to have happened.
//
// There is no model here and there is deliberately a hole where one goes. The
// `choose` function is the seam: today it is a routine policy that reads needs and
// proximity, and a scarce oracle will one day be asked for the same thing — a verb
// and a target — for whichever handful of people have the most pressure. Both
// answers go through `attempt`, which is what stops either of them from asserting
// a fact into the world.

import { ROOM_BY_ID, type RoomId } from '../rooms';
import { RESIDENTS, type ResidentId } from '../residents';
import {
  CONDITIONS, POSTED, SLEEPS, between, bounded, streamFor,
  type Body, type Happening, type WorldState,
} from './state';
import { attempt, type Intent, type VerbName } from './verbs';

/** How fast the five conditions fall over one watch, with nobody doing anything
 *  about them. Slow: these are meant to bite over days, not hours. */
const DECAY = {
  rested: 7, fed: 9, well: 1.5, safe: 1, accompanied: 5,
} as const satisfies Record<(typeof CONDITIONS)[number], number>;

/** Watch four is the one nobody is posted for. It is when the habitat is
 *  quietest, cheapest to run, and when the people who live at night are awake. */
const NIGHT = 4;

/** Watches two and three are when the habitat eats.
 *
 *  Not decoration, and not a convenience: without it the Dock is four watches
 *  from the only food in the habitat, so anybody posted there could either work
 *  or eat and not both, and the engine quietly starved them. A shared mealtime
 *  fixes the physics and is the truer model anyway — it is also what makes the
 *  Common the social heart, because it is the one thing that puts everybody in
 *  one room at the same time every single day. */
const MEALS = new Set([2, 3]);

/** What the reactor loses a day. Small, relentless, and the reason every argument
 *  about allocation will eventually get worse. */
const DECLINE = 0.00022;

/** Charge leaks. Money that rots is what stops anybody hoarding their way out. */
const LEAK = 0.012;

/** What it costs to keep a room lit for a day. Hydroponics costs more, because
 *  it is the only full-spectrum light in the habitat. */
function upkeep(room: RoomId): number {
  if (room === 'hydroponics') return 34;
  if (room === 'well' || room === 'spine') return 18;
  return 8;
}

/** When each condition starts asking to be dealt with.
 *
 *  Not one threshold for all five: a need has to announce itself early enough
 *  that its remedy is still reachable, and the remedies are not equally far away.
 *  Food is only in the Common, which can be three rooms and three watches off, so
 *  hunger has to speak up long before it is dire. Company is whoever is standing
 *  next to you and can wait until it is. Set to one number, people walked to bed
 *  at forty-four and reached the kitchen two days later at nine. */
const URGENT = {
  fed: 62, rested: 42, well: 35, safe: 35, accompanied: 45,
} as const satisfies Record<(typeof CONDITIONS)[number], number>;

/** Needs whose remedy is wherever you happen to be standing. Sitting down works
 *  in any room; eating only works in one. */
const PORTABLE = new Set(['rested', 'accompanied']);

/** Everything wrong with a person right now, most pressing first.
 *
 *  Pressing is measured against each condition's own threshold rather than in raw
 *  points, because being at forty on a thing that can wait is not worse than being
 *  at fifty-five on a thing that cannot.
 *
 *  It returns all of them rather than only the worst, because stopping at the
 *  single lowest meant somebody alone in a room ignored being hungry on the
 *  grounds that they were lonelier, with nobody there to be lonely at. A need you
 *  cannot act on must not silence the ones you can. */
function ailments(b: Body): Array<(typeof CONDITIONS)[number]> {
  // A need you can meet standing still can wait a watch; a need you can only
  // meet in one room cannot. Without this, somebody equally tired and hungry sat
  // down every single watch — in the Common, with food in front of them — because
  // resting is always available and so always won the tie.
  const rank = (key: (typeof CONDITIONS)[number]) => (
    b.condition[key] / URGENT[key] + (PORTABLE.has(key) ? 0.18 : 0)
  );
  return CONDITIONS
    .filter((key) => b.condition[key] < URGENT[key])
    .sort((x, y) => rank(x) - rank(y));
}

/** Who else is in this room. */
function alsoHere(state: WorldState, id: ResidentId): ResidentId[] {
  const room = state.bodies[id].room;
  return RESIDENTS.map((r) => r.id).filter((o) => o !== id && state.bodies[o].room === room);
}

/** A step towards a room, if there is one from here. The habitat is small enough
 *  that one hop a watch gets anybody anywhere in a day. */
function stepToward(from: RoomId, to: RoomId): RoomId | null {
  if (from === to) return null;
  if (ROOM_BY_ID[from].connects.includes(to)) return to;
  const seen = new Set<RoomId>([from]);
  const queue: Array<{ at: RoomId; firstHop: RoomId }> = ROOM_BY_ID[from].connects
    .map((c) => ({ at: c, firstHop: c }));
  for (const c of ROOM_BY_ID[from].connects) seen.add(c);
  while (queue.length) {
    const node = queue.shift()!;
    if (node.at === to) return node.firstHop;
    for (const next of ROOM_BY_ID[node.at].connects) {
      if (seen.has(next)) continue;
      seen.add(next);
      queue.push({ at: next, firstHop: node.firstHop });
    }
  }
  return null;
}

/**
 * What somebody does with this watch.
 *
 * This is the seam. It reads only the state a person could actually perceive —
 * their own body, the room they are in, who is standing in it — and returns an
 * intent, which the engine is then free to refuse. When cognition arrives it
 * replaces this for the handful of people with the most pressure, and everybody
 * else keeps running on exactly this, for free.
 */
export function choose(state: WorldState, id: ResidentId, roll: () => number): Intent {
  const b = state.bodies[id];
  const here = alsoHere(state, id);
  const night = state.watch === NIGHT;
  // Mealtimes. Anybody not already there and not recently fed starts walking,
  // because the kitchen does not come to you.
  if (MEALS.has(state.watch) && b.condition.fed < 76) {
    if (b.room === 'common') return { verb: 'eat', actor: id };
    const hop = stepToward(b.room, 'common');
    if (hop) return { verb: 'go', actor: id, room: hop };
  }

  // The body first, worst first, and on down the list until one of them is
  // something this person can actually do something about from where they are.
  for (const need of ailments(b)) {
    if (need === 'fed') {
      if (b.room === 'common') return { verb: 'eat', actor: id };
      const hop = stepToward(b.room, 'common');
      if (hop) return { verb: 'go', actor: id, room: hop };
    }
    if (need === 'rested') {
      const bed = SLEEPS[id];
      if (b.room === bed) return { verb: night ? 'sleep' : 'rest', actor: id };
      if (night) {
        const hop = stepToward(b.room, bed);
        if (hop) return { verb: 'go', actor: id, room: hop };
      } else {
        return { verb: 'rest', actor: id };
      }
    }
    if (need === 'accompanied' && here.length) {
      return { verb: 'accompany', actor: id, target: pickCompany(state, id, here, roll) };
    }
    if (need === 'well' && b.room === 'well') return { verb: 'wash', actor: id };
  }

  // Somebody in this room is in a worse state than they are.
  const struggling = here.find((o) => {
    const t = state.bodies[o];
    // Rare enough to mean something. At forty it fired five times a day and
    // stopped reading as anybody noticing anything.
    return Math.min(t.condition.well, t.condition.accompanied, t.condition.safe) < 30
      && between(state, id, o) > 26;
  });
  if (struggling) return { verb: 'console', actor: id, target: struggling };

  // Otherwise: the post, during a working watch.
  if (!night) {
    const post = POSTED[id];
    if (b.room !== post) {
      const hop = stepToward(b.room, post);
      if (hop) return { verb: 'go', actor: id, room: hop };
    } else {
      // A third of the time, the person next to you is more interesting than
      // the work, which over a hundred days is how anybody comes to know anybody.
      if (here.length && roll() < 0.42) {
        return talkTo(state, id, here, roll);
      }
      if (roll() < 0.09) return { verb: 'inspect', actor: id };
      const byRoom: Partial<Record<RoomId, VerbName>> = {
        face: 'dig', hydroponics: 'grow', common: 'cook', spine: 'charge',
        well: 'clean', workshops: 'repair', infirmary: 'inspect',
        greatwall: id === 'A' ? 'note' : 'observe',
      };
      return { verb: byRoom[post] ?? 'work', actor: id };
    }
  }

  // The night watch. Most people go to bed; you stay up for somebody, not for a
  // room. Without this, the whole habitat sat in the Common until three every
  // morning, which is a bug that looks like a party.
  const close = here.filter((o) => between(state, id, o) > 52);
  const worthStayingFor = close.length ? pickCompany(state, id, close, roll) : undefined;
  if (worthStayingFor) return talkTo(state, id, [worthStayingFor], roll);
  const bed = SLEEPS[id];
  if (b.room === bed) return { verb: 'sleep', actor: id };
  const hop = stepToward(b.room, bed);
  return hop ? { verb: 'go', actor: id, room: hop } : { verb: 'rest', actor: id };
}

/** Who, out of the people in this room.
 *
 *  Weighted by what is already between them, but never simply the strongest:
 *  taking the maximum meant Gita talked to Quim every single evening for a
 *  fortnight and met nobody else, so the weave calcified on day one and the
 *  design's whole claim that bonds form was quietly false. The floor is what
 *  gives a stranger a chance. */
function pickCompany(
  state: WorldState, id: ResidentId, here: ResidentId[], roll: () => number,
): ResidentId {
  const weights = here.map((o) => 8 + between(state, id, o) ** 1.5 / 12);
  const total = weights.reduce((n, w) => n + w, 0);
  let draw = roll() * total;
  for (let i = 0; i < here.length; i += 1) {
    draw -= weights[i]!;
    if (draw <= 0) return here[i]!;
  }
  return here[here.length - 1]!;
}

/** Which of the people in this room, and in what register. What is already
 *  between two people decides the register, which is why the weave compounds. */
function talkTo(
  state: WorldState, id: ResidentId, here: ResidentId[], roll: () => number,
): Intent {
  const target = pickCompany(state, id, here, roll);
  const mine = state.axes.get(`${id}${target}`)!;
  const r = roll();
  if (mine.resentment > 55 && r < 0.5) return { verb: 'argue', actor: id, target };
  if (mine.trust >= 55 && r < 0.16) return { verb: 'confide', actor: id, target };
  if (mine.admiration > 55 && r < 0.3) return { verb: 'teach', actor: target, target: id };
  if (mine.affection > 50 && r < 0.5) return { verb: 'joke', actor: id, target };
  if (r < 0.3) return { verb: 'listen', actor: id, target };
  if (r < 0.55) return { verb: 'ask', actor: id, target };
  return { verb: 'speak', actor: id, target };
}

/** A short phrase for what somebody is doing, for the view to show. */
function doingFor(intent: Intent, ok: boolean): string {
  if (!ok) return 'at a loose end';
  switch (intent.verb) {
    case 'go': return 'on their way somewhere';
    case 'sleep': return 'asleep';
    case 'rest': return 'sitting down for a bit';
    case 'eat': return 'eating';
    case 'dig': return 'cutting rock';
    case 'grow': return 'in among the trays';
    case 'cook': return 'cooking';
    case 'charge': return 'at the racks';
    case 'repair': return 'fixing something';
    case 'note': return 'writing something down';
    case 'console': return 'sitting with somebody who needs it';
    case 'argue': return 'in the middle of an argument';
    case 'confide': return 'saying something they have not said before';
    default: return 'talking';
  }
}

function assertCognitionActor(state: WorldState, cognition?: Readonly<Intent>): void {
  if (cognition
    && !Object.prototype.hasOwnProperty.call(state.bodies, cognition.actor)) {
    throw new TypeError(`Unknown cognition actor: ${String(cognition.actor)}`);
  }
}

/** One watch. Everybody acts once, in an order that changes with the day so
 *  nobody is permanently first through the door. */
export function advanceWatch(
  state: WorldState, cognition?: Readonly<Intent>,
): WorldState {
  assertCognitionActor(state, cognition);
  const roll = streamFor(state, 7);
  const order = RESIDENTS.map((r) => r.id)
    .sort((a, b) => (
      (state.bodies[a].pressure + roll() * 40) - (state.bodies[b].pressure + roll() * 40)
    ));

  const emitted: Happening[] = [];
  let slot = 0;
  for (const id of order) {
    // A watch is six hours and the habitat is a hundred and twenty-six metres
    // long. Walking to the next room is minutes, not a shift — so a person gets
    // to reach where they are going and then do something there. Charging a
    // whole watch per doorway collapsed the place into a commute: everybody
    // spent every watch in transit and nobody ever arrived at their post.
    const injected = cognition?.actor === id ? cognition : undefined;
    let intent: Intent = injected ? { ...injected } : choose(state, id, roll);
    let outcome = attempt(state, intent);
    for (let hops = 0; hops < 3 && outcome.ok && intent.verb === 'go'; hops += 1) {
      intent = choose(state, id, roll);
      outcome = attempt(state, intent);
    }
    const b = state.bodies[id];
    // A thought happened even when the world refused what it proposed.
    if (injected) b.thoughtOn = state.day;
    b.doing = doingFor(intent, outcome.ok);
    // A world that says no to somebody is a world they have to think about.
    b.pressure = bounded(b.pressure + (outcome.ok ? -1 : 6));
    if (outcome.happening) {
      emitted.push({
        ...outcome.happening,
        day: state.day,
        watch: state.watch,
        minute: (state.watch - 1) * 360 + Math.floor((slot / order.length) * 340) + 8,
      });
    }
    slot += 1;
  }

  // Bodies run down whatever anybody did about it.
  for (const r of RESIDENTS) {
    const b = state.bodies[r.id];
    for (const key of CONDITIONS) {
      b.condition[key] = bounded(b.condition[key] - DECAY[key]);
    }
    if (b.condition.fed < 18 || b.condition.rested < 12) {
      b.condition.well = bounded(b.condition.well - 3);
      b.pressure = bounded(b.pressure + 5);
    }
  }

  state.record.push(...emitted.sort((a, b) => a.minute - b.minute));
  state.watch += 1;
  return state;
}

/** Close a completed fourth watch: power, light and charge are daily books, not
 *  another action. Both the batch runner and the scheduler use this exact path. */
function closeDay(state: WorldState): void {
  // The reactor makes less than it did yesterday, and it will make less again.
  state.reactor.output = Math.max(0, state.reactor.output - DECLINE);
  const budget = Math.round(state.reactor.output * 1000);

  // Rooms are lit in the order they are needed, until the budget runs out. The
  // last ones on the list go dark, and nobody has agreed what the order is.
  const priority: RoomId[] = [
    'well', 'hydroponics', 'common', 'spine', 'infirmary', 'berths', 'workshops',
    'greatwall', 'diggings', 'cabins', 'hold', 'dock', 'bridge', 'face', 'hollow',
  ];
  let left = budget;
  const wentDark: RoomId[] = [];
  for (const id of Object.keys(state.rooms) as RoomId[]) state.rooms[id].lit = false;
  for (const id of priority) {
    const cost = upkeep(id);
    if (left >= cost) { left -= cost; state.rooms[id].lit = true; } else wentDark.push(id);
  }
  state.rooms.breach.lit = false;

  // What is left over is minted as charge and goes to whoever worked. Cells leak,
  // so nobody's pile is a plan.
  const workers = RESIDENTS.filter((r) => state.bodies[r.id].cells > 0);
  const share = workers.length ? Math.floor(left / workers.length / 8) : 0;
  for (const r of RESIDENTS) {
    const b = state.bodies[r.id];
    b.cells = Math.max(0, b.cells * (1 - LEAK) + share);
    b.pressure = bounded(b.pressure + (state.day - b.thoughtOn > 3 ? 4 : 0));
  }

  state.record.push({
    day: state.day, watch: 4, minute: 1430,
    room: 'spine', who: ['J'],
    text: `Reactor at ${state.reactor.output.toFixed(4)} of first-day output.`
      + (wentDark.length ? ` ${wentDark.length} rooms unlit for want of power.` : ''),
    kind: 'power',
  });

  state.day += 1;
  state.watch = 1;
}

/** Advance exactly one scheduled watch, closing the books after watch IV.
 *
 * Unlike `advanceWatch`, this is a clock primitive: the previous day's record is
 * cleared when watch I begins and completing watch IV rolls the world forward. */
export function advanceScheduledWatch(
  state: WorldState, cognition?: Readonly<Intent>,
): WorldState {
  assertCognitionActor(state, cognition);
  if (!Number.isInteger(state.watch) || state.watch < 1 || state.watch > NIGHT) {
    throw new RangeError(`Cannot schedule invalid watch ${state.watch}`);
  }
  if (state.watch === 1) state.record = [];
  advanceWatch(state, cognition);
  if (state.watch === NIGHT + 1) closeDay(state);
  return state;
}

/** One day: four watches, then the books. */
export function advanceDay(state: WorldState): WorldState {
  state.record = [];
  state.watch = 1;
  for (let i = 0; i < 4; i += 1) advanceWatch(state);
  closeDay(state);
  return state;
}

/** Run a stretch of days, keeping every day's record rather than only the last.
 *  Used for burn-in and for tests; the live world keeps one day in memory. */
export function run(state: WorldState, days: number): { state: WorldState; log: Happening[] } {
  const log: Happening[] = [];
  for (let i = 0; i < days; i += 1) {
    advanceDay(state);
    log.push(...state.record);
  }
  return { state, log };
}
