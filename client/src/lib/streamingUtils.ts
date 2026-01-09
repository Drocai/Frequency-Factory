/**
 * Utility functions for handling streaming platform URLs
 */

export type StreamingPlatform = 'youtube' | 'spotify' | 'soundcloud' | 'unknown';

export interface ParsedStreamingUrl {
  platform: StreamingPlatform;
  id: string | null;
  embedUrl: string | null;
}

/**
 * Extract YouTube video ID from various YouTube URL formats
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  
  // Standard watch URL: https://www.youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/[?&]v=([^&]+)/);
  if (watchMatch) return watchMatch[1];
  
  // Short URL: https://youtu.be/VIDEO_ID
  const shortMatch = url.match(/youtu\.be\/([^?]+)/);
  if (shortMatch) return shortMatch[1];
  
  // Embed URL: https://www.youtube.com/embed/VIDEO_ID
  const embedMatch = url.match(/youtube\.com\/embed\/([^?]+)/);
  if (embedMatch) return embedMatch[1];
  
  return null;
}

/**
 * Extract Spotify track/album/playlist ID from Spotify URL
 */
export function extractSpotifyId(url: string): string | null {
  if (!url) return null;
  
  // Standard URL: https://open.spotify.com/track/TRACK_ID
  // Also works for album, playlist, etc.
  const match = url.match(/spotify\.com\/(track|album|playlist|episode)\/([^?]+)/);
  if (match) return match[2];
  
  // Spotify URI: spotify:track:TRACK_ID
  const uriMatch = url.match(/spotify:(track|album|playlist|episode):([^?]+)/);
  if (uriMatch) return uriMatch[2];
  
  return null;
}

/**
 * Detect platform from URL
 */
export function detectPlatform(url: string): StreamingPlatform {
  if (!url) return 'unknown';
  
  const lowerUrl = url.toLowerCase();
  
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
    return 'youtube';
  }
  
  if (lowerUrl.includes('spotify.com') || lowerUrl.includes('spotify:')) {
    return 'spotify';
  }
  
  if (lowerUrl.includes('soundcloud.com')) {
    return 'soundcloud';
  }
  
  return 'unknown';
}

/**
 * Parse streaming URL and return platform, ID, and embed URL
 */
export function parseStreamingUrl(url: string): ParsedStreamingUrl {
  const platform = detectPlatform(url);
  
  switch (platform) {
    case 'youtube': {
      const id = extractYouTubeId(url);
      return {
        platform,
        id,
        embedUrl: id ? `https://www.youtube.com/embed/${id}?enablejsapi=1` : null,
      };
    }
    
    case 'spotify': {
      const id = extractSpotifyId(url);
      // Spotify embed URLs use the full path, not just ID
      const typeMatch = url.match(/spotify\.com\/(track|album|playlist|episode)/);
      const type = typeMatch ? typeMatch[1] : 'track';
      return {
        platform,
        id,
        embedUrl: id ? `https://open.spotify.com/embed/${type}/${id}` : null,
      };
    }
    
    case 'soundcloud': {
      // SoundCloud uses oEmbed API, but for simplicity we'll use direct URL
      return {
        platform,
        id: null,
        embedUrl: `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`,
      };
    }
    
    default:
      return {
        platform: 'unknown',
        id: null,
        embedUrl: null,
      };
  }
}

/**
 * Get platform icon/color
 */
export function getPlatformInfo(platform: StreamingPlatform) {
  switch (platform) {
    case 'youtube':
      return { name: 'YouTube', color: '#FF0000', icon: '▶' };
    case 'spotify':
      return { name: 'Spotify', color: '#1DB954', icon: '♫' };
    case 'soundcloud':
      return { name: 'SoundCloud', color: '#FF5500', icon: '☁' };
    default:
      return { name: 'Unknown', color: '#666666', icon: '?' };
  }
}
