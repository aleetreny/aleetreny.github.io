import { describe, expect, it } from 'vitest';
import { demoEntries } from './demo';

describe('demo content', () => {
  it('contains only public entries with ordered blocks', () => {
    expect(demoEntries).toHaveLength(24);
    for (const entry of demoEntries) {
      expect(entry.status).toBe('published');
      expect(entry.blocks.map((block) => block.position)).toEqual(
        [...entry.blocks].sort((a, b) => a.position - b.position).map((block) => block.position),
      );
    }
  });

  it('assigns every public entry to a documented archive section', () => {
    const sections = new Set([
      'research',
      'ai',
      'civic',
      'products',
      'experiments',
      'career',
      'education',
      'community',
      'profile',
    ]);

    for (const entry of demoEntries) {
      expect(sections.has(String(entry.metadata.section))).toBe(true);
      if (entry.metadata.projectUrl) expect(() => new URL(String(entry.metadata.projectUrl))).not.toThrow();
      if (entry.metadata.repositoryUrl) expect(() => new URL(String(entry.metadata.repositoryUrl))).not.toThrow();
    }
  });
});
