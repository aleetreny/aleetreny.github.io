// The habitat, as sixteen grids.
//
// Eight rooms in the hull, which went into the rock at an angle and is finite and
// inherited, and eight cut into the stone by hand, which grow. Hull grids are
// axis-aligned in their own local coordinates and the tilt is applied at render,
// so distance and adjacency stay sane while the cutaway still shows a ship driven
// in crooked.
//
// The content of this file is authored, not derived. Every grid, every object and
// every connection is a decision recorded in
// docs/superpowers/specs/2026-08-31-habitat-rooms.md, and rooms.test.ts holds the
// invariants that keep an edit from quietly breaking the map.

import { placedObjects, type Placed, type Point, type RoomLegend } from './grid';

export type Side = 'hull' | 'rock';

export type RoomId =
  | 'bridge' | 'dock' | 'cabins' | 'breach' | 'hold' | 'infirmary' | 'berths' | 'spine'
  | 'greatwall' | 'common' | 'hydroponics' | 'diggings' | 'workshops' | 'well' | 'face' | 'hollow';

export type Room = {
  id: RoomId;
  name: string;
  side: Side;
  /** Degrees off the dug galleries. The hull is 22; the rock is 0. */
  tilt: number;
  connects: readonly RoomId[];
  /** What a visitor is told about the room. */
  description: string;
  /** The one thing about it that is not obvious. */
  note?: string;
  grid: readonly string[];
  legend: RoomLegend;
};

