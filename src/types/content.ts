import { z } from 'zod';

export const entryStatusSchema = z.enum(['draft', 'published', 'archived']);
export const entryTypeSchema = z.enum([
  'project',
  'case-study',
  'experience',
  'education',
  'note',
  'custom',
]);

/** A prose field: one string, or the same string per language code.
 *
 *  Stored bilingual content puts a language map where a string used to be, and
 *  every reader resolves it through `pickText` in src/lib/i18n.ts. The schema
 *  has to accept both so a single-language board and a bilingual one validate
 *  against the same contract. */
export const localisedStringSchema = z.union([z.string(), z.record(z.string(), z.string())]);
export type LocalisedString = z.infer<typeof localisedStringSchema>;

export const contentBlockSchema = z.object({
  id: z.uuid(),
  type: z.string().min(1),
  position: z.number().int().nonnegative(),
  props: z.record(z.string(), z.unknown()),
  layout: z.record(z.string(), z.unknown()),
});

export const portfolioEntrySchema = z.object({
  id: z.uuid(),
  version: z.number().int().nonnegative().default(1),
  slug: z.string().min(1),
  title: localisedStringSchema,
  summary: localisedStringSchema,
  entryType: entryTypeSchema,
  status: entryStatusSchema,
  publishedAt: z.string().datetime({ offset: true }).nullable(),
  metadata: z.record(z.string(), z.unknown()),
  blocks: z.array(contentBlockSchema),
});

export const portfolioEntriesSchema = z.array(portfolioEntrySchema);

export type EntryStatus = z.infer<typeof entryStatusSchema>;
export type EntryType = z.infer<typeof entryTypeSchema>;
export type ContentBlock = z.infer<typeof contentBlockSchema>;

/** An entry exactly as stored: prose may be a language map. */
export type StoredPortfolioEntry = z.infer<typeof portfolioEntrySchema>;

/** An entry as the board renders it.
 *
 *  The schema accepts a language map for prose, but `localise()` in
 *  src/lib/i18n.ts resolves every one of them before anything renders, so the
 *  type components see declares plain strings. That resolution is the only
 *  place the two shapes meet; below it, no component knows a second language
 *  exists. */
export type PortfolioEntry = Omit<StoredPortfolioEntry, 'title' | 'summary'> & {
  title: string;
  summary: string;
};

export type EntryVersionSummary = {
  id: string;
  version: number;
  reason: string;
  createdAt: string;
};

export type DeletedEntrySummary = Pick<
  PortfolioEntry,
  'id' | 'version' | 'slug' | 'title' | 'entryType' | 'status'
> & {
  deletedAt: string;
};

export type StoredAsset = {
  id: string;
  bucket: string;
  objectKey: string;
  publicUrl: string;
  mimeType: string;
  byteSize: number;
  altText: string;
};
