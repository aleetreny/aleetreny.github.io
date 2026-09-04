// ── THE DIGGING MOULD ─────────────────────────────────────────────────────
//
// A digging is a room somebody cut and then made liveable out of what they
// had. The six are the same code with different rooms in it, the way the five
// cabins are the same code with different lamps.
//
// THIS FILE WAS REBUILT WHEN THE MAKESHIFT PACK ARRIVED. Read the history,
// because the first version was wrong in an instructive way.
//
// The Diggings' references — `reference/makeshift-two-rooms.png`,
// `-two-rooms-b.jpg` and `-bedsit.jpg` — were declared untraceable, correctly:
// none of their furniture matched any sheet above 0.766, and their wall band
// `#c0b8b2`, brick `#f2eae4` and floor `#a8a09a` existed in no sheet we owned.
// They were drawn instead in the one rock material that did trace, which was a
// substitution and was marked as one.
//
// The owner then supplied `makeshift_furnitureset.png` and
// `makeshift_room_door_tiles.png`. Re-run against those two sheets, the same
// three references now trace at **1.000** — dozens of objects each, the band,
// the brick, the floor. The gap was real and it is closed, so the substitution
// is gone and these rooms are traced.
//
// What the shell is, all of it measured off `makeshift-two-rooms-b` by brute
// force over every opaque tile x every phase, scored on the lowest 55 % of
// per-pixel errors so the furniture could not drag the fit:
//
//   band     1 px ink, 4 px of #c0b8b2, 1 px ink — the sheet's own cross-section
//   wall     makeshift_roomtiles column 4, rows 7-8: one 32 x 64 block of white
//            brick whose bottom four rows are the skirting
//   floor    the same sheet's column 5, rows 7-8 — grey concrete, median error
//            6 out of a possible 765
//   door     one 32 px tile of the band cut away, its inner ink line running on
//            across the gap as a threshold. All three references put it in the
//            same place, which is how we knew it was a template.

export const T = 32;
export const BAND = 6;
export const INK = '#000000', BANDFILL = '#c0b8b2';

/** makeshift_roomtiles, in sheet pixels. */
export const WALL = { sx: 128, sy: 224, w: 32, h: 64 };   // col 4, rows 7-8
export const FLOOR = { sx: 160, sy: 224, w: 32, h: 64 };  // col 5, rows 7-8
export const PART = { sx: 160, sy: 64, w: 6, h: 32 };     // the partition band

/** Where a room's shell sits in its canvas: the outline centred, with the
 *  interior exactly the grid's own tiles. */
export function frame(W, H, cols, rows) {
  const iw = (cols - 2) * T, ih = (rows - 2) * T;
  const x0 = Math.floor((W - (iw + 2 * BAND)) / 2);
  const y0 = Math.floor((H - (ih + 2 * BAND)) / 2);
  return {
    x0, y0, x1: x0 + iw + 2 * BAND - 1, y1: y0 + ih + 2 * BAND - 1,
    ix0: x0 + BAND, iy0: y0 + BAND, ix1: x0 + BAND + iw - 1, iy1: y0 + BAND + ih - 1,
    face: y0 + BAND + 64,        // the brick ends and the concrete starts
    // grid cell (c,r) -> canvas pixel
    px: (c) => x0 + BAND + (c - 1) * T,
    py: (r) => y0 + BAND + (r - 1) * T,
  };
}

export function isSolid(ch) { return ch === '#' || ch === '|'; }

export function isOpen(grid, c, r) {
  if (r < 0 || r >= grid.length) return false;
  const row = grid[r];
  if (c < 0 || c >= row.length) return false;
  return !isSolid(row[c]);
}

/** Doorways: a '+' on the boundary ring. */
export function doors(grid) {
  const out = [];
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c] !== '+') continue;
      if (r === 0 || r === grid.length - 1 || c === 0 || c === grid[r].length - 1) {
        out.push({ c, r, side: r === 0 ? 'n' : r === grid.length - 1 ? 's' : c === 0 ? 'w' : 'e' });
      }
    }
  }
  return out;
}

/** The room: band, brick, concrete, and the blocks of wall the grid says are
 *  solid — the bites out of the outline and the partition between chambers. */
