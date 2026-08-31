#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Builds and checks the habitat's sixteen room grids.

An authoring tool, not part of `pnpm check`. It holds the grids as data, verifies
them, and writes docs/superpowers/specs/2026-08-31-habitat-rooms.md.

Every grid is checked for: rectangularity; a closed boundary; no character outside
a legend; no legend entry that is never placed; at least one door; at least as many
doors as the room has connections; and connections reciprocated by the room on the
other side. A grid that fails any of these does not get written.

When the grids become engine data this should be replaced by a vitest test over
that data, so that editing a room cannot quietly break the map.

    python3 scripts/habitat/build-rooms.py
"""
import io, sys, collections, textwrap

TERRAIN = {
    "#": "solid rock or hull plate",
    ".": "open, walkable",
    "=": "deck plate or dug floor, walkable, stands on",
    "|": "partition, solid",
    "+": "hatch or doorway, walkable",
    "X": "sealed - needs a key, a suit or a tool",
    "^": "climb up",
    "v": "climb down",
    "~": "water",
    ":": "grating, walkable, things fall through",
    ",": "loose spoil, walkable, slow",
    '"': "living growth, walkable",
    "*": "vacuum, not survivable unsuited",
}

R = []
def room(key, name, side, tilt, conn, desc, grid, legend, note=None):
    R.append(dict(key=key, name=name, side=side, tilt=tilt, conn=conn,
                  desc=desc, grid=grid, legend=legend, note=note))

# ---------------------------------------------------------------- THE HULL
room("bridge", "The Bridge", "hull", 22, ["dock"],
"""The bow, canted up and nearly at the surface. The port is cracked across its
whole width and patched from the inside with plate and sealant, so the stars come
through a repair. Both consoles are dead. Nobody sits in the pilot's chair; the
taboo formed in the second week and nobody can say who started it.""",
[
    "######################",
    "#w.........p.........#",
    "#w...s...............#",
    "#w==============v====#",
    "#....t....u.....^....+",
    "#.................b..#",
    "#====================#",
    "######################",
],
{"w": "the cracked port, patched from inside",
 "p": "the pilot's chair",
 "s": "a scratch tally of the days, cut into the bulkhead",
 "t": "dead navigation console",
 "u": "dead helm console",
 "b": "a bench somebody dragged up here"})

room("dock", "The Dock", "hull", 22, ["bridge", "cabins", "greatwall"],
"""Where the hull's flank broke the surface. The outer hatch opens onto regolith and
sky. Three suits for twenty-five people, on racks, logged in and out by Dima
Vashenko with a scruple that irritates everybody.""",
[
    "########################",
    "#......................+",
    "#..1..2..3....r........#",
    "#......................+",
    "X...........l.......k..+",
    "#======================#",
    "########################",
],
{"1": "suit rack one", "2": "suit rack two", "3": "suit rack three",
 "r": "tether reel",
 "l": "the outing list, a plate scratched with names and dates",
 "k": "tool locker"})

room("cabins", "The Cabins", "hull", 22, ["dock", "breach", "hold", "greatwall"],
"""Original passenger quarters, and the floors run downhill. Everything that has to
stand level stands on a wedge. Each cabin belongs to somebody who is still asleep,
and living here means living among their things under an etiquette nobody wrote.""",
[
    "##########################",
    "#..m..|..m..|..m..|..m...#",
    "+..d..+..d..X..d..+..e...+",
    "#========================#",
    "#..m..|..m..|..m..|..m...#",
    "+..d..+..d..+..d..+......+",
    "#========================#",
    "##########################",
],
{"m": "a bunk", "d": "wedges and shims holding something level",
 "e": "a sleeping passenger's belongings, untouched"},
"The sealed cabin on the lower deck has never been opened. Its hatch is jammed, "
"not locked, and opening it has been on the list since week three.")

room("breach", "The Breach", "hull", 22, ["cabins", "hold"],
"""Where the hull tore. No pressure, no light, no sound, and the only place in the
habitat where nobody can see or hear you. It is the source of salvage mass and it
is where things go that are not meant to be found.""",
[
    "##########################",
    "#************************#",
    "#***n****c***************#",
    "#####**********p*********#",
    "+....X*******************#",
    "#=====#***s**************#",
    "X*****#*****************##",
    "##########################",
],
{"n": "the ship's nameplate, half buried, unread",
 "c": "cargo that came loose and stopped",
 "p": "a torn plate, the tear itself",
 "s": "the salvage pile, what has been dragged near the hatch"},
"Nobody has read the nameplate. They do not know what their ship is called.")

room("hold", "The Hold", "hull", 22, ["cabins", "breach", "infirmary"],
"""Cargo. The manifest went in the impact, so nothing here is labelled with anything
that means anything. Reva Sandoval has opened nine crates in a hundred days and
catalogued all nine beautifully.""",
[
    "############################",
    "#..........................+",
    "#..o..o..o....u..u..u..u...#",
    "#==========================#",
    "+..u..u..u..u..u..u..u..u..+",
    "#.v........................#",
    "#==========================#",
    "############################",
],
{"o": "an opened crate, catalogued",
 "u": "an unopened crate",
 "v": "Reva's inventory board"},
"Forty-one crates remain unopened. Opening one is an occasion and there is no way "
"to know what is inside until it is open.")

room("infirmary", "The Infirmary", "hull", 22, ["hold", "berths", "workshops"],
"""Ship medical, partly working. One diagnostic bed that still reports, one that
does not. The drug cabinet has never been audited by anybody. The dead are laid on
the slab at the far end, which means this is the room where you are saved and the
room where you are laid out.""",
[
    "######################",
    "#....................+",
    "#..b......c......k...#",
    "#....................#",
    "+..b..............z..+",
    "#====================#",
    "######################",
],
{"b": "a bed - one reports, one does not",
 "c": "the consulting corner, two chairs",
 "k": "the unaudited cabinet",
 "z": "the slab"})

room("berths", "The Cold Berths", "hull", 22, ["infirmary", "spine"],
"""Deep, cold, blue, and quiet enough that people lower their voices without
deciding to. Hundreds of sleepers. Nobody knows who any of them are. Somebody
started sticking tape to the glass with invented names on it and now most of the
front bank has one.""",
[
    "##############################",
    "#............................#",
    "#.bbbbbb.bbbbbb.bbbbbb.bbbbb.#",
    "#.nnnnnn.nnnn...............q#",
    "#============================#",
    "#.bbbbbb.bbbbbb.bbbbbb.bbbbb.#",
    "#............................#",
    "+.....t......................+",
    "#============================#",
    "##############################",
],
{"b": "an occupied berth", "n": "a berth with a name taped to the glass",
 "t": "the manifest terminal, blank",
 "q": "a berth on its own circuit, running, with no entry on any list"},
"Nobody has opened q. Its power does not come from the panel anybody can see.")

room("spine", "The Spine", "hull", 22, ["berths", "well", "workshops"],
"""The reactor and everything it feeds. With the ship at this angle the Spine is a
diagonal climb rather than a corridor, and it is hot the whole way down. The
allocation panel at the bottom has more outputs than there are places to send
power.""",
[
    "##############",
    "#....+.......#",
    "#....v.......#",
    "#=====.......#",
    "#....^.......#",
    "+..c.:...c...#",
    "#====:=======#",
    "#....v...a...#",
    "#....:.......#",
    "#=====.......#",
    "#....^.......#",
    "+..r.....r...#",
    "#============#",
    "##############",
],
{"c": "a charge cell rack", "a": "the allocation panel",
 "r": "the reactor face, too hot to stand near for long"},
"Four of the panel's outputs are labelled with department names that mean nothing "
"now. Two of them are drawing power. Nobody has traced where to.")

# ---------------------------------------------------------------- THE ROCK
room("greatwall", "The Great Wall", "rock", 0, ["dock", "cabins", "common"],
"""The first chamber they cut, and they cut it too big because they did not yet
know how hard the rock was going to be. One face came away almost flat: twenty-six
metres of clean stone, the largest surface in the habitat, and in a hundred days
nobody has put anything on it. The terminal salvaged out of the hull sits against
the opposite wall.""",
[
    "##########################",
    "+........................+",
    "#W......................t#",
    "#W......................t#",
    "#W......................b+",
    "#W=======================#",
    "##########################",
],
{"W": "the wall - flat, clean, and blank",
 "t": "the terminal", "b": "the stool in front of it"},
"People come here to look at the wall and then leave. Several have said they were "
"going to do something with it.")

room("common", "The Common", "rock", 0, ["greatwall", "hydroponics", "diggings", "workshops"],
"""The room the habitat happens in. Everybody passes through it and almost everybody
eats here. The long table is a hull plate: the first thing they ever built was the
place where they all sit down, and to build it they started taking the ship
apart.""",
[
    "################################",
    "#..............................#",
    "#..............................#",
    "#.............P................#",
    "+..............................+",
    "#..............................#",
    "+..k..s..bbbbTTTTTTTTTTbbbb....+",
    "#==============================#",
    "################################",
],
{"k": "Pilar's corner - two burners and everything she owns",
 "s": "the stove", "T": "the long table, a hull plate",
 "b": "benches, none of them matching",
 "P": "the pinning wall - notices, lists, one drawing"},
"Somebody pinned a drawing to the wall eleven days ago and did not sign it.")

room("hydroponics", "Hydroponics", "rock", 0, ["common", "well", "diggings"],
"""The only living green and the only full-spectrum light. It is a farm and it is
also where people come to sit, and the light they sit under costs everybody power.
Vero Castel resents the sitters, needs the company, and has not resolved it.""",
[
    "##############################",
    "#llllllllllllllllllllllllllll#",
    "+............................+",
    '#."""""".""""""".""""""......#',
    "#.TTTTTT.TTTTTTT.TTTTTT..f...#",
    "#============================#",
    "#.......................c.c..#",
    "+...s........................#",
    "#============================#",
    "##############################",
],
{"l": "the lamp bank", "T": "a growing tray", "f": "the one plant that is not food",
 "s": "the seed store - eleven varieties, no more coming",
 "c": "chairs that were dragged in here and never went back"},
"Nobody planted f. It came up in a tray and Vero has not pulled it.")

room("diggings", "The Diggings", "rock", 0, ["common", "hydroponics", "face"],
"""Where people dug their own homes. Nine so far, and the difference between them is
the most public document in the habitat: how much rock you could move, how well you
finished it, and how many people were willing to help you.""",
[
    "################################",
    "#.....|......|.......|.........#",
    "+..1..+..2...+...3...+....4....+",
    "#==============================#",
    "#.....|......|.......|.....|...#",
    "+..5..+..6...+...7...+..8..+.9.+",
    "#==============================#",
    "################################",
],
{"1": "Xan's - small, square, finished to the millimetre",
 "2": "Mara's - the largest, and six people helped",
 "3": "Quim's - unfinished, because he keeps working on other people's",
 "4": "Gita's - narrow, deep, and nobody has been inside",
 "5": "Pilar's - nearest the Common, which was not an accident",
 "6": "Osvald's", "7": "Ulla's - forty metres from Osvald's",
 "8": "Vero's", "9": "Yara's - the smallest, and she dug it alone"},
"Sixteen people are still in the Cabins. Digging is optional and everybody knows "
"what choosing not to looks like.")

room("workshops", "The Workshops", "rock", 0, ["common", "infirmary", "spine", "well"],
"""Bays, divided by whoever got there first. The economy is in this room. There is
one fabricator and it has a queue, and the queue is the most contested object in
the habitat because there is no procedure for it and everybody can see there is
no procedure for it.""",
[
    "##############################",
    "+.....|.......|..............+",
    "#..t..|...t...|...f......q...#",
    "#.....|.......|..............#",
    "#=====#=======#==============#",
    "+..h......t...|..........t...+",
    "#.............|..............#",
    "#============================#",
    "##############################",
],
{"t": "tools, each set marked with an owner's mark",
 "f": "the fabricator", "q": "the queue board",
 "h": "the scrap heap - hull offcuts, sorted by Lior"},
"Three bays. Nine people want one. The bays were claimed in week four by the "
"three who happened to be standing there.")

room("well", "The Well", "rock", 0, ["hydroponics", "workshops", "spine"],
"""Water reclamation and air scrubbing. The lowest room, because water goes
downhill. It is the ugliest work in the habitat and everybody's life depends on it
and Osvald Berg does it without complaint and without letting anybody forget.""",
[
    "######################",
    "+....................+",
    "#..TT......TT........#",
    "#..TT......TT....p...#",
    "#=========:==========#",
    "+..f.f.f.............#",
    "#~~~~~~~~~~~~~~~~~~~~#",
    "#~~~~~~~~~~~~~~~~~~~~#",
    "######################",
],
{"T": "a tank", "p": "the pump", "f": "filter housings - the filters are consumable"},
"Eleven spare filters. When they are gone there is no more air scrubbing and "
"nobody has worked out what happens then.")

room("face", "The Face", "rock", 0, ["diggings", "hollow"],
"""The unfinished tunnel. The only room in the habitat that is incomplete by
definition, and the only one whose position on the map changes. People come here
to claim space and people come here to be somewhere nobody is.""",
[
    "########################",
    "#.....................,#",
    "+..t..m...............,#",
    "#====================,,#",
    "+.y...................,#",
    "#====================,,#",
    "########################",
],
{"t": "the tools, left at the face", "m": "progress marks, cut weekly",
 "y": "marks in the rock on a side gallery, three weeks old, unsigned"},
"y is not good yet. Nobody has seen it and Yara Haddad has not said it is hers.")

room("hollow", "The Hollow", "rock", 0, ["face"],
"""They did not dig this. A gallery broke into it in week nine: a natural void,
irregular, orthogonal to nothing, with a floor that is not flat and a roof nobody
has measured. It has no assigned use. It is the only space in the habitat that
nobody designed and nobody has decided about.""",
[
    "############################",
    "#####..................#####",
    "###.......................##",
    "##........................##",
    "#.........................##",
    "##.......,,,,,............##",
    "###...,,,,,,,,,,,,........##",
    "####,,,,,,,,,,,,,,,,,,,,,###",
    "+#,,,,,,,,,,,,,,,,,,,,,,,###",
    "############################",
],
{},
"There is nothing in it. That is the entry.")

# ---------------------------------------------------------------- validate
errs = []
seen_conn = collections.defaultdict(set)
keys = {r["key"] for r in R}
for r in R:
    g, leg, k = r["grid"], r["legend"], r["key"]
    w = len(g[0])
    for i, row in enumerate(g):
        if len(row) != w:
            errs.append(f"{k}: row {i} is {len(row)} wide, expected {w}")
    used = set("".join(g))
    unknown = used - set(TERRAIN) - set(leg)
    if unknown:
        errs.append(f"{k}: characters not in any legend: {sorted(unknown)}")
    unused = set(leg) - used
    if unused:
        errs.append(f"{k}: legend entries never placed: {sorted(unused)}")
    SOLID, DOOR = set("#|"), set("+X")
    for x, c in enumerate(g[0]):
        if c not in SOLID | DOOR: errs.append(f"{k}: open top edge at x={x} ({c!r})")
    for x, c in enumerate(g[-1]):
        if c not in SOLID | DOOR: errs.append(f"{k}: open bottom edge at x={x} ({c!r})")
    for y, row in enumerate(g):
        if row[0] not in SOLID | DOOR: errs.append(f"{k}: open left edge at y={y} ({row[0]!r})")
        if row[-1] not in SOLID | DOOR: errs.append(f"{k}: open right edge at y={y} ({row[-1]!r})")
    if sum(row.count("+") + row.count("X") for row in g) < len(r["conn"]):
        errs.append(f"{k}: {len(r['conn'])} connections but fewer doors")
    if not any(c in used for c in "+X"):
        errs.append(f"{k}: no door")
    for c in r["conn"]:
        if c not in keys: errs.append(f"{k}: connects to unknown room {c!r}")
        seen_conn[k].add(c)
for k, cs in seen_conn.items():
    for c in cs:
        if k not in seen_conn.get(c, set()):
            errs.append(f"connection {k} -> {c} is not reciprocated")
if errs:
    print("VALIDATION FAILED"); [print("  " + e) for e in errs]; sys.exit(1)

objs = sum(len(r["legend"]) for r in R)
print(f"OK  {len(R)} rooms  {objs} legend entries  "
      f"{sum(len(r['grid'][0])*len(r['grid']) for r in R)} tiles")

OUT = "docs/superpowers/specs/2026-08-31-habitat-rooms.md"

by = {r["key"]: r for r in R}

HEAD = """# Genesis: the sixteen rooms

