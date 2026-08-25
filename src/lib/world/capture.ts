// Drawing the board onto a canvas.
//
// Two objects need this and they need the same thing: the Polaroid needs a
// photograph of a rectangle of slate, and the telescope needs a magnified view
// of one. Neither can screenshot the DOM — a browser will not hand a page's own
// pixels to a canvas — so this walks the board instead and draws what is there:
// every card and object in the rectangle, at its real position and rotation,
// with its real colours, its real live canvases and its real images.
//
// Type is drawn as type wherever it would still be readable at the output size,
// and as ruled lines where it would not, which is exactly what a small print of
// a full board looks like anyway.

export type Rect = { x: number; y: number; w: number; h: number };

type Piece = {
  el: HTMLElement;
  x: number;
  y: number;
  w: number;
  h: number;
  rot: number;
  z: number;
};

function pieceRect(el: HTMLElement): { x: number; y: number; w: number; h: number } {
  return {
    x: parseFloat(el.style.left || '0') || el.offsetLeft,
    y: parseFloat(el.style.top || '0') || el.offsetTop,
    w: el.offsetWidth,
    h: el.offsetHeight,
  };
}

function collect(board: HTMLElement, rect: Rect): Piece[] {
  const pieces: Piece[] = [];
  const nodes = board.querySelectorAll<HTMLElement>('[data-card],[data-obj]');
  for (const el of nodes) {
    if (el.hidden || el.style.opacity === '0') continue;
    const box = pieceRect(el);
    // A generous overlap test: rotation and shadows push a piece past its box.
    if (box.x > rect.x + rect.w + 60 || box.x + box.w < rect.x - 60) continue;
    if (box.y > rect.y + rect.h + 60 || box.y + box.h < rect.y - 60) continue;
    pieces.push({
      el,
      ...box,
      rot: parseFloat(el.dataset.rot ?? '0') || readRotation(el),
      z: Number(getComputedStyle(el).zIndex) || 0,
    });
  }
  return pieces.sort((a, b) => a.z - b.z);
}

function readRotation(el: HTMLElement): number {
  const match = /rotate\((-?[\d.]+)deg\)/.exec(el.style.transform || '');
  return match ? parseFloat(match[1]) : 0;
}

/** The slate's flat colour, published by the board as a custom property. The
 *  board element itself is transparent — the slate is a separate plate behind
 *  it — so there is nothing useful to read off `backgroundColor`. */
function slateGround(board: HTMLElement): string {
  const own = getComputedStyle(board).getPropertyValue('--board-ground').trim();
  return own || '#1b2724';
}

function paintable(value: string): string | null {
  if (!value || value === 'transparent' || value.startsWith('rgba(0, 0, 0, 0)')) return null;
  return value;
}

/** Everything inside one piece worth drawing: its own surfaces, its canvases,
 *  its images, its type. Deliberately shallow — this is a photograph, not a
 *  renderer. */
