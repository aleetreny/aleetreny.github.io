// The public edge of the habitat.
//
// A network response is untrusted even when it came from our own Worker. Keep
// that uncertainty here so every component beyond this file continues to read a
// complete HabitatSnapshot, exactly as it did when Genesis was the only source.

import { ROOM_BY_ID, ROOMS, type RoomId } from './rooms';
import { RESIDENTS, type ResidentId } from './residents';
import { isWalkable } from './grid';
import type {
  HabitatSnapshot,
  PersonState,
  RecordEntry,
  RoomState,
} from './snapshot';

const ROOM_IDS: ReadonlySet<string> = new Set(ROOMS.map((room) => room.id));
const RESIDENT_IDS: ReadonlySet<string> = new Set(RESIDENTS.map((resident) => resident.id));

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactly(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value);
  return actual.length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

function isRoomId(value: unknown): value is RoomId {
  return typeof value === 'string' && ROOM_IDS.has(value);
}

function isResidentId(value: unknown): value is ResidentId {
  return typeof value === 'string' && RESIDENT_IDS.has(value);
}

function hasUniqueKnownIds(values: readonly unknown[], known: ReadonlySet<string>): boolean {
  return values.every((value) => typeof value === 'string' && known.has(value))
    && new Set(values).size === values.length;
}

function isRoomState(value: unknown): value is RoomState {
  if (!isObject(value) || !hasExactly(value, ['id', 'occupants', 'lit'])) return false;
  return isRoomId(value.id)
    && Array.isArray(value.occupants)
    && hasUniqueKnownIds(value.occupants, RESIDENT_IDS)
    && typeof value.lit === 'boolean';
}

function isPersonState(value: unknown): value is PersonState {
  if (!isObject(value) || !hasExactly(value, ['id', 'room', 'at', 'doing'])) return false;
  if (!isResidentId(value.id) || !isRoomId(value.room) || typeof value.doing !== 'string') {
    return false;
  }
  if (value.doing.trim().length === 0 || !isObject(value.at) || !hasExactly(value.at, ['x', 'y'])) {
    return false;
  }
  const { x, y } = value.at;
  if (!Number.isInteger(x) || !Number.isInteger(y) || (x as number) < 0 || (y as number) < 0) {
    return false;
  }
  const room = ROOM_BY_ID[value.room];
  return isWalkable(room.grid, room.legend, x as number, y as number);
}

function isRecordEntry(value: unknown): value is RecordEntry {
  if (!isObject(value) || !hasExactly(value, ['minute', 'room', 'who', 'text'])) return false;
  return Number.isInteger(value.minute)
    && (value.minute as number) >= 0
    && (value.minute as number) < 24 * 60
    && isRoomId(value.room)
    && Array.isArray(value.who)
    && hasUniqueKnownIds(value.who, RESIDENT_IDS)
    && typeof value.text === 'string'
    && value.text.trim().length > 0;
}

function sameMembers(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value) => right.includes(value));
}

/** Accept only a complete, internally coherent snapshot of the canonical world. */
export function isHabitatSnapshot(value: unknown): value is HabitatSnapshot {
  if (!isObject(value) || !hasExactly(value, ['day', 'watch', 'power', 'rooms', 'people', 'record'])) {
    return false;
  }
  if (!Number.isInteger(value.day) || (value.day as number) < 0) return false;
  if (value.watch !== 1 && value.watch !== 2 && value.watch !== 3 && value.watch !== 4) return false;
  if (typeof value.power !== 'number' || !Number.isFinite(value.power)
    || value.power < 0 || value.power > 1) return false;
  if (!Array.isArray(value.rooms) || value.rooms.length !== ROOMS.length
    || !value.rooms.every(isRoomState)) return false;
  if (!Array.isArray(value.people) || value.people.length !== RESIDENTS.length
    || !value.people.every(isPersonState)) return false;
  if (!Array.isArray(value.record) || !value.record.every(isRecordEntry)) return false;

  const snapshot = value as unknown as HabitatSnapshot;
  if (!hasUniqueKnownIds(snapshot.rooms.map((room) => room.id), ROOM_IDS)) return false;
  if (!hasUniqueKnownIds(snapshot.people.map((person) => person.id), RESIDENT_IDS)) return false;
  const occupied = snapshot.people.map((person) => (
    `${person.room}:${person.at.x}:${person.at.y}`
  ));
  if (new Set(occupied).size !== occupied.length) return false;

  for (const room of snapshot.rooms) {
    const present = snapshot.people
      .filter((person) => person.room === room.id)
      .map((person) => person.id);
    if (!sameMembers(room.occupants, present)) return false;
  }
  for (let index = 1; index < snapshot.record.length; index += 1) {
    if (snapshot.record[index]!.minute < snapshot.record[index - 1]!.minute) return false;
  }
  return true;
}

export type HabitatFetchOptions = {
  signal?: AbortSignal;
  fetcher?: typeof fetch;
};

/** Fetch once. A failure is represented as null so the caller can keep Genesis. */
export async function fetchHabitatSnapshot(
  runtimeUrl: string,
  options: HabitatFetchOptions = {},
): Promise<HabitatSnapshot | null> {
  if (!runtimeUrl) return null;

  try {
    const endpoint = new URL('/v1/snapshot', runtimeUrl);
    const response = await (options.fetcher ?? fetch)(endpoint, {
      method: 'GET',
      headers: { accept: 'application/json' },
      credentials: 'omit',
      signal: options.signal,
    });
    if (!response.ok) return null;
    const value: unknown = await response.json();
    return isHabitatSnapshot(value) ? value : null;
  } catch {
    return null;
  }
}
