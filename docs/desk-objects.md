# The things on the desk

The board's first layer is a portfolio: somebody can arrive, read the twelve
cards, open a dossier and leave without touching anything odd. This document is
about the second layer — the twenty-six objects lying on the same slate, what
holds them together, and what it costs to have them there.

The rule the whole design hangs on: **an object is furniture, a card is
content.** A card is written, translated, seeded, versioned and read. An object
is a thing on a table that does something when you touch it. They share a slate,
a camera and a light source, and nothing else.

---

## 1. The shared physical system

Everything lives under one provider (`src/lib/world/context.tsx`), which owns
four things a single object cannot:

| | |
| --- | --- |
| **Placement** | Where each object is, as a `Map` on a ref — never React state. A physics step at sixty frames a second is not a render, and the camera and the guided tour already work this way. |
| **One loop** | `src/lib/world/frame.ts` is a single `requestAnimationFrame` shared by every simulation. It starts when the first thing needs it and stops dead when the last one lets go. |
| **One integrator** | A body map stepped by that loop: gravity toward the black hole, drag, wall bounce, soft pairwise collisions when the gravity is off. A body that comes to rest is dropped. |
| **Modes** | Zero gravity, what tool is being held, which objects are inside the hole, the paint on the board, the photographs taken. |

### Traits, not types

The coin, the die and a fresh Polaroid have nothing in common as components and
everything in common as things that fall when the gravity goes off. So each
object declares traits (`src/lib/world/kinds.ts`):

```
draggable   can be picked up and moved
physics     has a body: it drifts, it bounces, it can be thrown
gravity     floats when the gravity goes off
blackhole   feels the hole, and can cross its horizon
paintable   paint sticks to it, and travels with it
capture     shows up in a Polaroid and through the telescope
heavy       worth loading late and pausing off screen
```

That is what lets the paint gun stain the passport without either of them
knowing the other exists, and what makes "everything loose floats" one line
rather than twenty-six.

### Drag

`ObjectShell` owns one pointer handler: it moves the object in board units
(reading the live camera scale off the board's own transform, so it never has to
know a camera exists), tracks velocity for throwing, and calls `onActivate` only
when the pointer did not move. It stops propagation so the board underneath
never pans, and the object's root carries `data-nodrag` so the board's own drag
code ignores it too.

---

## 2. Simple objects

Drawn in SVG and CSS, no canvas, no simulation:

**the book** — covers that swing, leaves that turn one at a time, corners you can
take hold of and pull halfway, a ribbon that remembers the page for the session,
an index. The infrastructure takes any number of pages; what ships is a title
leaf, a colophon and a handful of written ones. **No copyrighted text is
reproduced** — the leaves are deliberately blank for their owner to fill (see
`src/lib/world/book.ts`).

**the scholarship** — an envelope with a wax seal; the flap opens and a sheet
folded in three slides out with the award, the amount, the degree and the year.
A crest, a signature, an embossed ring, a paperclip. Not a badge.

**the note pad** — write on the top sheet, tear it off, watch it land on the
spike. The visitor never sees anybody else's.

**the passport** — a stamp per country, four to a leaf, scattered the way a bored
official scatters them, in five inks and four shapes. Every stamp opens a card
with a photograph and something written by hand. All of it owner-editable from
inside the passport.

**the coin** — flips with real half-turns, so it lands on the face it claims.
A Beta(1,1) prior and a Beta-Binomial update give the posterior that appears
after eight throws. It is not a fair coin, and nobody is told.

**the die** — WORK · MATH · TRAVEL · CHAOS · PROJECT · ?. It rolls, bounces and
*suggests* somewhere to go. Being teleported by a die you threw for fun is not a
feature.

**the calculator** — really does arithmetic, which is the point; if it were
obviously broken nobody would ever be surprised by `6 × 9`.

**DO NOT PRESS** — a lid you lift and five presses that escalate: nothing, a
screw, something turns, an alarm, the gravity goes.

**the coffee cup, the telescope, the camera, the paint gun, the flower** — see
below; each is the handle for something larger.

---

## 3. Mathematical simulations

All canvas, all real, all lazy (`React.lazy`), all paused by an
`IntersectionObserver` the moment they leave the viewport.

