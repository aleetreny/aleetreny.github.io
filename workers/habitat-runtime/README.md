# Habitat cloud runtime

Cloudflare control plane for the canonical Night Shift habitat. It is deliberately
separate from the portfolio UI and from the domain simulation Claude is designing.

The runtime is production-shaped, but a new habitat starts **paused** with reason
`awaiting-domain-engine`. Deploying it cannot spend inference quota. Once the domain
engine emits immutable cognition jobs, an authenticated resume command enables the
hourly alarm loop.

## Non-negotiable invariants

- One canonical habitat is one SQLite-backed Durable Object.
- Genesis and maximum population are both exactly **25**.
- Durable Object SQLite is the sole operational authority. D1 may later be a
  rebuildable public projection, never a second source of truth.
- A web visitor can only read health/status; no visitor path can enqueue or trigger
  inference.
- Provider order is closed: Workers AI, then Groq Free, then defer. There is no
  third provider and no paid path.
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
- Idempotent alarm runs, self-repair via hourly Cron, pause/resume commands, an
  immutable cognition outbox, leases, provider attempt audit, quota reservations,
  daily usage counters, and provider circuit breakers.
- Strict JSON contracts and strict structured-output requests.
- Workers AI primary adapter and direct Groq HTTP fallback.
- Public lightweight status and health endpoints with CORS limited to
  `https://aleetreny.github.io`.
- A test suite running in the actual Workers runtime with Durable Object storage.

The alarm currently advances only the operational run ledger and drains explicitly
enqueued cognition. It does **not** invent world events or mutate Claude's domain
state. A successful cognition remains `resolved`, not `applied`, until the domain
adapter validates and applies its consequences.

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
- `GROQ_API_KEY`: optional. When absent, Groq fails closed and the job waits for
  Workers AI or is deferred.

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
- Production secrets currently expected: `ADMIN_TOKEN`; optional `GROQ_API_KEY`

The production admin token is present as a Worker secret and in macOS Keychain.
The deployed habitat remains paused, so provisioning and public status reads do
not invoke either model.

## HTTP surface

Public:

- `GET /health`
- `GET /v1/status`

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

## Domain-engine handoff

The future engine imports `CognitionJob` and `cognitionJobSchema` from
`src/contracts.ts`. It must:

1. Perform a deterministic world tick in the same Durable Object transaction.
2. Freeze each job's prompt, causal world revision, output schema, and `jobId`.
3. Enqueue only `origin.kind = "alarm"` jobs.
4. Validate a resolved payload against its versioned domain schema.
5. Apply consequences idempotently and mark the job `applied`.

No runtime file imports `src/lib/habitat`, so Claude can finish the product model
without merge pressure. Connect the two through an explicit adapter once those
types settle.
