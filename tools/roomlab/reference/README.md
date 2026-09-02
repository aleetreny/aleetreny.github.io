# References

Room renders by 0_mem0ry — https://0-mem0ry.itch.io/ — kept here to be traced
from. They are the artist's own promo images for the packs in
`public/assets/props/`, and they are the reason a habitat room looks like a room
rather than like a shelf of props. **This directory is not copied into `dist/`,
so none of it is served by the site.**

Every scale below was measured, not estimated — see `../measure/README.md`.
**Drawn at** is the integer factor the render was exported at; divide by it to get
native pixels, which is the scale the sprites were drawn for and the scale a trace
works in.

| File | Drawn at | Native | Tiles of 32 | Traced for |
| --- | --- | --- | --- | --- |
| `two-berth-cabin.jpg` | 5.34× | ≈ 204 × 205 | 6.4 × 6.4 | **The Cabins.** Already traced, as `../berth.html`. |
| `shelter-bunker-room.png` | 3× | 154 × 218 | 4.8 × 6.8 | **The Infirmary.** A bed, stores racks, a first-aid box, and an alcove partitioned off the main room. |
| `shelter-bunk-and-stores.jpg` | 2× | 166 × 250 | 5.2 × 7.8 | **The Hold.** Racking, jars, tins, a footlocker, a bunk with its ladder. |
| `workshop-two-bay.jpg` | 4× | 250 × 228 | 7.8 × 7.1 | **The Workshops.** Pegboard, dressed bench, tool chest, lockers, shutter, floor grate. |
| `workshop-plate-walls-on-dirt.png` | 4× | 179 × 212 | 5.6 × 6.6 | **The rock half of the map.** A room walled in salvaged corrugated sheet standing on bare dirt — no drawn wall band, no floor tile. |
| `workshop-three-rooms.jpg` | 2× | ≈ 600 × 430 | 18.7 × 13.4 | **How to compose.** Three rooms sharing walls in one frame. Cross-pack: it uses props that are in none of our sheets, so it is a composition reference, not a traceable one. |
| `makeshift-two-rooms.png` | 3× | 245 × 181 | 7.7 × 5.7 | **The Diggings.** Two rooms sharing a wall with a gap in it, and a notched outline. |
| `makeshift-two-rooms-b.jpg` | 4× | 181 × 187 | 5.7 × 5.8 | **The Diggings.** The same move again, differently furnished. |
| `makeshift-bedsit.jpg` | 4× | 178 × 217 | 5.6 × 6.8 | **The Diggings, the Cabins' second clutter layer.** Everything improvised out of crates and toolboxes. |
| `bathroom-wet-and-filthy.jpg` | 4× | 184 × 170 | 5.8 × 5.3 | **The Well.** The whole wet vocabulary: puddles, running stains, drains, grating, mop and bucket. |
| `kitchen-working.png` | 4× | 178 × 212 | 5.6 × 6.6 | **The Common**, Pilar's corner only. Griddle, hood, prep tables, under-shelves. |
| `office-ruin.png` | 3× | 236 × 269 | 7.4 × 8.4 | **The Breach.** Broken walls with exposed rebar, concrete rubble, a safe left standing. |
| `office-abandoned.jpg` | 4× | 199 × 199 | 6.2 × 6.2 | **The Bridge.** Desks that read as consoles, a chair, paper over the floor, a cracked window. |
| `office-rock-through-the-floor.png` | native promo art | 545 × 736 | — | **The Breach, the Landing.** Rock pushing up through a built floor. Redrawn promo art: its props do not match the shipped sheets at any integer scale, so trace the *idea*, not the pixels. |
| `shelter-dugout-mouth.png` | 3× | 310 × 215 | 9.7 × 6.7 | **The Dock, the Face.** A dugout entrance with a corrugated hood, spoil heaps, worn tracks. |
| `shelter-hillside-mouth.jpg` | 3× | 237 × 258 | 7.4 × 8.1 | **The Face.** A shelter mouth cut into rock. |
| `shelter-ground-hatch.jpg` | 8× | 89 × 109 | 2.8 × 3.4 | **The Dock.** A hatch flush in the ground. |
| `garden-planters.png` | 4× | 177 × 194 | 5.5 × 6.1 | **Hydroponics.** Improvised planters — drums, tyres, buckets, tins — with living plants in them. |

`fig-scale-audit.png` is not a reference. It is the evidence behind the size
decision in `docs/superpowers/specs/2026-09-02-habitat-references-and-scale.md`:
every canon grid at 32 px per tile, filled with copies of the traced cabin.
Regenerate it with `python3 ../measure/scale_audit.py <berth 1:1 render> fig-scale-audit.png`.

## Licence

0_mem0ry's packs permit commercial use and modification; resale and
redistribution are not permitted. See `../../../public/assets/props/LICENSE-0_mem0ry.txt`.
These are the artist's published promo images, kept out of the built site for
that reason. The wider question — that `public/assets/props/` *is* served to every
visitor and should be cut down to an atlas of only the tiles used — is still open.
