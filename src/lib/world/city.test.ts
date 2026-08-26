// The world outside the board.
//
// A generator this size is mostly judgement, and judgement cannot be tested.
// What can be is the handful of promises the rest of the code leans on: that
// nothing is ever built on the board, that the same seed gives the same city,
// that the hoarding actually encloses the site and has ways through it, and
// that every road has traffic to put on it.

import { describe, expect, it } from 'vitest';
import { TINTS, WINDOWS, buildCity, cityFor } from './city';

const W = 4120;
const H = 2500;
const city = buildCity(W, H);

describe('the city', () => {
  it('is the same city twice, and cached for the second asking', () => {
    expect(buildCity(W, H)).toEqual(city);
    expect(cityFor(W, H)).toBe(cityFor(W, H));
  });

  it('never builds on the board', () => {
    const site = city.site;
    for (const b of city.buildings) {
      const over = b.x < site.x + site.w && b.x + b.w > site.x
        && b.y - b.h < site.y + site.h && b.y > site.y;
      expect(over, `${b.trade} at ${b.x},${b.y}`).toBe(false);
    }
  });

  it('reaches well past the board on every side', () => {
    expect(city.bounds.x).toBeLessThan(-1000);
    expect(city.bounds.y).toBeLessThan(-1000);
    expect(city.bounds.x + city.bounds.w).toBeGreaterThan(W + 1000);
    expect(city.bounds.y + city.bounds.h).toBeGreaterThan(H + 1000);
    // And there is a town on all four sides of the site, not only above it.
    const left = city.buildings.filter((b) => b.x + b.w < 0).length;
    const right = city.buildings.filter((b) => b.x > W).length;
    const above = city.buildings.filter((b) => b.y < 0).length;
    const below = city.buildings.filter((b) => b.y > H).length;
    for (const side of [left, right, above, below]) expect(side).toBeGreaterThan(12);
  });

  it('gives every building a pattern and a tint the renderer has', () => {
    for (const b of city.buildings) {
      expect(b.glass).toBeGreaterThanOrEqual(0);
      expect(b.glass).toBeLessThan(WINDOWS);
      expect(b.tint).toBeGreaterThanOrEqual(0);
      expect(b.tint).toBeLessThan(TINTS);
      expect(b.w).toBeGreaterThan(0);
      expect(b.h).toBeGreaterThan(0);
    }
  });

  it('fences the site, and leaves ways in', () => {
    const { fence, site } = city;
    expect(fence.gates.length).toBeGreaterThanOrEqual(4);
    expect(fence.towers).toHaveLength(4);
    expect(fence.runs.length).toBeGreaterThanOrEqual(4);
    // Every panel is outside the board and axis-aligned with its edge.
    for (const run of fence.runs) {
      const straight = Math.abs(run.x1 - run.x2) < 0.001 || Math.abs(run.y1 - run.y2) < 0.001;
      expect(straight).toBe(true);
      const outside = run.x1 <= site.x || run.x1 >= site.x + site.w
        || run.y1 <= site.y || run.y1 >= site.y + site.h;
      expect(outside).toBe(true);
    }
    // And each side has more than one panel, because each side has a gate.
    const top = fence.runs.filter((run) => run.y1 === run.y2 && run.y1 < site.y);
    expect(top.length).toBeGreaterThan(1);
  });

  it('does not put the same sign over three doors in a row', () => {
    // The row of cabins backing onto the north side of the site is the one a
    // visitor reads at a glance, so it has to be a street rather than a repeat.
    // They all stand on one baseline, which is what identifies them.
    const baseline = city.site.y - 104;
    const compound = city.buildings
      .filter((b) => b.y === baseline && b.sign)
      .sort((a, b) => a.x - b.x);
    expect(compound.length).toBeGreaterThan(8);
    let run = 1;
    let worst = 1;
    for (let i = 1; i < compound.length; i += 1) {
      run = compound[i].sign === compound[i - 1].sign ? run + 1 : 1;
      worst = Math.max(worst, run);
    }
    expect(worst).toBeLessThan(3);
  });

  it('puts the weather somewhere other than over the crew', () => {
    expect(city.weather.fog.length).toBeGreaterThan(3);
    expect(city.weather.rain.length).toBeGreaterThan(0);
    for (const cell of city.weather.rain) {
      const over = cell.x < W + 80 && cell.x + cell.w > -80
        && cell.y < H + 80 && cell.y + cell.h > -80;
      expect(over, `rain at ${cell.x},${cell.y}`).toBe(false);
    }
  });

  it('never lays tarmac across the board, or drives traffic over it', () => {
    const { site } = city;
    // The hoarding stands 56 out and the roads keep clear of that as well, so
    // a road may come close but must never enter.
    const inside = (x: number, y: number) => (
      x > site.x - 40 && x < site.x + site.w + 40 && y > site.y - 40 && y < site.y + site.h + 40
    );
    for (const road of city.roads) {
      expect(inside(road.x1, road.y1), `road ends at ${road.x1},${road.y1}`).toBe(false);
      expect(inside(road.x2, road.y2), `road ends at ${road.x2},${road.y2}`).toBe(false);
      // And no road spans the site from one side to the other.
      const spans = road.x1 < site.x && road.x2 > site.x + site.w
        && road.y1 > site.y && road.y1 < site.y + site.h;
      const spansDown = road.y1 < site.y && road.y2 > site.y + site.h
        && road.x1 > site.x && road.x1 < site.x + site.w;
      expect(spans || spansDown).toBe(false);
    }
    for (const lane of city.lanes) {
      const spans = Math.min(lane.x1, lane.x2) < site.x && Math.max(lane.x1, lane.x2) > site.x + site.w
        && lane.y1 > site.y && lane.y1 < site.y + site.h;
      const spansDown = Math.min(lane.y1, lane.y2) < site.y && Math.max(lane.y1, lane.y2) > site.y + site.h
        && lane.x1 > site.x && lane.x1 < site.x + site.w;
      expect(spans || spansDown, `lane ${lane.x1},${lane.y1} to ${lane.x2},${lane.y2}`).toBe(false);
    }
  });

  it('has a lane for the traffic on every road it draws', () => {
    expect(city.lanes.length).toBeGreaterThanOrEqual(city.roads.length);
    for (const lane of city.lanes) {
      expect(Math.hypot(lane.x2 - lane.x1, lane.y2 - lane.y1)).toBeGreaterThan(100);
    }
  });

  it("leaves the site covered in the crew's things", () => {
    const onSite = city.props.filter((p) => p.x > 0 && p.x < W && p.y > 0 && p.y < H);
    expect(onSite.length).toBeGreaterThan(120);
  });
});
