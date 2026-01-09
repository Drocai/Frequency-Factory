import { describe, it, expect } from 'vitest';

// Since the utilities are in client, we'll test the logic directly here
// This is a server-side test for the URL parsing logic

describe('Streaming URL Parsing Logic', () => {
  describe('YouTube ID extraction', () => {
    const extractYouTubeId = (url: string): string | null => {
      if (!url) return null;
      const watchMatch = url.match(/[?&]v=([^&]+)/);
      if (watchMatch) return watchMatch[1];
      const shortMatch = url.match(/youtu\.be\/([^?]+)/);
      if (shortMatch) return shortMatch[1];
      const embedMatch = url.match(/youtube\.com\/embed\/([^?]+)/);
      if (embedMatch) return embedMatch[1];
      return null;
    };

    it('should extract ID from standard watch URL', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      expect(extractYouTubeId(url)).toBe('dQw4w9WgXcQ');
    });

    it('should extract ID from short URL', () => {
      const url = 'https://youtu.be/dQw4w9WgXcQ';
      expect(extractYouTubeId(url)).toBe('dQw4w9WgXcQ');
    });

    it('should extract ID from embed URL', () => {
      const url = 'https://www.youtube.com/embed/dQw4w9WgXcQ';
      expect(extractYouTubeId(url)).toBe('dQw4w9WgXcQ');
    });

    it('should handle URL with additional parameters', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s';
      expect(extractYouTubeId(url)).toBe('dQw4w9WgXcQ');
    });

    it('should return null for invalid URL', () => {
      expect(extractYouTubeId('https://example.com')).toBeNull();
      expect(extractYouTubeId('')).toBeNull();
    });
  });

  describe('Spotify ID extraction', () => {
    const extractSpotifyId = (url: string): string | null => {
      if (!url) return null;
      const match = url.match(/spotify\.com\/(track|album|playlist|episode)\/([^?]+)/);
      if (match) return match[2];
      const uriMatch = url.match(/spotify:(track|album|playlist|episode):([^?]+)/);
      if (uriMatch) return uriMatch[2];
      return null;
    };

    it('should extract ID from track URL', () => {
      const url = 'https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp';
      expect(extractSpotifyId(url)).toBe('3n3Ppam7vgaVa1iaRUc9Lp');
    });

    it('should extract ID from album URL', () => {
      const url = 'https://open.spotify.com/album/1DFixLWuPkv3KT3TnV35m3';
      expect(extractSpotifyId(url)).toBe('1DFixLWuPkv3KT3TnV35m3');
    });

    it('should extract ID from playlist URL', () => {
      const url = 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M';
      expect(extractSpotifyId(url)).toBe('37i9dQZF1DXcBWIGoYBM5M');
    });

    it('should extract ID from Spotify URI', () => {
      const uri = 'spotify:track:3n3Ppam7vgaVa1iaRUc9Lp';
      expect(extractSpotifyId(uri)).toBe('3n3Ppam7vgaVa1iaRUc9Lp');
    });

    it('should return null for invalid URL', () => {
      expect(extractSpotifyId('https://example.com')).toBeNull();
      expect(extractSpotifyId('')).toBeNull();
    });
  });

  describe('Platform detection', () => {
    const detectPlatform = (url: string): string => {
      if (!url) return 'unknown';
      const lowerUrl = url.toLowerCase();
      if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'youtube';
      if (lowerUrl.includes('spotify.com') || lowerUrl.includes('spotify:')) return 'spotify';
      if (lowerUrl.includes('soundcloud.com')) return 'soundcloud';
      return 'unknown';
    };

    it('should detect YouTube', () => {
      expect(detectPlatform('https://www.youtube.com/watch?v=test')).toBe('youtube');
      expect(detectPlatform('https://youtu.be/test')).toBe('youtube');
    });

    it('should detect Spotify', () => {
      expect(detectPlatform('https://open.spotify.com/track/test')).toBe('spotify');
      expect(detectPlatform('spotify:track:test')).toBe('spotify');
    });

    it('should detect SoundCloud', () => {
      expect(detectPlatform('https://soundcloud.com/artist/track')).toBe('soundcloud');
    });

    it('should return unknown for invalid URL', () => {
      expect(detectPlatform('https://example.com')).toBe('unknown');
      expect(detectPlatform('')).toBe('unknown');
    });

    it('should be case insensitive', () => {
      expect(detectPlatform('https://WWW.YOUTUBE.COM/watch?v=test')).toBe('youtube');
      expect(detectPlatform('HTTPS://OPEN.SPOTIFY.COM/track/test')).toBe('spotify');
    });
  });
});
