// Machine translation for the owner's editing session.
//
// This runs only while the owner is writing, never for a visitor: the result is
// stored alongside the source text, so the published site has no runtime
// dependency on any translation service. A failure here costs the owner a
// button press, not the site.
//
// Three providers, all free:
//
// - `mymemory` needs no key and no server. It is called straight from the
//   browser (it answers `access-control-allow-origin: *`), which is fine
//   because the text being translated is about to be published anyway. Its
//   allowance is per day and per address: about 5.000 characters anonymously,
//   50.000 with a contact address attached. It takes 500 characters per call,
//   so long prose is split and rejoined.
// - `google` is the keyless endpoint the Google Translate web widget itself
//   calls. It is markedly better prose than MyMemory and takes a whole
//   paragraph per call, but it is undocumented: Google can change or close it
//   without notice, so it is offered as a choice and never as the default.
// - `function` posts to the project's own Neon Function, which holds a
//   provider key server-side (DeepL's free tier, or a self-hosted
//   LibreTranslate) and validates the owner's JWT before spending it. Use this
//   when you want guaranteed prose or higher volume than the keyless routes.
//
// Every provider goes through the same retry ladder, because the failure that
// actually bites is a burst of requests hitting a per-second limit — not a
// permanent outage. A refusal that retrying cannot fix (the daily allowance is
// gone) is raised as `TranslateQuotaError` so the caller can say so plainly
// instead of blaming the network.

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

/** The provider is alive and said no: the day's free allowance is spent, or it
 *  is throttling harder than the retry ladder can absorb. Retrying the same
 *  request now will not help; tomorrow, or another provider, will. */
export class TranslateQuotaError extends TranslateError {}

/** The provider is asking us to slow down. Retried a few times; if it is still
 *  saying it after the last attempt, it is a wall rather than a blip and the
 *  caller is told so in those words. */
export class TranslateThrottleError extends TranslateError {}

const MYMEMORY_ENDPOINT = 'https://api.mymemory.translated.net/get';
const GOOGLE_ENDPOINT = 'https://translate.googleapis.com/translate_a/single';

/** MyMemory refuses a query longer than this. */
const MYMEMORY_MAX_CHARS = 480;
/** The keyless Google endpoint is a GET, so the URL is the real limit. */
const GOOGLE_MAX_CHARS = 1600;

/** One request at a time for MyMemory: it throttles bursts far more readily
 *  than it exhausts the daily allowance, and a translation that takes eight
 *  seconds instead of two is not a problem the owner will notice. */
const MYMEMORY_CONCURRENCY = 1;
const GOOGLE_CONCURRENCY = 2;
const RETRY_DELAYS = [700, 1800, 4200];

const sleep = (ms: number) => new Promise((resolve) => { setTimeout(resolve, ms); });

/** MyMemory answers 200 with the refusal in the body, so the wording is the
 *  only signal. These are the ones no amount of waiting will clear today. */
function isQuotaWording(detail: string): boolean {
  const text = detail.toUpperCase();
  return text.includes('USED ALL AVAILABLE FREE TRANSLATIONS')
    || text.includes('DAILY LIMIT')
    || text.includes('QUOTA');
}

function isThrottleWording(detail: string): boolean {
  const text = detail.toUpperCase();
  return text.includes('TOO MANY REQUESTS') || text.includes('RATE LIMIT');
}

/** Run one call through the retry ladder. Throttling and network blips are
 *  retried; a quota refusal and a malformed answer are not. */
async function withRetry<T>(run: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt += 1) {
    try {
      return await run();
    } catch (error) {
      if (error instanceof TranslateQuotaError) throw error;
      lastError = error;
      if (attempt === RETRY_DELAYS.length) break;
      await sleep(RETRY_DELAYS[attempt]);
    }
  }
  // Still being throttled after the whole ladder is not a blip: the caller
  // should say "this provider has hit its limit", not "the network is down".
  if (lastError instanceof TranslateThrottleError) throw new TranslateQuotaError(lastError.message);
  throw lastError instanceof Error ? lastError : new TranslateError('The translator could not be reached.');
}

