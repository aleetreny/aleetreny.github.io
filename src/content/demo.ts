import demoContent from '../../fixtures/demo-content.json';
import { portfolioEntriesSchema } from '../types/content';

export const demoEntries = portfolioEntriesSchema.parse(demoContent);
