# Eleven homes: the habitat's residential system

Planning, phase six. Branch: `night-shift-habitat`.

The owner has closed the residential question. Neither one symbolic Cabins with
false doors nor twenty-five separate rooms: **eleven real homes**, all enterable,
all renderable, all small, cloned from measured references.

> **The decision.** Five cabins off the Long Walk — inherited, rigid, industrial,
> reused passenger quarters — housing ten. Six diggings off the Row — personal,
> improvised, domestic, irregular, made by the people in them — housing fifteen.
> Twenty-five in total. Each unit stays **as close as possible to its measured
> reference**: clone first, vary slightly afterwards.

This is built. `pnpm check` is green (591 tests) and
`tools/roomlab/plan.html` draws the result from the same data the engine walks.

Nothing else is reopened. The material grammar, the map's art direction and the
tracing method all stand.

---

## What it cost structurally

Sixteen rooms became **twenty-seven**, and that is the one closed thing this
changes.

| | Was | Now |
| --- | --- | --- |
| Rooms | 16 | **27** — 13 hull, 14 rock |
| The Cabins | one room, 8 × 8 | **The Long Walk** (5 × 27) + **five cabins** (8 × 8 each) |
| The Diggings | one room, 9 × 7 | **The Row** (25 × 5) + **six diggings** (9 × 7, 7 × 7 ×2, 7 × 8 ×3) |
| Everything else | 14 rooms | unchanged, not one grid touched |

**Two corridors became rooms**, because "connected to the Long Walk" only means
anything if the Long Walk is a place. They are the first two of the eleven
connective spaces in `2026-09-01-habitat-plan.md` to be built; the other nine wait
for the corridor phase.

Everything else in the hull and the warren is where it was, at the size it was.
The chain below the cabins shifts down as the block is taller than the room it
replaced, but that falls out of the generator rather than being re-placed by hand.

## The five cabins

All five are the traced two-berth cabin — `tools/roomlab/reference/two-berth-cabin.jpg`,
204 × 205 px, already built as `tools/roomlab/berth.html` — at its measured size of
8 × 8. **The structure is identical in all five**: two bunks against the outboard
wall, the ladder well in the far corner, the wedges under everything that has to
stand level, and the door amidships onto the walk. Three open to port, two to
starboard, and the free strip opposite the first cabin is where the Throat leaves
for the rock.

What varies is **one object each**, and nothing else:

| Cabin | Who | The one thing that is only in this cabin |
| --- | --- | --- |
| Cabin One | Dima Vashenko, Edda Halvorsen | a sleeping passenger's belongings, untouched |
| Cabin Two | Ferran Solé, Halim Zoubir | a shim stack, grown over a hundred days as the floor settled |
| Cabin Three | Cato Lindqvist, Gita Raman | a photograph taped where the light is best |
| Cabin Four | Bex Ferreira, Reva Sandoval | a rope-and-plate shelf bolted over the bunk |
| Cabin Five | Iris Calloway, Osvald Berg | a locker that is not the ship's, and does not fit |

The starboard pair are mirrored, so their floors tilt the other way — the same
grid, flipped, which is what a passenger deck actually does.

The Long Walk carries **nine doorways**: five cabin doors, the Dock at its head,
the Hold at its foot, the Throat to starboard, and one hatch that does not open.
That hatch is the Breach, and it is the jammed one from the lore.

## The six diggings

Each is cloned from whichever makeshift reference best matches the household it
holds, at that reference's measured size:

| Digging | Who | Reference | Size | Shape |
| --- | --- | --- | --- | --- |
| **Mara's** | Mara Osei, Tomás Iriarte, Vero Castel | `makeshift-two-rooms.png` ×3, 245 × 181 | 9 × 7 | Two chambers, a gap cut between them rather than a door. The largest, and six people helped. |
| **Quim's** | Quim Bassols, Wen Jiaming, Lior Ben-Ari | `makeshift-two-rooms-b.jpg` ×4, 181 × 187 | 7 × 7 | Two chambers; the far one has no floor yet. |
| **Pilar's** | Pilar Ocaña, Kes Amankwah, Juno Petrakis | `makeshift-two-rooms-b.jpg` ×4 | 7 × 7 | Two chambers, nearest the Common. |
| **Xan's** | Xan Moreira, Sten Malm | `makeshift-bedsit.jpg` ×4, 178 × 217 | 7 × 8 | One room, square, finished to the millimetre. |
| **Ulla's** | Ulla Nyholm, Ama Oyelaran | `makeshift-bedsit.jpg` ×4 | 7 × 8 | One room, cut as far along the Row from the ship as the rock allowed. |
| **Yara's** | Yara Haddad, Noor Rahimi | `makeshift-bedsit.jpg` ×4 | 7 × 8 | One room, the smallest, and she dug it alone. |