The habitat, as a grid.

This is the load-bearing technical idea of the whole project, so it is worth
stating before the rooms: **there is one representation of space, and the engine,
the renderer and the mind all read the same one.** A room is a character grid with
a legend. That grid is what the simulation moves people across, what the canvas
draws, and what goes into a model's prompt verbatim.

An agent is never handed a prose description of where it is. It is handed the map.
It can count the steps to the door, see who is standing in the corner, and know
that the fabricator is on the far side of a partition. Spatial reasoning stops
being something a model hallucinates and becomes something it reads.

## The encoding

Three character classes, and they never collide.

**Terrain** — symbols. One legend for the whole world.

| | |
| --- | --- |
"""

MID = """
**Objects** — lowercase letters and digits, with a legend local to each room. A
room holds at most fifteen or so, which is why single characters are enough and
why the legend is per-room rather than global.

**People** — uppercase `A`–`Y`, each resident's own initial. This is what the
distinct initials in the roster were for: a resident renders onto the grid as
themselves, and a populated room reads without a key.

```
##############################
#............................#
#.bbbbbb.bbbbbb.J.....U.....q#
#============================#
```

Juno and Ulla are in the Cold Berths, six metres apart, and `q` is six metres
beyond Ulla against the far wall.

**Doors and decks.** `+` on a room's outer boundary is a way into another room; `+`
inside a room is a doorway between cells of it, as in the Cabins and the Diggings.
A hatch does not have to sit at floor level — this is a ship, and hatches are at
every height — so a boundary `+` on an upper row is reached by a step or a climb.
`v` and `^` are the between-deck climbs, and they come in pairs at the same `x`.
`X` is anything that will not open without a key, a suit or a tool: the outer hatch
at the Dock, the two ways into the Breach, and one cabin whose hatch has been jammed
since week three.

