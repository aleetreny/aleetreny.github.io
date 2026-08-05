import demoContent from '../../fixtures/demo-content.json';
import demoSettingsRaw from '../../fixtures/site-settings.json';
import { portfolioEntriesSchema } from '../types/content';

export const demoEntries = portfolioEntriesSchema.parse(demoContent);

export const demoSettings: Record<string, unknown> = Object.fromEntries(
  (demoSettingsRaw as Array<{ key: string; value: unknown }>).map((row) => [row.key, row.value]),
);