| Object | What is actually running |
| --- | --- |
| **Petri dish** | Gray–Scott reaction-diffusion on a 96×96 grid, five steps a frame, nine-point Laplacian. Two dials over F and k give spots, stripes, mazes and mitosis. |
| **Physarum** | 3,600 agents on the three-rule model: sense ahead and to each side, turn toward the strongest trail, deposit. The trail diffuses and evaporates. Food is a slowly-consumed source of the same signal, which is why a network appears between the pieces without anything being told to build one. |
| **PCA lamp** | A 3-D cloud with a real shape to lose, a beam, and a wall. The switch runs a power iteration on the covariance and turns the cloud until the leading axis lies across the wall. The meter is the variance left in the projection. |
| **Lorenz** | σ=10, ρ=28, β=8/3 integrated with RK4 (Euler visibly spirals out at this step size). Two trajectories a thousandth apart, drawn on the slate under the coffee cup. |
| **Game of Life** | B3/S23 on a 26×26 torus. A glider — any of its eight orientations — is recognised. |
| **Regression** | OLS against Theil–Sen on the same points, with the residuals drawn. Drag one point a long way and watch which line follows it. |
| **Random walk** | Box–Muller normal steps with drift and σ, laid down at drawing speed by a pencil. |
| **The game** | A probe falling through drifting masses. Steer with the pointer or the arrows, collect samples for fuel, thirty seconds is a good run. It is a gravity game because everything else on this end of the desk is. |
| **The black hole** | See below. |

### The instruments

Seven more, added later and to the same rules — a canvas each, a real
phenomenon each, and a chunk each. They carry one extra brake the older
objects do not: `useDetail` measures how wide the object is actually drawn and
stops the simulation below about a hundred pixels, so fitting the whole board
into a laptop screen *stops* a dozen simulations rather than starting them.

| Object | What is actually running |
| --- | --- |
| **Three doors** | The Monty Hall problem, played rather than explained. The host knows where the car is and never opens it, which is the entire asymmetry. The brass plate under the doors keeps the running score for staying and for switching, and after twenty rounds it has made the argument that no paragraph would. |
| **The marble tray** | Gradient descent, `v ← βv − η∇f`, over a loss surface drawn as a shaded relief with its own contours. Turn η down and it creeps, leave it in the middle and it converges, turn it up and it overshoots, rings, and eventually leaves the tray. Two landscapes: a tilted bowl with one answer, and four Gaussian wells where the answer depends on where you dropped it. The gradients are checked against a finite difference in `descent.test.ts`, because a tray that follows the wrong vector is a lie with a nice shadow on it. |
| **The crystal plate** | A Voronoi diagram, computed by clipping the plate with one half-plane per pair of seeds, and the Delaunay triangulation, which falls out of the same pass: two seeds are neighbours exactly when their cells share an edge. The lever dissolves one picture into the other. Exact, and tested. |
| **The microscope slide** | Chloroplast photorelocation. Weak light and they gather under it — the accumulation response; strong light and they run for the anticlinal walls — the avoidance response. Both are real, both are ordered by the same blue-light receptors, and the threshold between them is the whole object. They move on cytoplasmic streaming, not on billiard physics. |
| **The ferrofluid** | The Rosensweig instability. A hexagonal lattice of sites, each with a height springing toward √(B − B꜀) and lagging behind it, so the crown grows where the magnet is, follows it, and slumps when it leaves. The lattice pitch is a property of the fluid and does not change with the field, which is why the spikes keep their spacing. |
| **The Chladni plate** | The Ritz mode shapes of a square plate, `cos(nπx)cos(mπy) − cos(mπx)cos(nπy)`. Twelve hundred grains each walk down the gradient of \|A\| and are kicked in proportion to it, so they end up on the nodal lines. Off a resonance the plate barely answers and no figure forms; the marks around the dial are where it does. Changing modes throws the old figure apart before the new one appears. |
| **The pocket desert** | Werner's dune model: lift a slab, carry it downwind in hops, drop it with one probability on sand and a smaller one on bare tray, then avalanche anything past the angle of repose. Ripples, then dunes, then slip faces. Turn the fan and the old relief is eaten from the windward side and re-laid downwind rather than vanishing, which is why the tray always looks like the last several winds. The stone builds its own tail. Kept for the visit; the rake clears it. |

### The black hole

The one piece that had to be more than a dark circle. Per pixel of a 400×400
map, the sightline's impact parameter *b* is taken and the light bent by the
weak-field deflection

```
α ≈ 2 rs / b
```

which is used to sample the background — a deterministic star field and the
board's own grid — at the place the ray actually came from. That produces the
ring of smeared stars and the bowed grid. Inside *b* = 1.5 rs there is nothing
left to sample: the photon sphere, and inside it the shadow. Around it a thin
disk whose approaching side is brighter, because relativistic beaming says it
should be, and whose inner gas goes round very much faster than the outer,
because Kepler says it should.

The map is computed **once** and blitted; only the disk animates.

The DOM around it is bent too, and only the DOM that is close: each element
within reach is nudged toward the hole and squeezed along the sightline by the
same deflection, with blur and saturation only right up against it. Written
inline, because every piece on this board already carries an inline rotation
that a stylesheet rule could never beat.

Drag something in and it is wound in, stretched, reddened and gone — and
**nothing is deleted**. "Get them back" is one click, and it is in the editor too.

---

## 4. Persistent objects

Four things outlive the tab: a note, a plant, an answer, one vote.

`src/lib/world/remote.ts` is the whole surface. It tries Postgres and falls back
to this browser. That is not a stub: a portfolio that only half-works without a
backend is a portfolio that half-works, and this repository is built the other
way round — fixtures first, services as an upgrade.

