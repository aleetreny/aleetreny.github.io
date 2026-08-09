import demoContent from '../../fixtures/demo-content.json';
import demoSettingsRaw from '../../fixtures/site-settings.json';
import { portfolioEntriesSchema, type StoredPortfolioEntry } from '../types/content';

/** The safe copy, exactly as stored: prose here may be a language map. */
export const demoEntries: StoredPortfolioEntry[] = portfolioEntriesSchema.parse(demoContent);

export const demoSettings: Record<string, unknown> = Object.fromEntries(
  (demoSettingsRaw as Array<{ key: string; value: unknown }>).map((row) => [row.key, row.value]),
);
