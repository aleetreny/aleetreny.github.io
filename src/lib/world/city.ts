// The city the board is standing in.
//
// Under the blacklight the slate turns out to be a building site, and a
// building site is somewhere. This lays out what is around it: streets, blocks,
// several hundred buildings with their trades written over the door, the
// highways leaving the corners for a horizon that is not on the board, and
// every cone, skip, hoarding and stack of pipe that a working city leaves lying
// about.
//
// It is all deterministic from one seed, so the city is the same city every
// time you throw the switch, and it is all *data* — no element, no colour, no
// browser. What draws it is UvCity.tsx, and what tests it is city.test.ts.

import { mulberry32 } from './rng';

export type Trade =
  | 'tower' | 'flats' | 'house' | 'shop' | 'cafe' | 'bakery' | 'books' | 'bar'
  | 'garage' | 'cinema' | 'hotel' | 'clinic' | 'school' | 'market' | 'workshop'
  | 'depot' | 'gallery' | 'laundry' | 'chemist' | 'radio';

export type Roof = 'flat' | 'gable' | 'saw' | 'tank' | 'aerial' | 'dome';

export type Building = {
  /** Footprint: x is the left of the facade, y is the ground line it stands on.
   *  The facade rises from y to y - h. */
  x: number;
  y: number;
  w: number;
  h: number;
  trade: Trade;
  roof: Roof;
  /** Which window pattern, 0..WINDOWS-1. */
  glass: number;
  /** Which of the fluorescent tints the facade takes. */
  tint: number;
  /** Shopfront sign, where the trade has one. */
  sign?: string;
  /** A crane standing over it, still building. */
  crane: boolean;
};

export type Road = {
  x1: number; y1: number; x2: number; y2: number;
  /** Board units across. */
  w: number;
  kind: 'avenue' | 'street';
};

/** A road that leaves for somewhere the board does not go. Drawn as a taper:
 *  wide where it leaves the site, a point at the horizon. */
export type Highway = {
  x: number; y: number;
  /** Unit vector out towards the horizon. */
  dx: number; dy: number;
  /** How far it runs before it is a point. */
  len: number;
  /** Half-width where it leaves. */
  wide: number;
};

export type PropKind =
  | 'cone' | 'barrier' | 'skip' | 'pallet' | 'mixer' | 'ladder' | 'scaffold'
  | 'hoarding' | 'pipes' | 'reel' | 'lamp' | 'tree' | 'bench' | 'hydrant'
  | 'kiosk' | 'sign' | 'bin' | 'crate' | 'lights' | 'portaloo' | 'sandpile'
  | 'digger' | 'barrow' | 'drum' | 'planks';

export type Prop = { x: number; y: number; kind: PropKind; flip: 1 | -1; tint: number };

/** Where the weather is. Fog sits, rain falls, and neither is everywhere. */
export type Weather = {
  fog: Array<{ x: number; y: number; rx: number; ry: number; drift: number }>;
  rain: Array<{ x: number; y: number; w: number; h: number; tilt: number; rate: number }>;
};

export type Lane = {
  /** Which way traffic runs along it. */
  x1: number; y1: number; x2: number; y2: number;
  /** Board units per millisecond. */
  speed: number;
};

/** The hoarding round the site, and the gates in it. */
export type Fence = {
  /** The panels, as one path's worth of segments. */
  runs: Array<{ x1: number; y1: number; x2: number; y2: number }>;
  gates: Array<{ x: number; y: number; horizontal: boolean }>;
  /** Floodlight towers on the corners. */
  towers: Array<{ x: number; y: number }>;
};

export type City = {
  /** The whole world, board included. */
  bounds: { x: number; y: number; w: number; h: number };
  /** The site in the middle of it: the board itself. */
  site: { x: number; y: number; w: number; h: number };
  roads: Road[];
  highways: Highway[];
  buildings: Building[];
  props: Prop[];
  weather: Weather;
  lanes: Lane[];
  fence: Fence;
};

