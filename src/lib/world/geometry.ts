// The geometry two of the instruments on the desk are made of.
//
// A Voronoi diagram is the answer to one question asked of every point on a
// plate: which seed is nearest? The set of points nearer to seed A than to
// seed B is the half-plane on A's side of their perpendicular bisector, so a
// cell is simply the plate clipped by one half-plane per other seed. That is
// what `voronoiCells` does — Sutherland–Hodgman, once per pair — and for the
// dozen seeds a hand can comfortably move it is both exact and free.
//
// The Delaunay triangulation is the dual of that diagram: two seeds are joined
// exactly when their cells share a real edge. So it falls out of the same
// pass rather than needing an algorithm of its own, and the two pictures are
// guaranteed to agree because they were computed from the same clip.

export type Point = { x: number; y: number };
export type Rect = { x: number; y: number; w: number; h: number };

export type Cell = {
  /** Index of the seed this cell belongs to. */
  seed: number;
  /** The cell's outline, anticlockwise, already clipped to the plate. */
  polygon: Point[];
  /** Seeds whose bisector actually contributed an edge — the Delaunay
   *  neighbours of this one. */
  neighbours: number[];
};

/** Clip a convex polygon to the half-plane `n · p <= c`. */
function clipHalfPlane(polygon: Point[], nx: number, ny: number, c: number): { out: Point[]; cut: boolean } {
  if (polygon.length === 0) return { out: polygon, cut: false };
  const out: Point[] = [];
  let cut = false;
  for (let i = 0; i < polygon.length; i += 1) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    const da = nx * a.x + ny * a.y - c;
    const db = nx * b.x + ny * b.y - c;
    const aIn = da <= 0;
    const bIn = db <= 0;
    if (aIn) out.push(a);
    if (aIn !== bIn) {
      const t = da / (da - db);
      out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
      cut = true;
    }
  }
  return { out, cut };
}

const AREA_EPS = 1e-6;

/** Twice the signed area of a polygon. */
export function polygonArea2(polygon: Point[]): number {
  let sum = 0;
  for (let i = 0; i < polygon.length; i += 1) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return sum;
}

/** Every seed's cell, clipped to `rect`, with its Delaunay neighbours. */
export function voronoiCells(seeds: Point[], rect: Rect): Cell[] {
  const cells: Cell[] = [];
  for (let i = 0; i < seeds.length; i += 1) {
    const a = seeds[i];
    let polygon: Point[] = [
      { x: rect.x, y: rect.y },
      { x: rect.x + rect.w, y: rect.y },
      { x: rect.x + rect.w, y: rect.y + rect.h },
      { x: rect.x, y: rect.y + rect.h },
    ];
    const neighbours: number[] = [];
    for (let j = 0; j < seeds.length && polygon.length > 0; j += 1) {
      if (i === j) continue;
      const b = seeds[j];
      const nx = b.x - a.x;
      const ny = b.y - a.y;
      // Two seeds in the same place have no bisector to speak of.
      if (nx * nx + ny * ny < 1e-9) continue;
      // Points nearer to `a` lie on a's side of the bisector through the
      // midpoint, which is the half-plane n · p <= n · midpoint.
      const c = nx * ((a.x + b.x) / 2) + ny * ((a.y + b.y) / 2);
      const clipped = clipHalfPlane(polygon, nx, ny, c);
      polygon = clipped.out;
      if (clipped.cut) neighbours.push(j);
    }
    // A bisector can cut a corner off early and then be cut away entirely by a
    // later one, so a recorded neighbour is only real if its edge survived.
    const real = neighbours.filter((j) => sharesEdge(polygon, seeds[i], seeds[j]));
    cells.push({ seed: i, polygon, neighbours: real });
  }
  return cells;
}

/** Does this finished cell still have a stretch of boundary on the bisector of
 *  `a` and `b`? Only then are the two seeds Delaunay neighbours. */
function sharesEdge(polygon: Point[], a: Point, b: Point): boolean {
  if (polygon.length < 3) return false;
  const nx = b.x - a.x;
  const ny = b.y - a.y;
  const c = nx * ((a.x + b.x) / 2) + ny * ((a.y + b.y) / 2);
  const scale = Math.hypot(nx, ny) || 1;
  let on = 0;
  for (const p of polygon) {
    if (Math.abs((nx * p.x + ny * p.y - c) / scale) < 0.35) on += 1;
    if (on >= 2) return true;
  }
  return false;
}

/** The Delaunay edges, each pair once. */
export function delaunayEdges(cells: Cell[]): Array<[number, number]> {
  const edges: Array<[number, number]> = [];
  for (const cell of cells) {
    for (const other of cell.neighbours) {
      if (other > cell.seed) edges.push([cell.seed, other]);
    }
  }
  return edges;
}

/** The centre of mass of a polygon — where a cell's label, or the seed a
 *  relaxation step is pulling toward, belongs. */
export function centroid(polygon: Point[]): Point {
  const area2 = polygonArea2(polygon);
  if (Math.abs(area2) < AREA_EPS) {
    // Degenerate: fall back to the mean of the vertices.
    let x = 0; let y = 0;
    for (const p of polygon) { x += p.x; y += p.y; }
    const n = polygon.length || 1;
    return { x: x / n, y: y / n };
  }
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < polygon.length; i += 1) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    const cross = a.x * b.y - b.x * a.y;
    cx += (a.x + b.x) * cross;
    cy += (a.y + b.y) * cross;
  }
  return { x: cx / (3 * area2), y: cy / (3 * area2) };
}
