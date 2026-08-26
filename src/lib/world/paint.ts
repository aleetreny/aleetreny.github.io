// Painting the city.
//
// It was two thousand SVG nodes, which is a perfectly good way to describe a
// city and a bad way to keep one on screen: the board is one compositing layer,
// every animated object on it invalidates that layer, and everything in the
// layer is then rasterised again — including all two thousand nodes, sixty
// times a second, for a picture that had not changed. It cost forty
// milliseconds a frame.
//
// So the city is painted instead, into a buffer the size of the window, and
// that buffer is only repainted when the camera actually moves. Standing still
// it costs one drawImage; panning it costs the hundred-odd buildings that are
// actually in shot. Nothing here touches the DOM.

import type { Building, City, Prop, PropKind } from './city';

export type View = { x: number; y: number; r: number; b: number };

const SKIN = ['#2b1d5c', '#241a4e', '#332063', '#1e1846', '#3a2456'];
const EDGE = ['#7cf9ff', '#a6ff6e', '#ff7ce0', '#8b9cff', '#ffe86b'];
const PANE = ['rgba(140,226,255,.16)', 'rgba(255,228,150,.17)', 'rgba(170,255,210,.13)', 'rgba(210,170,255,.15)'];
const LIT = ['rgba(180,246,255,.34)', 'rgba(255,236,176,.4)', 'rgba(190,255,226,.3)', 'rgba(232,196,255,.36)'];

/** The window tiles, built once: a dark pane and a lit one, repeating. Filling
 *  a facade with a pattern is one operation however many windows it has. */
let panes: CanvasPattern[] | null = null;
function glazing(ctx: CanvasRenderingContext2D): CanvasPattern[] {
  if (panes) return panes;
  panes = PANE.map((dark, i) => {
    const tile = document.createElement('canvas');
    tile.width = 26 + i * 4;
    tile.height = 17 + i;
    const tc = tile.getContext('2d')!;
    tc.fillStyle = dark;
    tc.fillRect(2, 3, 6 + (i % 2) * 2, 8);
    tc.fillStyle = LIT[i];
    tc.fillRect(15 + i * 2, 3, 6 + (i % 2) * 2, 8);
    return ctx.createPattern(tile, 'repeat')!;
  });
  return panes;
}

/** One soft blob, built once and stamped wherever fog is wanted. A radial
 *  gradient costs real time in software raster; a scaled drawImage does not. */
let puff: HTMLCanvasElement | null = null;
function haze(): HTMLCanvasElement {
  if (puff) return puff;
  puff = document.createElement('canvas');
  puff.width = 128;
  puff.height = 128;
  const c = puff.getContext('2d')!;
  const g = c.createRadialGradient(64, 64, 2, 64, 64, 64);
  g.addColorStop(0, 'rgba(168,140,255,.34)');
  g.addColorStop(0.6, 'rgba(126,96,220,.14)');
  g.addColorStop(1, 'rgba(90,60,180,0)');
  c.fillStyle = g;
  c.fillRect(0, 0, 128, 128);
  return puff;
}

const inView = (x: number, y: number, w: number, h: number, view: View) => (
  x < view.r && x + w > view.x && y < view.b && y + h > view.y
);

