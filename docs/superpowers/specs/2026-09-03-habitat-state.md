# WHERE THE HABITAT IS — read this first

**This is the handoff. If you are picking this project up, start here, then read
only the specs this file sends you to.** Branch: `night-shift-habitat`.
Last updated: 3 September 2026, after the Infirmary and the Hold's dead end.

---

## What is being built

**The Habitat.** A pixel-art micro-civilisation: twenty-five people living in a
crashed ship half-buried in an asteroid, seen from the owner's portfolio site.
Twenty-seven rooms, each drawn as a top-down interior, plus a map and a minimap
that are generated from the same data the engine walks.

The art is built from 0_mem0ry's asset packs in `public/assets/props/`, and — this
is the whole method — **rooms are traced off that same artist's own room renders**,
which live in `tools/roomlab/reference/`.

## The one rule everything else hangs off

> **If there is a reference, it is traced. Not adapted, not reinterpreted, not
> rebuilt in another material. Traced.**
>
> The one exception so far is the Infirmary, and it is an exception the owner
> made after seeing the trace, not a licence to skip one. Trace first, name what
> is missing, and let the owner decide.
>
> Same walls, same floor, same objects, same places, same size.

The corollaries, all of which have already been paid for once:

- **Measure before drawing.** Never estimate a position or a size off the eye.
  `tools/roomlab/measure/` exists for exactly this and is described below.
- **Anything in a reference with no sprite is NAMED, not substituted.** Say which
  object it is, in a comment in the room's source, and leave it out.
- **Show the work visually and often.** Render, look, correct, render again. Do
  not ship the first acceptable result.
- **Never guess a sprite's tile span.** Half of these sheets put two or three
  objects in one 32 px tile. Use the connected-component tools.

The Workshops was built once as a "version" of its reference, with rock instead of
the block wall and dust instead of the tiled floor, and was rejected. The spec for
it (`2026-09-03-habitat-workshops.md`) records why, and it is the clearest
statement of the rule in the repo.

## The method, in order

1. **`measure/native.py <render>`** — what integer scale was this exported at, and
   at what phase? Writes `measure/native/<name>.png`. Everything downstream works
   on native pixels. *Test every phase offset; the first version of this tool read
   every render as 1:1 and was wrong.*
   **It under-reads heavily compressed JPEGs.** It called the Well's reference ×2
   when it is ×4 — the tell is `provenance.py` then reporting its best matches at
   `x2.0`, i.e. the sprites having to be *doubled* to fit. When that happens,
   reduce by hand (`Image.resize(..., NEAREST)`, not BOX — BOX averages the JPEG's
   ringing into the pixels and halves the hit count) and re-run provenance until it
   matches at scale 1.0.
2. **`measure/provenance.py <native> <sheet>...`** — which sheet is it built from?
   A score of 1.000 at scale 1.0 means the render and the sheet are the same art
   at the same size, and the trace can be exact.
3. **`measure/trace.py <native> <sheet>... --thresh 0.93`** — **the trace list.**
   Every sheet object, with the source rectangle to cut and the position to cut it
   to. Each line of its output is one line of the room's source.
   **`trace.every_position()`** finds every place one sprite appears, not just its
   best: these references reuse a handful of small props many times over, and a
   global argmax only ever reports one of each.
4. **`measure/find_at.py`** and **`trace.whats_at(render, sheets, box)`** — the
   two directions of "and what about *this*": where does this rectangle go, and
   what sprite is at this place. The second is how a prop that is half covered by
   the things sitting on it gets pinned down.
5. **`measure/ruler.py <img> x0 y0 x1 y1 zoom out.png`** — a labelled pixel ruler
   over a crop, for everything the correlation cannot reach: wall bands, floor
   phases, where a wall meets a floor.
6. **Build the room as an HTML page in `tools/roomlab/`**, open over
   `python3 -m http.server` (never `file://` — the pages read pixels back off a
   canvas and `file://` taints it).
7. **Render it and diff it against the reference**, masked to the room's outline.
   That number is the target. The Workshops sits at 10.4 %, most of which is the
   reference being a JPEG.

## Where each room is

| Room | State | Reference | Page |
| --- | --- | --- | --- |
| **The Cabins** ×5 | **done** | `two-berth-cabin.jpg` ×5.34 → 204 × 205 | `berth.html` (the mould), `cabin-kit.js`, `cabins.html` |
| **The Workshops** | **done** | `workshop-two-bay.jpg` ×4 → 250 × 228 | `workshops.html` |
| **The Infirmary** | **done**; traced, then composed on the owner's call | `shelter-bunker-room.png` ×3 → 154 × 218 | `infirmary.html` |
| The Hold | **blocked** — its reference is not traceable from our sheets, see below | `shelter-bunk-and-stores.jpg` | — |
| The Well | next | `bathroom-wet-and-filthy.jpg` **×4 → 184 × 170** | — |
| The six diggings | after that | `makeshift-*.jpg` | — |
| The other sixteen | not started | some have none | — |

`tools/roomlab/reference/README.md` carries the measured scale of every reference.
`2026-09-02-habitat-references-and-scale.md` carries the full catalogue: what each
one shows, which sheet it is built from, and which canon room it is for.

## The five cabins, in one paragraph