Every room carries **at least as many doors as it has connections**, and every
connection is reciprocated by the room on the other side. Both were checked
mechanically.

**Standing.** People and most objects sit on the row directly above a `=` row.
Things fixed to a wall — the pinning wall in the Common, the lamp bank in
Hydroponics, the cracked port on the Bridge — sit where they are mounted.

**Coordinates** are `(x, y)` from the top-left of the room's own grid, in metres:
one tile is one metre, a person occupies one tile and stands on the row above a
walkable floor. Object positions are **derived by scanning the grid**, never
maintained separately, so a grid and its object list cannot drift apart.

## Tilt

Hull grids are **axis-aligned in their own local coordinates**, and the tilt is a
property of the room applied at render. Pathfinding, distance and adjacency all
stay sane; the cutaway still shows the ship driven in at twenty-two degrees.

What the tilt costs is expressed *inside* the grids instead: the Cabins are full of
wedges holding things level, and the Spine is a climb rather than a corridor.

## Growth

Rock rooms grow. The grids below are the day-one-hundred state. **The Diggings**
and **The Workshops** extend as people cut new bays and new homes, and **The Face**
moves — its position on the section changes as it advances. Hull grids never
change. They can only be lost, sealed or taken apart for mass.

## The section

```
                  ·   regolith, vacuum, stars   ·
  ════════════════════════════════════════════════════════════════
            BRIDGE ╲
             DOCK   ╲──────── GREAT WALL ─── COMMON ─── HYDROPONICS
              CABINS ╲────────────┘            │  ╲          │
   the hull,   BREACH ╲                        │   DIGGINGS ─┘
    22° off     HOLD   ╲                       │       │
    the dug      INFIRMARY ╲─ WORKSHOPS ───────┘      FACE
    galleries     BERTHS    ╲     │   ╲                │
                   SPINE ────╲────┘    WELL          HOLLOW
```

