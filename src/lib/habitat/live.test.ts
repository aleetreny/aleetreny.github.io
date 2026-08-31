import { describe, expect, it, vi } from 'vitest';
import { genesisSnapshot, type HabitatSnapshot } from './snapshot';
import { fetchHabitatSnapshot, isHabitatSnapshot } from './live';

function response(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function liveSnapshot(): HabitatSnapshot {
  return { ...genesisSnapshot(), day: 101, watch: 3 };
}

describe('the live habitat snapshot boundary', () => {
  it('accepts a complete canonical snapshot', () => {
    expect(isHabitatSnapshot(liveSnapshot())).toBe(true);
  });

  it('rejects envelopes, unknown residents and inconsistent room membership', () => {
    const live = liveSnapshot();
    expect(isHabitatSnapshot({ snapshot: live })).toBe(false);
    expect(isHabitatSnapshot({
      ...live,
      people: [{ ...live.people[0], id: 'Z' }, ...live.people.slice(1)],
    })).toBe(false);
    expect(isHabitatSnapshot({
      ...live,
      rooms: live.rooms.map((room) => room.id === 'common' ? { ...room, occupants: [] } : room),
    })).toBe(false);
    expect(isHabitatSnapshot({
      ...live,
      people: live.people.map((person, index) => (
        index === 1 ? { ...person, room: live.people[0]!.room, at: live.people[0]!.at } : person
      )),
    })).toBe(false);
  });

  it('does not touch the network when no public runtime was configured', async () => {
    const fetcher = vi.fn<typeof fetch>();
    await expect(fetchHabitatSnapshot('', { fetcher })).resolves.toBeNull();
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('loads the public snapshot once without credentials', async () => {
    const live = liveSnapshot();
    const fetcher = vi.fn<typeof fetch>(async () => response(live));
    const controller = new AbortController();

    await expect(fetchHabitatSnapshot('https://habitat.example/base', {
      fetcher,
      signal: controller.signal,
    })).resolves.toEqual(live);

    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, init] = fetcher.mock.calls[0]!;
    expect(String(url)).toBe('https://habitat.example/v1/snapshot');
    expect(init).toMatchObject({
      method: 'GET',
      credentials: 'omit',
      signal: controller.signal,
    });
  });

  it('returns null for HTTP, network, malformed JSON and invalid contract failures', async () => {
    const serverError = vi.fn<typeof fetch>(async () => response({ error: true }, 503));
    const offline = vi.fn<typeof fetch>(async () => { throw new TypeError('offline'); });
    const malformed = vi.fn<typeof fetch>(async () => new Response('{', { status: 200 }));
    const invalid = vi.fn<typeof fetch>(async () => response({ ...liveSnapshot(), people: [] }));

    await expect(fetchHabitatSnapshot('https://habitat.example', { fetcher: serverError }))
      .resolves.toBeNull();
    await expect(fetchHabitatSnapshot('https://habitat.example', { fetcher: offline }))
      .resolves.toBeNull();
    await expect(fetchHabitatSnapshot('https://habitat.example', { fetcher: malformed }))
      .resolves.toBeNull();
    await expect(fetchHabitatSnapshot('https://habitat.example', { fetcher: invalid }))
      .resolves.toBeNull();
  });

  it('turns an aborted request into a quiet fallback', async () => {
    const controller = new AbortController();
    const fetcher = vi.fn<typeof fetch>(async (_input, init) => {
      expect(init?.signal).toBe(controller.signal);
      controller.abort();
      throw new DOMException('aborted', 'AbortError');
    });

    await expect(fetchHabitatSnapshot('https://habitat.example', {
      fetcher,
      signal: controller.signal,
    })).resolves.toBeNull();
  });
});