`db/migrations/0008_visitor_world.sql` adds four tables under one rule: **an
anonymous visitor may add their own row and read nothing that identifies anybody
else.** Where a visitor genuinely needs to read something back — their own plant,
the state of the plot, the running tally — they go through a `security definer`
function that returns exactly that and nothing else, rather than a table grant
that would have to be fenced in afterwards.

- `visitor_notes` — insert only for anonymous; everything for the owner.
- `garden_plants` — reached only through `garden_plot()`, `garden_plant()`,
  `garden_water()`, `garden_mine()`. One plant per visitor and a four-hour
  watering interval are enforced in the database, not hoped for in the client.
- `curiosity_questions` / `curiosity_answers` — the live questions are public,
  the answers are insert-only.
- `world_votes` — cast through `world_vote()`, counted through
  `world_vote_tally()`, listed by the owner alone.

**The garden runs on the wall clock.** A plant is a promise that something will
have happened by the time you come back, and a timer that only counts while you
are watching is not that. Seven species with their own germination, growth and
thirst; drought slows growth and never kills it, because a visitor who plants
something and never returns should still find it alive, only behind.

---

## 5. Interactions between objects

The point of the shared world, in the order they were built:

- the paint gun stains cards, the slate, and objects — and a stain on an object
  is drawn *inside* it, so it travels when you slide the thing across the desk;
- a Polaroid photographs whatever rectangle of board it is pointed at, live
  canvases included, so you can catch the slime mould mid-crawl;
- the telescope magnifies the same drawing, and past the edge of the slate finds
  a sky;
- the coin, the die, the camera, the cup and the paint gun can all be thrown
  into the hole;
- zero gravity lifts everything that is loose and leaves the cards alone;
- prints can be picked up, moved, stacked on top of documents and shot at.

Where a shot lands decides its layer: bare slate goes under the paper, paper
goes over it, an object carries its own.

---

## 6. Easter eggs

Nothing is announced.

- **42** — type it anywhere that is not a text box; reach the forty-second leaf
  of the book; make the calculator say it; find Saturn. Every object on the table
  turns to face the same way for a second and a quarter and then goes back to
  exactly where it was. Nothing is written and nothing is saved.
- **Saturn** — somewhere off the slate, only through the eyepiece.
- **The reversing hourglass** — shake it and, for four seconds, the second law
  takes the afternoon off. `S ↓ ?`
- **The glider** — build one in the Game of Life.
- **`deterministic ≠ predictable`** — the small `?` under the attractor.
- **`6 × 9 = 42`** — and a handful of others, on a calculator that otherwise
  works perfectly.

---

## 7. The editor

One new panel — `objects` in the owner bar — because it is all one question:
what is out on the table.

- every object: out or away, where, how big, which way up. Drag them into place
  on the board and press **take positions**;
- the paint: none / this visit / this browser for good, plus *wash the board*;
- *reset the world*, which brings back anything the hole ate;
- the notes, the answers, the plot and the vote, with hide, delete, reset and an
  export;
- the Curiosity Machine's questions, which are content and are edited here.

The passport is edited from inside the passport, in the language the owner is
working in, like every other piece of prose on the board.

No second CMS. Everything lands in `site_settings` beside the theme:
`board.objects`, `board.passport`, `board.world`.

---

## 8. Performance

The board has to stay a portfolio.

1. **One loop.** Twenty-six `requestAnimationFrame` callbacks is twenty-six
   things the browser schedules separately. There is one.
2. **Nothing runs off screen.** Every heavy object hangs its subscription off an
   `IntersectionObserver`. Measured: **zero frames per second** with the board
   panned away from everything.
3. **Nothing runs until it is asked.** The Game of Life, the random walk, the
   game and the slime mould are idle until someone starts them; the hourglass
   stops the moment the last grain settles.
4. **The expensive thing is computed once.** The black hole's lens map is a
   160,000-pixel trace; it is traced once and blitted from then on. Its DOM bend
   runs at 10 Hz, not 60.
5. **Late, not first.** The whole desk is one lazy chunk fetched after the board
   has painted, and the ten canvas objects split again from there. Measured
   against the commit before this work:

   | | before | after |
   | --- | --- | --- |
   | first chunk | 1,091 kB · **321 kB gzip** | 1,119 kB · **331 kB gzip** |
   | the desk | — | 65 kB · 21 kB gzip, after first paint |
   | each simulation | — | 2.8 – 5.2 kB, when it comes into view |
   | stylesheet | 63 kB · 13 kB gzip | 109 kB · 22 kB gzip |

   Ten kilobytes on the portfolio's own load, and everything else arrives once
   there is already a board to look at.
6. **No WebGL.** Nothing here needed it, so nothing here uses it.
7. **`prefers-reduced-motion` stops all of it**, including the alignment, the
   page flips and the falls.
