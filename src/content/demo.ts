import demoContent from '../../fixtures/demo-content.json';
import demoSettingsRaw from '../../fixtures/site-settings.json';
import { hydrateEntry } from '../lib/entry-storage';
import type { StoredPortfolioEntry } from '../types/content';

/** The safe copy, read exactly as a database row is: the fixture carries the
 *  stored shape — plain text columns plus the language sidecar in `metadata` —
 *  so the offline board and the live one agree on what an entry looks like.
 *
 *  It is taken at its word rather than validated here. This file is imported
 *  by the first module the browser runs, and running a schema over three
 *  hundred kilobytes of our own generated JSON before a single pixel is drawn
 *  buys nothing: the fixture is written by `pnpm content:build` from the same
 *  contract, and `demo.test.ts` is where it is checked against the schema. A
 *  document arriving from the network is a different matter, and is still
 *  parsed. */
export const demoEntries: StoredPortfolioEntry[] = (demoContent as StoredPortfolioEntry[])
  .map((entry) => hydrateEntry(entry));

export const demoSettings: Record<string, unknown> = Object.fromEntries(
  (demoSettingsRaw as Array<{ key: string; value: unknown }>).map((row) => [row.key, row.value]),
);
