# The Diggings — six rooms, and a verdict that got reversed

**Status:** drawn, `tools/roomlab/diggings.html` + `tools/roomlab/digging-kit.js`.
Six rooms, each at its canon size, each drawn from its own grid in `rooms.ts`.

---

## The reversal, and what it is worth remembering for

These rooms were built once in the wrong material, on a conclusion that was
carefully argued and correct at the time:

> The Diggings' references trace nothing. Their furniture matches no sheet above
> **0.766** at ×0.5, ×1 or ×2, and their wall band `#c0b8b2`, brick `#f2eae4` and
> floor `#a8a09a` exist in no sheet we own. `trace.py` reports their band pieces
> at **1.000** against three different roomtiles sheets anyway — because
> `ncc_map` is mean-removed and contrast-normalised and therefore scores *shape*,
> not art. Same 1 px ink / 4 px fill / 1 px ink cross-section, recoloured.

Every word of that was true, and the two lessons in it stand:

1. **A perfect score is not proof of the same art. Check a colour.**
2. **When a reference will not trace, prove it — every sheet, several scales,
   colour as well as score — then say so out loud.**

The second one is what mattered. Because the finding was written down as *"this
pack is missing and it is the single highest-value unblock in the art"*, the
owner went and got it. `makeshift_furnitureset.png` and
`makeshift_room_door_tiles.png` are now in `public/assets/props/` as
`makeshift.png` and `makeshift_roomtiles.png`, and the same three references
that matched nothing now match at **1.000**, in the dozens, including the band
whose colour was the proof it was missing.

So the substitution is gone and these six rooms are traced. **A blocked room is
worth reporting precisely; the report is what unblocks it.**

## The shell, measured

All of it off `makeshift-two-rooms-b` by brute force — every opaque tile ×
every phase, scored on the lowest 55 % of per-pixel errors so the furniture
could not drag the fit.

| Part | What it is |
| --- | --- |
| band | 1 px ink, 4 px of `#c0b8b2`, 1 px ink — the sheet's own cross-section |
| wall | `makeshift_roomtiles` column 4, rows 7–8: one 32 × 64 block of white brick whose bottom four rows are the skirting |
| floor | the same sheet's column 5, rows 7–8, grey concrete — **median error 6** out of a possible 765 |
| door | one 32 px tile of the band cut away, its inner ink line running on across the gap as a threshold |

The doorway is in the same place in all three references, which is how we knew
they came from one template scene rather than three rooms.

## What the owner asked for, and what changed

**1 · A sleeping place for every resident, and you can count them.**
Three-resident rooms have three, two-resident rooms have two, and the page fails
loudly if a room's count stops matching `SLEEPS`. They are deliberately not all
the same: a bed under a duvet, a bed made up, a bare blue mattress with somebody's
pillow on it. A mattress without a pillow reads as stock rather than as a person's
place, so the pillow is not decoration.

An armchair is **not** a sleeping place, whatever you call it. The first pass used
the sofa sprite as a third bed in two rooms and it read as an armchair, because
that is what it is.

**2 · The division between the two chambers.** It used to be a one-tile neck
sitting directly on top of the door, which read as a pinch rather than as two
rooms. Now the partition runs **three courses down from the back wall and stops**,
leaving two clear rows of shared floor you come into — which is also how
`makeshift-two-rooms-b` does it: its partition is a 6 px band from the top wall
that stops well short of halfway. The free end is capped in ink so it reads as
built and finished rather than as a wall that ran out.

**3 · Shape.** Each room now has its own bite out of the outline, drawn as wall
because that is what it is. Xan's is the exception and has none — *"small, square,
and finished to the millimetre… the only room in the habitat where every corner
is right"* — so it is the only rectangle of the six, and that reads.

**4 · Density.** Fifteen to twenty objects a room, which is what the references
carry. The page tracks every piece standing on the floor and reports any two that
overlap by more than 7 px, or anything crossing the frame. Rugs and the things you
put down on a surface — cups, bottles, magazines, a laptop on a desk — are exempt,
because those overlaps are the point.

## The six

| | Size | Grid | Sleeps | Its one object |
| --- | --- | --- | --- | --- |
| **Mara's** | 245 × 181 | 9 × 7 | 3 | a chair somebody brought and left |
| **Quim's** | 181 × 187 | 7 × 7 | 3 | a tool left mid-job, for the ninth time |
| **Pilar's** | 181 × 187 | 7 × 7 | 3 | a pan that has never been back to the kitchen |
| **Xan's** | 179 × 217 | 7 × 8 | 2 | a drawing pinned square to a wall that is not |
| **Ulla's** | 179 × 217 | 7 × 8 | 2 | two cups, and only one of them used |
| **Yara's** | 179 × 217 | 7 × 8 | 2 | *marks in the rock — named, not drawn* |

Two of those objects come from a neighbouring pack — Quim's toolbox from
`workshop.png`, Pilar's pan from `kitchen.png` — because `makeshift` is a bedsit
set and has neither. 0_mem0ry's own three-room render mixes sheets the same way.

Yara's is the one thing still named and left out: *"marks in the rock, three
weeks old, unsigned"* exists in no sheet. It is also the room the canon calls the
smallest and the one she dug alone, so its bareness reads.

## Three homes nobody could enter

Drawing a room from its own grid makes the grid's mistakes visible. Mara's,
Quim's and Pilar's each had their front door in the wall directly below the
partition, so the first step inside was unwalkable and the entire interior —
31, 21 and 21 tiles — was sealed. Every existing test passed: the room graph was
connected, the boundary was closed, the doors met the Row's. Nothing looked
inside.

The new test then found two more of the same class: the Bridge sealed one tile
between its two dead consoles and the pilot's chair, and the Cold Berths sealed
two behind the bunks.

`rooms.test.ts` now carries **"can be walked into: every open tile is reachable
from a door"**, across all twenty-seven rooms, allowing two things deliberately:
vacuum is crossable, because the Breach is islands of floor in a tear and
reaching them is what a suit is for; and a sealed `X` mouth still seeds the
search, because it means *needs a key*, not *no way in*.

## What is still open

**`dig4`, `dig5` and `dig6` have identical grids**, and `dig2` and `dig3` share
one. The canon says *the difference between them is the most public document in
the habitat*. They now differ by shape, lamp, bedding, contents and the one
object, which carries a lot of it — but Yara's cannot be *smaller* than Xan's
while their grids are the same size. Re-cutting them moves rooms on the map, so
it stays with the corridor phase.
