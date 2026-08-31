import { env, exports } from 'cloudflare:workers';
import { runDurableObjectAlarm, runInDurableObject } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';
import { parseRuntimeConfig } from '../src/contracts';
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
      habitatId: 'habitat-canonical',
      residentCapacity: 25,
      mode: 'paused',
      pauseReason: 'awaiting-domain-engine',
    });
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

  it('runs an operational alarm without inventing a world tick or cognition', async () => {
    const stub = env.HABITAT_WORLD.getByName('alarm-no-domain-engine-test');
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
    expect(status.lastRun?.runId).toContain('habitat-canonical:alarm:');
    expect(status.queue.counts).toEqual({});
    await stub.pause({ commandId: 'pause-alarm-test', issuedAtMs: Date.now() });
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
