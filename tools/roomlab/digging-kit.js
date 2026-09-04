// ── THE DIGGING MOULD ─────────────────────────────────────────────────────
//
// The six diggings are 1:1 traces of three of 0_mem0ry's own makeshift rooms.
// Not compositions in that style — traces: every object is the sprite the
// artist used, at the position it is in the render, found by matching and
// checked against the render pixel by pixel.
//
// HOW THE TRACE WAS MADE, because the obvious way does not work here.
//
// A plain best-NCC search finds the small props and misses almost every large
// one, because a sofa half hidden behind a table matches badly over the whole
// sprite even when the visible half is exact. So each candidate is scored by
// the **trimmed** mean colour error over its own opaque pixels — the best 55 %
// of them — which is precisely the part you can still see. The search runs
// greedily against the residual (what the reference has and the canvas does
// not), and **a placement is only kept if it actually reduces the pixel
// difference**, because a score can be fooled and the difference cannot.
//
// That took the three references to 7.8 %, 5.5 % and 8.9 % of pixels differing
// inside the outline — better than any other room in the habitat.
//
// The shell, all of it solved by brute force over every opaque tile and every
// phase:
//   band   1 px ink, 4 px of #c0b8b2, 1 px ink — the sheet's own cross-section
//   wall   makeshift_roomtiles column 4, rows 7-8: one 32 x 64 block of white
//          brick whose bottom four rows are the skirting
//   floor  the same sheet's column 5, rows 7-8, grey concrete
//   shape  a rectangle minus rectangular cuts, so the two-room flat keeps the
//          notch in its top wall and the corner missing from its bottom right
//   door   one 32 px tile of band cut away, its inner ink line running on
//          across the gap as a threshold — the same tile in all three renders

export const INK = '#000000', BANDFILL = '#c0b8b2';
export const BAND = 6;
export const WALL = { sx: 128, sy: 224 };      // col 4, rows 7-8
export const FLOOR = { sx: 160, sy: 224 };     // col 5, rows 7-8

/** The three rooms, measured off their renders. `top` is where the 32 x 64
 *  brick block starts and `ph` its x phase; `cuts` are taken out of the
 *  outline; `door` is the tile of the south band that is missing. */
export const REF = {
  twoRooms: {
    W: 245, H: 181, x0: 4, y0: 4, x1: 239, y1: 175, top: 10, ph: 10,
    cuts: [[80, 4, 131, 35], [144, 144, 239, 175]], door: [74, 105],
  },
  twoRoomsB: {
    W: 181, H: 187, x0: 4, y0: 4, x1: 175, y1: 172, top: 10, ph: 10,
    cuts: [], door: [74, 105],
  },
  bedsit: {
    W: 179, H: 217, x0: 19, y0: 23, x1: 158, y1: 194, top: 29, ph: 25,
    cuts: [], door: [74, 105],
  },
};

/** The room's outline inset by `k`: the rectangle shrunk by k, minus every cut
 *  grown by k. Filled even-odd, which is how a shape with bites in it is drawn
 *  in one path. */
function outline(g, r, k) {
  g.beginPath();
  g.rect(r.x0 + k, r.y0 + k, r.x1 - r.x0 + 1 - 2 * k, r.y1 - r.y0 + 1 - 2 * k);
  for (const [a, b, c, d] of r.cuts) {
    g.rect(a - k, b - k, c - a + 1 + 2 * k, d - b + 1 + 2 * k);
  }
}

export function shell(g, SH, r) {
  // ink, four of fill, ink — by filling the same outline at four insets
  g.fillStyle = INK; outline(g, r, 0); g.fill('evenodd');
  g.fillStyle = BANDFILL; outline(g, r, 1); g.fill('evenodd');
  g.fillStyle = INK; outline(g, r, BAND - 1); g.fill('evenodd');

  g.save();
  outline(g, r, BAND); g.clip('evenodd');
  const face = r.top + 64;
  for (let x = r.ph - 32; x < r.x1 + 32; x += 32) {
    g.drawImage(SH.rt, WALL.sx, WALL.sy, 32, 32, x, r.top - 32, 32, 32);
    g.drawImage(SH.rt, WALL.sx, WALL.sy, 32, 64, x, r.top, 32, 64);
    for (let y = face; y < r.y1 + 64; y += 64) {
      g.drawImage(SH.rt, FLOOR.sx, FLOOR.sy, 32, 64, x, y, 32, 64);
    }
  }
  g.restore();
}

/** The mouth, cut out of the south band after everything else is drawn. */
export function mouth(g, r) {
  const [dx0, dx1] = r.door;
  g.clearRect(dx0, r.y1 - BAND + 2, dx1 - dx0 + 1, BAND);
  g.fillStyle = INK;
  g.fillRect(dx0, r.y1 - BAND + 1, dx1 - dx0 + 1, 1);
}

/** Private space is dim and every door has its own warm — the map's art
 *  direction, applied inside the room rather than only at its mouth. */
export function lamp(g, W, H, at, strength, tint) {
  const rad = Math.max(W, H) * 0.95;
  const grd = g.createRadialGradient(at[0], at[1], 8, at[0], at[1], rad);
  grd.addColorStop(0, 'rgba(0,0,0,0)');
  grd.addColorStop(0.45, 'rgba(0,0,0,' + (0.22 * (1 - strength)).toFixed(3) + ')');
  grd.addColorStop(1, 'rgba(0,0,0,' + (0.42 - 0.22 * strength).toFixed(3) + ')');
  g.fillStyle = grd; g.fillRect(0, 0, W, H);
  g.save(); g.globalCompositeOperation = 'overlay';
  g.fillStyle = tint; g.fillRect(0, 0, W, H);
  g.restore();
}
