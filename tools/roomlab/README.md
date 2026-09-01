# Room lab

Composing habitat rooms from 32×32 asset sheets instead of drawing every prop.

Open any of these over a local HTTP server (`python3 -m http.server`), not
`file://` — the tools read pixels back off a canvas and the browser taints
canvases loaded from `file://`.

| File | What it does |
| --- | --- |
| `index-sheet.html?f=<png>&s=<zoom>` | Draws a sheet with a numbered tile grid, so props are picked by coordinate rather than guessed. |
| `find-objects.html` | Labels connected components in a sheet's alpha channel and prints each real object's tile span. **Run this before picking anything.** |
| `cabin.html` | One finished room. Its `place()` records every sprite's true ink rectangle, refuses nothing, but reports overlaps and anything crossing the frame. |

## The two rules that took several passes to learn

**Never guess a sprite's tile span.** A 2×3 grab off the sheet may contain one
object or two halves of two. `find-objects.html` is the ground truth: the bunk in
column 17 is 1×3, the lockers are 1×2, the drums are 1×1.

**Objects belong on the 32px grid.** These sheets are authored on it. Nudge only
to seat something against a wall, or to hang it at a height — never to fake
randomness.

## Layout

Rooms are laid out in functional zones with a clear aisle, not as one prop per
tile. `cabin.html` is sleeping / stowage / stores / working, and the middle
column stays empty because that is where you walk.

## The sheets

`public/assets/props/` — by 0_mem0ry, https://0-mem0ry.itch.io/. Commercial use
and modification permitted; resale and redistribution are not. See
`LICENSE-0_mem0ry.txt`. A live site serves these files to any visitor, so before
this ships publicly they should be cut down to an atlas of only the tiles used.
