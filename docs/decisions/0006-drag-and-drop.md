# ADR 0006: dnd-kit for drag and drop

- Status: accepted and implemented
- Date: 2026-08-04

## Context

The editor needs to reorder blocks with mouse, touch and keyboard without
breaking accessibility.

## Options considered

- native HTML5 drag and drop;
- react-beautiful-dnd and its forks;
- dnd-kit;
- buttons only.

## Decision and reasons

Use dnd-kit's sortable with pointer and keyboard sensors, plus up/down buttons.
A composable API and better accessibility support than native DnD.

## Consequences

It adds a dependency and optimistic state logic. The editor loads it lazily in
owner mode only, so it does not weigh on the public bundle.

## How to change it

Order normalisation is isolated in `src/lib/editor.ts`; the library can be
replaced while keeping that function, the buttons and the tests.