One mould — `cabin-kit.js`, the two-berth cabin traced 1:1 — rendered five times.
`berth.html` calls it with **no variation at all**, and its output must stay
**byte-identical to the render from before the mould was extracted**. That is the
check that the trace has not drifted; if you change `cabin-kit.js`, re-render
`berth.html` and diff it. The five differ through exactly three things: the lamp
(1.0 / 0.55 / 0.3 / 0.6 / 0.45, always dimming away from the mould, never
brightening past the reference), starboard mirroring (Four and Five, with the two
notices repainted unflipped), and one object each. See
`2026-09-02-habitat-residential-system.md`.

## The rules that are not about art

- **Commit authorship.** `CLAUDE.md` is not optional here: every commit is
  authored *and committed* as Alejandro Treny Ortega, set per-command with the
  four `GIT_*` variables, and there is **no `Co-Authored-By: Claude` trailer and
  no `Claude-Session:` line**. Any command that writes a commit — rebase, merge,
  cherry-pick, amend — needs the same four variables.
- **Never open a pull request** unless the owner asks.
- **`pnpm check`** is `validate:repo && lint && typecheck && test`, and it is green
  at every commit. 591 tests, 33 files.
- **The asset licence.** 0_mem0ry's packs allow commercial use and modification;
  **resale and redistribution are not allowed**. `public/` is copied into `dist/`,
  so every sheet is currently served to every visitor. Cutting it down to an atlas
  of only the tiles used is open and unsolved.
- **The references are not served.** `tools/roomlab/reference/` is outside
  `public/`, deliberately.

## Open, and the owner's call

1. **`main` and `night-shift-habitat` have diverged** — 4 commits against 25 — so
   the `--ff-only` merge in `CLAUDE.md` is impossible and **nothing from this
   branch has deployed**. This is the oldest open item.
2. **The Workshops is `side: 'rock'` in `rooms.ts` while its trace is a built
   room.** Either leave it, or re-skin every room's material in one pass at the
   end. Do not decide this room by room.
3. **The lore the Workshops carries is not drawn** — the three bays, the
   fabricator, the queue, Lior's sorted scrap. Where authored content goes on top
   of a trace is unsettled, and it will come up in every room from here.
4. **Three lore edits** the residential system forced: nine diggings drawn as six,
   the invented line "Vero lost her digging to the rock", and "sixteen people are
   still in the Cabins" now being ten. The owner has said these are not worth time
   yet; fold them in with the next `rooms.ts` edit.
5. **Two stated distances** in `rooms.ts` no longer match the drawn space: the
   Great Wall's "twenty-six metres" and Ulla's "forty metres from Osvald's".
6. **`rooms.ts` grids that disagree with their room's own note** — the Workshops
   is 9 × 9 with partitions describing four cells while its note says three bays,
   and its east doorway opens onto a partition. Left alone: the grid is
   walkability data and re-cutting it moves every room below it on the map.
   Flagged for the corridor phase.
7. **The pack the Infirmary's render is dressed from, we do not have.** Four of
   its objects match nothing above 0.72. The owner's call for that room was to
   fill them with the nearest sprite the pack does have and to take the bed out,
   so **the Infirmary is composed off its reference rather than traced from it** —
   and its pixel-difference number no longer measures it. Getting that pack is
   still the only way to finish it as a trace. See
   `2026-09-03-habitat-infirmary.md` for the precedent this sets.
8. **The Hold cannot be traced.** `shelter-bunk-and-stores.jpg` matches nothing
   in `public/assets/props/` at any integer scale — not its bunk, not its
   footlockers, not even its wall. Its bunk is ~144 px wide where the sheet's is
   54, which is not a factor of two or three, and template-matching the wall, the
   mattress and a footlocker against every sheet at ×1..×4 tops out at 0.67. The
   reference README's "×2" came from a hand ruler in an early pass and does not
   hold. **This room needs the pack it is dressed from, or a different
   reference.** It is the same gap as the Infirmary's four objects, total instead
   of partial — which is now two rooms pointing at one missing pack.
9. **The corridors.** Nine of the eleven named connective spaces have routes but
   no grids and no floor. This is what makes the habitat walkable, and it is the
   next planning phase after the rooms.

## The specs, and what each one closed

Read them in this order if you need the history. Each is closed unless it says
otherwise.

| Spec | What it settled |
| --- | --- |
| `2026-08-31-habitat-design.md` | the concept |
| `2026-08-31-habitat-residents.md`, `-roster-and-weave.md` | the twenty-five and the bonds between them |
| `2026-08-31-habitat-rooms.md` | the rooms and their lore |
| `2026-09-01-habitat-plan.md` | the layout and the eleven connective spaces |
| `2026-09-01-habitat-map-art.md` | the map: darkness is the ground state, six lights, world vs instrument |
| `2026-09-01-habitat-room-grammar.md` | four provenances, bolted never welded, the room sheet |
| `2026-09-02-habitat-references-and-scale.md` | every reference measured and mapped |
| `2026-09-02-habitat-new-scale.md` | **the size decision**: a traced room is exactly its reference's size |
| `2026-09-02-habitat-residential-system.md` | eleven homes, and the five cabins as built |
| `2026-09-03-habitat-workshops.md` | **the trace rule**, and what it cost to learn it |
| `2026-09-03-habitat-infirmary.md` | the trace, and the first room the sheets cannot finish |
| `2026-09-02-habitat-room-handoff.md` | superseded by this file |
