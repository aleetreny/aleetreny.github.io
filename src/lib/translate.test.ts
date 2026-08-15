import { describe, expect, it } from 'vitest';
import {
  TranslateQuotaError,
  pickGoogleText,
  pickMyMemoryText,
  providerDailyBudget,
  splitForLimit,
  translateTexts,
} from './translate';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

describe('translation providers', () => {
  it('identifies the signed-in owner to MyMemory instead of using its anonymous quota', async () => {
    let requestUrl = '';
    const result = await translateTexts(
      { texts: ['Hola'], from: 'es', to: 'en' },
      {
        provider: 'mymemory',
        email: 'owner@example.com',
        fetchImpl: async (input) => {
          requestUrl = String(input);
          return json({ responseStatus: 200, responseData: { translatedText: 'Hello' } });
        },
      },
    );

    expect(result).toEqual(['Hello']);
    expect(new URL(requestUrl).searchParams.get('de')).toBe('owner@example.com');
  });

  it('takes the machine translation over a loose memory match', () => {
    // A real answer: the headline text is a fuzzy hit on a different sentence,
    // and the actual machine translation is further down in `matches`.
    const body = {
      responseData: { translatedText: 'hello this is a test 123', match: 0.86 },
      matches: [
        { 'created-by': 'MateCat', translation: 'hello this is a test 123', segment: 'Hola, esto es una prueba', match: 0.86 },
        { 'created-by': 'MT!', translation: 'Hello world, this is a test', segment: 'Hola mundo, esto es una prueba', match: 0.85 },
      ],
    };
    expect(pickMyMemoryText(body, 'Hola mundo, esto es una prueba')).toBe('Hello world, this is a test');
  });

  it('accepts a memory match only when it is the same sentence', () => {
    const body = {
      responseData: { translatedText: 'Wrong' },
      matches: [{ 'created-by': 'MateCat', translation: 'Málaga', segment: 'Málaga', match: 1 }],
    };
    expect(pickMyMemoryText(body, 'Málaga')).toBe('Málaga');
    // Nothing usable in `matches` falls back to the headline rather than to ''.
    expect(pickMyMemoryText({ responseData: { translatedText: 'Only this' } }, 'algo')).toBe('Only this');
  });

  it('tells a spent daily allowance apart from a transient failure', async () => {
    await expect(translateTexts(
      { texts: ['Hola'], from: 'es', to: 'en' },
      {
        provider: 'mymemory',
        fetchImpl: async () => json({
          responseStatus: 403,
          responseDetails: 'YOU USED ALL AVAILABLE FREE TRANSLATIONS FOR TODAY',
        }),
      },
    )).rejects.toBeInstanceOf(TranslateQuotaError);
  });

  it('retries a throttled call instead of losing the run', async () => {
    let calls = 0;
    const result = await translateTexts(
      { texts: ['Hola'], from: 'es', to: 'en' },
      {
        provider: 'mymemory',
        fetchImpl: async () => {
          calls += 1;
          if (calls === 1) return new Response('', { status: 429 });
          return json({ responseStatus: 200, responseData: { translatedText: 'Hello' } });
        },
      },
    );
    expect(calls).toBe(2);
    expect(result).toEqual(['Hello']);
  });

  it('reads the keyless Google endpoint, sentence by sentence', () => {
    expect(pickGoogleText([[['One. ', 'Uno. '], ['Two.', 'Dos.']], null, 'es'])).toBe('One. Two.');
    expect(pickGoogleText('nonsense')).toBe('');
  });

  it('keeps the line breaks the owner typed', async () => {
    const seen: string[] = [];
    const result = await translateTexts(
      { texts: ['Primera línea\nSegunda línea'], from: 'es', to: 'en' },
      {
        provider: 'google',
        fetchImpl: async (input) => {
          const q = new URL(String(input)).searchParams.get('q') ?? '';
          seen.push(q);
          return json([[[q === 'Primera línea' ? 'First line' : 'Second line', q]]]);
        },
      },
    );
    expect(seen).toEqual(['Primera línea', 'Segunda línea']);
    expect(result).toEqual(['First line\nSecond line']);
  });

  it('splits prose to the provider limit without dropping words', () => {
    const long = `${'palabra '.repeat(200)}fin.`;
    const chunks = splitForLimit(long, 480);
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) expect(chunk.length).toBeLessThanOrEqual(480);
    expect(chunks.join(' ').replace(/\s+/g, ' ').trim()).toBe(long.replace(/\s+/g, ' ').trim());
  });

  it('knows how much MyMemory will give away in a day', () => {
    expect(providerDailyBudget('mymemory', false)).toBeLessThan(providerDailyBudget('mymemory', true));
    expect(providerDailyBudget('google', false)).toBe(Number.POSITIVE_INFINITY);
  });

  it('never spends a call translating a language into itself', async () => {
    const result = await translateTexts(
      { texts: ['Hola'], from: 'es', to: 'es' },
      { provider: 'mymemory', fetchImpl: async () => { throw new Error('should not be called'); } },
    );
    expect(result).toEqual(['Hola']);
  });
});
