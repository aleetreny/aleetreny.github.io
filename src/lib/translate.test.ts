import { describe, expect, it } from 'vitest';
import { translateTexts } from './translate';

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
          return new Response(JSON.stringify({ responseStatus: 200, responseData: { translatedText: 'Hello' } }));
        },
      },
    );

    expect(result).toEqual(['Hello']);
    expect(new URL(requestUrl).searchParams.get('de')).toBe('owner@example.com');
  });
});
