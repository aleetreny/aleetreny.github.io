import { DurableObject } from 'cloudflare:workers';
import {
  adminCommandSchema,
  cognitionJobSchema,
  MAX_RESIDENTS,
  parseRuntimeConfig,
  type CognitionJob,
  type ProviderAttemptResult,
  type RuntimeConfig,
} from './contracts';
import { SqlQuotaLedger } from './quota';
import { routeCognition } from './providers/router';
import type { WorkersAIRunner } from './providers/workers-ai';

type RuntimeRow = {
  mode: 'running' | 'paused';
  pause_reason: string | null;
  resident_capacity: number;
  world_revision: number;
  control_revision: number;
  sim_day: number;
  sim_minute: number;
  alarm_generation: number;
  next_alarm_at_ms: number | null;
  next_alarm_reason: string | null;
  last_committed_run_id: string | null;
  last_committed_at_ms: number | null;
  last_error_code: string | null;
};

type JobRow = {
  job_id: string;
  envelope_json: string;
  attempts: number;
};

type CommandResult = {
  commandId: string;
  kind: 'pause' | 'resume';
  applied: boolean;
  mode: 'running' | 'paused';
  controlRevision: number;
};

export class HabitatWorld extends DurableObject<Env> {
  private readonly state: DurableObjectState;
  private readonly sql: SqlStorage;
  private readonly runtimeEnv: Env;
  private readonly config: RuntimeConfig;

  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
    this.state = state;
    this.sql = state.storage.sql;
    this.runtimeEnv = env;
    this.config = parseRuntimeConfig(env);
    this.ensureSchema();
  }

  async getStatus(): Promise<Record<string, unknown>> {
    const runtime = this.runtime();
    const queueRows = this.sql.exec<{ status: string; count: number }>(
      'SELECT status, COUNT(*) AS count FROM cognition_jobs GROUP BY status ORDER BY status',
    ).toArray();
    const oldest = firstRow(this.sql.exec<{ oldest_due_at_ms: number | null }>(
      `SELECT MIN(due_at_ms) AS oldest_due_at_ms
         FROM cognition_jobs WHERE status IN ('pending', 'deferred')`,
    ));
    const alarm = await this.state.storage.getAlarm();
    const healthy = runtime.mode === 'paused'
      || (runtime.next_alarm_at_ms !== null && alarm !== null);

    return {
      schemaVersion: 1,
      habitatId: this.config.HABITAT_ID,
      residentCapacity: runtime.resident_capacity,
      mode: runtime.mode,
      pauseReason: runtime.pause_reason,
      health: healthy ? 'healthy' : 'degraded',
      worldRevision: runtime.world_revision,
      controlRevision: runtime.control_revision,
      simTime: { day: runtime.sim_day, minute: runtime.sim_minute },
      lastRun: runtime.last_committed_run_id === null ? null : {
        runId: runtime.last_committed_run_id,
        committedAtMs: runtime.last_committed_at_ms,
      },
      nextWake: runtime.next_alarm_at_ms === null ? null : {
        generation: runtime.alarm_generation,
        dueAtMs: runtime.next_alarm_at_ms,
        reason: runtime.next_alarm_reason,
        installedAtMs: alarm,
      },
      queue: {
        counts: Object.fromEntries(queueRows.map((row) => [row.status, row.count])),
        oldestDueAtMs: oldest?.oldest_due_at_ms ?? null,
      },
      providers: new SqlQuotaLedger(this.sql, this.config).snapshot(Date.now()),
      lastErrorCode: runtime.last_error_code,
    };
  }

  async pause(value: unknown): Promise<CommandResult> {
    const command = adminCommandSchema.parse(value);
    const replay = this.commandReplay(command.commandId, 'pause');
    if (replay) return replay;

    const runtime = this.runtime();
    this.assertControlRevision(runtime, command.expectedControlRevision);
    const applied = runtime.mode !== 'paused';
    const revision = applied ? runtime.control_revision + 1 : runtime.control_revision;
    const result: CommandResult = {
      commandId: command.commandId,
      kind: 'pause',
      applied,
      mode: 'paused',
      controlRevision: revision,
    };

    this.state.storage.transactionSync(() => {
      if (applied) {
        this.sql.exec(
          `UPDATE runtime_meta SET mode = 'paused', pause_reason = ?,
             control_revision = ?, next_alarm_at_ms = NULL, next_alarm_reason = NULL
           WHERE singleton = 1`,
          command.reason ?? 'administrative pause',
          revision,
        );
        this.appendEvent('runtime.paused', command.issuedAtMs, {
          commandId: command.commandId,
          reason: command.reason ?? null,
        });
      }
      this.saveCommand(command.commandId, 'pause', command.issuedAtMs, result);
    });
    await this.state.storage.deleteAlarm();
    return result;
  }

  async resume(value: unknown): Promise<CommandResult> {
    const command = adminCommandSchema.parse(value);
    const replay = this.commandReplay(command.commandId, 'resume');
    if (replay) return replay;

    const runtime = this.runtime();
    this.assertControlRevision(runtime, command.expectedControlRevision);
    const applied = runtime.mode !== 'running';
    const revision = applied ? runtime.control_revision + 1 : runtime.control_revision;
    const result: CommandResult = {
      commandId: command.commandId,
      kind: 'resume',
      applied,
      mode: 'running',
      controlRevision: revision,
    };

    this.state.storage.transactionSync(() => {
      if (applied) {
        this.sql.exec(
          `UPDATE runtime_meta SET mode = 'running', pause_reason = NULL,
             control_revision = ? WHERE singleton = 1`,
          revision,
        );
        this.appendEvent('runtime.resumed', command.issuedAtMs, {
          commandId: command.commandId,
        });
      }
      this.saveCommand(command.commandId, 'resume', command.issuedAtMs, result);
    });
    if (applied) {
      await this.scheduleWake(Date.now(), 'resume');
    } else if ((await this.state.storage.getAlarm()) === null) {
      await this.reconcile();
    }
    return result;
  }

  enqueueCognition(value: unknown): { accepted: boolean; jobId: string } {
    const job = cognitionJobSchema.parse(value);
    if (job.habitatId !== this.config.HABITAT_ID) {
      throw new TypeError('job habitatId does not match this runtime');
    }
    const cursor = this.sql.exec(
      `INSERT OR IGNORE INTO cognition_jobs (
         job_id, envelope_json, status, pressure, created_at_ms, due_at_ms, attempts
       ) VALUES (?, ?, 'pending', ?, ?, ?, 0)`,
      job.jobId,
      JSON.stringify(job),
      job.pressure,
      job.createdAtMs,
      job.createdAtMs,
    );
    return { accepted: cursor.rowsWritten > 0, jobId: job.jobId };
  }

  async reconcile(): Promise<{ mode: string; repaired: boolean; dueAtMs: number | null }> {
    const runtime = this.runtime();
    if (runtime.mode === 'paused') {
      const alarm = await this.state.storage.getAlarm();
      if (alarm !== null) await this.state.storage.deleteAlarm();
      return { mode: runtime.mode, repaired: alarm !== null, dueAtMs: null };
    }

    const installed = await this.state.storage.getAlarm();
    if (runtime.next_alarm_at_ms === null) {
      const dueAtMs = await this.scheduleWake(Date.now(), 'clock');
      return { mode: runtime.mode, repaired: true, dueAtMs };
    }
    if (installed === null) {
      await this.state.storage.setAlarm(Math.max(Date.now(), runtime.next_alarm_at_ms));
      return { mode: runtime.mode, repaired: true, dueAtMs: runtime.next_alarm_at_ms };
    }
    return { mode: runtime.mode, repaired: false, dueAtMs: runtime.next_alarm_at_ms };
  }

  async alarm(): Promise<void> {
    const nowMs = Date.now();
    try {
      const runtime = this.runtime();
      if (runtime.mode === 'paused') {
        this.sql.exec(
          'UPDATE runtime_meta SET next_alarm_at_ms = NULL, next_alarm_reason = NULL WHERE singleton = 1',
        );
        return;
      }

      const runId = `${this.config.HABITAT_ID}:alarm:${runtime.alarm_generation}`;
      const existing = firstRow(this.sql.exec<{ phase: string }>(
        'SELECT phase FROM alarm_runs WHERE run_id = ?',
        runId,
      ));
      if (!existing || existing.phase === 'claimed') {
        this.state.storage.transactionSync(() => {
          this.sql.exec(
            `INSERT INTO alarm_runs (run_id, generation, phase, received_at_ms)
             VALUES (?, ?, 'claimed', ?)
             ON CONFLICT(run_id) DO NOTHING`,
            runId,
            runtime.alarm_generation,
            nowMs,
          );
          this.sql.exec(
            `UPDATE alarm_runs SET phase = 'tick-committed', tick_committed_at_ms = ?
             WHERE run_id = ? AND phase = 'claimed'`,
            nowMs,
            runId,
          );
          this.sql.exec(
            `UPDATE runtime_meta SET last_committed_run_id = ?, last_committed_at_ms = ?,
               next_alarm_at_ms = NULL, next_alarm_reason = NULL, last_error_code = NULL
             WHERE singleton = 1`,
            runId,
            nowMs,
          );
        });
      }

      await this.processDueCognition(nowMs);
      this.sql.exec(
        `UPDATE alarm_runs SET phase = 'completed', completed_at_ms = ? WHERE run_id = ?`,
        Date.now(),
        runId,
      );
      await this.scheduleWake(this.nextDueAt(Date.now()), 'clock');
    } catch (error) {
      const code = safeErrorCode(error);
      this.sql.exec(
        'UPDATE runtime_meta SET last_error_code = ? WHERE singleton = 1',
        code,
      );
      await this.scheduleWake(Date.now() + 15 * 60 * 1_000, 'retry');
    }
  }

  private async processDueCognition(nowMs: number): Promise<void> {
    // A crash after claiming a job must not strand it in `running` forever.
    this.sql.exec(
      `UPDATE cognition_jobs SET status = 'deferred', due_at_ms = ?,
         lease_expires_at_ms = NULL, error_code = 'lease_expired'
       WHERE status = 'running' AND lease_expires_at_ms <= ?`,
      nowMs,
      nowMs,
    );
    const jobs = this.sql.exec<JobRow>(
      `SELECT job_id, envelope_json, attempts FROM cognition_jobs
       WHERE status IN ('pending', 'deferred') AND due_at_ms <= ?
       ORDER BY pressure DESC, created_at_ms ASC
       LIMIT ?`,
      nowMs,
      this.config.MAX_COGNITIONS_PER_ALARM,
    ).toArray();

    for (const row of jobs) {
      if (this.runtime().mode === 'paused') break;
      const attemptOrdinal = row.attempts + 1;
      this.sql.exec(
        `UPDATE cognition_jobs SET status = 'running', attempts = ?, lease_expires_at_ms = ?
         WHERE job_id = ? AND status IN ('pending', 'deferred')`,
        attemptOrdinal,
        nowMs + 5 * 60 * 1_000,
        row.job_id,
      );

      let job: CognitionJob;
      try {
        job = cognitionJobSchema.parse(JSON.parse(row.envelope_json));
      } catch {
        this.sql.exec(
          `UPDATE cognition_jobs SET status = 'dead', error_code = 'invalid_envelope',
             lease_expires_at_ms = NULL WHERE job_id = ?`,
          row.job_id,
        );
        continue;
      }

      const quota = new SqlQuotaLedger(this.sql, this.config);
      const groqApiKey = readSecret(this.runtimeEnv, 'GROQ_API_KEY');
      const result = await routeCognition({
        ai: this.runtimeEnv.AI as unknown as WorkersAIRunner,
        ...(groqApiKey ? { groqApiKey } : {}),
        config: this.config,
        job,
        attemptOrdinal,
        quota,
      });
      this.persistRouterResult(row.job_id, result, nowMs);
    }
  }

  private persistRouterResult(
    jobId: string,
    result: Awaited<ReturnType<typeof routeCognition>>,
    nowMs: number,
  ): void {
    if (result.status === 'completed') {
      this.sql.exec(
        `UPDATE cognition_jobs SET status = 'resolved', provider = ?, model = ?,
           output_json = ?, resolved_at_ms = ?, lease_expires_at_ms = NULL,
           error_code = NULL WHERE job_id = ?`,
        result.result.provider,
        result.result.model,
        JSON.stringify(result.result.payload),
        nowMs,
        jobId,
      );
      this.saveAttempt(result.result, nowMs);
      return;
    }

    for (const reason of result.reasons) this.saveAttempt(reason, nowMs);
    if (result.status === 'deferred') {
      this.sql.exec(
        `UPDATE cognition_jobs SET status = 'deferred', due_at_ms = ?,
           lease_expires_at_ms = NULL, error_code = 'providers_deferred' WHERE job_id = ?`,
        result.retryAtMs,
        jobId,
      );
      return;
    }
    this.sql.exec(
      `UPDATE cognition_jobs SET status = 'dead', lease_expires_at_ms = NULL,
         error_code = 'providers_rejected' WHERE job_id = ?`,
      jobId,
    );
  }

  private saveAttempt(result: ProviderAttemptResult, nowMs: number): void {
    this.sql.exec(
      `INSERT OR REPLACE INTO provider_attempts (
         attempt_id, provider, model, ok, kind, retryable, retry_at_ms,
         detail_code, latency_ms, recorded_at_ms
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      result.attemptId,
      result.provider,
      result.model,
      result.ok ? 1 : 0,
      result.ok ? null : result.kind,
      result.ok ? 0 : result.retryable ? 1 : 0,
      result.ok ? null : result.retryAtMs ?? null,
      result.ok ? null : result.detailCode ?? null,
      result.latencyMs,
      nowMs,
    );
  }

  private nextDueAt(nowMs: number): number {
    const queued = firstRow(this.sql.exec<{ due_at_ms: number | null }>(
      `SELECT MIN(due_at_ms) AS due_at_ms FROM cognition_jobs
       WHERE status IN ('pending', 'deferred')`,
    ));
    const clockDue = nowMs + this.config.TICK_INTERVAL_MS;
    return queued?.due_at_ms === null || queued?.due_at_ms === undefined
      ? clockDue
      : Math.min(clockDue, Math.max(nowMs + 1_000, queued.due_at_ms));
  }

  private async scheduleWake(dueAtMs: number, reason: 'clock' | 'retry' | 'resume'): Promise<number> {
    const runtime = this.runtime();
    if (runtime.mode === 'paused') return dueAtMs;
    const generation = runtime.alarm_generation + 1;
    this.sql.exec(
      `UPDATE runtime_meta SET alarm_generation = ?, next_alarm_at_ms = ?,
         next_alarm_reason = ? WHERE singleton = 1`,
      generation,
      dueAtMs,
      reason,
    );
    await this.state.storage.setAlarm(dueAtMs);
    return dueAtMs;
  }

  private runtime(): RuntimeRow {
    return this.sql.exec<RuntimeRow>('SELECT * FROM runtime_meta WHERE singleton = 1').one();
  }

  private assertControlRevision(runtime: RuntimeRow, expected?: number): void {
    if (expected !== undefined && expected !== runtime.control_revision) {
      throw new RangeError('control revision conflict');
    }
  }

  private commandReplay(commandId: string, kind: 'pause' | 'resume'): CommandResult | undefined {
    const row = firstRow(this.sql.exec<{ kind: string; response_json: string }>(
      'SELECT kind, response_json FROM admin_commands WHERE command_id = ?',
      commandId,
    ));
    if (!row) return undefined;
    if (row.kind !== kind) throw new TypeError('commandId was already used for another command');
    return JSON.parse(row.response_json) as CommandResult;
  }

  private saveCommand(
    commandId: string,
    kind: 'pause' | 'resume',
    issuedAtMs: number,
    result: CommandResult,
  ): void {
    this.sql.exec(
      `INSERT INTO admin_commands (command_id, kind, issued_at_ms, response_json)
       VALUES (?, ?, ?, ?)`,
      commandId,
      kind,
      issuedAtMs,
      JSON.stringify(result),
    );
  }

  private appendEvent(type: string, occurredAtMs: number, detail: Record<string, unknown>): void {
    this.sql.exec(
      'INSERT INTO runtime_events (type, occurred_at_ms, detail_json) VALUES (?, ?, ?)',
      type,
      occurredAtMs,
      JSON.stringify(detail),
    );
  }

  private ensureSchema(): void {
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS _sql_schema_migrations (
        version INTEGER PRIMARY KEY,
        applied_at_ms INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS runtime_meta (
        singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
        mode TEXT NOT NULL CHECK (mode IN ('running', 'paused')),
        pause_reason TEXT,
        resident_capacity INTEGER NOT NULL CHECK (resident_capacity = 25),
        world_revision INTEGER NOT NULL,
        control_revision INTEGER NOT NULL,
        sim_day INTEGER NOT NULL,
        sim_minute INTEGER NOT NULL,
        alarm_generation INTEGER NOT NULL,
        next_alarm_at_ms INTEGER,
        next_alarm_reason TEXT,
        last_committed_run_id TEXT,
        last_committed_at_ms INTEGER,
        last_error_code TEXT
      );
      CREATE TABLE IF NOT EXISTS alarm_runs (
        run_id TEXT PRIMARY KEY,
        generation INTEGER NOT NULL UNIQUE,
        phase TEXT NOT NULL CHECK (phase IN ('claimed', 'tick-committed', 'completed', 'failed')),
        received_at_ms INTEGER NOT NULL,
        tick_committed_at_ms INTEGER,
        completed_at_ms INTEGER,
        error_code TEXT
      );
      CREATE TABLE IF NOT EXISTS cognition_jobs (
        job_id TEXT PRIMARY KEY,
        envelope_json TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'deferred', 'resolved', 'applied', 'dead')),
        pressure REAL NOT NULL,
        created_at_ms INTEGER NOT NULL,
        due_at_ms INTEGER NOT NULL,
        attempts INTEGER NOT NULL,
        lease_expires_at_ms INTEGER,
        provider TEXT,
        model TEXT,
        output_json TEXT,
        resolved_at_ms INTEGER,
        error_code TEXT
      );
      CREATE INDEX IF NOT EXISTS cognition_due_idx
        ON cognition_jobs(status, due_at_ms, pressure DESC);
      CREATE TABLE IF NOT EXISTS provider_attempts (
        attempt_id TEXT PRIMARY KEY,
        provider TEXT NOT NULL,
        model TEXT NOT NULL,
        ok INTEGER NOT NULL,
        kind TEXT,
        retryable INTEGER NOT NULL,
        retry_at_ms INTEGER,
        detail_code TEXT,
        latency_ms INTEGER NOT NULL,
        recorded_at_ms INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS provider_usage_daily (
        day TEXT NOT NULL,
        provider TEXT NOT NULL,
        requests INTEGER NOT NULL,
        input_tokens INTEGER NOT NULL,
        output_tokens INTEGER NOT NULL,
        neurons INTEGER NOT NULL,
        actual_requests INTEGER NOT NULL,
        actual_input_tokens INTEGER NOT NULL,
        actual_output_tokens INTEGER NOT NULL,
        actual_neurons INTEGER NOT NULL,
        PRIMARY KEY (day, provider)
      );
      CREATE TABLE IF NOT EXISTS quota_reservations (
        reservation_id TEXT PRIMARY KEY,
        provider TEXT NOT NULL,
        day TEXT NOT NULL,
        state TEXT NOT NULL CHECK (state IN ('reserved', 'dispatched', 'settled')),
        max_requests INTEGER NOT NULL,
        max_input_tokens INTEGER NOT NULL,
        max_output_tokens INTEGER NOT NULL,
        max_neurons INTEGER NOT NULL,
        actual_requests INTEGER,
        actual_input_tokens INTEGER,
        actual_output_tokens INTEGER,
        actual_neurons INTEGER,
        created_at_ms INTEGER NOT NULL,
        dispatched_at_ms INTEGER,
        settled_at_ms INTEGER
      );
      CREATE TABLE IF NOT EXISTS provider_breakers (
        provider TEXT PRIMARY KEY,
        open_until_ms INTEGER NOT NULL,
        reason TEXT,
        failure_streak INTEGER NOT NULL,
        updated_at_ms INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS admin_commands (
        command_id TEXT PRIMARY KEY,
        kind TEXT NOT NULL,
        issued_at_ms INTEGER NOT NULL,
        response_json TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS runtime_events (
        sequence INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        occurred_at_ms INTEGER NOT NULL,
        detail_json TEXT NOT NULL
      );
      INSERT OR IGNORE INTO runtime_meta (
        singleton, mode, pause_reason, resident_capacity, world_revision,
        control_revision, sim_day, sim_minute, alarm_generation
      ) VALUES (1, 'paused', 'awaiting-domain-engine', ${MAX_RESIDENTS}, 0, 0, 100, 0, 0);
      INSERT OR IGNORE INTO _sql_schema_migrations (version, applied_at_ms)
        VALUES (1, ${Date.now()});
    `);
  }
}

function firstRow<T extends Record<string, SqlStorageValue>>(
  cursor: SqlStorageCursor<T>,
): T | undefined {
  return cursor.toArray()[0];
}

function readSecret(env: Env, key: 'GROQ_API_KEY' | 'ADMIN_TOKEN'): string | undefined {
  const value = (env as unknown as Record<string, unknown>)[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function safeErrorCode(error: unknown): string {
  if (error instanceof Error) return error.name.slice(0, 80);
  return 'unknown_error';
}

export function adminSecret(env: Env): string | undefined {
  return readSecret(env, 'ADMIN_TOKEN');
}