// ------------------------------------------------------------------ MyMemory

type MyMemoryMatch = {
  translation?: unknown;
  'created-by'?: unknown;
  match?: unknown;
  segment?: unknown;
};

type MyMemoryBody = {
  responseStatus?: number | string;
  responseData?: { translatedText?: unknown; match?: unknown };
  responseDetails?: unknown;
  matches?: unknown;
};

/** Pick the machine translation out of a MyMemory answer.
 *
 *  `responseData.translatedText` is *not* the machine translation: it is the
 *  best entry in a crowd-sourced translation memory, and a loose fuzzy match
 *  outranks the real one often enough to matter. Asking it for
 *  "Hola mundo, esto es una prueba" answers "hello this is a test 123" while
 *  the machine translation sitting in `matches` says "Hello world, this is a
 *  test". So: take the machine entry when there is one, take a memory entry
 *  only when it matches the source exactly, and fall back to the headline
 *  answer last. */
export function pickMyMemoryText(body: unknown, source: string): string {
  const parsed = (body ?? {}) as MyMemoryBody;
  const matches = Array.isArray(parsed.matches) ? (parsed.matches as MyMemoryMatch[]) : [];

  const machine = matches.find((match) => {
    const by = typeof match['created-by'] === 'string' ? match['created-by'] : '';
    return by.toUpperCase().startsWith('MT') && typeof match.translation === 'string' && match.translation.trim();
  });
  if (machine && typeof machine.translation === 'string') return machine.translation;

  const wanted = source.trim().toLowerCase();
  const exact = matches.find((match) => {
    const segment = typeof match.segment === 'string' ? match.segment.trim().toLowerCase() : '';
    return segment === wanted && typeof match.translation === 'string' && match.translation.trim();
  });
  if (exact && typeof exact.translation === 'string') return exact.translation;

  const headline = parsed.responseData?.translatedText;
  return typeof headline === 'string' ? headline : '';
}

async function mymemoryChunk(
  fetchImpl: typeof fetch,
  chunk: string,
  from: string,
  to: string,
  email?: string,
): Promise<string> {
  const url = new URL(MYMEMORY_ENDPOINT);
  url.searchParams.set('q', chunk);
  url.searchParams.set('langpair', `${from}|${to}`);
  if (email) url.searchParams.set('de', email);

  const response = await fetchImpl(url.toString(), { headers: { accept: 'application/json' } });
  if (response.status === 429) throw new TranslateThrottleError('The translator is throttling.');
  if (!response.ok) throw new TranslateError(`Translator answered ${response.status}.`);

  const body = (await response.json()) as MyMemoryBody;
  const detail = typeof body.responseDetails === 'string' ? body.responseDetails : '';
  const status = Number(body.responseStatus ?? 200);
  if (status !== 200) {
    if (isQuotaWording(detail)) throw new TranslateQuotaError(detail);
    if (isThrottleWording(detail)) throw new TranslateThrottleError(detail);
    throw new TranslateError(detail || 'The translator refused the request.');
  }
  const piece = pickMyMemoryText(body, chunk);
  if (!piece) throw new TranslateError('The translator returned nothing.');
  // A refusal can also arrive as the "translation" itself.
  if (isQuotaWording(piece)) throw new TranslateQuotaError(piece);
  return piece;
}

// --------------------------------------------------------------------- Google

/** The widget endpoint answers a nested array; sentence zero of each segment,
 *  concatenated, is the translation. */
export function pickGoogleText(body: unknown): string {
  if (!Array.isArray(body) || !Array.isArray(body[0])) return '';
  return (body[0] as unknown[])
    .map((segment) => (Array.isArray(segment) && typeof segment[0] === 'string' ? segment[0] : ''))
    .join('');
}