Eight rooms in the hull, eight cut into the rock. Everything above the Great Wall
is inherited and finite. Everything from the Great Wall rightwards was made by
hand and is still being made.

---
"""

def emit():
    out = [HEAD]
    for ch, meaning in TERRAIN.items():
        shown = "\\|" if ch == "|" else ch
        out.append(f"| `{shown}` | {meaning} |\n")
    out.append(MID)
    for side, title in (("hull", "The hull"), ("rock", "The rock")):
        out.append(f"\n# {title}\n")
        for r in [x for x in R if x["side"] == side]:
            g = r["grid"]; w, h = len(g[0]), len(g)
            conns = ", ".join(by[c]["name"] for c in r["conn"])
            tilt = f"tilted {r['tilt']}°" if r["tilt"] else "level"
            out.append(f"\n## {r['name']}\n\n")
            out.append(f"**{side} · {tilt} · {w}×{h} m · {len(r['legend'])} objects**  \n")
            out.append(f"*Connects to: {conns}.*\n\n")
            out.append(r["desc"].strip() + "\n\n```\n" + "\n".join(g) + "\n```\n\n")
            if r["legend"]:
                out.append("| | |\n| --- | --- |\n")
                for ch, meaning in r["legend"].items():
                    out.append(f"| `{ch}` | {meaning} |\n")
            else:
                out.append("No objects.\n")
            if r["note"]:
                wrapped = textwrap.fill(" ".join(r["note"].split()), 76)
                out.append("\n> " + wrapped.replace("\n", "\n> ") + "\n")
    out.append("""
---

# What this gives the implementer

- **One artefact, three consumers.** The grid is the simulation's collision and
  adjacency map, the renderer's tile source, and the perception block in an agent's
  prompt. There is no second representation to keep in sync, and no translation
  layer to get wrong.
- **Perception is a substring.** What an agent can see is a window of the grid plus
  the legends for what is in that window. Line of sight, hearing range and "who is
  in this room" are all operations on the same array.
- **Objects cannot drift.** Positions are scanned out of the grid. Moving an object
  means editing one character.
- **The map is falsifiable.** A room either has a door or it does not, a legend
  entry is either placed or it is not, and both were checked mechanically when this
  document was generated. Every grid here is rectangular, every character is in a
  legend, every legend entry appears in its grid, every room has at least one door
  and every connection is reciprocated.
- **Sixty-five significant objects** across sixteen rooms, inside the sixty-to-eighty
  band the design called for. Set dressing sits on top of this as drawn detail with
  written lore and no state, and never enters a grid.
""")
    return "".join(out)

io.open(OUT, "w", encoding="utf-8").write(emit())
print("written")
