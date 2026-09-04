# The Diggings — six holes, and the reference that lied

**Status:** drawn, `tools/roomlab/diggings.html` + `tools/roomlab/digging-kit.js`.
Six rooms, each at its canon size, each drawn from its own grid in `rooms.ts`.

**Drawing them found three homes nobody could enter.** That is the headline, and
it is below.

---

## The references cannot be traced. Not even their walls.

The Diggings were mapped to `reference/makeshift-two-rooms.png`,
`makeshift-two-rooms-b.jpg` and `makeshift-bedsit.jpg` — three renders of the
same modern bedsit, dressed differently. All three were tested properly this
time, and the verdict is total:

- **Their furniture is in no sheet we own.** The bed, the sofa, the television,
  the shelf unit, the wardrobe rail and the fridge were each cut out of the
  render and matched against every sheet in `public/assets/props/` at ×0.5, ×1
  and ×2. The best score for any of them is **0.766**, and every top hit is at
  ×0.5, which is the signature of a shrunken template correlating with mush.
- **Their shell is in no sheet either.** Their wall band is `#c0b8b2`, their
  brick `#f2eae4` and their floor `#a8a09a`. Searched every sheet for those
  three exact colours: the band colour appears **nowhere at all**.

### The trap, which nearly caught me

`trace.py` reports the makeshift band pieces at **ncc 1.000** against
`bathroom_roomtiles`, `kitchen_roomtiles` and `workshop_roomtiles` alike. Three
sheets, perfect scores, one of them a 64 × 35 object. It looks like proof.

It is not. **NCC is mean-removed and contrast-normalised**, so a grey band and a
tan band with the same 1 px ink / 4 px fill / 1 px ink cross-section score
identically. The three roomtiles sheets share those pieces, which is why all
three "matched". The makeshift pack is the same band kit **recoloured**, and we
do not have it.

> **1.000 means same shape, not same art. Check a colour before believing a
> score.** This is now the second way a high score has lied — the first was the
> Well's `pipe` at 0.938, a thin vertical bar matching a different thin vertical
> bar — and it is the more dangerous one because it survives a visual glance at
> the shape.

## What was traced instead

`reference/workshop-plate-walls-on-dirt.png` — the rock half's own reference, ×4
→ 179 × 212 — **does** trace: 22 distinct objects at ncc ≥ 0.88 and nine at
1.000, all from `workshop.png`. It is a room walled in salvaged corrugated plate
standing on bare dirt, which is exactly what the canon says a digging is:

> *Your house is a hole you made. Its size and finish are a public, permanent
> record of your labour, your skill, and how much help you could get.*

So the material is that render's, measured the same way as the Well's:

| Part | What it is | How it was found |
| --- | --- | --- |
| the dug floor | `shelter_terrain` tile (1,9), `#9c8d42` | brute force over every opaque tile × every phase: **median error 0** out of 765 |
| the rock around it | the same sheet's darker family, `#94693c` | its plain fill, so the hole reads as a hole in something |
| the cut edge | that family's own nine-slice, rows 8–10 | organic and chiselled, which is the canon's "no two faces at the same angle" |
| the scrap front | `workshop.png` (194,273) 28 × 45 | the plate `plate-walls-on-dirt` stands on its dirt at (24,143), ncc **0.919** |
| the grit | `shelter_terrain` (5,8)–(6,9) | spoil. The tufts at (0,11)–(2,11) in the same family are *vegetation*, and nothing grows in a hole in an asteroid. |

**The nine-slice's edge runs through the middle of its rim tiles, not along
their border.** So the slice is laid on a grid offset by half a tile and the
hole's edge lands where the room's own grid puts the wall. Getting that wrong
shifts every floor by 16 px, which looks almost right and is not.

**This is a substitution and it is marked as one.** The rule is trace first, name
what is missing, and let the owner decide; here nothing at all was traceable, so
the choice was between not drawing the rooms and drawing them in the one rock
material the sheets actually carry. The geometry is still measured from the
makeshift renders — that part of them *is* readable — and the doorway is one 32 px
tile, in the same place in the south wall of all three.

## Three homes nobody could enter

Drawing a room from its grid makes the grid's mistakes visible. `dig1`, `dig2`
and `dig3` each had their front door in the wall **directly below the spur of
rock between their two chambers**. The first step inside was into an unwalkable
tile and the entire interior was sealed — 31, 21 and 21 tiles respectively,
reachable by nobody.

Every existing test passed. The room graph said they were connected; the
boundary was closed; the doors met the Row's doors. Nothing looked at the inside.

Fixed by running each partition the full depth and putting the gap at the front
instead of the middle, which is also what the canon asks for — *"two chambers
with a gap cut between them rather than a door"* — and by moving the crates one
column clear of the only route.

**And the new test found two more rooms with the same class of defect:** the
Bridge sealed one tile between its two dead consoles and the pilot's chair, and
the Cold Berths sealed two behind the bunks. Both fixed by moving one glyph.

`rooms.test.ts` now carries **"can be walked into: every open tile is reachable
from a door"**, run against all twenty-seven rooms. Two things it deliberately
allows:

- **vacuum is crossable**, because the Breach is a tear with islands of floor in
  it and reaching them is what a suit is for. The grid cannot say *walkable if
  suited*, so it says not walkable and the room means otherwise.
- **a sealed mouth still seeds the flood**, because `X` means "needs a key, a
  suit or a tool", not "no way in".

Floor sealed off behind *furniture* is always a mistake, and that is what the
test is for.

## The six

One mould, `digging-kit.js`, six calls. Each digging is drawn at its reference's
own native size, and its contents come from its grid in `rooms.ts`, read out of
`habitat-plan.json` so the drawing cannot drift from the walkability data.

| | Size | Grid | Its one object |
| --- | --- | --- | --- |
| **Mara's** | 245 × 181 | 9 × 7 | a chair somebody brought and left |
| **Quim's** | 181 × 187 | 7 × 7 | a tool left mid-job, for the ninth time |
| **Pilar's** | 181 × 187 | 7 × 7 | a pan that has never been back to the kitchen |
| **Xan's** | 179 × 217 | 7 × 8 | a drawing pinned square to a wall that is not |
| **Ulla's** | 179 × 217 | 7 × 8 | two cups, and only one of them used |
| **Yara's** | 179 × 217 | 7 × 8 | *marks in the rock — named, not drawn* |

The beds are bare mattresses on the floor, four different stains, because the
legend says *"a bed, on the floor, made of what there was"* and the sheet's
framed bunks are not that. The crates are open crates. Each room also carries
two or three pieces of scrap from the same two sheets, and the page refuses any
of it that lands in the rock or on something already there.

Yara's object is the one thing named and left out: *"marks in the rock, three
weeks old, unsigned"*, which exists in no sheet. It is also the room the canon
calls the smallest and the one she dug alone, so its bareness reads.

## What is still wrong, and is not mine to fix

1. **`dig4`, `dig5` and `dig6` have identical grids**, and `dig2` and `dig3`
   share one too. The canon is explicit that *the difference between them is the
   most public document in the habitat* — Xan's is "finished to the millimetre",
   Yara's is "the smallest" — and identical grids cannot say that. Re-cutting
   them moves rooms on the map, which the size spec says is a corridor-phase
   decision, so they are flagged, not changed. Until then the six differ only by
   lamp, mattress, object and clutter.
2. **The material is a substitution**, as above. If the makeshift pack is ever
   obtained, these six should be re-traced properly — the geometry in this file
   will still hold.
