import { describe, expect, it } from 'vitest';
import { centroid, delaunayEdges, polygonArea2, voronoiCells, type Point } from './geometry';

const PLATE = { x: 0, y: 0, w: 100, h: 100 };

describe('voronoi cells', () => {
  it('gives one seed the whole plate', () => {
    const cells = voronoiCells([{ x: 50, y: 50 }], PLATE);
    expect(cells).toHaveLength(1);
    expect(Math.abs(polygonArea2(cells[0].polygon)) / 2).toBeCloseTo(10_000, 6);
    expect(cells[0].neighbours).toEqual([]);
  });

  it('splits the plate down the middle for two seeds', () => {
    const cells = voronoiCells([{ x: 25, y: 50 }, { x: 75, y: 50 }], PLATE);
    for (const cell of cells) {
      expect(Math.abs(polygonArea2(cell.polygon)) / 2).toBeCloseTo(5_000, 6);
    }
    expect(delaunayEdges(cells)).toEqual([[0, 1]]);
  });

  it('tiles the plate exactly, however the seeds fall', () => {
    // Areas have to sum to the plate: no gaps, no double-counting.
    const seeds: Point[] = [
      { x: 12, y: 18 }, { x: 74, y: 26 }, { x: 41, y: 63 },
      { x: 88, y: 81 }, { x: 22, y: 90 }, { x: 55, y: 9 },
    ];
    const cells = voronoiCells(seeds, PLATE);
    const total = cells.reduce((sum, cell) => sum + Math.abs(polygonArea2(cell.polygon)) / 2, 0);
    expect(total).toBeCloseTo(10_000, 3);
    // Every seed is inside its own cell, which is the definition.
    for (const cell of cells) {
      const seed = seeds[cell.seed];
      for (const other of seeds) {
        if (other === seed) continue;
        expect(Math.hypot(seed.x - seed.x, seed.y - seed.y)).toBeLessThanOrEqual(
          Math.hypot(seed.x - other.x, seed.y - other.y),
        );
      }
    }
  });

  it('reports adjacency symmetrically', () => {
    const seeds: Point[] = [
      { x: 20, y: 20 }, { x: 80, y: 20 }, { x: 50, y: 70 }, { x: 20, y: 80 },
    ];
    const cells = voronoiCells(seeds, PLATE);
    for (const cell of cells) {
      for (const other of cell.neighbours) {
        expect(cells[other].neighbours, `${other} should know ${cell.seed}`).toContain(cell.seed);
      }
    }
  });

  it('survives two seeds landing in the same place', () => {
    const cells = voronoiCells([{ x: 40, y: 40 }, { x: 40, y: 40 }], PLATE);
    expect(cells).toHaveLength(2);
    for (const cell of cells) expect(cell.polygon.length).toBeGreaterThan(2);
  });
});

describe('centroid', () => {
  it('finds the middle of a square', () => {
    const middle = centroid([{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }]);
    expect(middle.x).toBeCloseTo(5, 9);
    expect(middle.y).toBeCloseTo(5, 9);
  });

  it('does not divide by zero on a degenerate cell', () => {
    const flat = centroid([{ x: 3, y: 3 }, { x: 5, y: 3 }, { x: 7, y: 3 }]);
    expect(Number.isFinite(flat.x)).toBe(true);
    expect(Number.isFinite(flat.y)).toBe(true);
  });
});
