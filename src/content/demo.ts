import demoContent from '../../fixtures/demo-content.json';
import demoSettingsRaw from '../../fixtures/site-settings.json';
import { hydrateEntry } from '../lib/entry-storage';
import { portfolioEntriesSchema, type StoredPortfolioEntry } from '../types/content';

/** The safe copy, read exactly as a database row is: the fixture carries the
 *  stored shape — plain text columns plus the language sidecar in `metadata` —
 *  so the offline board and the live one agree on what an entry looks like. */
export const demoEntries: StoredPortfolioEntry[] = portfolioEntriesSchema
  .parse(demoContent)
  .map((entry) => hydrateEntry(entry));

export const demoSettings: Record<string, unknown> = Object.fromEntries(
  (demoSettingsRaw as Array<{ key: string; value: unknown }>).map((row) => [row.key, row.value]),
);