async function googleChunk(
  fetchImpl: typeof fetch,
  chunk: string,
  from: string,
  to: string,
): Promise<string> {
  const url = new URL(GOOGLE_ENDPOINT);
  url.searchParams.set('client', 'gtx');
  url.searchParams.set('dt', 't');
  url.searchParams.set('sl', from);
  url.searchParams.set('tl', to);
  url.searchParams.set('q', chunk);

  const response = await fetchImpl(url.toString(), { headers: { accept: 'application/json' } });
  if (response.status === 429) throw new TranslateThrottleError('The keyless Google endpoint is rate-limiting this address.');
  if (response.status === 403) throw new TranslateQuotaError('The keyless Google endpoint refused this browser.');
  if (!response.ok) throw new TranslateError(`Translator answered ${response.status}.`);

  const text = pickGoogleText(await response.json());
  if (!text) throw new TranslateError('The translator returned nothing.');
  return text;
}

// ------------------------------------------------------------------ splitting

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

/** Newlines are structure the owner typed on purpose — a two-line title, a
 *  paragraph with a break in it. Translate each line and put the breaks back
 *  rather than letting them collapse into one run-on sentence. */
async function translateKeepingLines(
  text: string,
  translateLine: (line: string) => Promise<string>,
): Promise<string> {
  if (!text.includes('\n')) return translateLine(text);
  const out: string[] = [];
  for (const line of text.split('\n')) {
    out.push(line.trim() ? await translateLine(line) : line);
  }
  return out.join('\n');
}

// -------------------------------------------------------------------- function

async function viaFunction(
  fetchImpl: typeof fetch,
  request: TranslateRequest,
  endpoint: string,
  token?: string,
): Promise<TranslateResult> {
  const response = await fetchImpl(`${endpoint.replace(/\/$/, '')}/translate`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    if (response.status === 429) throw new TranslateQuotaError(detail || 'The translator is out of allowance.');
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

export const TRANSLATE_PROVIDER_LIST = ['mymemory', 'google', 'function', 'off'] as const;
export type TranslateProviderName = (typeof TRANSLATE_PROVIDER_LIST)[number];

export type TranslateOptions = {
  provider: TranslateProviderName;
  /** Only for `function`; the owner's short-lived Neon Auth JWT. */
  token?: string;
  /** Only for `mymemory`; raises the free daily allowance tenfold. */
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

/** How many characters of one text this provider will charge for; used to keep
 *  a run inside the free daily allowance instead of discovering the ceiling
 *  three quarters of the way through. */
export function providerDailyBudget(provider: TranslateProviderName, hasEmail: boolean): number {
  if (provider === 'mymemory') return hasEmail ? 45_000 : 4_500;
  return Number.POSITIVE_INFINITY;
}

/** Translate a batch. Order and length always match the input. */
export async function translateTexts(
  request: TranslateRequest,
  options: TranslateOptions,
): Promise<TranslateResult> {
  if (request.texts.length === 0) return [];
  if (options.provider === 'off') throw new TranslateError('Translation is switched off.');
  if (request.from === request.to) return [...request.texts];

  const fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);

  if (options.provider === 'function') {
    const endpoint = options.endpoint ?? runtimeConfig.translateFunctionUrl;
    if (!endpoint) throw new TranslateError('No translate function is configured.');
    return withRetry(() => viaFunction(fetchImpl, request, endpoint, options.token));
  }

  const google = options.provider === 'google';
  const limit = google ? GOOGLE_MAX_CHARS : MYMEMORY_MAX_CHARS;
  const workers = google ? GOOGLE_CONCURRENCY : MYMEMORY_CONCURRENCY;

  const one = async (chunk: string): Promise<string> => withRetry(() => (google
    ? googleChunk(fetchImpl, chunk, request.from, request.to)
    : mymemoryChunk(fetchImpl, chunk, request.from, request.to, options.email)));

  return pool(request.texts, workers, async (text) => {
    if (!text.trim()) return '';
    return translateKeepingLines(text, async (line) => {
      const chunks = splitForLimit(line, limit);
      const done: string[] = [];
      for (const chunk of chunks) done.push(await one(chunk));
      return done.join(' ');
    });
  });
}
