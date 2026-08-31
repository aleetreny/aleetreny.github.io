import { env, exports } from 'cloudflare:workers';
import { runDurableObjectAlarm, runInDurableObject } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';
import { parseRuntimeConfig } from '../src/contracts';
import { deserializeWorldState, prepareCognition } from '../src/domain';
import { HabitatWorld } from '../src/habitat-world';
import { SqlQuotaLedger } from '../src/quota';

describe('habitat runtime Worker', () => {
  it('serves a lightweight health endpoint', async () => {
    const response = await exports.default.fetch('https://habitat.test/health');
    expect(response.status).toBe(200);
    expect(response.headers.get('access-control-allow-origin')).toBe('https://aleetreny.github.io');
    await expect(response.json()).resolves.toMatchObject({ ok: true, service: 'habitat-runtime' });
  });

  it('initializes one paused, canonical habitat with exactly 25 residents of capacity', async () => {
    const response = await exports.default.fetch('https://habitat.test/v1/status');
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      schemaVersion: 3,
      habitatId: 'habitat-canonical',
      residentCapacity: 25,
      mode: 'paused',
      pauseReason: 'awaiting-domain-engine',
    });
  });

  it('serves a live snapshot as a read-only public projection', async () => {
    const before = await exports.default.fetch('https://habitat.test/v1/status');
    const beforeStatus = await before.json() as { worldRevision: number; lastRun: unknown };

    const response = await exports.default.fetch('https://habitat.test/v1/snapshot');
    expect(response.status).toBe(200);
    expect(response.headers.get('access-control-allow-origin')).toBe('https://aleetreny.github.io');
    expect(response.headers.get('cache-control')).toContain('stale-while-revalidate');
    expect(response.headers.get('etag')).toBe(`"habitat-${beforeStatus.worldRevision}"`);
    await expect(response.json()).resolves.toMatchObject({
      day: 100,
      watch: 1,
      people: expect.arrayContaining([expect.objectContaining({ id: 'A' })]),
      rooms: expect.arrayContaining([expect.objectContaining({ id: 'bridge' })]),
    });

    const after = await exports.default.fetch('https://habitat.test/v1/status');
    await expect(after.json()).resolves.toMatchObject({
      worldRevision: beforeStatus.worldRevision,
      lastRun: beforeStatus.lastRun,
    });
  });

  it('requires a day for immutable archive reads', async () => {
    const invalid = await exports.default.fetch('https://habitat.test/v1/archive');
    expect(invalid.status).toBe(400);

    const response = await exports.default.fetch('https://habitat.test/v1/archive?day=100');
    expect(response.status).toBe(200);
    expect(response.headers.get('access-control-allow-origin')).toBe('https://aleetreny.github.io');
    await expect(response.json()).resolves.toMatchObject({ day: 100, entries: [] });
  });

  it('does not expose admin operations without a configured secret', async () => {
    const response = await exports.default.fetch('https://habitat.test/v1/admin/resume', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ commandId: 'resume-test-0001', issuedAtMs: Date.now() }),
    });
    expect(response.status).toBe(503);
  });

  it('keeps pause and resume commands idempotent inside the Durable Object', async () => {
    const stub = env.HABITAT_WORLD.getByName('idempotency-test');
    const command = { commandId: 'resume-idempotency-test', issuedAtMs: Date.now() };
    const first = await stub.resume(command);
    const replay = await stub.resume(command);
    expect(replay).toEqual(first);
    expect(replay.applied).toBe(true);
    const firstStatus = await stub.getStatus() as unknown as {
      nextWake: { generation: number } | null;
    };

    const alreadyRunning = await stub.resume({
      commandId: 'resume-already-running-test',
      issuedAtMs: Date.now(),
    });
    expect(alreadyRunning).toMatchObject({
      applied: false,
      mode: 'running',
      controlRevision: first.controlRevision,
    });
    const secondStatus = await stub.getStatus() as unknown as {
      nextWake: { generation: number } | null;
    };
    expect(secondStatus.nextWake?.generation).toBe(firstStatus.nextWake?.generation);

    const paused = await stub.pause({ commandId: 'pause-idempotency-test', issuedAtMs: Date.now() });
    expect(paused.mode).toBe('paused');
    const status = await stub.getStatus() as unknown as { residentCapacity: number };
    expect(status.residentCapacity).toBe(25);
  });

  it('does not advance a watch when an operational alarm fires early', async () => {
    const stub = env.HABITAT_WORLD.getByName('alarm-before-watch-test');
    await stub.resume({ commandId: 'resume-alarm-test', issuedAtMs: Date.now() });
    await runInDurableObject(stub, async (_instance: HabitatWorld, state) => {
      await state.storage.setAlarm(Date.now() + 60_000);
    });
    expect(await runDurableObjectAlarm(stub)).toBe(true);

    const status = await stub.getStatus() as unknown as {
      worldRevision: number;
      lastRun: { runId: string } | null;
      queue: { counts: Record<string, number> };
    };
    expect(status.worldRevision).toBe(0);
    expect(status.lastRun).toBeNull();
    expect(status.queue.counts).toEqual({});
    await stub.pause({ commandId: 'pause-alarm-test', issuedAtMs: Date.now() });
  });

  it('waits for an active cognition lease instead of applying a premature fallback', async () => {
    const stub = env.HABITAT_WORLD.getByName('active-cognition-lease-test');
    const resumed = await stub.resume({
      commandId: 'resume-active-cognition-lease-test',
      issuedAtMs: Date.now(),
    });
    const leaseAtMs = Date.now() + 5 * 60_000;
    await runInDurableObject(stub, async (_instance: HabitatWorld, state) => {
      const sql = state.storage.sql;
      const stored = sql.exec<{ state_json: string }>(
        'SELECT state_json FROM world_state WHERE singleton = 1',
      ).one();
      const world = deserializeWorldState(stored.state_json);
      const runId = 'habitat-canonical:world:0:watch';
      const prepared = prepareCognition({
        state: world,
        worldRevision: 0,
        habitatId: 'habitat-canonical',
        runId,
        createdAtMs: Date.now(),
        controlRevision: resumed.controlRevision,
      });
      sql.exec(
        `INSERT INTO watch_runs (
           run_id, cause_world_revision, sim_day, sim_watch, control_revision,
           subject_id, cognition_job_id, phase, due_at_ms
         ) VALUES (?, 0, ?, ?, ?, ?, ?, 'claimed', 0)`,
        runId,
        world.day,
        world.watch,
        resumed.controlRevision,
        prepared.actor,
        prepared.job.jobId,
      );
      sql.exec(
        `INSERT INTO cognition_jobs (
           job_id, envelope_json, status, pressure, created_at_ms, due_at_ms,
           attempts, lease_expires_at_ms
         ) VALUES (?, ?, 'running', ?, ?, 0, 1, ?)`,
        prepared.job.jobId,
        JSON.stringify(prepared.job),
        prepared.job.pressure,
        prepared.job.createdAtMs,
        leaseAtMs,
      );
      sql.exec('UPDATE runtime_meta SET next_watch_at_ms = 0 WHERE singleton = 1');
      await state.storage.setAlarm(Date.now() + 60_000);
    });

    expect(await runDurableObjectAlarm(stub)).toBe(true);
    const status = await stub.getStatus() as unknown as {
      worldRevision: number;
      lastRun: unknown;
      nextWake: { dueAtMs: number; reason: string } | null;
      queue: { counts: Record<string, number> };
    };
    expect(status.worldRevision).toBe(0);
    expect(status.lastRun).toBeNull();
    expect(status.queue.counts.running).toBe(1);
    expect(status.nextWake).toMatchObject({ dueAtMs: leaseAtMs, reason: 'retry' });
    await stub.pause({
      commandId: 'pause-active-cognition-lease-test',
      issuedAtMs: Date.now(),
    });
  });

  it('advances exactly one watch with deterministic fallback when providers are unavailable', async () => {
    const stub = env.HABITAT_WORLD.getByName('alarm-domain-fallback-test');
    await stub.resume({ commandId: 'resume-domain-fallback-test', issuedAtMs: Date.now() });
    await runInDurableObject(stub, async (_instance: HabitatWorld, state) => {
      const nowMs = Date.now();
      state.storage.sql.exec(
        `INSERT INTO provider_breakers (
           provider, open_until_ms, reason, failure_streak, updated_at_ms
         ) VALUES ('workers-ai', ?, 'test', 1, ?)`,
        nowMs + 60_000,
        nowMs,
      );
      state.storage.sql.exec(
        'UPDATE runtime_meta SET next_watch_at_ms = ? WHERE singleton = 1',
        0,
      );
      await state.storage.setAlarm(nowMs + 60_000);
    });
    expect(await runDurableObjectAlarm(stub)).toBe(true);

    const status = await stub.getStatus() as unknown as {
      worldRevision: number;
      simTime: { day: number; minute: number };
      lastRun: { runId: string } | null;
      queue: { counts: Record<string, number> };
    };
    expect(status.worldRevision).toBe(1);
    expect(status.simTime).toEqual({ day: 100, minute: 360 });
    expect(status.lastRun?.runId).toBe('habitat-canonical:world:0:watch');
    expect(status.queue.counts.dead).toBe(1);
    const snapshot = await stub.getSnapshot();
    expect(snapshot.snapshot.people).toHaveLength(25);
    expect(snapshot.snapshot.rooms).toHaveLength(16);
    await stub.pause({ commandId: 'pause-domain-fallback-test', issuedAtMs: Date.now() });
  });

  it('archives every committed happening and keeps the new day record honest', async () => {
    const stub = env.HABITAT_WORLD.getByName('daily-archive-test');
    await stub.resume({ commandId: 'resume-daily-archive-test', issuedAtMs: Date.now() });

    for (let watch = 1; watch <= 4; watch += 1) {
      await runInDurableObject(stub, async (_instance: HabitatWorld, state) => {
        const nowMs = Date.now();
        state.storage.sql.exec(
          `INSERT OR REPLACE INTO provider_breakers (
             provider, open_until_ms, reason, failure_streak, updated_at_ms
           ) VALUES ('workers-ai', ?, 'test', 1, ?)`,
          nowMs + 60_000,
          nowMs,
        );
        state.storage.sql.exec(
          'UPDATE runtime_meta SET next_watch_at_ms = ? WHERE singleton = 1',
          0,
        );
        await state.storage.setAlarm(nowMs + 60_000);
      });
      expect(await runDurableObjectAlarm(stub)).toBe(true);
    }

    const snapshot = await stub.getSnapshot();
    expect(snapshot.snapshot).toMatchObject({ day: 101, watch: 1, record: [] });

    const archive = await stub.getArchive({ day: 100 }) as unknown as {
      day: number;
      entries: Array<{
        day: number;
        watch: number;
        minute: number;
        room: string;
        who: string[];
        text: string;
        kind: string;
      }>;
    };
    expect(archive.day).toBe(100);
    expect(archive.entries.length).toBeGreaterThan(0);
    expect(new Set(archive.entries.map((entry) => entry.watch))).toEqual(new Set([1, 2, 3, 4]));
    expect(archive.entries.every((entry) => entry.day === 100)).toBe(true);

    const person = archive.entries[0]!.who[0]!;
    const personal = await stub.getArchive({ day: 100, person }) as unknown as {
      entries: Array<{ who: string[] }>;
    };
    expect(personal.entries.length).toBeGreaterThan(0);
    expect(personal.entries.every((entry) => entry.who.includes(person))).toBe(true);
    await stub.pause({ commandId: 'pause-daily-archive-test', issuedAtMs: Date.now() });
  });

  it('reserves quota before dispatch and settles each reservation once', async () => {
    const stub = env.HABITAT_WORLD.getByName('quota-idempotency-test');
    await stub.getStatus();

    await runInDurableObject(stub, async (_instance: HabitatWorld, state) => {
      const ledger = new SqlQuotaLedger(state.storage.sql, parseRuntimeConfig(env));
      const maximum = { requests: 1, inputTokens: 100, outputTokens: 20, neurons: 3 };
      const nowMs = Date.now();
      expect(ledger.reserve('quota:test:1', 'workers-ai', maximum, nowMs)).toEqual({
        allowed: true,
      });
      expect(ledger.reserve('quota:test:1', 'workers-ai', maximum, nowMs)).toMatchObject({
        allowed: false,
        reason: 'duplicate',
      });

      ledger.markDispatched('quota:test:1', nowMs);
      ledger.settle('quota:test:1', { inputTokens: 90, outputTokens: 10, neurons: 2 }, nowMs);
      ledger.settle('quota:test:1', { inputTokens: 90, outputTokens: 10, neurons: 2 }, nowMs);
      const usage = state.storage.sql.exec<{
        requests: number;
        actual_requests: number;
        actual_neurons: number;
      }>(
        `SELECT requests, actual_requests, actual_neurons
         FROM provider_usage_daily WHERE provider = 'workers-ai'`,
      ).one();
      expect(usage).toEqual({ requests: 1, actual_requests: 1, actual_neurons: 2 });
    });
  });
});
