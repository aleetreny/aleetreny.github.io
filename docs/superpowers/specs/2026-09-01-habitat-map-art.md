# The lit section: art direction for the map

Art direction, phase two. Branch: `night-shift-habitat`.

This settles **how the global map and the observer's minimap look**. It does not
cover room interiors, furniture, clutter density or object palettes; those are
phase three, room by room. It builds on `2026-09-01-habitat-plan.md` and does not
reopen it.

## The principle everything comes from

An asteroid interior has no ambient light. Nothing is visible unless somebody ran
power to it, and power is the resource the whole simulation is organised around.

> **Darkness is the ground state. Light is the information.**

Rooms are pools of light in black stone, not coloured rectangles on a background.
Bright is what matters, dim is what is neglected, black is what nobody has
claimed. Three things follow for free:

1. **The reactor's decline is the map's.** Brightness is drawn from the power
   allocation, so as available power falls year on year **the map gets darker**.
   The slowest clock in the design becomes the first thing anybody sees.
2. **The Breach and the Hollow read identically, and correctly.** They are the
   only two interior blacks — the place you go so nobody sees you, and the space
   nobody has decided about. Both are holes in the light, which is what they are.
3. **Every light source names its place.** Six sources, six colours, no overlap.

### The six lights

| Light | Hex | Where, and only there |
| --- | --- | --- |
| Lamp amber | `#ffd18a` | Anywhere people live. The working light, and the one that costs. |
| Grow white | `#cfe89a` | Hydroponics. Full spectrum, and everybody pays for it. |
| Berth cyan | `#7fc4dd` | The Cold Berths. Machine light from capsules nobody has opened. |
| Reactor orange | `#ff9a4d` | The Spine. Not illumination — heat you can see. |
| Star blue | `#9fb8d8` | The Bridge. The only light from outside, arriving through a crack. |
| Sun white | `#c9c3cc` | The surface. The only high contrast in the picture. |

Any room on the map is identifiable by the colour of what is glowing in it, at
any zoom, with no label.

## Two registers, one geometry

The design already says *a cold instrument on the outside, warm life within*.
That settles the map question:

- **The global map is world.** Pixel art, dark, warm, textured. The thing you look at.
- **The minimap is instrument.** Flat ink, hairlines, monospace, unrounded, following
  `docs/design-direction.md`. The thing you read.

The reference minimap that prompted this is not its game's art either. A minimap
is a readout and is right to be one.

**What binds them: the shapes are identical.** Both registers are generated from
one table of polygons. Nothing is redrawn between them. This is the promise the
current `section.ts` breaks by drawing a side section under top-down rooms.

**The rule underneath:** the world map *shows*, the minimap *tells*. If a label is
ever wanted on the global map, the composition has failed.

## What tells the nine things apart

| Element | Global map | Minimap |
| --- | --- | --- |
| **Hull** | Cold blue-grey plate, hard specular edge, a seam and rivet rhythm every four tiles. Repetition is the tell. | Fine 45° hatch, 3px pitch — a drafting convention for inherited structure. |
| **Rock** | Warm brown, chiselled facets, tool marks, no repeating rhythm. | Solid fill. The absence of hatch *is* "made by hand". |
| **Cannibalised** | The plate's value decays toward the rock's. Holes with bright cut edges, rust weeping down from every cut. **The ship rusts toward the colour of the stone.** | The hatch thins, then breaks into gaps. Heaviest at the Throat and the Cut. |
| **Corridors** | Narrower, darker, floor polished lighter down the middle where everybody walks. | Thinner stroke, dimmer fill, and they carry the label chips. |
| **Doors** | Not door leaves — **a gap where light spills through**. Sealed is a rust bar across the gap. | A break in the hairline. Sealed is a rust tick, climb a stepped mark. |
| **Hubs** | Never annotated: simply the brightest, most peopled and most worn. Emergent. | Label chip in the heavier weight. Annotation is legitimate here. |
| **Dead ends** | One light source or none, and no worn path leading out. | The hairline closes with no break. Chip in the lighter weight. |
| **Private** | Dim, narrow, unworn floor, a personal accent at each door — nine Diggings, nine different warms. | Fill one step darker. Doors shown; who is behind them, open question. |
| **Public** | Broad pools of warm light, floor worn to a polish, people in it. | Fill one step lighter, every crossing drawn. |

## Chaos that stays legible

The room references are the argument: the garage is roughly sixty per cent bare
floor, and so is the office. Clutter is packed against the walls and the middle is
left alone. **That contrast is the mechanism, not uniform density.**

