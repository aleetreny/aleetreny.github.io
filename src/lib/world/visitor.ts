// What the board remembers about one visitor, and where.
//
// Three kinds of memory, kept apart on purpose:
//
//  - *ephemeral*: gone on reload. Where a toy was left, a random walk, a board
//    of Life, the splats when the paint is in session mode, zero gravity.
//  - *visitor*: this browser, under an anonymous id. Which page of the book
//    they were on, what they planted, how they voted, their best score.
//  - *global*: everybody's. Notes, the garden, answers, votes. That lives in
//    the database (see ./remote.ts), and falls back to this file when there is
//    no database to talk to.
//
// No accounts, ever. The identifier is a random string this browser made up
// about itself; it is not a fingerprint and it is not tied to a person.

const ID_KEY = 'board.visitor.id';

function jar(kind: 'local' | 'session'): Storage | null {
  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    // A blocked storage jar means the board forgets. It must never mean the
    // board breaks.
    return null;
  }
}

function randomId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `v-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  }
}

let cachedId: string | null = null;

/** This browser's anonymous handle. Made up here, kept here. */
export function visitorId(): string {
  if (cachedId) return cachedId;
  const store = jar('local');
  const existing = store?.getItem(ID_KEY);
  if (existing) { cachedId = existing; return existing; }
  const made = randomId();
  store?.setItem(ID_KEY, made);
  cachedId = made;
  return made;
}

/** A short, readable stand-in for the handle — what the owner sees in the
 *  moderation lists instead of a UUID nobody can hold in their head. */
export function shortId(id: string): string {
  const clean = id.replace(/[^a-z0-9]/gi, '');
  return clean.slice(0, 4).toLowerCase() + '·' + clean.slice(-3).toLowerCase();
}

export function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = jar('local')?.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeLocal(key: string, value: unknown): void {
  try {
    jar('local')?.setItem(key, JSON.stringify(value));
  } catch {
    // Nothing to do and nothing worth failing for.
  }
}

export function readSession<T>(key: string, fallback: T): T {
  try {
    const raw = jar('session')?.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeSession(key: string, value: unknown): void {
  try {
    jar('session')?.setItem(key, JSON.stringify(value));
  } catch {
    // As above.
  }
}

export function dropLocal(key: string): void {
  try { jar('local')?.removeItem(key); } catch { /* as above */ }
}

/** A crude, honest rate limit: at most `max` of this action per `windowMs`.
 *  It stops a bored visitor, not a determined one — which is the right amount
 *  of effort for a board with no accounts on it. */
export function underLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = readLocal<number[]>(`board.rate.${key}`, []).filter((at) => now - at < windowMs);
  if (recent.length >= max) return false;
  recent.push(now);
  writeLocal(`board.rate.${key}`, recent);
  return true;
}