export const ROOMS: readonly Room[] = [
  {
    id: 'bridge',
    name: 'The Bridge',
    side: 'hull',
    tilt: 22,
    connects: ['dock'],
    description:
      'The bow, canted up and nearly at the surface. The port is cracked across '
      + 'its whole width and patched from the inside with plate and sealant, so '
      + 'the stars come through a repair. Both consoles are dead. Nobody sits in '
      + 'the pilot\'s chair; the taboo formed in the second week and nobody can '
      + 'say who started it.',
    grid: [
      '######################',
      '#w.........p.........#',
      '#w...s...............#',
      '#w==============v====#',
      '#....t....u.....^....+',
      '#.................b..#',
      '#====================#',
      '######################',
    ],
    legend: {
      w: { name: 'the cracked port, patched from inside', solid: true },
      p: { name: 'the pilot\'s chair', solid: true },
      s: { name: 'a scratch tally of the days, cut into the bulkhead', solid: false },
      t: { name: 'dead navigation console', solid: true },
      u: { name: 'dead helm console', solid: true },
      b: { name: 'a bench somebody dragged up here', solid: false },
    },
  },
  {
    id: 'dock',
    name: 'The Dock',
    side: 'hull',
    tilt: 22,
    connects: ['bridge', 'cabins', 'greatwall'],
    description:
      'Where the hull\'s flank broke the surface. The outer hatch opens onto '
      + 'regolith and sky. Three suits for twenty-five people, on racks, logged '
      + 'in and out by Dima Vashenko with a scruple that irritates everybody.',
    grid: [
      '########################',
      '#......................+',
      '#..1..2..3....r........#',
      '#......................+',
      'X...........l.......k..+',
      '#======================#',
      '########################',
    ],
    legend: {
      '1': { name: 'suit rack one', solid: true },
      '2': { name: 'suit rack two', solid: true },
      '3': { name: 'suit rack three', solid: true },
      r: { name: 'tether reel', solid: true },
      l: { name: 'the outing list, a plate scratched with names and dates', solid: false },
      k: { name: 'tool locker', solid: true },
    },
  },
  {
    id: 'cabins',
    name: 'The Cabins',
    side: 'hull',
    tilt: 22,
    connects: ['dock', 'breach', 'hold', 'greatwall'],
    description:
      'Original passenger quarters, and the floors run downhill. Everything '
      + 'that has to stand level stands on a wedge. Each cabin belongs to '
      + 'somebody who is still asleep, and living here means living among their '
      + 'things under an etiquette nobody wrote.',
    note:
      'The sealed cabin on the lower deck has never been opened. Its hatch is '
      + 'jammed, not locked, and opening it has been on the list since week '
      + 'three.',
    grid: [
      '##########################',
      '#..m..|..m..|..m..|..m...#',
      '+..d..+..d..X..d..+..e...+',
      '#========================#',
      '#..m..|..m..|..m..|..m...#',
      '+..d..+..d..+..d..+......+',
      '#========================#',
      '##########################',
    ],
    legend: {
      m: { name: 'a bunk', solid: true },
      d: { name: 'wedges and shims holding something level', solid: false },
      e: { name: 'a sleeping passenger\'s belongings, untouched', solid: false },
    },
  },
  {
    id: 'breach',
    name: 'The Breach',
    side: 'hull',
    tilt: 22,
    connects: ['cabins', 'hold'],
    description:
      'Where the hull tore. No pressure, no light, no sound, and the only place '
      + 'in the habitat where nobody can see or hear you. It is the source of '
      + 'salvage mass and it is where things go that are not meant to be found.',
    note:
      'Nobody has read the nameplate. They do not know what their ship is '
      + 'called.',
    grid: [
      '##########################',
      '#************************#',
      '#***n****c***************#',
      '#####**********p*********#',
      '+....X*******************#',
      '#=====#***s**************#',
      'X*****#*****************##',
      '##########################',
    ],
    legend: {
      n: { name: 'the ship\'s nameplate, half buried, unread', solid: false },
      c: { name: 'cargo that came loose and stopped', solid: true },
      p: { name: 'a torn plate, the tear itself', solid: true },
      s: { name: 'the salvage pile, what has been dragged near the hatch', solid: true },
    },
  },
  {
    id: 'hold',
    name: 'The Hold',
    side: 'hull',
    tilt: 22,
    connects: ['cabins', 'breach', 'infirmary'],
    description:
      'Cargo. The manifest went in the impact, so nothing here is labelled with '
      + 'anything that means anything. Reva Sandoval has opened nine crates in a '
      + 'hundred days and catalogued all nine beautifully.',
    note:
      'Forty-one crates remain unopened. Opening one is an occasion and there '
      + 'is no way to know what is inside until it is open.',
    grid: [
      '############################',
      '#..........................+',
      '#..o..o..o....u..u..u..u...#',
      '#==========================#',
      '+..u..u..u..u..u..u..u..u..+',
      '#.v........................#',
      '#==========================#',
      '############################',
    ],
    legend: {
      o: { name: 'an opened crate, catalogued', solid: true },
      u: { name: 'an unopened crate', solid: true },
      v: { name: 'Reva\'s inventory board', solid: false },
    },
  },
  {
    id: 'infirmary',
    name: 'The Infirmary',
    side: 'hull',
    tilt: 22,
    connects: ['hold', 'berths', 'workshops'],
    description:
      'Ship medical, partly working. One diagnostic bed that still reports, one '
      + 'that does not. The drug cabinet has never been audited by anybody. The '
      + 'dead are laid on the slab at the far end, which means this is the room '
      + 'where you are saved and the room where you are laid out.',
    grid: [
      '######################',
      '#....................+',
      '#..b......c......k...#',
      '#....................#',
      '+..b..............z..+',
      '#====================#',
      '######################',
    ],
    legend: {
      b: { name: 'a bed - one reports, one does not', solid: true },
      c: { name: 'the consulting corner, two chairs', solid: false },
      k: { name: 'the unaudited cabinet', solid: true },
      z: { name: 'the slab', solid: true },
    },
  },
  {
    id: 'berths',
    name: 'The Cold Berths',
    side: 'hull',
    tilt: 22,
    connects: ['infirmary', 'spine'],
    description:
      'Deep, cold, blue, and quiet enough that people lower their voices '
      + 'without deciding to. Hundreds of sleepers. Nobody knows who any of them '
      + 'are. Somebody started sticking tape to the glass with invented names on '
      + 'it and now most of the front bank has one.',
    note:
      'Nobody has opened q. Its power does not come from the panel anybody can '
      + 'see.',
    grid: [
      '##############################',
      '#............................#',
      '#.bbbbbb.bbbbbb.bbbbbb.bbbbb.#',
      '#.nnnnnn.nnnn...............q#',
      '#============================#',
      '#.bbbbbb.bbbbbb.bbbbbb.bbbbb.#',
      '#............................#',
      '+.....t......................+',
      '#============================#',
      '##############################',
    ],
    legend: {
      b: { name: 'an occupied berth', solid: true },
      n: { name: 'a berth with a name taped to the glass', solid: true },
      t: { name: 'the manifest terminal, blank', solid: true },
      q: { name: 'a berth on its own circuit, running, with no entry on any list', solid: true },
    },
  },
  {
    id: 'spine',
    name: 'The Spine',
    side: 'hull',
    tilt: 22,
    connects: ['berths', 'well', 'workshops'],
    description:
      'The reactor and everything it feeds. With the ship at this angle the '
      + 'Spine is a diagonal climb rather than a corridor, and it is hot the '
      + 'whole way down. The allocation panel at the bottom has more outputs than '
      + 'there are places to send power.',
    note:
      'Four of the panel\'s outputs are labelled with department names that mean '
      + 'nothing now. Two of them are drawing power. Nobody has traced where to.',
    grid: [
      '##############',
      '#....+.......#',
      '#....v.......#',
      '#=====.......#',
      '#....^.......#',
      '+..c.:...c...#',
      '#====:=======#',
      '#....v...a...#',
      '#....:.......#',
      '#=====.......#',
      '#....^.......#',
      '+..r.....r...#',
      '#============#',
      '##############',
    ],
    legend: {
      c: { name: 'a charge cell rack', solid: true },
      a: { name: 'the allocation panel', solid: false },
      r: { name: 'the reactor face, too hot to stand near for long', solid: true },
    },
  },
  {
    id: 'greatwall',
    name: 'The Great Wall',
    side: 'rock',
    tilt: 0,
    connects: ['dock', 'cabins', 'common'],
    description:
      'The first chamber they cut, and they cut it too big because they did not '
      + 'yet know how hard the rock was going to be. One face came away almost '
      + 'flat: twenty-six metres of clean stone, the largest surface in the '
      + 'habitat, and in a hundred days nobody has put anything on it. The '
      + 'terminal salvaged out of the hull sits against the opposite wall.',
    note:
      'People come here to look at the wall and then leave. Several have said '
      + 'they were going to do something with it.',
    grid: [
      '##########################',
      '+........................+',
      '#W......................t#',
      '#W......................t#',
      '#W......................b+',
      '#W=======================#',
      '##########################',
    ],
    legend: {
      'W': { name: 'the wall - flat, clean, and blank', solid: true },
      t: { name: 'the terminal', solid: true },
      b: { name: 'the stool in front of it', solid: false },
    },
  },
  {
    id: 'common',
    name: 'The Common',
    side: 'rock',
    tilt: 0,
    connects: ['greatwall', 'hydroponics', 'diggings', 'workshops'],
    description:
      'The room the habitat happens in. Everybody passes through it and almost '
      + 'everybody eats here. The long table is a hull plate: the first thing '
      + 'they ever built was the place where they all sit down, and to build it '
      + 'they started taking the ship apart.',
    note:
      'Somebody pinned a drawing to the wall eleven days ago and did not sign '
      + 'it.',
    grid: [
      '################################',
      '#..............................#',
      '#..............................#',
      '#.............P................#',
      '+..............................+',
      '#..............................#',
      '+..k..s..bbbbTTTTTTTTTTbbbb....+',
      '#==============================#',
      '################################',
    ],
    legend: {
      k: { name: 'Pilar\'s corner - two burners and everything she owns', solid: true },
      s: { name: 'the stove', solid: true },
      'T': { name: 'the long table, a hull plate', solid: true },
      b: { name: 'benches, none of them matching', solid: false },
      'P': { name: 'the pinning wall - notices, lists, one drawing', solid: false },
    },
  },
  {
    id: 'hydroponics',
    name: 'Hydroponics',
    side: 'rock',
    tilt: 0,
    connects: ['common', 'well', 'diggings'],
    description:
      'The only living green and the only full-spectrum light. It is a farm and '
      + 'it is also where people come to sit, and the light they sit under costs '
      + 'everybody power. Vero Castel resents the sitters, needs the company, and '
      + 'has not resolved it.',
    note:
      'Nobody planted f. It came up in a tray and Vero has not pulled it.',
    grid: [
      '##############################',
      '#llllllllllllllllllllllllllll#',
      '+............................+',
      '#."""""".""""""".""""""......#',
      '#.TTTTTT.TTTTTTT.TTTTTT..f...#',
      '#============================#',
      '#.......................c.c..#',
      '+...s........................#',
      '#============================#',
      '##############################',
    ],
    legend: {
      l: { name: 'the lamp bank', solid: false },
      'T': { name: 'a growing tray', solid: true },
      f: { name: 'the one plant that is not food', solid: false },
      s: { name: 'the seed store - eleven varieties, no more coming', solid: true },
      c: { name: 'chairs that were dragged in here and never went back', solid: false },
    },
  },
  {
    id: 'diggings',
    name: 'The Diggings',
    side: 'rock',
    tilt: 0,
    connects: ['common', 'hydroponics', 'face'],
    description:
      'Where people dug their own homes. Nine so far, and the difference '
      + 'between them is the most public document in the habitat: how much rock '
      + 'you could move, how well you finished it, and how many people were '
      + 'willing to help you.',
    note:
      'Sixteen people are still in the Cabins. Digging is optional and '
      + 'everybody knows what choosing not to looks like.',
    grid: [
      '################################',
      '#.....|......|.......|.........#',
      '+..1..+..2...+...3...+....4....+',
      '#==============================#',
      '#.....|......|.......|.....|...#',
      '+..5..+..6...+...7...+..8..+.9.+',
      '#==============================#',
      '################################',
    ],
    legend: {
      '1': { name: 'Xan\'s - small, square, finished to the millimetre', solid: false },
      '2': { name: 'Mara\'s - the largest, and six people helped', solid: false },
      '3': { name: 'Quim\'s - unfinished, because he keeps working on other people\'s', solid: false },
      '4': { name: 'Gita\'s - narrow, deep, and nobody has been inside', solid: false },
      '5': { name: 'Pilar\'s - nearest the Common, which was not an accident', solid: false },
      '6': { name: 'Osvald\'s', solid: false },
      '7': { name: 'Ulla\'s - forty metres from Osvald\'s', solid: false },
      '8': { name: 'Vero\'s', solid: false },
      '9': { name: 'Yara\'s - the smallest, and she dug it alone', solid: false },
    },
  },
  {
    id: 'workshops',
    name: 'The Workshops',
    side: 'rock',
    tilt: 0,
    connects: ['common', 'infirmary', 'spine', 'well'],
    description:
      'Bays, divided by whoever got there first. The economy is in this room. '
      + 'There is one fabricator and it has a queue, and the queue is the most '
      + 'contested object in the habitat because there is no procedure for it and '
      + 'everybody can see there is no procedure for it.',
    note:
      'Three bays. Nine people want one. The bays were claimed in week four by '
      + 'the three who happened to be standing there.',
    grid: [
      '##############################',
      '+.....|.......|..............+',
      '#..t..|...t...|...f......q...#',
      '#.....|.......|..............#',
      '#=====#=======#==============#',
      '+..h......t...|..........t...+',
      '#.............|..............#',
      '#============================#',
      '##############################',
    ],
    legend: {
      t: { name: 'tools, each set marked with an owner\'s mark', solid: false },
      f: { name: 'the fabricator', solid: true },
      q: { name: 'the queue board', solid: false },
      h: { name: 'the scrap heap - hull offcuts, sorted by Lior', solid: true },
    },
  },
  {
    id: 'well',
    name: 'The Well',
    side: 'rock',
    tilt: 0,
    connects: ['hydroponics', 'workshops', 'spine'],
    description:
      'Water reclamation and air scrubbing. The lowest room, because water goes '
      + 'downhill. It is the ugliest work in the habitat and everybody\'s life '
      + 'depends on it and Osvald Berg does it without complaint and without '
      + 'letting anybody forget.',
    note:
      'Eleven spare filters. When they are gone there is no more air scrubbing '
      + 'and nobody has worked out what happens then.',
    grid: [
      '######################',
      '+....................+',
      '#..TT......TT........#',
      '#..TT......TT....p...#',
      '#=========:==========#',
      '+..f.f.f.............#',
      '#~~~~~~~~~~~~~~~~~~~~#',
      '#~~~~~~~~~~~~~~~~~~~~#',
      '######################',
    ],
    legend: {
      'T': { name: 'a tank', solid: true },
      p: { name: 'the pump', solid: true },
      f: { name: 'filter housings - the filters are consumable', solid: true },
    },
  },
  {
    id: 'face',
    name: 'The Face',
    side: 'rock',
    tilt: 0,
    connects: ['diggings', 'hollow'],
    description:
      'The unfinished tunnel. The only room in the habitat that is incomplete '
      + 'by definition, and the only one whose position on the map changes. '
      + 'People come here to claim space and people come here to be somewhere '
      + 'nobody is.',
    note:
      'y is not good yet. Nobody has seen it and Yara Haddad has not said it is '
      + 'hers.',
    grid: [
      '########################',
      '#.....................,#',
      '+..t..m...............,#',
      '#====================,,#',
      '+.y...................,#',
      '#====================,,#',
      '########################',
    ],
    legend: {
      t: { name: 'the tools, left at the face', solid: false },
      m: { name: 'progress marks, cut weekly', solid: false },
      y: { name: 'marks in the rock on a side gallery, three weeks old, unsigned', solid: false },
    },
  },
  {
    id: 'hollow',
    name: 'The Hollow',
    side: 'rock',
    tilt: 0,
    connects: ['face'],
    description:
      'They did not dig this. A gallery broke into it in week nine: a natural '
      + 'void, irregular, orthogonal to nothing, with a floor that is not flat '
      + 'and a roof nobody has measured. It has no assigned use. It is the only '
      + 'space in the habitat that nobody designed and nobody has decided about.',
    note:
      'There is nothing in it. That is the entry.',
    grid: [
      '############################',
      '#####..................#####',
      '###.......................##',
      '##........................##',
      '#.........................##',
      '##.......,,,,,............##',
      '###...,,,,,,,,,,,,........##',
      '####,,,,,,,,,,,,,,,,,,,,,###',
      '+#,,,,,,,,,,,,,,,,,,,,,,,###',
      '############################',
    ],
    legend: {},
  },
];

export const ROOM_BY_ID = Object.fromEntries(
  ROOMS.map((r) => [r.id, r]),
) as Record<RoomId, Room>;

export function roomObjects(id: RoomId): Placed[] {
  const room = ROOM_BY_ID[id];
  return placedObjects(room.grid, room.legend);
}

export function doorsOf(room: Room): Point[] {
  const out: Point[] = [];
  room.grid.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch === '+' || ch === 'X') out.push({ x, y });
    });
  });
  return out;
}

export function neighbours(id: RoomId): readonly RoomId[] {
  return ROOM_BY_ID[id].connects;
}