/** The whole city, in board coordinates, clipped to what is on screen. */
export function paintCity(ctx: CanvasRenderingContext2D, city: City, view: View, k: number) {
  const { roads, highways, buildings, props, fence, weather } = city;

  // ---- tarmac --------------------------------------------------------------
  ctx.fillStyle = 'rgba(16,10,38,.82)';
  const tar = new Path2D();
  for (const road of roads) {
    if (road.x1 === road.x2) {
      if (!inView(road.x1 - road.w / 2, road.y1, road.w, road.y2 - road.y1, view)) continue;
      tar.rect(road.x1 - road.w / 2, road.y1, road.w, road.y2 - road.y1);
    } else {
      if (!inView(road.x1, road.y1 - road.w / 2, road.x2 - road.x1, road.w, view)) continue;
      tar.rect(road.x1, road.y1 - road.w / 2, road.x2 - road.x1, road.w);
    }
  }
  for (const road of highways) {
    const nx = -road.dy;
    const ny = road.dx;
    const tx = road.x + road.dx * road.len;
    const ty = road.y + road.dy * road.len;
    tar.moveTo(road.x + nx * road.wide, road.y + ny * road.wide);
    tar.lineTo(tx + nx * 2, ty + ny * 2);
    tar.lineTo(tx - nx * 2, ty - ny * 2);
    tar.lineTo(road.x - nx * road.wide, road.y - ny * road.wide);
    tar.closePath();
  }
  ctx.fill(tar);

  // ---- centre lines --------------------------------------------------------
  const lines = new Path2D();
  for (const road of roads) {
    if (!inView(Math.min(road.x1, road.x2), Math.min(road.y1, road.y2),
      Math.abs(road.x2 - road.x1) || 1, Math.abs(road.y2 - road.y1) || 1, view)) continue;
    lines.moveTo(road.x1, road.y1);
    lines.lineTo(road.x2, road.y2);
  }
  ctx.strokeStyle = 'rgba(150,214,255,.3)';
  ctx.lineWidth = 2;
  ctx.setLineDash([22, 26]);
  ctx.stroke(lines);

  const far = new Path2D();
  for (const road of highways) {
    far.moveTo(road.x, road.y);
    far.lineTo(road.x + road.dx * road.len, road.y + road.dy * road.len);
  }
  ctx.strokeStyle = 'rgba(180,232,255,.5)';
  ctx.lineWidth = 3;
  ctx.setLineDash([40, 34]);
  ctx.stroke(far);
  ctx.setLineDash([]);

  // Where a road stops being a road and becomes a horizon.
  const glow = haze();
  ctx.globalAlpha = 0.5;
  for (const road of highways) {
    const tx = road.x + road.dx * road.len;
    const ty = road.y + road.dy * road.len;
    const rad = road.wide * 2.4;
    ctx.drawImage(glow, tx - rad, ty - rad, rad * 2, rad * 2);
  }
  ctx.globalAlpha = 1;

  // ---- the hoarding round the site ----------------------------------------
  const boards = new Path2D();
  for (const run of fence.runs) {
    boards.moveTo(run.x1, run.y1);
    boards.lineTo(run.x2, run.y2);
  }
  ctx.strokeStyle = 'rgba(24,14,52,.92)';
  ctx.lineWidth = 22;
  ctx.stroke(boards);
  ctx.strokeStyle = 'rgba(255,214,64,.5)';
  ctx.lineWidth = 5;
  ctx.setLineDash([16, 14]);
  ctx.stroke(boards);
  ctx.setLineDash([]);

  const gates = new Path2D();
  for (const gate of fence.gates) {
    if (gate.horizontal) {
      gates.moveTo(gate.x - 62, gate.y);
      gates.lineTo(gate.x - 62, gate.y - 26);
      gates.lineTo(gate.x + 62, gate.y - 26);
      gates.lineTo(gate.x + 62, gate.y);
      gates.moveTo(gate.x, gate.y - 26);
      gates.lineTo(gate.x, gate.y);
    } else {
      gates.moveTo(gate.x, gate.y - 62);
      gates.lineTo(gate.x - 26, gate.y - 62);
      gates.lineTo(gate.x - 26, gate.y + 62);
      gates.lineTo(gate.x, gate.y + 62);
      gates.moveTo(gate.x - 26, gate.y);
      gates.lineTo(gate.x, gate.y);
    }
  }
  ctx.strokeStyle = 'rgba(255,214,64,.55)';
  ctx.lineWidth = 3.4;
  ctx.stroke(gates);

  const towers = new Path2D();
  for (const tower of fence.towers) {
    towers.moveTo(tower.x, tower.y);
    towers.lineTo(tower.x, tower.y - 72);
    towers.moveTo(tower.x - 13, tower.y - 64);
    towers.lineTo(tower.x + 13, tower.y - 64);
    towers.moveTo(tower.x - 9, tower.y - 64);
    towers.lineTo(tower.x, tower.y - 128);
    towers.lineTo(tower.x + 9, tower.y - 64);
  }
  ctx.strokeStyle = 'rgba(198,214,226,.45)';
  ctx.lineWidth = 2.6;
  ctx.stroke(towers);
  ctx.globalAlpha = 0.6;
  for (const tower of fence.towers) {
    ctx.drawImage(glow, tower.x - 60, tower.y - 144, 120, 120);
  }
  ctx.globalAlpha = 1;

  // ---- the blocks ----------------------------------------------------------
  const glass = glazing(ctx);
  for (const b of buildings) {
    if (!inView(b.x, b.y - b.h, b.w, b.h, view)) continue;
    paintBlock(ctx, b, glass, k);
  }

  // ---- everything loose ----------------------------------------------------
  for (let tint = 0; tint < EDGE.length; tint += 1) {
    const path = new Path2D();
    let any = false;
    for (const prop of props) {
      if (prop.tint !== tint) continue;
      if (!inView(prop.x - 34, prop.y - 50, 68, 56, view)) continue;
      kit(path, prop);
      any = true;
    }
    if (!any) continue;
    ctx.strokeStyle = EDGE[tint];
    ctx.globalAlpha = 0.62;
    ctx.lineWidth = 1.6;
    ctx.stroke(path);
  }
  ctx.globalAlpha = 1;

  // ---- and the haze over all of it ----------------------------------------
  for (const bank of weather.fog) {
    if (!inView(bank.x - bank.rx, bank.y - bank.ry, bank.rx * 2, bank.ry * 2, view)) continue;
    ctx.drawImage(glow, bank.x - bank.rx, bank.y - bank.ry, bank.rx * 2, bank.ry * 2);
  }

  // The world has an edge, and a city that simply stops at a straight line
  // looks unfinished. It dissolves into night instead.
  edge(ctx, city, view);
}

