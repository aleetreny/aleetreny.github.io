import { describe, expect, it } from 'vitest';
import { RESIDENTS } from './residents';
import {
  AXES, BONDS, LATENT, bondBetween, clusterOf, modularity, pairKey,
  priorEdges, randomBaseline, withinClusterEdges,
} from './weave';

describe('the axes', () => {
  it('measures six things between two people', () => {
    expect(AXES).toEqual(
      ['trust', 'affection', 'admiration', 'debt', 'resentment', 'desire'],
    );
  });
});

describe('the bonds', () => {
  it('carries twenty-three real bonds and six latent ones', () => {
    expect(BONDS).toHaveLength(23);
    expect(LATENT).toHaveLength(6);
  });

  it('never pairs somebody with themselves', () => {
    for (const b of [...BONDS, ...LATENT]) expect(b.from).not.toBe(b.to);
  });

  it('names only residents who exist', () => {
    const ids = new Set(RESIDENTS.map((r) => r.id));
    for (const b of [...BONDS, ...LATENT]) {
      expect(ids.has(b.from)).toBe(true);
      expect(ids.has(b.to)).toBe(true);
    }
  });

  it('has no duplicate pair, in either direction', () => {
    const edges = priorEdges();
    expect(new Set(edges).size).toBe(edges.length);
    expect(edges).toHaveLength(29);
  });

  it('writes a line for every bond, because no number says what is between two people', () => {
    for (const b of [...BONDS, ...LATENT]) expect(b.line.length).toBeGreaterThan(40);
  });

  it('finds a bond regardless of which way round it is asked', () => {
    expect(bondBetween('U', 'O')).toBeDefined();
    expect(bondBetween('O', 'U')).toBe(bondBetween('U', 'O'));
  });

  it('returns nothing for two people who carried no bond aboard', () => {
    expect(bondBetween('A', 'C')).toBeUndefined();
  });
});

describe('the latent bonds', () => {
  it('runs one way: one of them knows and the other does not', () => {
    for (const l of LATENT) expect(l.knower).toBe(l.from);
  });

  it('gives every one of them a route to surfacing, so no dotted edge can fail to resolve', () => {
    for (const l of LATENT) expect(l.route.length).toBeGreaterThan(30);
  });

  it('leaves Juno holding the one she does not know she is holding', () => {
    const juno = LATENT.find((l) => l.from === 'J' && l.to === 'R');
    expect(juno).toBeDefined();
    expect(juno!.line).toMatch(/transit station/);
  });
});

describe('the anomaly is a measurement, not a claim', () => {
  it('puts twenty-three of the twenty-nine bonds inside a cluster', () => {
    expect(withinClusterEdges(priorEdges())).toBe(23);
  });

  it('scores far above what chance produces on the five-way partition', () => {
    const observed = modularity(priorEdges());
    const base = randomBaseline(7, priorEdges().length, 2000);
    expect(observed).toBeGreaterThan(0.5);
    expect(base.meanModularity).toBeLessThan(0.15);
    expect(base.meanWithin).toBeLessThan(8);
    // Not one random graph in two thousand reaches it.
    expect(base.atLeastAsExtreme).toBe(0);
  });

  it('is reproducible, because the baseline is seeded', () => {
    expect(randomBaseline(7, 29, 200)).toEqual(randomBaseline(7, 29, 200));
  });

  it('assigns every resident to exactly one cluster', () => {
    for (const r of RESIDENTS) expect(clusterOf(r.id)).toBe(r.cluster);
  });

  it('orders a pair the same way whichever end it is given', () => {
    expect(pairKey('Y', 'A')).toBe(pairKey('A', 'Y'));
  });
});
