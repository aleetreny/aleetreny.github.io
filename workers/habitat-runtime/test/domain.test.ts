import { describe, expect, it } from 'vitest';
import { isWalkable } from '../../../src/lib/habitat/grid';
import { ROOM_BY_ID } from '../../../src/lib/habitat/rooms';
import {
  advanceWorldWatch,
  createGenesisWorld,
  decodeCognition,
  deserializeWorldState,
  prepareCognition,
  serializeWorldState,
  worldSnapshot,
} from '../src/domain';

describe('canonical world adapter', () => {
  it('round-trips all twenty-five bodies and six hundred directed relationships', () => {
    const restored = deserializeWorldState(serializeWorldState(createGenesisWorld()));
    expect(Object.keys(restored.bodies)).toHaveLength(25);
    expect(restored.axes.size).toBe(25 * 24);
    expect(serializeWorldState(restored)).toBe(serializeWorldState(createGenesisWorld()));
  });

  it('projects walkable, non-overlapping positions', () => {
    const snapshot = worldSnapshot(createGenesisWorld());
    const occupied = new Set<string>();
    for (const person of snapshot.people) {
      const room = ROOM_BY_ID[person.room];
      expect(isWalkable(room.grid, room.legend, person.at.x, person.at.y)).toBe(true);
      const key = `${person.room}:${person.at.x}:${person.at.y}`;
      expect(occupied.has(key)).toBe(false);
      occupied.add(key);
    }
  });

  it('builds one bounded cognition request and fixes the actor outside model output', () => {
    const state = createGenesisWorld();
    const prepared = prepareCognition({
      state,
      worldRevision: 0,
      habitatId: 'habitat-canonical',
      runId: 'habitat-canonical:world:0:watch',
      createdAtMs: 1_788_225_600_000,
      controlRevision: 1,
    });
    expect(prepared.job.subjects).toEqual([{ kind: 'resident', id: prepared.actor }]);
    expect(prepared.job.maxOutputTokens).toBe(128);

    const intent = decodeCognition(prepared.actor, {
      verb: 'rest',
      room: null,
      target: null,
    });
    expect(intent).toEqual({ actor: prepared.actor, verb: 'rest' });
    expect(decodeCognition(prepared.actor, {
      actor: 'Y', verb: 'rest', room: null, target: null,
    })).toBeUndefined();

    const beforeDay = state.day;
    const beforeWatch = state.watch;
    advanceWorldWatch(state, intent);
    expect(state.day).toBe(beforeDay);
    expect(state.watch).toBe(beforeWatch + 1);
    expect(state.bodies[prepared.actor].thoughtOn).toBe(beforeDay);
  });

  it('places recent immutable history in working memory without changing the output authority', () => {
    const prepared = prepareCognition({
      state: createGenesisWorld(),
      worldRevision: 7,
      habitatId: 'habitat-canonical',
      runId: 'habitat-canonical:world:7:watch',
      createdAtMs: 1_788_225_600_000,
      controlRevision: 2,
      recentHistory: [{
        day: 99,
        watch: 4,
        minute: 1_390,
        room: 'common',
        who: ['A', 'E'],
        text: 'A promise was recorded and left unresolved.',
        kind: 'meeting',
      }],
    });
    const prompt = JSON.parse(prepared.job.prompt.user) as {
      recentHistory: Array<Record<string, unknown>>;
    };
    expect(prompt.recentHistory).toEqual([{
      day: 99,
      watch: 4,
      minute: 1_390,
      room: 'common',
      people: ['A', 'E'],
      text: 'A promise was recorded and left unresolved.',
      kind: 'meeting',
    }]);
    expect(prepared.job.outputContract.jsonSchema).toMatchObject({
      required: ['verb', 'room', 'target'],
      additionalProperties: false,
    });
  });
});