/** The last streets dissolve rather than being cut off.
 *
 *  Painting night over them does not work: the band is opaque at the boundary
 *  and there is nothing beyond it, so the world ends in a hard rectangle of
 *  black against the desk. This rubs the city out instead — the same gradient,
 *  composited as destination-out — so whatever is behind the canvas comes
 *  through and the edge is genuinely soft. */
function edge(ctx: CanvasRenderingContext2D, city: City, view: View) {
  const { x, y, w, h } = city.bounds;
  const deep = 900;
  const bands: Array<[number, number, number, number, number, number, number, number]> = [
    [x, y, w, deep, x, y, x, y + deep],
    [x, y + h - deep, w, deep, x, y + h, x, y + h - deep],
    [x, y, deep, h, x, y, x + deep, y],
    [x + w - deep, y, deep, h, x + w, y, x + w - deep, y],
  ];
  ctx.globalCompositeOperation = 'destination-out';
  for (const [bx, by, bw, bh, gx1, gy1, gx2, gy2] of bands) {
    if (!inView(bx, by, bw, bh, view)) continue;
    const fade = ctx.createLinearGradient(gx1, gy1, gx2, gy2);
    fade.addColorStop(0, 'rgba(0,0,0,1)');
    fade.addColorStop(0.5, 'rgba(0,0,0,.55)');
    fade.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = fade;
    ctx.fillRect(bx, by, bw, bh);
  }
  // And nothing outside the world at all.
  ctx.fillStyle = 'rgba(0,0,0,1)';
  const far = 9000;
  ctx.fillRect(x - far, y - far, far, h + far * 2);
  ctx.fillRect(x + w, y - far, far, h + far * 2);
  ctx.fillRect(x - far, y - far, w + far * 2, far);
  ctx.fillRect(x - far, y + h, w + far * 2, far);
  ctx.globalCompositeOperation = 'source-over';
}

