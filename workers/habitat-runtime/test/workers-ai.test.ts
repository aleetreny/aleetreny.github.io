import { describe, expect, it, vi } from 'vitest';
import {
  estimateQwenNeurons,
  runWorkersAI,
  WORKERS_AI_MODEL,
} from '../src/providers/workers-ai';
import { cognitionJob } from './fixtures';

describe('Workers AI primary', () => {
  it('uses the fixed Qwen model and JSON schema mode', async () => {
    const run = vi.fn(async () => ({
      response: '{"thought":"observe"}',
      usage: { prompt_tokens: 18, completion_tokens: 4, total_tokens: 22 },
    }));
    const result = await runWorkersAI({
      ai: { run },
      job: cognitionJob(),
      attemptId: 'workers:1',
      model: WORKERS_AI_MODEL,
    });
    expect(result).toMatchObject({
      ok: true,
      provider: 'workers-ai',
      payload: { thought: 'observe' },
    });
    expect(run).toHaveBeenCalledWith(WORKERS_AI_MODEL, expect.objectContaining({
      max_tokens: 384,
      response_format: expect.objectContaining({ type: 'json_schema' }),
    }));
  });

  it('uses conservative integer neuron estimates', () => {
    expect(estimateQwenNeurons(1_000, 384)).toBe(
      Math.ceil((1_000 * 4_625 + 384 * 30_475) / 1_000_000),
    );
  });

  it('never calls a model outside the allowlist', async () => {
    const run = vi.fn();
    const result = await runWorkersAI({
      ai: { run },
      job: cognitionJob(),
      attemptId: 'workers:2',
      model: '@cf/another/model',
    });
    expect(result).toMatchObject({ ok: false, kind: 'policy-blocked' });
    expect(run).not.toHaveBeenCalled();
  });
});
