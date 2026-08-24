const SPOTIFY_TRACK_ID = /^[A-Za-z0-9]{22}$/;

/** Turn a copied Spotify song link or URI into the official, safe player URL.
 * Query parameters are intentionally discarded: this component never accepts
 * arbitrary iframe source URLs or pasted HTML. */
export function spotifyTrackEmbedUrl(value: string | undefined): string | null {
  const raw = value?.trim();
  if (!raw) return null;

  const uriMatch = raw.match(/^spotify:track:([A-Za-z0-9]{22})$/i);
  if (uriMatch) return `https://open.spotify.com/embed/track/${uriMatch[1]}`;

  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' || url.hostname !== 'open.spotify.com') return null;
    const parts = url.pathname.split('/').filter(Boolean);
    const trackIndex = parts.indexOf('track');
    const trackId = trackIndex >= 0 ? parts[trackIndex + 1] : undefined;
    return trackId && SPOTIFY_TRACK_ID.test(trackId)
      ? `https://open.spotify.com/embed/track/${trackId}`
      : null;
  } catch {
    return null;
  }
}