Three face three across the Row, so every front door looks at another front door.
The Row is 25 × 5 with three metres of walkable width, and it carries nine
doorways: six homes, the Common at one end, the Face at the other, and the crawl
up from Hydroponics.

## Who lives with whom

Not assigned. **Read off the weave**, so every household is a bond you can point
at in `weave.ts`.

| Home | Residents | The bond it is built on |
| --- | --- | --- |
| Mara's | M · T · V | Mara and Tomás are thirty years, the closest bond that came aboard. Vero has been mothered by Mara since she was nine and finds it suffocating — and now lives in her house. |
| Quim's | Q · W · L | Quim and Wen are the most functional working relationship in the habitat. |
| Pilar's | P · K · J | Pilar and Kes, same building for nine years. Kes and Juno, a nodding acquaintance that turned into something neither has named. |
| Xan's | X · S | Sten taught Xan to swim forty-eight years ago. Xan is sixty and still defers to him. |
| Ulla's | U · A | Schoolmates, and the only bond in Cluster I with nothing wrong with it. |
| Yara's | Y · N | No prior bond. The two youngest-feeling in the warren, in the smallest room in it. |
| Cabin One | D · E | The outing list and the allocation ledger in the same four metres. |
| Cabin Two | F · H | One season together twenty years ago, never once mentioned. |
| Cabin Three | C · G | Hull integrity and shipyard safety: the two people who inspect things. |
| Cabin Four | B · R | Stores and the Hold: the two who catalogue. |
| Cabin Five | I · O | The Well and the map. Osvald sleeps in the ship; his half-sister has a digging. |

Three hostile pairs were kept apart deliberately: Dima and Halim (the buried
fault), Halim and Gita (would trust each other with their lives and would not sit
together), Cato and Yara (he was briefly her clinician and neither has raised it).

---

## Three lore edits this forced, all needing the owner's word

The number six does not fit the canon nine. These are the seams, and they are all
in text I wrote — say the word and any of them changes.

**1 · Nine diggings became six.** The Diggings' description said "Nine so far",
with nine named owners. Six are drawn. The Row's note now reads *"Three more
diggings were begun and are not lived in. Nobody talks about whose they were
going to be."* The three that lost their home are **Gita's**, **Vero's** and
**Osvald's**, chosen this way: Gita's could not survive being shared, because its
whole entry is that nobody has been inside it; Vero's had no lore attached to it
at all; and Osvald's going lets Ulla keep hers, which is where the half-sibling
distance lives. The alternative is to keep nine on the map and cut the household
sizes, which the owner has already ruled out.

**2 · Vero lost her home to the rock.** That sentence is mine. It is the reason
she is in Mara's house, and it is the best thing the constraint produced — the
woman who finds Mara's mothering suffocating and cannot say so now lives in her
spare chamber. But it is invented, and it is the one invention in this pass that
carries real weight.

**3 · "Sixteen people are still in the Cabins" is now ten.** That note went with
the old single Cabins room and has not been replaced. Osvald's line —
*"has not dug himself a home and will not say why"* — is mine, and does the same
work the old note did: choosing not to dig is visible.

Still open from the last phase, unchanged: the Great Wall's "twenty-six metres"
against a ten-tile face, and Ulla's "forty metres from Osvald's" — which this
pass makes true in a different way, since Osvald is now in the ship entirely.

## What the tests now hold

- Twenty-seven rooms, thirteen hull and fourteen rock; eleven of them homes.
- **Every home's door and its corridor's door are the same doorway** — checked as
  orthogonal adjacency between the two grids' door cells, so nudging a block and
  breaking a doorway fails the suite rather than the eye.
- Five cabins touching the Long Walk, three to port and two to starboard, each
  connecting to nothing else. Six diggings touching the Row, three facing three.
- Corridors are exempt from the twelve-tile cap on their long axis and held to
  three tiles of walkable width on their short one.

## Next: the Workshops

Unchanged from the last phase, and now more clearly right. It is the only room
whose reference shows how a rock-side room is walled — salvaged corrugated sheet
standing on bare ground, `workshop-plate-walls-on-dirt.png` — and the six
diggings need exactly that grammar. Building the Workshops first means the
diggings are built second with the wall question already answered.

Order from here: **Workshops → a first cabin → the other four → Infirmary →
Hold → a first digging → the other five → Well.** The cabins and diggings go in
one-and-then-the-rest because the first of each is where the clone-and-vary rule
gets proved; the remaining four and five are repetition.
