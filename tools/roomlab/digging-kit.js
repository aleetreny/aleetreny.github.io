// ── THE DIGGING MOULD ─────────────────────────────────────────────────────
//
// A digging is a hole somebody made. The canon is blunt about it: *your house
// is a hole you made, and its size and finish are a public, permanent record of
// your labour, your skill, and how much help you could get.* So the six are the
// same code with different holes in it, the way the five cabins are the same
// code with different lamps.
//
// WHAT IS TRACED HERE AND WHAT IS NOT — read this before changing anything.
//
// The Diggings' own references (`reference/makeshift-*`) CANNOT be traced. Not
// their furniture: the bed, the sofa, the television, the shelf unit and the
// wardrobe rail match nothing in `public/assets/props/` above 0.77 at any of
// x0.5, x1 and x2. And not even their shell: their wall band is #c0b8b2, their
// brick #f2eae4 and their floor #a8a09a, and **none of those three colours
// exists in any sheet we own.** `trace.py` reports their band pieces at ncc
// 1.000 anyway, because NCC is mean-removed and contrast-normalised — a grey
// band and a tan band of the same geometry score identically. That is the trap:
// *1.000 means same shape, not same art.* Check the colour before believing it.
//
// So the material comes from the one rock-half reference that DOES trace:
// `reference/workshop-plate-walls-on-dirt.png`, 22 objects at ncc >= 0.88 and
// nine at 1.000. Its floor is `shelter_terrain` tile (1,9) — solved by brute
// force over every opaque tile and every phase, median error 0 out of 765 — and
// its walls are salvaged corrugated plate from `workshop.png` (194,273), which
// lands at 0.919. Both are used here exactly as that render uses them.
//
// The geometry comes from the makeshift renders, which is the part of them that
// IS measurable: the doorway is one 32 px tile, and in all three renders it is
// at the same place in the south wall. Their outlines, partitions and door
// widths are in `2026-09-03-habitat-diggings.md`.

export const T = 32;

/** shelter_terrain carries two complete dirt families, and a digging needs
 *  both: the lighter one is the floor somebody dug out, the darker one is the
 *  rock they did not. Each is a nine-slice whose edge runs through the MIDDLE
 *  of its rim tiles, not along their border — so the nine-slice is laid on a
 *  grid offset by half a tile, and the hole's edge lands where the room's own
 *  grid says the wall is. Getting this wrong shifts every floor by 16 px. */
export const DUG = { c: 0, r: 8 };      // #9c8d42, the floor of the hole
export const ROCK = { c: 7, r: 8 };     // #94693c, the rock around it
export const FILLS = [[1, 9], [3, 10], [4, 10], [3, 11], [4, 11]];
export const GRIT = [[5, 8], [6, 8], [5, 9], [6, 9]];   // spoil, not grass:
// (0,11)-(2,11) in the same family are tufts of vegetation, and nothing grows
// in a hole in an asteroid.

/** The corrugated plate the digger fitted across the mouth. workshop.png
 *  (194,273) 28x45 — the same plate `workshop-plate-walls-on-dirt` stands on
 *  its dirt at (24,143), where it matches at ncc 0.919. */
export const PLATE = { sheet: 'ws', sx: 194, sy: 273, w: 28, h: 45 };

/** A stable hash, so tile variants and grit are the same on every render.
 *  The variants are the terrain set's own — using them in rotation is how the
 *  set is meant to be used. It is not faked randomness; there is no rand() in
 *  this file. */
export function pick(list, x, y, salt) {
  const h = Math.abs(Math.imul(x * 73856093 ^ y * 19349663 ^ salt * 83492791, 2654435761)) >>> 0;
  return list[h % list.length];
}

/** Is this grid cell dug out? '#' is the rock ring and '|' is the spur of rock
 *  between two chambers — the canon calls it "a gap cut between them rather
 *  than a door", so the wall is rock they left, not a partition they built. */
export function isDug(grid, c, r) {
  if (r < 0 || r >= grid.length) return false;
  const row = grid[r];
  if (c < 0 || c >= row.length) return false;
  const ch = row[c];
  if (ch === '#' || ch === '|') return false;
  return true;   // '+' included: a door in a hand-dug room is a passage cut
                 // through the rock, so the floor runs out through the mouth
}