/** How many window patterns UvCity defines. */
export const WINDOWS = 4;
/** How many facade tints. */
export const TINTS = 5;

/** How far the city reaches past the board on every side. */
const REACH = 1750;
/** Distance between one terrace of buildings and the next. */
const ROW = 430;
/** Clear ground kept around the site, so the board is never built over. Tight,
 *  because a wide dead band between the city and the site reads as a hole in
 *  the world rather than as a building site. */
const CLEAR = 92;
/** How far out from the board the hoarding stands. */
const FENCE = 56;

const SHOPS: Array<[Trade, string]> = [
  ['cafe', 'CAFÉ'], ['bakery', 'PAN'], ['books', 'LIBROS'], ['bar', 'BAR'],
  ['garage', 'TALLER'], ['cinema', 'CINE'], ['hotel', 'HOTEL'], ['clinic', 'CLÍNICA'],
  ['school', 'ESCUELA'], ['market', 'MERCADO'], ['gallery', 'GALERÍA'],
  ['laundry', 'LAVANDERÍA'], ['chemist', 'FARMACIA'], ['shop', 'ULTRAMARINOS'],
  ['workshop', 'FERRETERÍA'], ['radio', 'RADIO'], ['depot', 'ALMACÉN'],
];
const HOMES: Trade[] = ['tower', 'flats', 'house', 'flats', 'house', 'tower'];
const ROOFS: Roof[] = ['flat', 'flat', 'gable', 'saw', 'tank', 'aerial', 'flat', 'dome'];
const SITE_PROPS: PropKind[] = [
  'cone', 'cone', 'barrier', 'skip', 'pallet', 'mixer', 'ladder', 'scaffold',
  'hoarding', 'pipes', 'reel', 'crate', 'lights', 'portaloo', 'sandpile',
  'digger', 'barrow', 'drum', 'planks',
];
const STREET_PROPS: PropKind[] = ['lamp', 'lamp', 'tree', 'tree', 'bench', 'hydrant', 'kiosk', 'sign', 'bin'];

function overlapsSite(x: number, w: number, y: number, h: number, site: City['site']): boolean {
  return x < site.x + site.w + CLEAR && x + w > site.x - CLEAR
    && y - h < site.y + site.h + CLEAR && y > site.y - CLEAR;
}

let cached: { key: string; city: City } | null = null;

/** The city, laid out once per board size and kept. Two components need it and
 *  neither should pay for it twice. */
export function cityFor(width: number, height: number): City {
  const key = `${width}x${height}`;
  if (cached?.key === key) return cached.city;
  cached = { key, city: buildCity(width, height) };
  return cached.city;
}