function paintBlock(ctx: CanvasRenderingContext2D, b: Building, glass: CanvasPattern[], k: number) {
  const top = b.y - b.h;
  ctx.fillStyle = SKIN[b.tint % SKIN.length];
  ctx.fillRect(b.x, top, b.w, b.h);
  ctx.strokeStyle = 'rgba(0,0,0,.5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(b.x, top, b.w, b.h);

  // Windows, as one pattern fill however many there are.
  const gh = Math.max(0, b.h - (b.sign ? 30 : 14));
  if (gh > 4 && b.w > 10) {
    ctx.save();
    ctx.translate(b.x + 4, top + 7);
    ctx.fillStyle = glass[b.glass % glass.length];
    ctx.fillRect(0, 0, Math.max(0, b.w - 8), gh);
    ctx.restore();
  }

  // Roof and ground floor share a stroke.
  const edge = EDGE[b.tint % EDGE.length];
  const trim = new Path2D();
  cap(trim, b, top);
  ground(trim, b);
  ctx.strokeStyle = edge;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 1.6;
  ctx.stroke(trim);
  ctx.globalAlpha = 1;

  // Signage, once it is big enough to read.
  if (b.sign) {
    ctx.fillStyle = 'rgba(10,6,26,.8)';
    ctx.fillRect(b.x + 3, b.y - 21, b.w - 6, 12);
    ctx.strokeStyle = edge;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 0.8;
    ctx.strokeRect(b.x + 3, b.y - 21, b.w - 6, 12);
    ctx.globalAlpha = 1;
    const size = Math.min(9, (b.w - 10) / (b.sign.length * 0.62));
    if (size * k > 4) {
      ctx.fillStyle = edge;
      ctx.globalAlpha = 0.82;
      ctx.font = `${size.toFixed(1)}px "IBM Plex Mono", ui-monospace, monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(b.sign, b.x + b.w / 2, b.y - 12);
      ctx.globalAlpha = 1;
    }
  }

  if (b.crane) {
    const cx = b.x + b.w * 0.62;
    ctx.strokeStyle = 'rgba(255,232,107,.5)';
    ctx.globalAlpha = 1;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, top + 6);
    ctx.lineTo(cx, top - 82);
    ctx.lineTo(cx - 56, top - 82);
    ctx.moveTo(cx, top - 82);
    ctx.lineTo(cx + 34, top - 82);
    ctx.lineTo(cx + 34, top - 60);
    ctx.stroke();
  }
}

function cap(path: Path2D, b: Building, top: number) {
  switch (b.roof) {
    case 'gable':
      path.moveTo(b.x - 3, top);
      path.lineTo(b.x + b.w / 2, top - 22);
      path.lineTo(b.x + b.w + 3, top);
      path.closePath();
      break;
    case 'saw': {
      const teeth = Math.max(1, Math.floor(b.w / 26));
      for (let i = 0; i < teeth; i += 1) {
        const x = b.x + i * 26;
        path.moveTo(x, top);
        path.lineTo(x, top - 13);
        path.lineTo(x + 26, top - 5);
      }
      break;
    }
    case 'tank':
      path.rect(b.x + 6, top - 3, b.w - 12, 3);
      path.moveTo(b.x + b.w * 0.36, top - 3);
      path.lineTo(b.x + b.w * 0.36, top - 12);
      path.moveTo(b.x + b.w * 0.58, top - 3);
      path.lineTo(b.x + b.w * 0.58, top - 12);
      path.rect(b.x + b.w * 0.3, top - 23, b.w * 0.36, 11);
      break;
    case 'aerial':
      path.moveTo(b.x, top);
      path.lineTo(b.x + b.w, top);
      path.moveTo(b.x + b.w * 0.5, top);
      path.lineTo(b.x + b.w * 0.5, top - 34);
      path.moveTo(b.x + b.w * 0.5 - 9, top - 22);
      path.lineTo(b.x + b.w * 0.5 + 9, top - 22);
      path.moveTo(b.x + b.w * 0.5 - 5, top - 13);
      path.lineTo(b.x + b.w * 0.5 + 5, top - 13);
      break;
    case 'dome':
      path.moveTo(b.x + b.w * 0.2, top);
      path.quadraticCurveTo(b.x + b.w * 0.5, top - b.w * 0.4, b.x + b.w * 0.8, top);
      break;
    default:
      path.rect(b.x - 3, top - 4, b.w + 6, 4);
  }
}

function ground(path: Path2D, b: Building) {
  const dw = Math.min(15, b.w * 0.24);
  const dx = b.x + b.w * 0.5 - dw / 2;
  const dh = Math.min(22, b.h * 0.3);
  path.moveTo(dx, b.y);
  path.lineTo(dx, b.y - dh);
  path.lineTo(dx + dw, b.y - dh);
  path.lineTo(dx + dw, b.y);
  if (!b.sign) return;
  path.moveTo(b.x + 4, b.y - 26);
  path.lineTo(b.x - 1, b.y - 17);
  path.lineTo(b.x + b.w + 3, b.y - 17);
  path.lineTo(b.x + b.w - 2, b.y - 26);
  path.closePath();
}

/** Every loose thing in the world, as a run of segments on a shared path. */
const KIT: Record<PropKind, number[][]> = {
  //  Each entry is a polyline in the prop's own coordinates, feet at 0,0.
  cone: [[-5, 0, 5, 0], [1, 0, -1, -13, -3, -13, -5, 0], [-8, -3, 8, -3]],
  barrier: [[-16, 0, -16, -13, 16, -13, 16, 0], [-16, -9, 16, -9], [-10, 0, -10, 6], [10, 0, 10, 6]],
  skip: [[-19, 0, -15, -15, 15, -15, 19, 0, -19, 0], [-32, -13, 28, -13]],
  pallet: [[-15, 0, 15, 0, 15, -6, -15, -6, -15, 0], [-12, -6, -12, -10, 12, -10, 12, -6]],
  mixer: [[-13, 0, -9, -9, 5, -9, 5, 0], [-17, 0, 9, 0], [0, -9, 9, -18]],
  ladder: [[-3, 0, 3, -30], [-9, 0, -3, -30], [-8, -5, -1, -5], [-7, -11, 0, -11], [-6, -17, 1, -17], [-5, -23, 2, -23]],
  scaffold: [[-18, 0, -18, -34, 18, -34, 18, 0], [-18, -22, 18, -22], [-18, -11, 18, -11], [-18, -34, 0, 0], [18, -34, 0, 0]],
  hoarding: [[-26, 0, -26, -24, 26, -24, 26, 0, -26, 0], [-26, -16, 26, -16], [-14, 0, -14, 6], [14, 0, 14, 6]],
  pipes: [[-14, 0, -14, -6, -4, -6, -4, 0], [-4, 0, -4, -6, 6, -6, 6, 0], [-9, -6, -9, -12, 1, -12, 1, -6]],
  reel: [[-9, -9, 9, -9, 9, 9, -9, 9, -9, -9], [-13, -9, -13, 9], [13, -9, 13, 9]],
  lamp: [[0, 0, 0, -38, 9, -47, 16, -47], [14, -47, 18, -43, 14, -39, 10, -43, 14, -47]],
  tree: [[0, 0, 0, -14], [-11, -22, 0, -33, 11, -22, 0, -14, -11, -22]],
  bench: [[-13, 0, -13, -7, 13, -7, 13, 0], [-13, -7, -13, -13, 13, -13, 13, -7], [-9, -7, -9, -3], [9, -7, 9, -3]],
  hydrant: [[-4, 0, -4, -11, 4, -11, 4, 0], [-7, 0, 7, 0], [-8, -8, 8, -8]],
  kiosk: [[-16, 0, -16, -26, 16, -26, 16, 0], [-20, -26, 20, -26, 16, -33, -16, -33, -20, -26], [-6, 0, -6, -14, 6, -14, 6, 0]],
  sign: [[0, 0, 0, -24], [-13, -24, 13, -24, 13, -38, -13, -38, -13, -24]],
  bin: [[-7, 0, -5, -16, 5, -16, 7, 0, -7, 0], [-11, -16, 7, -16], [0, -16, 0, -20]],
  crate: [[-9, 0, -9, -14, 9, -14, 9, 0, -9, 0], [-9, -14, 9, 0], [9, -14, -9, 0]],
  lights: [[0, 0, 0, -30], [-11, -30, 11, -30, 7, -39, -7, -39, -11, -30], [-3, -31, -3, -37], [3, -31, 3, -37]],
  portaloo: [[-9, 0, -9, -30, 9, -30, 9, 0, -9, 0], [2, -22, 6, -22, 6, -16, 2, -16, 2, -22]],
  sandpile: [[-17, 0, -8, -12, 8, -12, 17, 0, -17, 0], [-7, -4, -3, -8, 1, -4]],
  digger: [[-16, 0, -12, -5, -6, 0], [-4, 0, 0, -5, 6, 0], [-14, -5, -14, -18, 6, -18, 6, -5], [6, -9, 20, -13, 26, -1], [6, -9, 9, -20]],
  barrow: [[-11, 0, -7, -4, -3, 0], [-14, -4, -18, -18, 4, -18, -1, -4, -14, -4], [4, -18, 11, -24]],
  drum: [[-6, 0, -6, -17, 6, -17, 6, 0, -6, 0], [-12, -17, 12, -17], [-12, -11, 12, -11], [-12, -5, 12, -5]],
  planks: [[-20, 0, 20, 0, 20, -4, -20, -4, -20, 0], [-18, -4, 18, -4, 18, -8, -18, -8], [-15, -8, 15, -8, 15, -12, -15, -12]],
};

function kit(path: Path2D, prop: Prop) {
  const shape = KIT[prop.kind];
  const f = prop.flip;
  for (const line of shape) {
    path.moveTo(prop.x + line[0] * f, prop.y + line[1]);
    for (let i = 2; i < line.length; i += 2) path.lineTo(prop.x + line[i] * f, prop.y + line[i + 1]);
  }
}

/** Rain, drawn live because it falls. A few hundred short strokes, all on one
 *  path, and only for the cells that are on screen. */
export function paintRain(ctx: CanvasRenderingContext2D, city: City, view: View, now: number) {
  const path = new Path2D();
  let any = false;
  for (const cell of city.weather.rain) {
    if (!inView(cell.x, cell.y, cell.w, cell.h, view)) continue;
    const pitch = 46;
    const slide = ((now * cell.rate) / 6) % pitch;
    const lean = Math.tan((cell.tilt * Math.PI) / 180) * 26;
    const x0 = Math.max(cell.x, view.x);
    const x1 = Math.min(cell.x + cell.w, view.r);
    const y0 = Math.max(cell.y, view.y);
    const y1 = Math.min(cell.y + cell.h, view.b);
    for (let x = Math.ceil(x0 / pitch) * pitch; x < x1; x += pitch) {
      const jitter = ((x * 7919) % pitch);
      for (let y = Math.ceil((y0 - jitter) / pitch) * pitch + jitter + slide; y < y1; y += pitch) {
        path.moveTo(x, y);
        path.lineTo(x + lean, y + 26);
        any = true;
      }
    }
  }
  if (!any) return;
  ctx.strokeStyle = 'rgba(190,222,255,.34)';
  ctx.lineWidth = 1.1;
  ctx.stroke(path);
}
