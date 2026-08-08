# ADR 0007: Mobile-first responsive

- Status: accepted
- Date: 2026-08-04

## Context

The public portfolio and the editor must work from a phone to a desktop, and
respect accessibility preferences.

## Options considered

- desktop-first breakpoints;
- a utility CSS framework;
- CSS-in-JS;
- native mobile-first CSS with fluid type and grid, plus media and container
  queries where they earn their place.

## Decision and reasons

Native CSS, tokens on `:root`, `clamp`, a flexible grid, few breakpoints and
`prefers-reduced-motion`. Fewer dependencies and a portable build.

## Consequences

It needs discipline with components and class names, and visual testing. Because
the board is a transformed canvas, the phone strategy is not only CSS: framing,
gesture handling and chrome density are decided in
[`docs/handbook.md`](../handbook.md) and are editable at runtime.

## How to change it

Introduce a design system or utilities after inventorying the tokens; migrate
progressively and check for visual regressions.
