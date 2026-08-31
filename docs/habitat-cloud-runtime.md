# Habitat cloud-runtime handoff

Implementation lives in `workers/habitat-runtime` on branch
`codex/habitat-cloud-runtime`. It intentionally does not import or modify Claude's
Night Shift UI/domain files.

The integration seam is the immutable `CognitionJob` contract in
`workers/habitat-runtime/src/contracts.ts`. The Cloudflare layer owns scheduling,
operational persistence, provider routing, quotas, circuit breakers and admin
controls. The domain layer owns every world rule, perception, memory, intention,
primitive action and canonical consequence.

Important current behavior:

- population capacity is hard-coded and database-constrained to 25;
- a fresh deployment is paused;
- alarms never fabricate a cognition job;
- manually/domain-enqueued cognition can be resolved but is not applied to world
  state yet;
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

The Groq API key is the only remaining credential to provision. Creating it is a
sensitive browser action and should happen only with action-time confirmation;
after creation, pipe it directly into the Worker secret `GROQ_API_KEY` and never
place it in Git or shell history.

Before enabling the runtime, add the domain tick/application adapter and tests for
crashes before/after tick commit. Then set the Groq Free secret if desired and send
one authenticated, idempotent resume command.
