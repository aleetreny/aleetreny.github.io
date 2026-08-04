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
  title: z.string().min(1),
  summary: z.string(),
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
export type PortfolioEntry = z.infer<typeof portfolioEntrySchema>;

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
