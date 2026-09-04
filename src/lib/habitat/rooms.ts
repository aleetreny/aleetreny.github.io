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
  | 'bridge' | 'dock' | 'breach' | 'hold' | 'infirmary' | 'berths' | 'spine'
  | 'longwalk' | 'cabin1' | 'cabin2' | 'cabin3' | 'cabin4' | 'cabin5'
  | 'greatwall' | 'common' | 'hydroponics' | 'workshops' | 'well' | 'face' | 'hollow'
  | 'row' | 'dig1' | 'dig2' | 'dig3' | 'dig4' | 'dig5' | 'dig6';

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
      '########',
      '#wwwwww#',
      '#..t..u#',
      '#...p..#',
      '#s.....#',
      '#..b...#',
      '###+####',
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
    connects: ['bridge', 'longwalk', 'greatwall'],
    description:
      'Where the hull\'s flank broke the surface. The outer hatch opens onto '
      + 'regolith and sky. Three suits for twenty-five people, on racks, logged '
      + 'in and out by Dima Vashenko with a scruple that irritates everybody.',
    grid: [
      '###+###',
      '+.1.2.+',
      '#.....#',
      '#..3..#',
      '#l...k#',
      '#..r..+',
      'X##+###',
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
    id: 'longwalk',
    name: 'The Long Walk',
    side: 'hull',
    tilt: 22,
    connects: ['dock', 'breach', 'hold', 'greatwall', 'cabin1', 'cabin2', 'cabin3', 'cabin4', 'cabin5'],
    description:
      'The ship\'s corridor, straight, metal and downhill the whole way, with five '
      + 'cabin doors off it. Everybody passes every door every day, which is the '
      + 'whole of the etiquette in this half of the habitat. The floor is the most '
      + 'worn in the place and it is worn off-centre, because on a twenty-two '
      + 'degree deck you drift as you walk down it.',
    note:
      'One hatch does not open. It is jammed and not locked, and opening it has '
      + 'been on the list since week three.',
    grid: [
      '##+##',
      '#===#',
      '+===+',
      '#===#',
      '#===#',
      '#=p=#',
      '#===#',
      '#===#',
      '#===#',
      '#===#',
      '+===+',
      '#===#',
      '#===#',
      '#===#',
      '#===#',
      '#===#',
      '#===#',
      '#===#',
      '+===+',
      '#===#',
      '#===#',
      '#=l=#',
      '#===#',
      '#===#',
      '#===#',
      'X===#',
      '##+##',
    ],
    legend: {
      l: { name: 'a strip lamp; half the run is dead', solid: false },
      p: { name: 'a bite out of the wall where the plate was lifted', solid: false },
    },
  },
  {
    id: 'cabin1',
    name: 'Cabin One',
    side: 'hull',
    tilt: 22,
    connects: ['longwalk'],
    description:
      'The first cabin off the Dock, and the one everybody passes twice a day. '
      + 'Two bunks, a floor that runs downhill, and a wedge under everything that '
      + 'has to stand level. Dima Vashenko and Edda Halvorsen sleep here, which '
      + 'means the outing list and the allocation ledger live in the same four '
      + 'metres.',
    note:
      'Its lamp is the brightest of the five. Neither of them has said who chose '
      + 'that.',
    grid: [
      '########',
      '#.^....#',
      '#m.m..e+',
      '#m.m...#',
      '#..d...#',
      '#......#',
      '#......#',
      '########',
    ],
    legend: {
      e: { name: 'a sleeping passenger\'s belongings, untouched', solid: false },
      m: { name: 'a bunk', solid: true },
      d: { name: 'wedges and shims holding something level', solid: false },
    },
  },
  {
    id: 'cabin2',
    name: 'Cabin Two',
    side: 'hull',
    tilt: 22,
    connects: ['longwalk'],
    description:
      'Identical to the first, because they all are, and slowly not. Halim Zoubir '
      + 'and Ferran Sole are in it, two men who worked one season together twenty '
      + 'years ago and have never once mentioned it.',
    note:
      'The shim stack by the bunk has a shim added roughly every nine days. It is '
      + 'the closest thing in the habitat to a calendar nobody meant to keep.',
    grid: [
      '########',
      '#.^....#',
      '#m.m..s+',
      '#m.m...#',
      '#..d...#',
      '#......#',
      '#......#',
      '########',
    ],
    legend: {
      s: { name: 'a shim stack, grown over a hundred days as the floor settled', solid: false },
      m: { name: 'a bunk', solid: true },
      d: { name: 'wedges and shims holding something level', solid: false },
    },
  },
  {
    id: 'cabin3',
    name: 'Cabin Three',
    side: 'hull',
    tilt: 22,
    connects: ['longwalk'],
    description:
      'The furthest cabin down the walk, and the darkest. Gita Raman and Cato '
      + 'Lindqvist, who between them are responsible for whether the hull holds and '
      + 'whether anybody is standing under it when it does not.',
    note:
      'The photograph is taped over a patch where plate was lifted, which is the '
      + 'only reason anybody knows the patch is there.',
    grid: [
      '########',
      '#.^....#',
      '#m.m..p+',
      '#m.m...#',
      '#..d...#',
      '#......#',
      '#......#',
      '########',
    ],
    legend: {
      p: { name: 'a photograph taped where the light is best', solid: false },
      m: { name: 'a bunk', solid: true },
      d: { name: 'wedges and shims holding something level', solid: false },
    },
  },
  {
    id: 'cabin4',
    name: 'Cabin Four',
    side: 'hull',
    tilt: 22,
    connects: ['longwalk'],
    description:
      'Across the walk, so its floor tilts the other way. Bex Ferreira and Reva '
      + 'Sandoval sleep here, and both of them catalogue things for a living, and '
      + 'the cabin shows it.',
    note:
      'The shelf is bolted, not welded, and you can count the bolts. Four of them '
      + 'are not the same as the other three.',
    grid: [
      '########',
      '#....^.#',
      '+r..m.m#',
      '#...m.m#',
      '#...d..#',
      '#......#',
      '#......#',
      '########',
    ],
    legend: {
      r: { name: 'a rope-and-plate shelf bolted over the bunk', solid: false },
      m: { name: 'a bunk', solid: true },
      d: { name: 'wedges and shims holding something level', solid: false },
    },
  },
  {
    id: 'cabin5',
    name: 'Cabin Five',
    side: 'hull',
    tilt: 22,
    connects: ['longwalk'],
    description:
      'The last of the five, opposite the second. Osvald Berg and Iris Calloway. '
      + 'He is up before anybody and back after everybody, and she draws the map of '
      + 'a place she has still not walked all of.',
    note:
      'Osvald has not dug himself a home and will not say why. His half-sister '
      + 'has one, forty metres of rock and the whole ship away.',
    grid: [
      '########',
      '#....^.#',
      '+k..m.m#',
      '#...m.m#',
      '#...d..#',
      '#......#',
      '#......#',
      '########',
    ],
    legend: {
      k: { name: 'a locker that is not the ship\'s, and does not fit', solid: false },
      m: { name: 'a bunk', solid: true },
      d: { name: 'wedges and shims holding something level', solid: false },
    },
  },
  {
    id: 'breach',
    name: 'The Breach',
    side: 'hull',
    tilt: 22,
    connects: ['longwalk', 'hold'],
    description:
      'Where the hull tore. No pressure, no light, no sound, and the only place '
      + 'in the habitat where nobody can see or hear you. It is the source of '
      + 'salvage mass and it is where things go that are not meant to be found.',
    note:
      'Nobody has read the nameplate. They do not know what their ship is '
      + 'called.',
    grid: [
      '########',
      '#**n**.X',
      '#*c****#',
      '#..**p*#',
      '#=*****#',
      '#**s***#',
      '#*****.X',
      '########',
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
    connects: ['longwalk', 'breach', 'infirmary'],
    description:
      'Cargo. The manifest went in the impact, so nothing here is labelled with '
      + 'anything that means anything. Reva Sandoval has opened nine crates in a '
      + 'hundred days and catalogued all nine beautifully.',
    note:
      'Forty-one crates remain unopened. Opening one is an occasion and there '
      + 'is no way to know what is inside until it is open.',
    grid: [
      '###+###',
      '+u...u#',
      '#u...u#',
      '#u...u+',
      '#.....#',
      '#o...u#',
      '#o...u#',
      '+v...u#',
      '###+###',
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
      '##+###',
      '+b..k#',
      '#b...#',
      '#....+',
      '#..c.#',
      '#....#',
      '#z...+',
      '##+###',
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
      '####+####',
      '#bbb.bbb#',
      '#n.n.bbb#',
      '+.......+',
      '#bbb.bbq#',
      '#nnn.bbb#',
      '#t......#',
      '####+####',
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
      '###+####',
      '#..v...#',
      '#..:...+',
      '#==:===#',
      '#..^...#',
      '+c.:.c.#',
      '#==:===#',
      '#..v..a#',
      '#==:===#',
      '#r...r.+',
      '########',
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
    connects: ['dock', 'longwalk', 'common'],
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
      '############',
      '+WWWWWWWWWW+',
      '#..........#',
      '#..........#',
      '#.........t#',
      '+........b.+',
      '############',
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
    connects: ['greatwall', 'hydroponics', 'row', 'workshops'],
    description:
      'The room the habitat happens in. Everybody passes through it and almost '
      + 'everybody eats here. The long table is a hull plate: the first thing '
      + 'they ever built was the place where they all sit down, and to build it '
      + 'they started taking the ship apart.',
    note:
      'Somebody pinned a drawing to the wall eleven days ago and did not sign '
      + 'it.',
    grid: [
      '####+#######',
      '+..........#',
      '#k.s.......#',
      '#.....P....#',
      '#....:.....#',
      '#.bbbbbbbb.#',
      '#.TTTTTTTT.#',
      '+.bbbbbbbb.+',
      '######+#####',
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
    connects: ['common', 'well', 'row'],
    description:
      'The only living green and the only full-spectrum light. It is a farm and '
      + 'it is also where people come to sit, and the light they sit under costs '
      + 'everybody power. Vero Castel resents the sitters, needs the company, and '
      + 'has not resolved it.',
    note:
      'Nobody planted f. It came up in a tray and Vero has not pulled it.',
    grid: [
      '########',
      '#llllll#',
      '+......+',
      '#""""".#',
      '#TTTTT.#',
      '#.....f#',
      '+.s..cc#',
      '###+####',
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
    id: 'row',
    name: 'The Row',
    side: 'rock',
    tilt: 0,
    connects: ['common', 'hydroponics', 'face', 'dig1', 'dig2', 'dig3', 'dig4', 'dig5', 'dig6'],
    description:
      'Six front doors facing each other across three metres of cut rock. '
      + 'Everyone sees who goes into whose, and going home means having crossed the '
      + 'Common first. It is the only corridor in the warren that anybody has '
      + 'decorated.',
    note:
      'Three more diggings were begun and are not lived in. Nobody talks about '
      + 'whose they were going to be.',
    grid: [
      '####+########+#######+###',
      '+=n=====================#',
      '#=======================+',
      '+=====================s=#',
      '###+#######+#######+#####',
    ],
    legend: {
      n: { name: 'names scratched into the rock beside each door', solid: false },
      s: { name: 'the drift of things left outside doors', solid: false },
    },
  },
  {
    id: 'dig1',
    name: 'Mara\'s',
    side: 'rock',
    tilt: 0,
    connects: ['row'],
    description:
      'The largest of the six, and six people helped dig it. Two chambers with a '
      + 'gap cut between them rather than a door. Mara Osei, Tomas Iriarte, and '
      + 'Vero Castel, who did not choose to be here.',
    note:
      'Vero lost her own digging to the rock and moved in with the woman who has '
      + 'mothered her since she was nine. She has not said what that costs her.',
    // Three people sleep here, so there are three places to sleep. The partition
    // runs two courses down from the back wall and stops, which leaves the whole
    // front of the room as one shared space you come into — the arrangement the
    // makeshift references use, and the fix for a neck that used to sit right on
    // top of the door. The bite out of the south-west corner is this room's own
    // shape; no two diggings have the same one.
    grid: [
      '#########',
      '#b.b|b..#',
      '#b.b|b..#',
      '#...|...#',
      '#k.....k#',
      '##.....q#',
      '####+####',
    ],
    legend: {
      q: { name: 'a chair somebody brought and left', solid: false },
      b: { name: 'one of three places to sleep — a bed, a mattress and a couch', solid: true },
      k: { name: 'crates doing the work of furniture', solid: true },
    },
  },
  {
    id: 'dig2',
    name: 'Quim\'s',
    side: 'rock',
    tilt: 0,
    connects: ['row'],
    description:
      'Unfinished, because Quim Bassols keeps stopping to work on other people\'s. '
      + 'The far chamber has no floor yet and is used for storage. Wen Jiaming and '
      + 'Lior Ben-Ari live in the finished half with him.',
    note:
      'It has been three weeks from finished for eleven weeks.',
    grid: [
      '#######',
      '#b.|b.#',
      '#b.|b.#',
      '#..|.q#',
      '#k...b#',
      '##...b#',
      '###+###',
    ],
    legend: {
      q: { name: 'a tool left mid-job, for the ninth time', solid: false },
      b: { name: 'one of three places to sleep, and none of them finished', solid: true },
      k: { name: 'crates doing the work of furniture', solid: true },
    },
  },
  {
    id: 'dig3',
    name: 'Pilar\'s',
    side: 'rock',
    tilt: 0,
    connects: ['row'],
    description:
      'Nearest the Common, which was not an accident: Pilar Ocana cooks, and she '
      + 'wanted the short walk. Kes Amankwah and Juno Petrakis are in the second '
      + 'chamber, in an arrangement neither of them has named.',
    note:
      'You can hear the Common from inside it. Everybody knows this and comes '
      + 'anyway.',
    grid: [
      '#######',
      '#.b|b.#',
      '#.b|b.#',
      '#q.|..#',
      '#b...k#',
      '#b...##',
      '###+###',
    ],
    legend: {
      q: { name: 'a pan that has never been back to the kitchen', solid: false },
      b: { name: 'one of three places to sleep, and the nearest to the Common', solid: true },
      k: { name: 'crates doing the work of furniture', solid: true },
    },
  },
  {
    id: 'dig4',
    name: 'Xan\'s',
    side: 'rock',
    tilt: 0,
    connects: ['row'],
    description:
      'Small, square, and finished to the millimetre, which took Xan Moreira '
      + 'eleven weeks. Sten Malm sleeps in it too, at seventy-eight, in the only '
      + 'room in the habitat where every corner is right.',
    note:
      'Sten taught Xan to swim forty-eight years ago. Xan is sixty and still '
      + 'defers to him, and Sten has never found a way to say that he would rather '
      + 'he did not.',
    grid: [
      '###+###',
      '#b..b.#',
      '#b..b.#',
      '#.....#',
      '#k...k#',
      '#q....#',
      '#.....#',
      '#######',
    ],
    legend: {
      q: { name: 'a drawing pinned square to a wall that is not', solid: false },
      b: { name: 'one of two places to sleep, both squared to the wall', solid: true },
      k: { name: 'crates doing the work of furniture', solid: true },
    },
  },
  {
    id: 'dig5',
    name: 'Ulla\'s',
    side: 'rock',
    tilt: 0,
    connects: ['row'],
    description:
      'Cut as far along the Row from the ship as the rock allowed. Ulla Nyholm '
      + 'dug it in five weeks and nobody asked her why she was in a hurry. Ama '
      + 'Oyelaran moved in on the ninetieth day.',
    note:
      'Ama and Ulla were at school together. It is the only bond in their cluster '
      + 'with nothing wrong with it, and Ulla has needed it since the Dock list '
      + 'went up.',
    grid: [
      '###+###',
      '#b..b.#',
      '#b..b.#',
      '#.....#',
      '#k...k#',
      '#q....#',
      '#....##',
      '#######',
    ],
    legend: {
      q: { name: 'two cups, and only one of them used', solid: false },
      b: { name: 'one of two places to sleep', solid: true },
      k: { name: 'crates doing the work of furniture', solid: true },
    },
  },
  {
    id: 'dig6',
    name: 'Yara\'s',
    side: 'rock',
    tilt: 0,
    connects: ['row'],
    description:
      'The smallest, and she dug it alone. Yara Haddad and Noor Rahimi, and the '
      + 'room is barely large enough for the two of them to be in it at once.',
    note:
      'The marks on the back wall are the same hand as the ones on the side '
      + 'gallery at the Face. Nobody has put the two together.',
    grid: [
      '###+###',
      '#b..b##',
      '#b..b.#',
      '#.....#',
      '#k...k#',
      '#q....#',
      '##....#',
      '#######',
    ],
    legend: {
      q: { name: 'marks in the rock, three weeks old, unsigned', solid: false },
      b: { name: 'one of two places to sleep, and they touch', solid: true },
      k: { name: 'crates doing the work of furniture', solid: true },
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
      '#########',
      '+..|...|+',
      '#t.|.f.|#',
      '#..|...|#',
      '#=======#',
      '+..|..t|#',
      '#h.|..q|+',
      '#..|...|#',
      '####+####',
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
      '###+###',
      '+T...T+',
      '#T.p.T#',
      '#..:..#',
      '#f.f.f#',
      '#~~~~~+',
      '#######',
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
    connects: ['row', 'hollow'],
    description:
      'The unfinished tunnel. The only room in the habitat that is incomplete '
      + 'by definition, and the only one whose position on the map changes. '
      + 'People come here to claim space and people come here to be somewhere '
      + 'nobody is.',
    note:
      'y is not good yet. Nobody has seen it and Yara Haddad has not said it is '
      + 'hers.',
    grid: [
      '########',
      '+..t..,#',
      '#.m...,#',
      '#=====,#',
      '#.....,#',
      '#y....,#',
      '#####+##',
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
      '#####+######',
      '####....####',
      '##........##',
      '#.........##',
      '#.........##',
      '#..,,,,...##',
      '##,,,,,,,.##',
      '####,,,,####',
      '############',
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