export function shell(g, SH, grid, f) {
  const cols = grid[0].length, rows = grid.length;
  const cut = (sx, sy, w, h, dx, dy) =>
    g.drawImage(SH.rt, sx, sy, w, h, dx, dy, w, h);

  // the band: ink, four of fill, ink — drawn as two rectangles and two rings
  g.fillStyle = BANDFILL;
  g.fillRect(f.x0, f.y0, f.x1 - f.x0 + 1, f.y1 - f.y0 + 1);
  g.fillStyle = INK;
  const ring = (x0, y0, x1, y1) => {
    g.fillRect(x0, y0, x1 - x0 + 1, 1); g.fillRect(x0, y1, x1 - x0 + 1, 1);
    g.fillRect(x0, y0, 1, y1 - y0 + 1); g.fillRect(x1, y0, 1, y1 - y0 + 1);
  };
  ring(f.x0, f.y0, f.x1, f.y1);
  ring(f.ix0 - 1, f.iy0 - 1, f.ix1 + 1, f.iy1 + 1);

  g.save();
  g.beginPath();
  g.rect(f.ix0, f.iy0, f.ix1 - f.ix0 + 1, f.iy1 - f.iy0 + 1);
  g.clip();
  // brick down to the skirting, then concrete. One extra course above the
  // block so the strip under the north band is not bare.
  for (let x = f.ix0; x < f.ix1 + T; x += T) {
    cut(WALL.sx, WALL.sy, T, T, x, f.iy0 - T);
    cut(WALL.sx, WALL.sy, T, 64, x, f.iy0);
    for (let y = f.face; y < f.iy1 + 64; y += 64) cut(FLOOR.sx, FLOOR.sy, T, 64, x, y);
  }
  g.restore();

  // the blocks of solid the grid declares inside the ring: the partition
  // between two chambers, and the bites out of the corners that give each
  // room its own shape. Both are wall, so both are drawn as wall.
  for (let r = 1; r < rows - 1; r++) {
    for (let c = 1; c < cols - 1; c++) {
      if (!isSolid(grid[r][c])) continue;
      const x = f.px(c), y = f.py(r);
      if (grid[r][c] === '|') {
        // a partition is a 6 px band, centred in its column, and it carries the
        // brick's own face above the skirting line like the walls do
        const bx = x + (T - BAND) / 2;
        g.fillStyle = INK; g.fillRect(bx, y, BAND, T);
        g.fillStyle = BANDFILL; g.fillRect(bx + 1, y, BAND - 2, T);
        // cap the free end, so a partition that stops mid-room reads as built
        // and finished rather than as a wall that ran out
        if (!isSolid(grid[r + 1] ? grid[r + 1][c] : '#')) {
          g.fillStyle = INK; g.fillRect(bx, y + T - 1, BAND, 1);
        }
        if (!isSolid(grid[r - 1] ? grid[r - 1][c] : '#')) {
          g.fillStyle = INK; g.fillRect(bx, y, BAND, 1);
        }
        continue;
      }
      g.save(); g.beginPath(); g.rect(x, y, T, T); g.clip();
      cut(WALL.sx, WALL.sy, T, 64, x, y < f.face ? f.iy0 : y - 32);
      g.restore();
      g.fillStyle = INK;                                   // its own outline
      for (const [dc, dr, ex, ey, ew, eh] of [
        [0, -1, x, y, T, 1], [0, 1, x, y + T - 1, T, 1],
        [-1, 0, x, y, 1, T], [1, 0, x + T - 1, y, 1, T],
      ]) if (isOpen(grid, c + dc, r + dr)) g.fillRect(ex, ey, ew, eh);
    }
  }

  // the mouths: the band cut away, its inner ink line running on as a threshold
  for (const d of doors(grid)) {
    const x = f.px(d.c);
    if (d.side === 's') {
      g.clearRect(x, f.iy1 + 2, T, BAND);
      g.fillStyle = INK; g.fillRect(x, f.iy1 + 1, T, 1);
    } else if (d.side === 'n') {
      g.clearRect(x, f.y0, T, BAND - 1);
      g.fillStyle = INK; g.fillRect(x, f.iy0 - 1, T, 1);
    }
  }
}

/** Private space is dim and every door has its own warm — the map's art
 *  direction, applied inside the room rather than only at its mouth. */
export function lamp(g, W, H, at, strength, tint) {
  const r = Math.max(W, H) * 0.95;
  const grd = g.createRadialGradient(at[0], at[1], 8, at[0], at[1], r);
  grd.addColorStop(0, 'rgba(0,0,0,0)');
  grd.addColorStop(0.45, 'rgba(0,0,0,' + (0.26 * (1 - strength)).toFixed(3) + ')');
  grd.addColorStop(1, 'rgba(0,0,0,' + (0.50 - 0.26 * strength).toFixed(3) + ')');
  g.fillStyle = grd; g.fillRect(0, 0, W, H);
  g.save(); g.globalCompositeOperation = 'overlay';
  g.fillStyle = tint; g.fillRect(0, 0, W, H);
  g.restore();
}