/** Doorways: a '+' on the boundary ring. */
export function doors(grid) {
  const out = [];
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c] !== '+') continue;
      const edge = r === 0 || r === grid.length - 1 || c === 0 || c === grid[r].length - 1;
      if (edge) out.push({ c, r, side: r === 0 ? 'n' : r === grid.length - 1 ? 's' : c === 0 ? 'w' : 'e' });
    }
  }
  return out;
}

/** The hole itself. `ox, oy` is where grid cell (0,0) starts in the canvas. */
export function digFloor(g, SH, grid, ox, oy) {
  const cut = (c, r, dx, dy) =>
    g.drawImage(SH.terr, c * T, r * T, T, T, dx, dy, T, T);

  const cols = grid[0].length, rows = grid.length;

  // the rock, everywhere, first: a digging is a hole in something
  for (let y = -T; y < rows * T + T; y += T)
    for (let x = -T; x < cols * T + T; x += T)
      cut(ROCK.c + 1, ROCK.r + 1, ox + x, oy + y);

  // the dug floor, laid on the half-tile grid so its edge falls on the room's
  for (let r = 0; r <= rows; r++) {
    for (let c = 0; c <= cols; c++) {
      // the four grid cells this rim tile straddles
      const nw = isDug(grid, c - 1, r - 1), ne = isDug(grid, c, r - 1);
      const sw = isDug(grid, c - 1, r), se = isDug(grid, c, r);
      const n = nw || ne, s = sw || se, w = nw || sw, e = ne || se;
      if (!n && !s) continue;
      const dx = ox + c * T - T / 2, dy = oy + r * T - T / 2;
      if (nw && ne && sw && se) {                     // open floor
        const f = pick(FILLS, c, r, 1);
        cut(f[0], f[1], dx, dy);
        continue;
      }
      // an inner corner: three of the four are floor
      const solid = [nw, ne, sw, se].filter(Boolean).length;
      if (solid === 3) {
        const col = DUG.c + (!nw || !sw ? 3 : 4);
        const row = DUG.r + (!nw || !ne ? 0 : 1);
        cut(col, row, dx, dy);
        continue;
      }
      const col = DUG.c + (w && e ? 1 : e ? 0 : 2);
      const row = DUG.r + (n && s ? 1 : s ? 0 : 2);
      cut(col, row, dx, dy);
    }
  }

  // the set's own grit, on the floor only, at fixed positions
  for (let r = 1; r < rows - 1; r++) {
    for (let c = 1; c < cols - 1; c++) {
      if (!isDug(grid, c, r)) continue;
      const h = Math.abs(Math.imul(c * 2654435761 ^ r * 40503, 2246822519)) >>> 0;
      if (h % 5) continue;
      const t = pick(GRIT, c, r, 7);
      cut(t[0], t[1], ox + c * T, oy + r * T);
    }
  }
}

/** The salvaged front, standing beside the mouth. */
export function plate(g, SH, x, y, flip) {
  g.save();
  if (flip) { g.translate(x + PLATE.w, y); g.scale(-1, 1); g.translate(-x, -y); }
  g.drawImage(SH.ws, PLATE.sx, PLATE.sy, PLATE.w, PLATE.h, x, y, PLATE.w, PLATE.h);
  g.restore();
}

/** The lamp. Private space is dim and each door has its own warm — the map's
 *  art direction, applied inside the room rather than only at its mouth. */
export function lamp(g, W, H, at, strength, tint) {
  const r = Math.max(W, H) * 0.95;
  const grd = g.createRadialGradient(at[0], at[1], 8, at[0], at[1], r);
  grd.addColorStop(0, 'rgba(0,0,0,0)');
  grd.addColorStop(0.45, 'rgba(0,0,0,' + (0.30 * (1 - strength)).toFixed(3) + ')');
  grd.addColorStop(1, 'rgba(0,0,0,' + (0.62 - 0.30 * strength).toFixed(3) + ')');
  g.fillStyle = grd; g.fillRect(0, 0, W, H);
  g.save(); g.globalCompositeOperation = 'overlay';
  g.fillStyle = tint; g.fillRect(0, 0, W, H);
  g.restore();
}