/** Lay out the whole world around a board of the given size. */
export function buildCity(width: number, height: number, seed = 5150): City {
  const r = mulberry32(seed);
  const site = { x: 0, y: 0, w: width, h: height };
  const bounds = { x: -REACH, y: -REACH, w: width + REACH * 2, h: height + REACH * 2 };

  const roads: Road[] = [];
  const buildings: Building[] = [];
  const props: Prop[] = [];
  const lanes: Lane[] = [];

  // ---- avenues, running the full height, spaced so blocks are city-sized ----
  const avenues: number[] = [];
  for (let x = bounds.x + 210; x < bounds.x + bounds.w; x += 520 + Math.round(r() * 240)) {
    avenues.push(Math.round(x));
  }
  /** Everything the site's boundary keeps out. A road that would run across the
   *  board is cut into the two pieces either side of it, and if it misses the
   *  board it is left whole. */
  const outside = (lo: number, hi: number, blockLo: number, blockHi: number, crosses: boolean) => (
    !crosses || hi <= blockLo || lo >= blockHi
      ? [[lo, hi]]
      : [[lo, blockLo], [blockHi, hi]].filter(([a, b]) => b - a > 40)
  );
  const KEEP = FENCE + 34;

  for (const x of avenues) {
    const w = r() < 0.28 ? 56 : 34;
    const crosses = x > site.x - KEEP && x < site.x + site.w + KEEP;
    const runs = outside(bounds.y, bounds.y + bounds.h, site.y - KEEP, site.y + site.h + KEEP, crosses);
    const pace = 0.05 + r() * 0.05;
    for (const [y1, y2] of runs) {
      roads.push({ x1: x, y1, x2: x, y2, w, kind: 'avenue' });
      lanes.push({ x1: x - w * 0.22, y1, x2: x - w * 0.22, y2, speed: pace });
      lanes.push({ x1: x + w * 0.22, y1: y2, x2: x + w * 0.22, y2: y1, speed: pace });
    }
  }

  // ---- terraces: a street, and a row of buildings standing on it ----
  for (let y = bounds.y + ROW; y < bounds.y + bounds.h; y += ROW) {
    const street = Math.round(y);
    const crosses = street + 26 > site.y - KEEP && street + 26 < site.y + site.h + KEEP;
    const runs = outside(bounds.x, bounds.x + bounds.w, site.x - KEEP, site.x + site.w + KEEP, crosses);
    const pace = 0.045 + r() * 0.04;
    for (const [x1, x2] of runs) {
      roads.push({ x1, y1: street + 26, x2, y2: street + 26, w: 30, kind: 'street' });
      lanes.push({ x1, y1: street + 20, x2, y2: street + 20, speed: pace });
      lanes.push({ x1: x2, y1: street + 32, x2: x1, y2: street + 32, speed: pace });
    }

    let x = bounds.x + 40;
    while (x < bounds.x + bounds.w - 60) {
      // An avenue crossing here is a gap in the terrace, not a building.
      const blocking = avenues.find((a) => a > x - 40 && a < x + 200);
      if (blocking !== undefined) { x = blocking + 46; continue; }

      const w = 78 + Math.round(r() * 176);
      const tall = r();
      const h = Math.round(tall < 0.1 ? 300 + r() * 240 : tall < 0.4 ? 150 + r() * 110 : 74 + r() * 84);
      if (!overlapsSite(x, w, street, h, site)) {
        const shopfront = r() < 0.46;
        const [trade, sign] = shopfront
          ? SHOPS[Math.floor(r() * SHOPS.length)]
          : [HOMES[Math.floor(r() * HOMES.length)], undefined] as [Trade, string | undefined];
        buildings.push({
          x: Math.round(x),
          y: street,
          w,
          h,
          trade,
          roof: h > 260 ? (r() < 0.5 ? 'aerial' : 'tank') : ROOFS[Math.floor(r() * ROOFS.length)],
          glass: Math.floor(r() * WINDOWS),
          tint: Math.floor(r() * TINTS),
          sign,
          crane: h > 220 && r() < 0.22,
        });
      }
      x += w + 8 + Math.round(r() * 26);
    }

    // Street furniture along the pavement, and never on the site.
    for (let sx = bounds.x + 80; sx < bounds.x + bounds.w - 80; sx += 120 + Math.round(r() * 200)) {
      if (overlapsSite(sx, 24, street + 44, 24, site)) continue;
      props.push({
        x: Math.round(sx),
        y: street + 44,
        kind: STREET_PROPS[Math.floor(r() * STREET_PROPS.length)],
        flip: r() < 0.5 ? -1 : 1,
        tint: Math.floor(r() * TINTS),
      });
    }
  }

  // ---- the compound: low buildings in the band the terraces cannot reach ----
  // The street grid is on a four-hundred-unit pitch, so whichever row would
  // have stood nearest the board is always the one cleared away, leaving a
  // ring of nothing between the city and the hoarding. This fills it with what
  // would really be there: cabins, stores and a canteen, backing onto the site.
  const COMPOUND_TRADES: Array<[Trade, string]> = [
    ['depot', 'ALMACÉN'], ['workshop', 'TALLER'], ['cafe', 'CANTINA'],
    ['clinic', 'BOTIQUÍN'], ['shop', 'ECONOMATO'], ['radio', 'CONTROL'],
  ];
  // Every cabin is signed and no two neighbours share a sign. Six kinds drawn
  // six times with a fair die still gives you three canteens in a row, and a
  // run of identical signs is the one thing that makes a generated street look
  // generated — so each side of the site keeps track of what it last put up.
  const last = new Map<string, string>();
  const cabin = (side: string, x: number, y: number, w: number) => {
    let pick = Math.floor(r() * COMPOUND_TRADES.length);
    if (COMPOUND_TRADES[pick][1] === last.get(side)) pick = (pick + 1) % COMPOUND_TRADES.length;
    const [trade, sign] = COMPOUND_TRADES[pick];
    last.set(side, sign);
    buildings.push({
      x: Math.round(x), y: Math.round(y), w: Math.round(w),
      h: Math.round(38 + r() * 46),
      trade, roof: r() < 0.4 ? 'gable' : 'flat',
      glass: Math.floor(r() * WINDOWS), tint: Math.floor(r() * TINTS),
      sign,
      crane: false,
    });
  };
  for (let x = site.x - 40; x < site.x + site.w + 40; x += 110 + r() * 130) {
    cabin('n', x, site.y - 104, 60 + r() * 74);
    cabin('s', x, site.y + site.h + 226, 60 + r() * 74);
  }
  for (let y = site.y + 60; y < site.y + site.h; y += 150 + r() * 190) {
    cabin('w', site.x - 260 + r() * 40, y, 66 + r() * 70);
    cabin('e', site.x + site.w + 150 + r() * 60, y, 66 + r() * 70);
  }

  // ---- the highways out of the corners, for a horizon the board has not got --
  const highways: Highway[] = [];
  const corners: Array<[number, number, number, number]> = [
    [site.x + site.w * 0.18, site.y, -0.52, -0.86],
    [site.x + site.w * 0.82, site.y, 0.52, -0.86],
    [site.x + site.w * 0.2, site.y + site.h, -0.5, 0.87],
    [site.x + site.w * 0.8, site.y + site.h, 0.5, 0.87],
    [site.x, site.y + site.h * 0.5, -1, 0.03],
    [site.x + site.w, site.y + site.h * 0.42, 1, -0.05],
  ];
  for (const [x, y, dx, dy] of corners) {
    highways.push({ x, y, dx, dy, len: REACH * (1.5 + r() * 0.5), wide: 46 + r() * 26 });
  }

  // ---- the site itself: everything a working crew leaves on the ground ------
  const litter = 430;
  for (let i = 0; i < litter; i += 1) {
    const edge = r();
    // Two thirds on the board, a third in the streets around it.
    const on = edge < 0.66;
    const x = on ? site.x + 40 + r() * (site.w - 80) : bounds.x + 120 + r() * (bounds.w - 240);
    const y = on ? site.y + 40 + r() * (site.h - 80) : bounds.y + 120 + r() * (bounds.h - 240);
    if (!on && !overlapsSite(x, 20, y, 20, site) === false) continue;
    props.push({
      x: Math.round(x),
      y: Math.round(y),
      kind: SITE_PROPS[Math.floor(r() * SITE_PROPS.length)],
      flip: r() < 0.5 ? -1 : 1,
      tint: Math.floor(r() * TINTS),
    });
  }

  // ---- the hoarding, and the way in ----------------------------------------
  // A site has a boundary. Without one the city simply stops a few hundred
  // units short of the board and the gap reads as missing rather than as kept
  // clear, which is what the whole middle of this world is.
  const fx = site.x - FENCE;
  const fy = site.y - FENCE;
  const fw = site.w + FENCE * 2;
  const fh = site.h + FENCE * 2;
  const gates = [
    { x: site.x + site.w * 0.18, y: fy, horizontal: true },
    { x: site.x + site.w * 0.82, y: fy, horizontal: true },
    { x: site.x + site.w * 0.2, y: fy + fh, horizontal: true },
    { x: site.x + site.w * 0.8, y: fy + fh, horizontal: true },
    { x: fx, y: site.y + site.h * 0.5, horizontal: false },
    { x: fx + fw, y: site.y + site.h * 0.42, horizontal: false },
  ];
  const GATE = 130;
  const runs: Fence['runs'] = [];
  const side = (x1: number, y1: number, x2: number, y2: number, along: 'x' | 'y') => {
    const cuts = gates
      .filter((g) => (along === 'x' ? Math.abs(g.y - y1) < 2 : Math.abs(g.x - x1) < 2))
      .map((g) => (along === 'x' ? g.x : g.y))
      .sort((a, b) => a - b);
    let from = along === 'x' ? x1 : y1;
    const end = along === 'x' ? x2 : y2;
    for (const cut of [...cuts, end + GATE]) {
      const stop = Math.min(end, cut - GATE / 2);
      if (stop > from) {
        runs.push(along === 'x'
          ? { x1: from, y1, x2: stop, y2: y1 }
          : { x1, y1: from, x2: x1, y2: stop });
      }
      from = Math.max(from, cut + GATE / 2);
    }
  };
  side(fx, fy, fx + fw, fy, 'x');
  side(fx, fy + fh, fx + fw, fy + fh, 'x');
  side(fx, fy, fx, fy + fh, 'y');
  side(fx + fw, fy, fx + fw, fy + fh, 'y');
  const fence: Fence = {
    runs,
    gates,
    towers: [
      { x: fx, y: fy }, { x: fx + fw, y: fy },
      { x: fx, y: fy + fh }, { x: fx + fw, y: fy + fh },
    ],
  };

  // The compound: everything parked in the strip between the board and the
  // hoarding, which is where a real site keeps its plant.
  const COMPOUND: PropKind[] = ['portaloo', 'skip', 'pallet', 'mixer', 'drum', 'crate', 'sandpile', 'digger', 'pipes', 'planks', 'reel', 'lights'];
  for (let i = 0; i < 46; i += 1) {
    const t = r();
    const edge = Math.floor(r() * 4);
    const off = 16 + r() * (FENCE - 26);
    const x = edge === 0 || edge === 2 ? site.x + t * site.w : edge === 1 ? site.x + site.w + off : site.x - off;
    const y = edge === 0 ? site.y - off : edge === 2 ? site.y + site.h + off : site.y + t * site.h;
    props.push({
      x: Math.round(x), y: Math.round(y),
      kind: COMPOUND[Math.floor(r() * COMPOUND.length)],
      flip: r() < 0.5 ? -1 : 1,
      tint: Math.floor(r() * TINTS),
    });
  }

  // ---- weather: it is not the same everywhere -------------------------------
  const fog: Weather['fog'] = [];
  for (let i = 0; i < 7; i += 1) {
    fog.push({
      x: bounds.x + r() * bounds.w,
      y: bounds.y + r() * bounds.h,
      rx: 500 + r() * 900,
      ry: 260 + r() * 420,
      drift: 40 + r() * 90,
    });
  }
  // Rain falls on the town, not on the site: a squall over the board reads as
  // a rendering fault rather than as weather, and the crew are working.
  const rain: Weather['rain'] = [];
  for (let attempt = 0; attempt < 60 && rain.length < 4; attempt += 1) {
    const w = 1100 + r() * 1500;
    const h = 800 + r() * 1100;
    const x = bounds.x + r() * (bounds.w - w);
    const y = bounds.y + r() * (bounds.h - h);
    if (x < site.x + site.w + 80 && x + w > site.x - 80
      && y < site.y + site.h + 80 && y + h > site.y - 80) continue;
    rain.push({ x, y, w, h, tilt: 8 + r() * 10, rate: 0.7 + r() * 0.6 });
  }

  return { bounds, site, roads, highways, buildings, props, weather: { fog, rain }, lanes, fence };
}
