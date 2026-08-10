/** A link is stored as a range in a prose field instead of raw HTML. That keeps
 * article copy safe to render and makes links survive regular text edits. */
export type TextLink = {
  start: number;
  end: number;
  href: string;
};

export type TextLinkMap = Record<string, TextLink[]>;
export type TextLinkListMap = Record<string, TextLink[][]>;

const ARTICLE_PREFIX = 'article:';
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/** Convert a user-entered web address into the only kind of external href we
 * render: an absolute HTTP(S) address. Bare domains get a useful HTTPS prefix. */
export function normaliseExternalHref(value: string): string | null {
  const typed = value.trim();
  if (!typed || /\s/.test(typed)) return null;
  const candidate = /^https?:\/\//i.test(typed) ? typed : `https://${typed}`;
  try {
    const url = new URL(candidate);
    return (url.protocol === 'https:' || url.protocol === 'http:') && url.hostname ? url.href : null;
  } catch {
    return null;
  }
}

export function articleHref(slug: string): string | null {
  const clean = slug.trim();
  return SLUG_PATTERN.test(clean) ? `${ARTICLE_PREFIX}${clean}` : null;
}

export function articleSlug(href: string): string | null {
  if (!href.startsWith(ARTICLE_PREFIX)) return null;
  const slug = href.slice(ARTICLE_PREFIX.length);
  return SLUG_PATTERN.test(slug) ? slug : null;
}

export function isSafeTextHref(href: string): boolean {
  return articleSlug(href) !== null || normaliseExternalHref(href) !== null;
}

/** Discard malformed, overlapping or out-of-bounds records before rendering. */
export function normaliseTextLinks(value: unknown, textLength: number): TextLink[] {
  if (!Array.isArray(value)) return [];
  const candidates = value.flatMap((item): TextLink[] => {
    if (!isRecord(item)) return [];
    const { start, end, href } = item;
    if (typeof start !== 'number' || typeof end !== 'number' || !Number.isInteger(start) || !Number.isInteger(end) || typeof href !== 'string') return [];
    if (start < 0 || end > textLength || start >= end || !isSafeTextHref(href)) return [];
    return [{ start, end, href }];
  }).sort((a, b) => a.start - b.start || a.end - b.end);

  const links: TextLink[] = [];
  for (const candidate of candidates) {
    if ((links.at(-1)?.end ?? 0) > candidate.start) continue;
    links.push(candidate);
  }
  return links;
}

export function linksForLanguage(value: unknown, language: string, textLength: number): TextLink[] {
  if (Array.isArray(value)) return normaliseTextLinks(value, textLength); // migration-friendly
  if (!isRecord(value)) return [];
  return normaliseTextLinks(value[language], textLength);
}

export function setLinksForLanguage(value: unknown, language: string, links: TextLink[]): TextLinkMap {
  const existing: TextLinkMap = isRecord(value) ? value as TextLinkMap : {};
  return { ...existing, [language]: links };
}

export function linksForLanguageAt(value: unknown, language: string, index: number, textLength: number): TextLink[] {
  if (!isRecord(value) || !Array.isArray(value[language])) return [];
  return normaliseTextLinks(value[language][index], textLength);
}

export function setLinksForLanguageAt(value: unknown, language: string, index: number, links: TextLink[]): TextLinkListMap {
  const existing: TextLinkListMap = isRecord(value) ? value as TextLinkListMap : {};
  const current = Array.isArray(existing[language]) ? [...existing[language]] : [];
  current[index] = links;
  return { ...existing, [language]: current };
}

export function removeLinksForLanguageAt(value: unknown, language: string, index: number): TextLinkListMap {
  const existing: TextLinkListMap = isRecord(value) ? value as TextLinkListMap : {};
  const current = Array.isArray(existing[language]) ? [...existing[language]] : [];
  current.splice(index, 1);
  return { ...existing, [language]: current };
}

/** Adding a range intentionally replaces a link it intersects; nested anchors
 * are not a meaningful article format and cannot be rendered accessibly. */
export function addTextLink(links: TextLink[], start: number, end: number, href: string, textLength: number): TextLink[] {
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end > textLength || start >= end || !isSafeTextHref(href)) return links;
  return normaliseTextLinks([
    ...links.filter((link) => link.end <= start || link.start >= end),
    { start, end, href },
  ], textLength);
}

export function removeTextLink(links: TextLink[], link: TextLink): TextLink[] {
  return links.filter((candidate) => candidate.start !== link.start || candidate.end !== link.end || candidate.href !== link.href);
}

/** Rebase ranges after one text edit. Ranges touched by the edit are removed;
 * untouched links remain, including links after the changed passage. */
export function rebaseTextLinks(links: TextLink[], previous: string, next: string): TextLink[] {
  if (previous === next) return normaliseTextLinks(links, next.length);

  let prefix = 0;
  while (prefix < previous.length && prefix < next.length && previous[prefix] === next[prefix]) prefix += 1;

  let suffix = 0;
  while (
    suffix < previous.length - prefix
    && suffix < next.length - prefix
    && previous[previous.length - 1 - suffix] === next[next.length - 1 - suffix]
  ) suffix += 1;

  const oldEnd = previous.length - suffix;
  const shift = next.length - previous.length;
  const rebased = links.flatMap((link): TextLink[] => {
    if (link.end <= prefix) return [link];
    if (link.start >= oldEnd) return [{ ...link, start: link.start + shift, end: link.end + shift }];
    return [];
  });
  return normaliseTextLinks(rebased, next.length);
}
