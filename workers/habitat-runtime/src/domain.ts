import { z } from 'zod';
import { ROOM_BY_ID, ROOMS, type RoomId } from '../../../src/lib/habitat/rooms';
import {
  RESIDENT_BY_ID,
  RESIDENTS,
  type ResidentId,
} from '../../../src/lib/habitat/residents';
import {
  CONDITIONS,
  genesisState,
  snapshotFrom,
  type Happening,
  type WorldState,
} from '../../../src/lib/habitat/engine/state';
import { advanceScheduledWatch } from '../../../src/lib/habitat/engine/tick';
import {
  decodeIntentFor,
  VERB_NAMES,
  type Intent,
} from '../../../src/lib/habitat/engine/verbs';
import { AXES } from '../../../src/lib/habitat/weave';
import type { HabitatSnapshot } from '../../../src/lib/habitat/snapshot';
import {
  HABITAT_SCHEMA_VERSION,
  type CognitionJob,
  type JsonValue,
} from './contracts';

export const WORLD_CODEC_VERSION = 1 as const;

const RESIDENT_IDS = RESIDENTS.map((resident) => resident.id) as [
  ResidentId,
  ...ResidentId[],
];
const ROOM_IDS = ROOMS.map((room) => room.id) as [RoomId, ...RoomId[]];
const residentIdSchema = z.enum(RESIDENT_IDS);
const roomIdSchema = z.enum(ROOM_IDS);

const pointSchema = z.strictObject({
  x: z.number().int().nonnegative(),
  y: z.number().int().nonnegative(),
});

const conditionSchema = z.strictObject(Object.fromEntries(
  CONDITIONS.map((condition) => [condition, z.number().min(0).max(100)]),
) as Record<(typeof CONDITIONS)[number], z.ZodNumber>);

const axisSchema = z.strictObject(Object.fromEntries(
  AXES.map((axis) => [axis, z.number().min(0).max(100)]),
) as Record<(typeof AXES)[number], z.ZodNumber>);

const bodySchema = z.strictObject({
  id: residentIdSchema,
  room: roomIdSchema,
  at: pointSchema,
  condition: conditionSchema,
  cells: z.number().nonnegative().max(1_000_000),
  pressure: z.number().min(0).max(100),
  thoughtOn: z.number().int().nonnegative(),
  doing: z.string().min(1).max(240),
});

const happeningSchema = z.strictObject({
  day: z.number().int().nonnegative(),
  watch: z.number().int().min(1).max(4),
  minute: z.number().int().min(0).max(1439),
  room: roomIdSchema,
  who: z.array(residentIdSchema).min(1).max(25),
  text: z.string().min(1).max(2_000),
  kind: z.enum(['work', 'need', 'meeting', 'power', 'note']),
});

const storedWorldSchema = z.strictObject({
  seed: z.number().int(),
  day: z.number().int().nonnegative(),
  watch: z.number().int().min(1).max(4),
  bodies: z.record(residentIdSchema, bodySchema),
  rooms: z.record(roomIdSchema, z.strictObject({
    id: roomIdSchema,
    lit: z.boolean(),
  })),
  reactor: z.strictObject({ output: z.number().min(0).max(1) }),
  axes: z.array(z.tuple([z.string(), axisSchema])).length(RESIDENTS.length * (RESIDENTS.length - 1)),
  record: z.array(happeningSchema).max(256),
}).superRefine((world, context) => {
  const expected = new Set(
    RESIDENTS.flatMap((from) => RESIDENTS
      .filter((to) => to.id !== from.id)
      .map((to) => `${from.id}${to.id}`)),
  );
  const received = new Set(world.axes.map(([key]) => key));
  if (received.size !== expected.size || [...expected].some((key) => !received.has(key))) {
    context.addIssue({
      code: 'custom',
      path: ['axes'],
      message: 'the directed relationship matrix is incomplete',
    });
  }
});

const DECISION_JSON_SCHEMA = {
  type: 'object',
  properties: {
    verb: { type: 'string', enum: [...VERB_NAMES] },
    room: { anyOf: [{ type: 'string', enum: [...ROOM_IDS] }, { type: 'null' }] },
    target: { anyOf: [{ type: 'string', enum: [...RESIDENT_IDS] }, { type: 'null' }] },
  },
  required: ['verb', 'room', 'target'],
  additionalProperties: false,
} satisfies JsonValue;

export type PreparedCognition = {
  actor: ResidentId;
  job: CognitionJob;
};

export function serializeWorldState(state: WorldState): string {
  const stored = storedWorldSchema.parse({
    ...state,
    axes: [...state.axes.entries()].sort(([left], [right]) => left.localeCompare(right)),
  });
  return JSON.stringify(stored);
}

