import { describe, expect, it } from 'vitest';
import { portfolioEntrySchema } from './content';

const entry = {
  id: '8b3b274b-3579-4fca-b48f-e417581467da',
  version: 2,
  slug: 'auditoria-online',
  title: 'Auditoría online',
  summary: '',
  entryType: 'note',
  status: 'published',
  metadata: {},
  blocks: [],
};

describe('portfolio entry contract', () => {
  it('accepts PostgreSQL timestamps with an explicit UTC offset', () => {
    expect(portfolioEntrySchema.parse({
      ...entry,
      publishedAt: '2026-08-04T23:38:00+00:00',
    }).publishedAt).toBe('2026-08-04T23:38:00+00:00');
  });

  it('continues to accept ISO timestamps using Z', () => {
    expect(portfolioEntrySchema.parse({
      ...entry,
      publishedAt: '2026-08-04T23:38:00Z',
    }).publishedAt).toBe('2026-08-04T23:38:00Z');
  });

  it('rejects malformed publication timestamps', () => {
    expect(() => portfolioEntrySchema.parse({
      ...entry,
      publishedAt: '04/08/2026',
    })).toThrow();
  });
});
