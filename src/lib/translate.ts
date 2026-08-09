// Machine translation for the owner's editing session.
//
// This runs only while the owner is writing, never for a visitor: the result is
// stored alongside the source text, so the published site has no runtime
// dependency on any translation service. A failure here costs the owner a
// button press, not the site.
//
// Two providers, both free:
//
// - `mymemory` needs no key and no server. It is called straight from the
//   browser, which is fine because the text being translated is about to be
//   published anyway. Anonymous use is rate-limited per day, which a person
//   editing their own portfolio will not notice.
// - `function` posts to the project's own Neon Function, which holds a
//   provider key server-side (DeepL's free tier, or a self-hosted
//   LibreTranslate) and validates the owner's JWT before spending it. Use this
//   when you want better prose or higher volume than the keyless route.

import { runtimeConfig } from './config';

export type TranslateRequest = {
  texts: string[];
  from: string;
  to: string;
};

/** Same length and order as the request; an empty string means "no result",
 *  never a silently wrong one. */
export type TranslateResult = string[];

export class TranslateError extends Error {}

/** MyMemory takes one string per call, so a batch is a bounded fan-out. */
const MYMEMORY_ENDPOINT = 'https://api.mymemory.translated.net/get';
const MAX_CHARS = 500;
const CONCURRENCY = 4;

async function mymemoryOne(text: string, from: string, to: string, email?: string): Promise<string> {
  // Its limit is per request, so anything longer is split on sentence
  // boundaries and rejoined — a paragraph translates as several sentences
  // rather than being truncated.
  const chunks = splitForLimit(text, MAX_CHARS);
  const out: string[] = [];
  for (const chunk of chunks) {
    const url = new URL(MYMEMORY_ENDPOINT);
    url.searchParams.set('q', chunk);
    url.searchParams.set('langpair', `${from}|${to}`);
    if (email) url.searchParams.set('de', email);
    const response = await fetch(url, { headers: { accept: 'application/json' } });
    if (!response.ok) throw new TranslateError(`Translator answered ${response.status}.`);
    const body = (await response.json()) as {
      responseStatus?: number | string;
      responseData?: { translatedText?: string };
      responseDetails?: string;
    };
    const status = Number(body.responseStatus ?? 200);
    if (status !== 200) throw new TranslateError(body.responseDetails || 'The translator refused the request.');
    const piece = body.responseData?.translatedText ?? '';
    if (!piece) throw new TranslateError('The translator returned nothing.');
    out.push(piece);
  }
  return out.join(' ');
}

/** Split on sentence ends, then on words, so no chunk exceeds `limit`. */
export function splitForLimit(text: string, limit: number): string[] {
  if (text.length <= limit) return [text];
  const chunks: string[] = [];
  let current = '';
  const pieces = text.split(/(?<=[.!?…])\s+/);
  for (const piece of pieces) {
    for (const part of piece.length > limit ? splitWords(piece, limit) : [piece]) {
      if (!current) { current = part; continue; }
      if (current.length + part.length + 1 <= limit) { current = `${current} ${part}`; continue; }
      chunks.push(current);
      current = part;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

function splitWords(text: string, limit: number): string[] {
  const out: string[] = [];
  let current = '';
  for (const word of text.split(/\s+/)) {
    if (!current) { current = word.slice(0, limit); continue; }
    if (current.length + word.length + 1 <= limit) { current = `${current} ${word}`; continue; }
    out.push(current);
    current = word.slice(0, limit);
  }
  if (current) out.push(current);
  return out;
}

async function viaFunction(request: TranslateRequest, endpoint: string, token?: string): Promise<TranslateResult> {
  const response = await fetch(`${endpoint.replace(/\/$/, '')}/translate`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new TranslateError(detail || `Translator answered ${response.status}.`);
  }
  const body = (await response.json()) as { texts?: unknown };
  if (!Array.isArray(body.texts) || body.texts.length !== request.texts.length) {
    throw new TranslateError('The translator returned an unexpected shape.');
  }
  return body.texts.map((item) => (typeof item === 'string' ? item : ''));
}

/** Run `workers` promises at a time, preserving input order. */
async function pool<T, R>(items: T[], workers: number, run: (item: T) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length);
  let cursor = 0;
  const lane = async () => {
    for (;;) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) return;
      out[index] = await run(items[index]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(workers, items.length) }, lane));
  return out;
}

export type TranslateOptions = {
  provider: 'mymemory' | 'function' | 'off';
  /** Only for `function`; the owner's short-lived Neon Auth JWT. */
  token?: string;
  /** Only for `mymemory`; raises the free daily allowance. */
  email?: string;
  /** Overrides the endpoint from runtime config, for tests. */
  endpoint?: string;
  fetchImpl?: typeof fetch;
};

export function translatorAvailable(options: Pick<TranslateOptions, 'provider' | 'endpoint'>): boolean {
  if (options.provider === 'off') return false;
  if (options.provider === 'function') {
    return Boolean(options.endpoint ?? runtimeConfig.translateFunctionUrl);
  }
  return true;
}

/** Translate a batch. Order and length always match the input. */
export async function translateTexts(
  request: TranslateRequest,
  options: TranslateOptions,
): Promise<TranslateResult> {
  if (request.texts.length === 0) return [];
  if (options.provider === 'off') throw new TranslateError('Translation is switched off.');
  if (request.from === request.to) return [...request.texts];

  if (options.provider === 'function') {
    const endpoint = options.endpoint ?? runtimeConfig.translateFunctionUrl;
    if (!endpoint) throw new TranslateError('No translate function is configured.');
    return viaFunction(request, endpoint, options.token);
  }

  const previousFetch = globalThis.fetch;
  if (options.fetchImpl) globalThis.fetch = options.fetchImpl;
  try {
    return await pool(request.texts, CONCURRENCY, async (text) => {
      if (!text.trim()) return '';
      return mymemoryOne(text, request.from, request.to, options.email);
    });
  } finally {
    if (options.fetchImpl) globalThis.fetch = previousFetch;
  }
}