export function deserializeWorldState(serialized: string): WorldState {
  let raw: unknown;
  try {
    raw = JSON.parse(serialized);
  } catch {
    throw new RangeError('stored habitat world is not valid JSON');
  }
  const stored = storedWorldSchema.parse(raw);
  return {
    ...stored,
    bodies: stored.bodies as WorldState['bodies'],
    rooms: stored.rooms as WorldState['rooms'],
    axes: new Map(stored.axes) as WorldState['axes'],
  };
}

export function createGenesisWorld(): WorldState {
  return deserializeWorldState(serializeWorldState(genesisState(1)));
}

export function worldSnapshot(state: WorldState): HabitatSnapshot {
  return snapshotFrom(state);
}

export function advanceWorldWatch(state: WorldState, cognition?: Intent): WorldState {
  return advanceScheduledWatch(state, cognition);
}

export function decodeCognition(actor: ResidentId, payload: unknown): Intent | undefined {
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) return undefined;
  const candidate = { ...(payload as Record<string, unknown>) };
  if (candidate.room === null) delete candidate.room;
  if (candidate.target === null) delete candidate.target;
  const decoded = decodeIntentFor(actor, candidate);
  return decoded.ok ? decoded.intent : undefined;
}

export function selectCognitionSubject(state: WorldState): ResidentId {
  return [...RESIDENTS]
    .sort((left, right) => {
      const pressure = state.bodies[right.id].pressure - state.bodies[left.id].pressure;
      if (pressure !== 0) return pressure;
      const timeWithoutThought = state.bodies[left.id].thoughtOn - state.bodies[right.id].thoughtOn;
      if (timeWithoutThought !== 0) return timeWithoutThought;
      return left.id.localeCompare(right.id);
    })[0]!.id;
}

export function prepareCognition(input: {
  state: WorldState;
  worldRevision: number;
  habitatId: string;
  runId: string;
  createdAtMs: number;
  controlRevision: number;
  recentHistory?: readonly Happening[];
}): PreparedCognition {
  const actor = selectCognitionSubject(input.state);
  const body = input.state.bodies[actor];
  const resident = RESIDENT_BY_ID[actor];
  const room = ROOM_BY_ID[body.room];
  const coLocated = RESIDENTS
    .filter((other) => other.id !== actor && input.state.bodies[other.id].room === body.room)
    .map((other) => ({
      id: other.id,
      name: other.name,
      doing: input.state.bodies[other.id].doing,
    }));
  const jobId = `${input.habitatId}:world:${input.worldRevision}:control:${input.controlRevision}:action`;

  return {
    actor,
    job: {
      schemaVersion: HABITAT_SCHEMA_VERSION,
      jobId,
      habitatId: input.habitatId,
      origin: { kind: 'alarm', runId: input.runId },
      cause: {
        worldRevision: input.worldRevision,
        simTime: {
          day: input.state.day,
          minute: (input.state.watch - 1) * 360,
        },
      },
      kind: 'resident_action',
      subjects: [{ kind: 'resident', id: actor }],
      pressure: body.pressure / 100,
      createdAtMs: input.createdAtMs,
      prompt: {
        system: [
          'Choose one immediate intention for one persistent resident of a closed habitat.',
          'Return only the JSON object required by the schema.',
          'You choose a verb and optional room or target; you never claim consequences.',
          'The deterministic world engine will validate location, resources, access and relationships.',
          'A refused intention is allowed and becomes part of the resident\'s pressure.',
          'Prefer a concrete action grounded in the supplied present state and personal history.',
        ].join(' '),
        user: JSON.stringify({
          time: { day: input.state.day, watch: input.state.watch },
          resident: {
            id: actor,
            name: resident.name,
            age: resident.age,
            formerWork: resident.was,
            duty: resident.duty,
            fears: resident.fears,
            wants: resident.wants,
            voice: resident.voice,
          },
          body: {
            room: body.room,
            conditions: body.condition,
            cells: Math.floor(body.cells),
            pressure: body.pressure,
            daysSinceThought: input.state.day - body.thoughtOn,
            doing: body.doing,
          },
          surroundings: {
            room: { id: room.id, name: room.name },
            connectedRooms: room.connects,
            peopleHere: coLocated,
          },
          recentHistory: (input.recentHistory ?? [])
            .slice(-8)
            .map((entry) => ({
              day: entry.day,
              watch: entry.watch,
              minute: entry.minute,
              room: entry.room,
              people: entry.who,
              text: entry.text,
              kind: entry.kind,
            })),
        }),
      },
      outputContract: {
        name: 'habitat_intent',
        version: 1,
        schemaHash: 'sha256:53d7e5e3e3baf8102d2d1f3e2fdd08d85818bb74f3b4e14e4c89f851eeaab40d',
        jsonSchema: DECISION_JSON_SCHEMA,
      },
      maxOutputTokens: 128,
    },
  };
}
