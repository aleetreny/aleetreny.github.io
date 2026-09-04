# The Diggings — six rooms, three traces

**Status:** done, `tools/roomlab/diggings.html` + `tools/roomlab/digging-kit.js`.
Six rooms, each a **1:1 trace** of one of 0_mem0ry's own makeshift rooms.

| | Reference | Size | Objects | Pixels differing inside the outline |
| --- | --- | --- | --- | --- |
| **Mara's** | `makeshift-two-rooms.png` | 245 × 181 | 39 | **7.8 %** |
| **Quim's**, **Pilar's** | `makeshift-two-rooms-b.jpg` | 181 × 187 | 24 | **5.5 %** |
| **Xan's**, **Ulla's**, **Yara's** | `makeshift-bedsit.jpg` | 179 × 217 | 18 | **8.9 %** |

That is the closest any room in the habitat has come — the Workshops sits at
10.4 % and the Well at 15.8 %. The sizes are the canon ones and they are already
each reference's own native size, so a trace drops in without moving anything.

---

## How the trace was made, because the obvious way does not work

A plain best-NCC search over the sheet's components finds the small props and
misses almost every large one. The reason is occlusion: a sofa half hidden
behind a table scores badly over the whole sprite even when the visible half is
exact, so the true placement never wins. Nineteen objects out of forty, and none
of the furniture.

Three changes fixed it, and they are the transferable part:

1. **Score on the part you can still see.** Each candidate is scored by the
   *trimmed* mean colour error over its own opaque pixels — the best 55 % of
   them. A sprite half covered still matches perfectly on its visible half.
2. **Search the residual, not the picture.** Each pass works on what the
   reference has and the canvas does not, so the search shrinks as the room
   fills and never re-finds what is already drawn.
3. **Keep a placement only if the picture gets closer.** The top candidates by
   score are each composited on a copy and measured; the one that removes the
   most differing pixels wins, and if none removes at least forty, the pass
   stops. **A score can be fooled. The difference cannot.** Without this the
   solver cheerfully added a rug at 23.7 error that made the room worse.

A final pass force-places the large flat pieces — rugs, mattresses, wardrobes —
which are too low-contrast for the residual search to rank highly on its own.
That found the blue rug in all three rooms, worth 866, 955 and 187 pixels.

## The shell

Solved by brute force over every opaque tile and every phase, scored on the
lowest 55 % of per-pixel errors so the furniture could not drag the fit:

| Part | What it is |
| --- | --- |
| band | 1 px ink, 4 px of `#c0b8b2`, 1 px ink — the sheet's own cross-section |
| wall | `makeshift_roomtiles` column 4, rows 7–8: one 32 × 64 block of white brick whose bottom four rows are the skirting. Block top y 10, 10 and 29; x phase 10, 10 and 25. |
| floor | the same sheet's column 5, rows 7–8, grey concrete |
| shape | a rectangle **minus rectangular cuts**, so the two-room flat keeps the notch in its top wall (x 80–131, y 4–35) and the corner missing from its bottom right (x 144–239, y 144–175). Drawn as one even-odd path filled at four insets, which gives the ink/fill/ink cross-section for free. |
| door | one 32 px tile of band cut away at x 74–105, its inner ink line running on across the gap as a threshold — **the same tile in all three renders**, which is how we knew they are one template scene dressed three ways |

## What varies between two diggings sharing a reference

The lamp, and nothing else. The map's art direction gives every private door its
own warm, so Quim's and Pilar's are the same room at different brightnesses, and
so are Xan's, Ulla's and Yara's. That is the deliberate consequence of tracing
to the letter: three references, six rooms.

## Two things this leaves open

1. **The drawing no longer derives from `rooms.ts`.** It used to, and that is
   what caught three homes nobody could enter. Now each room is an exact copy of
   a render, so the furniture in the picture and the `b`/`k`/`q` glyphs in the
   grid agree on size and shape but not on where anything stands — and the drawn
   doorway is one tile left of where the grid puts it, because the reference puts
   it there and the grid column is pinned by the Row. Reconciling them belongs
   with the corridor phase.
2. **Two rooms the owner showed do not fit any digging.**
   `library/rooms/Xmas_2.jpg` **traces** — 23 objects at ncc ≥ 0.90, and it is
   the densest domestic room in the archive — but it is 207 × 213 and no digging
   is that size. `library/rooms/Post Apoc Shelter - Asset Pack_4.jpg` is the
   Hold's reference and **still does not trace**, even against the shadow
   variants and the 16 × 16 cut that came with the full pack: its footlocker is
   85 px wide where the sheet's is 48, which is not an integer ratio.

## The history, kept because it is the lesson

These six were drawn twice before. First in a substituted rock material, on a
finding that was correct — the makeshift references matched nothing above 0.766
and their wall band `#c0b8b2` existed in no sheet we owned, while `trace.py`
reported their band pieces at 1.000 anyway, because NCC is mean-removed and
contrast-normalised and scores *shape*, not art. Then, when the owner supplied
the pack that finding had named, as compositions in the makeshift style with a
sleeping place per resident. Now, as traces.

**Naming the missing pack precisely is what got it.** The Hold, the Infirmary
and the Well are still waiting on theirs; name them the same way.
