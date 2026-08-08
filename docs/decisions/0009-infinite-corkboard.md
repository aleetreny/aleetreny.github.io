# ADR 0009: An infinite board

- Status: accepted and implemented
- Date: 2026-08-04

## Context

The portfolio should not feel like a conventional vertical landing page. The
central metaphor is a personal board where each area appears as a physical piece
of paper, is found by exploring, and expands without leaving the paper language.

## Options considered

- a vertical landing page by sections;
- a card grid with conventional modals;
- canvas/WebGL;
- a transformed DOM surface with pan, zoom and positioned pieces.

## Decision

Use a fixed DOM surface over a repeatable board texture. The world of cards moves
with `translate` and `scale`; pointer and touch drive pan and pinch, the wheel and
the buttons drive zoom, and the keyboard offers shortcuts. Cards summarise the
main elements and open a dossier that uses the same paper.

## Reasons

- it keeps semantic text, links, focus and assistive reading;
- it avoids the accessibility loss of a drawn canvas;
- it works on GitHub Pages with no extra runtime;
- content keeps coming from the same entry/block model;
- the repeatable texture lets the surface continue without a visual edge.

## Consequences

- initial positions are an editorial decision and must be reviewed when adding
  cards;
- important content needs a short summary for the card and detail for the
  dossier;
- every interaction has to be tested with mouse, touch, keyboard and
  `prefers-reduced-motion`;
- owner editing happens in place on the board, so editing and spatial navigation
  share one surface — which is why the per-card controls counter-scale with the
  zoom.

## How to change it

Keep `PortfolioEntry` and `ContentBlocks` independent of the canvas. A future
layout strategy can replace positions and transforms without migrating content
or the backend.
