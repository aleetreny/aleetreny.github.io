# The Infirmary: a trace, and the first room the sheets cannot finish

Building, phase eight. Branch: `night-shift-habitat`.

`tools/roomlab/infirmary.html` — the old composed version of this room is gone;
this is a 1:1 trace of `reference/shelter-bunker-room.png` (×3 phase (1,2) →
**154 × 218** native). `pnpm check` green, the room reports **clean**, and
**8.0 % of its pixels differ from the render**, measured inside the outline.

**All of that 8 % is four objects that do not exist in any sheet we own.** The
structure, the deck, the alcove and every prop that does exist are in place.

---

## What was measured

| | |
| --- | --- |
| room | x 7..146, y 7..210 |
| bands | 6 px: 1 px ink, 4 px of `#666666`, 1 px ink |
| wall | `shelter_walls` row 10/11, one 32 px column at a time, at y 13; the plate meets the deck at **y 77** |
| panels | top `[2, 8, 8, 3]`, bottom `[8, 8, 8, 3]` — found by brute force, not by eye |
| deck | flat `#959595` with an `#8b8b8b` line every 8 px, x ≡ 0 and y ≡ 0. Drawn: no sheet carries this floor |
| alcove | partitioned off the bottom right — a 6 px band along y 104..109 from x 109, its own plate face from y 110, and its own deck from y 159 |
| door | the south wall is open from x 45 to x 108, with a 3 px threshold left in it |

**The wall columns were solved rather than chosen.** For each 32 px column of the
render's wall, every column of the sheet was scored against every source y, over
only the pixels the props do not cover. Panel two came back at **0.00 mean
error** and panel one's left edge at **0.00**. Panel one is the darker plate (c 2)
in its top half and the plain one (c 8) below, which is the darker corner you can
see behind the locker — and getting that wrong was the first version's one visible
artefact: c 2's lower half is *rusted*, and the rust showed as an orange bar in
the three-pixel gap between the locker and the bed.

## What was placed

Seventeen props, every one at its own normalised-cross-correlation position,
**thirteen of them at 1.000**. `measure/trace.py` finds them; a new
`every_position()` in the same file finds the ones the render **reuses** — the
same crate appears four times and the same flask four times, and a global argmax
only ever reports one of each.

## The four objects the sheets do not have

Every connected component of every one of the **nineteen** sheets in
`public/assets/props/` was correlated against this render. Nothing beat **0.56**
for any of these:

1. **The brown examination chair** in the middle of the room, ~34 × 72 at
   (42,118). It is the room's centrepiece and its absence is the hole you can see.
2. **The second, larger orange cylinder** at (96,76). We have only the small size.
3. **Two white jugs and a blue water bottle** in the alcove.
4. **A steel drum** in the alcove, about (128,150).

They are **named in the source and left out**, per the rule. Substituting the
nearest thing would put objects in this room that the reference does not have,
and this is a trace.

> **This is a decision for the owner.** The render is `Post Apoc Shelter_7` and it
> is dressed from a pack we do not have. Either **get that pack**, in which case
> this room finishes exactly; or **accept the four gaps**; or **allow the nearest
> sprite** in this one room, which is what the last spec's Infirmary row assumed
> before the trace rule was made explicit. Until then the room stands as traced.

## What this changes about the method

`every_position()` is the new tool and it matters for every room from here: these
references reuse a handful of small props many times over, and until now the
trace list only ever found the best instance of each. It is documented in
`measure/README.md` with the rest.

## Next

The Hold — `shelter-bunk-and-stores.jpg` ×2 → 166 × 250, the same sheet, and by
the look of the reference the same problem is unlikely there. Then the first
digging.
