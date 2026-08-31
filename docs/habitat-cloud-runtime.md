# Habitat cloud-runtime handoff

The integrated implementation lives in `workers/habitat-runtime` and
`src/lib/habitat` on branch `codex/habitat-integrated`.

The Cloudflare layer owns scheduling, operational persistence, provider routing,
quotas, circuit breakers and admin controls. The domain layer owns every world
rule, intention, primitive action and canonical consequence. `src/domain.ts` is
the narrow adapter between them.

Important current behavior:

- population capacity is hard-coded and database-constrained to 25;
- a fresh deployment is paused and requires an authenticated resume;
- one six-hour watch is one causal SQLite transaction;
- each watch freezes at most one cognition job for the highest-pressure resident;
- structured output supplies only `verb`, `room` and `target`; the engine validates
  and applies it through `attempt()`;
- unavailable or invalid cognition falls back to routine policy without stopping
  the world;
- four watches advance exactly one simulated day;
- every committed happening is appended transactionally to the canonical archive,
  indexed by day, room and resident, and recent personal history is fed back into
  that resident's next cognition request;
- public reads never invoke an LLM;
- D1, Queues, Agents SDK and AI Gateway are intentionally absent until a measured
  need appears.

Provisioned external resources:

- Cloudflare Worker `aleetreny-habitat-runtime` on the Free plan, deployed at
  `https://aleetreny-habitat-runtime.alejandrotreny100.workers.dev`;
- Groq Free project `habitat-prod`, restricted to `openai/gpt-oss-20b`, with caps
  of 10 RPM, 200 RPD, 6,000 TPM and 150,000 TPD;
- Cloudflare MCP servers from the official agent setup prompt, installed globally;
  the account, bindings, builds and observability servers are OAuth-authenticated,
  while the documentation server needs no login. Restart Codex once so the current
  tool session discovers them.

The active Groq key `habitat-runtime-v3` has been created with explicit authorization
and is installed directly as the Worker secret `GROQ_API_KEY`. Its value was never
written to Git or command output, and it is never persisted in world SQL. The two
superseded setup keys were revoked after the authenticated smoke test passed.

The public frontend reads `/v1/snapshot` once when the Habitat view opens and keeps
the authored Genesis snapshot on any network or contract failure. Immutable days
are available from `/v1/archive?day=N`, with optional room/person filters, ready for
the archive UI. Visiting the portfolio itself performs no habitat request, and no
read path can enqueue cognition.
