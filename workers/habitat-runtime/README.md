# Habitat cloud runtime

Cloudflare control plane and canonical scheduler for the Night Shift habitat. It
persists and advances the same deterministic domain world that the portfolio renders.

A new habitat starts **paused** with reason `awaiting-domain-engine`, so a deployment
cannot spend inference quota by itself. An authenticated resume command schedules
the first of four six-hour watches.

## Non-negotiable invariants

- One canonical habitat is one SQLite-backed Durable Object.
- Genesis and maximum population are both exactly **25**.
- Durable Object SQLite is the sole operational authority. D1 may later be a
  rebuildable public projection, never a second source of truth.
- A web visitor can only read health, status, the current snapshot and immutable
  archive days; no visitor path can enqueue, advance the clock or trigger inference.
- Provider order is closed: Workers AI, then Groq Free, then the deterministic
  routine policy. There is no third provider and no paid path.
- Models are compile-time and runtime allowlisted:
  `@cf/qwen/qwen3-30b-a3b-fp8` and `openai/gpt-oss-20b`.
- Local caps are below the advertised free allocations: 8,000 Workers AI neurons
  per UTC day and 150,000 Groq tokens / 200 Groq requests per UTC day.
- Quota is reserved before network I/O. An ambiguous timeout consumes the full
  reservation rather than risking an accidental overrun.
- The cron trigger is only a watchdog. The Durable Object owns its single alarm and
  its persisted generation.

On a Workers Free account, excess Durable Object operations fail rather than being
billed. The application also fails closed before provider I/O when its own caps are
reached. Do not enable Workers Paid, Groq Developer, AI Gateway Unified Billing, or
add any billing method for this runtime.

## What exists now

- A single `HabitatWorld` Durable Object using the current declarative `exports`
  lifecycle and SQLite storage.
- Versioned SQLite migrations, a validated `WorldState` codec (including all 600
  directed relationship edges), an append-only happenings archive with per-person
  indexes, causal watch runs, self-repair via hourly Cron, pause/resume commands,
  provider attempt audit, quota reservations, daily usage counters, and provider
  circuit breakers.
- One cognition opportunity per watch, assigned to the resident under greatest
  pressure. The model can return only a verb and optional room/target. Every intent
  still passes through the domain engine's `attempt()` authority. Its working
  memory includes the resident's eight most recent archived happenings.
- Strict JSON contracts. Groq uses native strict structured output; Qwen3 receives
  the same schema in its system prompt because that Workers AI model is not on
  Cloudflare's JSON-mode allowlist, and its response is still parsed and validated
  before the domain sees it.
- Workers AI primary adapter and direct Groq HTTP fallback. The encrypted key is a
  required Worker binding: it is available in memory to the Durable Object but
  never enters SQL, logs, source control or the public HTTP surface.
- Public status reports bounded provider-attempt diagnostics (never prompts,
  outputs, tokens or credentials) so free-tier failures can be audited remotely.
- Public lightweight status, health, snapshot and day-archive endpoints with CORS
  limited to `https://aleetreny.github.io`.
- A test suite running in the actual Workers runtime with Durable Object storage.

Operational wakeups and simulation time are separate persisted clocks. A retry or
hourly watchdog wake never creates an extra watch. If cognition is unavailable or
invalid, the same watch still advances deterministically; the society slows its
thinking before it ever spends money or freezes.

## Commands

From the repository root:

```sh
pnpm habitat:check
pnpm habitat:deploy:dry
pnpm habitat:deploy
```

For local development:

```sh
cp workers/habitat-runtime/.dev.vars.example workers/habitat-runtime/.dev.vars
pnpm habitat:dev
```

Never commit `.dev.vars`.

## Secrets

Production accepts two Worker secrets:

- `ADMIN_TOKEN`: required for every `/v1/admin/*` route.
- `GROQ_API_KEY`: optional at the code boundary. When absent, Groq fails closed and
  the watch uses the deterministic policy after Workers AI.

Both names are declared in Wrangler's `secrets.required`, so production deploys
fail before upload if either encrypted binding is missing. The runtime still keeps
the deterministic fallback as a last-resort safety net.

Set them without placing values in config or shell history:

```sh
cd workers/habitat-runtime
pnpm wrangler secret put ADMIN_TOKEN
pnpm wrangler secret put GROQ_API_KEY
```

On Alejandro's Mac, the generated production admin token is also stored in the
login Keychain under service `aleetreny-habitat-runtime-admin` and account
`alejandrotreny`. Retrieve it for an operator request without printing it:

```sh
runtime_admin_token="$(security find-generic-password \
  -a alejandrotreny -s aleetreny-habitat-runtime-admin -w)"
```

The Groq key should belong to a separate Free project with only
`openai/gpt-oss-20b` allowed. A real inference smoke test is manual only and must
never run in CI.

The provisioned Groq project is `habitat-prod`. It is on the **Free ($0)** plan,
allows only `openai/gpt-oss-20b`, and has project limits of 10 requests/minute,
200 requests/day, 6,000 tokens/minute and 150,000 tokens/day. No API key is stored
in this repository.

## Provisioned Cloudflare runtime

- Worker: `aleetreny-habitat-runtime`
- URL: `https://aleetreny-habitat-runtime.alejandrotreny100.workers.dev`
- Workers plan: **Free ($0)**
- Cron watchdog: minute 7 of every hour
- Production secrets installed: `ADMIN_TOKEN` and `GROQ_API_KEY`

The production admin token is present as a Worker secret and in macOS Keychain.
The Groq key exists only in Groq and Cloudflare's encrypted secret store.

## HTTP surface

Public:

- `GET /health`
- `GET /v1/status`
- `GET /v1/snapshot`
- `GET /v1/archive?day=100` (optional `room` and `person` filters)

Bearer-authenticated administration:

- `POST /v1/admin/pause`
- `POST /v1/admin/resume`
- `POST /v1/admin/cognition/enqueue`

Pause/resume body:

```json
{
  "commandId": "a-stable-idempotency-key",
  "issuedAtMs": 1788210000000,
  "expectedControlRevision": 0,
  "reason": "optional operator note"
}
```

Do not put the admin token in frontend code. These endpoints are for an operator or
a trusted deployment job, not the portfolio browser.

## Domain boundary

`src/domain.ts` is the only Cloudflare adapter around `src/lib/habitat`. It encodes
the `Map`-backed world into validated JSON, freezes each cognition job against a
world/control revision, and converts a structured model decision into an `Intent`.
The model never supplies the actor and never writes consequences. A world update,
job disposition and causal watch commit happen in one synchronous SQLite
transaction, so a retry can neither apply the same thought twice nor skip the
deterministic fallback.
