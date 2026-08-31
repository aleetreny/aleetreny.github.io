import type { CognitionJob, ProviderAttemptResult } from '../contracts';
import { errorCode, parseStructuredPayload, sanitizeUsage } from './shared';

export const WORKERS_AI_MODEL = '@cf/qwen/qwen3-30b-a3b-fp8' as const;

export type WorkersAIRunner = {
  run(model: typeof WORKERS_AI_MODEL, input: unknown): Promise<unknown>;
};

type WorkersAIResponse = {
  response?: unknown;
  usage?: {
    prompt_tokens?: unknown;
    completion_tokens?: unknown;
    total_tokens?: unknown;
  };
};

function classifyWorkersAIError(error: unknown): {
  kind: Extract<ProviderAttemptResult, { ok: false }>['kind'];
  retryable: boolean;
} {
  const code = errorCode(error)?.toLowerCase() ?? '';
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  const detail = `${code} ${message}`;

  if (detail.includes('quota') || detail.includes('limit') || detail.includes('10040')) {
    return { kind: 'quota-exhausted', retryable: true };
  }
  if (detail.includes('auth') || detail.includes('permission') || detail.includes('forbidden')) {
    return { kind: 'authentication', retryable: false };
  }
  if (detail.includes('model') || detail.includes('binding')) {
    return { kind: 'misconfigured', retryable: false };
  }
  return { kind: 'unavailable', retryable: true };
}

export async function runWorkersAI(input: {
  ai: WorkersAIRunner;
  job: CognitionJob;
  attemptId: string;
  model: string;
  now?: () => number;
}): Promise<ProviderAttemptResult> {
  const now = input.now ?? Date.now;
  const startedAt = now();

  if (input.model !== WORKERS_AI_MODEL) {
    return {
      ok: false,
      provider: 'workers-ai',
      model: input.model,
      attemptId: input.attemptId,
      kind: 'policy-blocked',
      retryable: false,
      detailCode: 'model_not_allowed',
      latencyMs: 0,
    };
  }

  try {
    const raw = (await input.ai.run(WORKERS_AI_MODEL, {
      messages: [
        { role: 'system', content: input.job.prompt.system },
        { role: 'user', content: input.job.prompt.user },
      ],
      max_tokens: input.job.maxOutputTokens,
      temperature: 0.3,
      seed: stableSeed(input.job.jobId),
      response_format: {
        type: 'json_schema',
        json_schema: input.job.outputContract.jsonSchema,
      },
    })) as WorkersAIResponse;

    const payload = parseStructuredPayload(raw.response);
    const usage = sanitizeUsage(raw.usage);
    usage.neurons = estimateQwenNeurons(
      usage.inputTokens ?? 0,
      usage.outputTokens ?? input.job.maxOutputTokens,
    );

    return {
      ok: true,
      provider: 'workers-ai',
      model: WORKERS_AI_MODEL,
      attemptId: input.attemptId,
      payload,
      usage,
      latencyMs: now() - startedAt,
    };
  } catch (error) {
    const classification = classifyWorkersAIError(error);
    const detailCode = errorCode(error);
    return {
      ok: false,
      provider: 'workers-ai',
      model: WORKERS_AI_MODEL,
      attemptId: input.attemptId,
      ...classification,
      ...(detailCode ? { detailCode } : {}),
      latencyMs: now() - startedAt,
    };
  }
}

export function estimateQwenNeurons(inputTokens: number, outputTokens: number): number {
  return Math.ceil((inputTokens * 4_625 + outputTokens * 30_475) / 1_000_000);
}

function stableSeed(value: string): number {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}