function drawPiece(ctx: CanvasRenderingContext2D, piece: Piece, k: number) {
  const inner = piece.el.querySelectorAll<HTMLElement>('*');
  const originX = piece.x + piece.w / 2;
  const originY = piece.y + piece.h / 2;

  ctx.save();
  ctx.translate(originX * k, originY * k);
  ctx.rotate((piece.rot * Math.PI) / 180);
  ctx.translate(-originX * k, -originY * k);

  const style = getComputedStyle(piece.el);
  const ground = paintable(style.backgroundColor);
  if (ground) {
    ctx.fillStyle = ground;
    ctx.fillRect(piece.x * k, piece.y * k, piece.w * k, piece.h * k);
  }

  for (const child of inner) {
    if (child.offsetParent === null && child.tagName !== 'CANVAS') continue;
    const cw = child.offsetWidth;
    const ch = child.offsetHeight;
    if (cw < 1 || ch < 1) continue;
    const cx = piece.x + offsetWithin(child, piece.el, 'left');
    const cy = piece.y + offsetWithin(child, piece.el, 'top');

    if (child instanceof HTMLCanvasElement) {
      // A live simulation photographs as itself. This is the whole reason the
      // camera is worth having.
      try { ctx.drawImage(child, cx * k, cy * k, cw * k, ch * k); } catch { /* a tainted canvas is still a canvas */ }
      continue;
    }
    if (child instanceof HTMLImageElement && child.complete && child.naturalWidth > 0) {
      try { ctx.drawImage(child, cx * k, cy * k, cw * k, ch * k); } catch { /* cross-origin: skip */ }
      continue;
    }
    if (child instanceof SVGElement) continue;

    const cs = getComputedStyle(child);
    const bg = paintable(cs.backgroundColor);
    if (bg) {
      ctx.fillStyle = bg;
      ctx.fillRect(cx * k, cy * k, cw * k, ch * k);
    }

    const text = directText(child);
    if (!text) continue;
    const size = parseFloat(cs.fontSize) * k;
    ctx.fillStyle = cs.color;
    if (size >= 6.5) {
      ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${size}px ${cs.fontFamily}`;
      ctx.textBaseline = 'top';
      const lines = wrap(ctx, text, cw * k);
      const leading = Math.max(size * 1.18, parseFloat(cs.lineHeight) * k || size * 1.18);
      lines.slice(0, Math.floor((ch * k) / leading) + 1).forEach((line, i) => {
        ctx.fillText(line, cx * k, cy * k + i * leading);
      });
    } else {
      // Too small to read, so it is drawn as what it looks like from here.
      ctx.globalAlpha = 0.55;
      const rows = Math.max(1, Math.floor((ch * k) / Math.max(2, size * 1.5)));
      for (let i = 0; i < rows; i += 1) {
        const width = cw * k * (i === rows - 1 ? 0.45 + (i % 3) * 0.15 : 0.82 + ((i * 7) % 5) * 0.03);
        ctx.fillRect(cx * k, cy * k + i * Math.max(2, size * 1.5), width, Math.max(0.7, size * 0.62));
      }
      ctx.globalAlpha = 1;
    }
  }
  ctx.restore();
}

function offsetWithin(child: HTMLElement, ancestor: HTMLElement, side: 'left' | 'top'): number {
  let total = 0;
  let node: HTMLElement | null = child;
  while (node && node !== ancestor) {
    total += side === 'left' ? node.offsetLeft : node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return total;
}

/** The text this element owns, not the text of everything inside it. */
function directText(el: HTMLElement): string {
  let out = '';
  for (const node of el.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) out += node.nodeValue ?? '';
  }
  return out.trim();
}

function wrap(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > width && line) { lines.push(line); line = word; }
    else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

export type RegionOptions = {
  /** Painted first, under everything. */
  ground?: string;
  /** A star field for whatever falls outside the slate. */
  stars?: boolean;
};

/** Draw `rect` of the board into a canvas context `out` pixels across. */
export function renderRegion(
  ctx: CanvasRenderingContext2D,
  board: HTMLElement,
  rect: Rect,
  out: { w: number; h: number },
  options: RegionOptions = {},
): void {
  const k = out.w / rect.w;
  ctx.save();
  ctx.clearRect(0, 0, out.w, out.h);

  if (options.stars) drawStars(ctx, rect, out);
  const ground = options.ground ?? slateGround(board);
  if (paintable(ground)) {
    ctx.fillStyle = ground;
    const x0 = Math.max(0, -rect.x * k);
    const y0 = Math.max(0, -rect.y * k);
    const x1 = Math.min(out.w, (board.offsetWidth - rect.x) * k);
    const y1 = Math.min(out.h, (board.offsetHeight - rect.y) * k);
    if (x1 > x0 && y1 > y0) ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  }

  ctx.translate(-rect.x * k, -rect.y * k);
  for (const piece of collect(board, rect)) drawPiece(ctx, piece, k);
  ctx.restore();
}

/** The sky beyond the slate. Deterministic per board cell, so panning the
 *  telescope across the same patch shows the same stars every time. */
export function drawStars(ctx: CanvasRenderingContext2D, rect: Rect, out: { w: number; h: number }): void {
  const k = out.w / rect.w;
  ctx.fillStyle = '#05070d';
  ctx.fillRect(0, 0, out.w, out.h);
  const cell = 60;
  const x0 = Math.floor(rect.x / cell) - 1;
  const y0 = Math.floor(rect.y / cell) - 1;
  const cols = Math.ceil(rect.w / cell) + 2;
  const rows = Math.ceil(rect.h / cell) + 2;
  for (let gy = y0; gy < y0 + rows; gy += 1) {
    for (let gx = x0; gx < x0 + cols; gx += 1) {
      // A cheap integer hash: same cell, same three stars, forever.
      let h = (gx * 374761393 + gy * 668265263) | 0;
      for (let i = 0; i < 3; i += 1) {
        h = Math.imul(h ^ (h >>> 13), 1274126177);
        const rx = ((h >>> 8) & 1023) / 1023;
        const ry = ((h >>> 18) & 1023) / 1023;
        const mag = ((h >>> 3) & 255) / 255;
        const sx = (gx * cell + rx * cell - rect.x) * k;
        const sy = (gy * cell + ry * cell - rect.y) * k;
        if (sx < -4 || sy < -4 || sx > out.w + 4 || sy > out.h + 4) continue;
        ctx.globalAlpha = 0.25 + mag * 0.75;
        ctx.fillStyle = mag > 0.93 ? '#cfe2ff' : '#e9eef6';
        const r = mag > 0.96 ? 1.5 : mag > 0.8 ? 1 : 0.65;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.globalAlpha = 1;
}
