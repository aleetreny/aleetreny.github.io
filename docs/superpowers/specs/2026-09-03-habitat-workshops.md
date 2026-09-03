# The Workshops: the first room cut in rock

Building, phase seven. Branch: `night-shift-habitat`.

The five cabins are closed. This is the first room on the **rock** side of the
map, and the reason it was chosen to go first: it is the only room in the
collection whose references also answer *how a rock-side room is walled and
floored*. Everything learned here is what the six diggings, the Common, the Well
and the Great Wall get built from.

`tools/roomlab/workshops.html`. 250 × 228 px, the reference's own native size.
The room reports **clean** — 12 props on the floor, 7 on the rock, nothing
overlapping, nothing crossing the frame — and `pnpm check` is green.

---

## Two references, because no single one is this room

| | Gives | Proof |
| --- | --- | --- |
| `workshop-two-bay.jpg` ×4 → **250 × 228** | the composition and every prop | 7 objects match `workshop.png` at **ncc 1.000, scale 1.0**. Our sheet, our size, nothing to invent. |
| `workshop-plate-walls-on-dirt.png` ×4 → 179 × 212 | the wall and floor of a room that is **not a built room** | its props match `workshop.png` too; its *ground* matches no sheet we have, so the floor is drawn — measured off it at three flat tones and no gradient: `156,141,66`, `132,114,19`, `106,89,0`. |

Four prop positions are **ncc-exact** and are marked `ANCHOR` in the source: the
pegboard at (88, 52), the tall shelf, the floor mat at (38, 172) and the timber
bucket at (128, 162). The rest were measured off the render.

The outline was measured, not eyeballed: content runs `x 7..242, y 7..210`, and
the right bay's ceiling is cut **32 px higher** than the left one — that step is
the composition, so it is kept. The floor line sits at `y = 79`, read off the
base of the reference's shutter.

## What was substituted, and why each was forced

| Reference | Ours | Because |
| --- | --- | --- |
| concrete block wall | **rock**, chiselled | the room is cut in an asteroid |
| tiled floor, 16 px grid | **rock dust**, no grid | same |
| the block wall between the bays | **bolted plate** standing on the rock | "Bays, divided by whoever got there first" — and the plate-walls reference is exactly this |
| the roller shutter | **the fabricator's hatch** | see below |
| its daylight olive dirt | the same three flat tones, pulled toward grey-brown | the law that a saturated pixel is a light, a living thing or cargo |

**The fabricator.** The room's lore needs one and no sheet carries one; the last
spec listed it as a missing object. Rather than invent a machine, the reference's
**roller shutter stays exactly where the reference puts it** and is read as the
fabricator's hatch: the pixels are the reference's, what they are is ours. It is
aged into the habitat afterwards — rust where the rails hold water, grime along
the bottom, the slot at its foot the finished work comes out of, and one green
running light, the only pixel in the room that is not lamp amber.

## The three things that had to be drawn

No sheet carries them, so they are drawn, and each is written down here because a
drawn thing is a decision:

1. **The rock face.** Courses of angular faces, each with its own width, skew and
   height so the course line is not a seam; a bright edge where the tool came
   through; chisel marks everywhere. Four tone steps, because three read as mud.
2. **The rock dust.** Large flat patches in three tones, hard-edged, plus grit
   and chips of stone lit on top — and **the track**, a worn line from the west
   door to the fabricator, which is the trace the design says to spend first.
3. **The sorted scrap.** Three stacks of hull offcuts graded by size, which is the
   one thing in this room anybody has organised. A cut edge is a date, so the
   bright ones came off the ship this month.

**Both rock functions fill a scanline at a time.** The first version used canvas
path fills, and a path fill antialiases its diagonals — which puts half-tones
into a picture that has none. Every facet and every patch is `fillRect` now.

## The light

Two work lamps and nothing else. What matters is not the level but that **the
ground state is cool and the lamps are warm**: without that, rock, dust and lamp
are all the same brown and the room reads as one flat wash. Lit and unlit now
differ in hue as well as in value, which is what gives the third bay its
character — the scrap ended up there because that is where the light does not
reach, not because anybody decided it.

## Where the drawn room and the grid disagree

`rooms.ts` gives the Workshops a 9 × 9 grid with `|` partitions in both halves
**and** a full-width `=`, which describes four cells; its own note says "Three
bays". The room is drawn as **three** — two above, one across the bottom — which
is what the lore says and what the reference's composition supports. The grid
also puts a partition hard against the east wall, so the east doorway opens onto
it. Neither is fixed here: the grid is walkability data and the render is the
picture, and re-cutting the grid moves every room below it on the map. Flagged
for the corridor phase, where the doorways get resolved anyway.

## Still open

1. **The room's own props that no sheet has** are now down to zero — the
   fabricator was the last one, and it was solved by rereading a sprite rather
   than by drawing a machine.
2. **The lore edits** from the residential phase are still unmade, by the owner's
   call that they are not worth time yet. They go in with the next `rooms.ts` edit.
3. **`main` and `night-shift-habitat` have diverged** (4 against 24 commits), so
   the `--ff-only` merge in `CLAUDE.md` is impossible and nothing from this
   branch has deployed.

## Next

The Infirmary, then the Hold — both hull rooms with measured references and
approved libraries, so both are direct. Then the first digging, which is where
the rock grammar drawn here gets its second use and the clone-and-vary rule gets
proved for the makeshift references.
