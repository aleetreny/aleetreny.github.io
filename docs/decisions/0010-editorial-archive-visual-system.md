# ADR 0010: The working-board visual system

- Status: accepted
- Date: 2026-08-05, extended 2026-08-08

## Context

The pinboard was a good metaphor, but pastel notes, rounding and low density read
as a childish aesthetic and hid the real breadth of the work. Owner mode also
looked like a different application.

## Options considered

1. Abandon the board and use a conventional editorial portfolio.
2. Keep the sticky notes and limit the change to colour and typography.
3. Reinterpret the board as a working surface and apply the same system to the
   frontend and the editor.

## Decision

The third option. The infinite canvas stays, but its vocabulary becomes dossiers,
drawers, a grid, stamps and cuts. The palette is ink, bone, rust and signal
amber. Large radii and soft shadows stop being base resources. The editor uses
the same tokens, materials and hierarchies.

Content is organised into owner-editable **lists**: `metadata.group` relates an
entry to a list without a new table and without closing the content model.

### 2026-08-08 extension

The board became a **finite slate on a wall** rather than an edge-to-edge
texture, which gave the guided tour something to arrive at. Both the slate and
the wall are theme settings, and turning the slate off restores the previous
look exactly — the change is additive, not a replacement.

## Reasons

- it keeps the distinctive interaction that already worked;
- it expresses research, method and professional breadth better;
- a fixed jump index makes a larger catalogue navigable;
- it avoids a second visual identity for administration;
- it remains a static SPA compatible with GitHub Pages;
- every texture is reproduced with versioned CSS and no assets.

## Consequences

- the composition uses explicit positions and must be reviewed when cards are
  added;
- high contrast means checking small sizes when zoomed out;
- an entry with no `metadata.group` falls back to a default list;
- the editor must evolve alongside the public metadata;
- because the slate is finite, the wall behind it is now part of the design and
  carries its own settings.

## How to change it

Create an ADR that supersedes this one, migrate or map `metadata.group`, and
update [`docs/design-direction.md`](../design-direction.md),
[`docs/handbook.md`](../handbook.md), the fixtures and the tests. If the canvas
is abandoned, keep pan/zoom only where it still earns its place and keep content
routes and URLs compatible.
