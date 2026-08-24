import { describe, expect, it } from 'vitest';
import { spotifyTrackEmbedUrl } from './spotify-embed';

describe('spotifyTrackEmbedUrl', () => {
  it('turns shared track URLs and URIs into the official player URL', () => {
    expect(spotifyTrackEmbedUrl('https://open.spotify.com/intl-es/track/4uLU6hMCjMI75M1A2tKUQC?si=abc')).toBe(
      'https://open.spotify.com/embed/track/4uLU6hMCjMI75M1A2tKUQC',
    );
    expect(spotifyTrackEmbedUrl('spotify:track:4uLU6hMCjMI75M1A2tKUQC')).toBe(
      'https://open.spotify.com/embed/track/4uLU6hMCjMI75M1A2tKUQC',
    );
  });

  it('rejects non-Spotify URLs, playlists, and malformed IDs', () => {
    expect(spotifyTrackEmbedUrl('https://example.com/track/4uLU6hMCjMI75M1A2tKUQC')).toBeNull();
    expect(spotifyTrackEmbedUrl('https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M')).toBeNull();
    expect(spotifyTrackEmbedUrl('https://open.spotify.com/track/not-a-track')).toBeNull();
  });
});