1. **Nothing chaotic is ever load-bearing for navigation.** Doors, thresholds and
   worn paths are the cleanest marks on the map. This rule is what permits all the
   others.
2. **Chaos lives at high frequency only.** Silhouette, mass and value stay ordered;
   grain, clutter and stains carry the disorder.
3. **Segment by value, not by edge.** Every floor shares a value, every wall shares
   a value. The eye separates by tone first, so outlines are then free to be ragged.
4. **Perimeter packing.** Clutter hugs walls; the centre of every space stays open.
5. **One outline weight, everywhere.** A single consistent hairline is what lets an
   irregular polygon read at all.
6. **A chaos budget you can count.** No more than about a fifth of any 32×32 tile
   region carries high-frequency detail. Count it rather than feeling it.
7. **Irregularity is directional.** Phase one's drift rule makes disorder increase
   with distance from the ship, so the eye reads a gradient rather than noise.

## What the minimap knows

It is an observatory, not a game, so the minimap is a readout with **no
affordances** — no buttons, toggles, filters or meters. The moment it looks
operable the proposition breaks.

**Shows:** room and corridor footprints, named in monospace chips; doors and their
kind, because that is what decides routes; twenty-five people as dots, presence
never identity; the frontier edge wherever the Face has got to; unmapped rock as
absence; what is currently being looked at, in amber, and nothing else in amber.

**Does not show:** objects or furniture; resident names, stats or numbers;
anything behind a sealed door — the Breach's interior is a void and the jammed
cabin a blank; legend, key or north arrow, since it never rotates; any control.

**Confidence levels.** The Hollow's roof is canon as never measured, so the
hairline carries certainty: solid means surveyed and measured, dashed means known
but never measured, absent means not found. The map becomes an artefact of what
the society knows about its own home, and it visibly improves over years as they
survey.

## The zoom is the connective tissue

Not two screens — two ends of one continuous zoom.

| Scale | Density | What it is |
| --- | --- | --- |
| **Survey** | 1–2 px/m | Pure instrument. Whole habitat, hairlines, every chip legible. |
| **Approach** | 6–10 px/m | The cross-fade. Hatching resolves into plate, fills into lit floor, chips shrink and drop away as the light comes up. **This band is the whole experience.** |
| **Room** | 24–32 px/m | Pure world. Full clutter, wear, people you can tell apart. The room's name persists a beat as the same chip it had on the minimap — that chip is the suture. |

**The load-bearing promise:** the polygon seen on the minimap is exactly the
polygon walked into, not a stylised version of it.

## Structural, slow, live

Two tiers is the obvious split and it is wrong. There is a third in the middle.

- **Structural** — changes only when the world changes shape: asteroid outline,
  craters, the surface, hull plate and its seams, room and corridor footprints,
  doors, the two crossings.
- **Slow** — recomputed daily or weekly, then baked, and reads as part of the
  picture: light level per room from the power allocation; **worn paths**, polished
  where people actually walked; the cannibalisation gradient; the Face's position;
  each new digging; stains and accumulated wear.
- **Live** — per tick, drawn on top, never baked: the twenty-five people, the
  current watch's lighting, selection and hover, the day's headline marker.

The middle tier is the interesting one. The engine already knows where everybody
walked; drawn as a polished track, the map accumulates a hundred days of movement
as texture — desire paths nobody authored. It is the first dogma, *the product is
the archive*, expressed as art direction rather than as a list of events.

## Variants considered

- **A · The Lit Section (chosen).** Dark light-first world map, flat instrument
  minimap, joined by a continuous zoom.
- **B · One Material.** Pixel art at every scale, minimap included, evenly lit.
  Coherent and cheap, but turns to mush at minimap size, labels on it look like a
  mod, and even lighting throws away the power economy.
- **C · The Survey Sheet.** The global map is instrument too — an ink survey on
  bone paper. Beautiful and on-brand, but it kills the "something is alive in here"
  moment, and it lies about the fiction: nobody in there has drawn a map, the Great
  Wall is still blank, and no chronicler is forced.

**Decision: A, with confidence levels taken from C.** One line style, it makes the
Hollow correct, and it gives the map somewhere to grow that is not just area.

## Open, for the owner

- **People inside their own diggings.** Does the minimap show who is home, or only
  that a door is occupied?
- **The night watch.** Should `THE NIGHT SHIFT` visibly change the map's lighting —
  fewer lamps, colder, longer shadows — or stay purely a lever on the board?
- **Worn paths as canon.** Confirm the slow tier may write into the picture at all.
  Once wear is drawn the map stops being authored and starts being recorded.
