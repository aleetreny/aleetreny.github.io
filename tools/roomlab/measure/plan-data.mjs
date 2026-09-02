// Pull the habitat's real geometry out of the TypeScript and write it as JSON,
// so the plan drawing is generated from the same data the engine and the room
// canvas use. A plan that is drawn by hand is a plan that drifts.
//
//     node tools/roomlab/measure/plan-data.mjs
//
// Writes tools/roomlab/habitat-plan.json.
import { createServer } from 'vite';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../..');

const vite = await createServer({ root, server: { middlewareMode: true }, appType: 'custom' });
const section = await vite.ssrLoadModule('/src/lib/habitat/section.ts');
const rooms = await vite.ssrLoadModule('/src/lib/habitat/rooms.ts');
await vite.close();

const out = {
  frame: section.FRAME,
  tilt: section.TILT,
  surface: section.SURFACE_ALONG_HULL,
  outline: section.asteroidOutline().map((v) => [round(v.x), round(v.y)]),
  placements: section.PLACEMENTS.map((p) => ({
    ...p,
    name: rooms.ROOM_BY_ID[p.id].name,
    connects: rooms.ROOM_BY_ID[p.id].connects,
    grid: rooms.ROOM_BY_ID[p.id].grid,
  })),
  links: section.LINKS,
};
function round(n) { return Math.round(n * 100) / 100; }

const path = resolve(root, 'tools/roomlab/habitat-plan.json');
writeFileSync(path, JSON.stringify(out, null, 1));
console.log(`${path}\n${out.placements.length} rooms, ${out.links.length} links, frame ${out.frame.w}x${out.frame.h}`);
