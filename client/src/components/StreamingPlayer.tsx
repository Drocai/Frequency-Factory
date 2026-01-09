import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, ExternalLink } from 'lucide-react';
import { parseStreamingUrl, getPlatformInfo, type StreamingPlatform } from '@/lib/streamingUtils';

interface StreamingPlayerProps {
  url: string;
  autoplay?: boolean;
  showControls?: boolean;
  height?: number;
  className?: string;
}

/**
 * Unified streaming player component that handles YouTube, Spotify, and SoundCloud embeds
 */
export default function StreamingPlayer({ 
  url, 
  autoplay = false,
  showControls = true,
  height = 80,
  className = '' 
}: StreamingPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<any>(null);

  const parsed = parseStreamingUrl(url);
  const platformInfo = getPlatformInfo(parsed.platform);

  useEffect(() => {
    if (!parsed.embedUrl) {
      setError('Invalid streaming URL');
      setIsLoading(false);
      return;
    }

    // For YouTube, we can use the iframe API
    if (parsed.platform === 'youtube' && parsed.id) {
      loadYouTubeAPI();
    } else {
      setIsLoading(false);
    }

    return () => {
      // Cleanup
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        playerRef.current.destroy();
      }
    };
  }, [url]);

  const loadYouTubeAPI = () => {
    // Check if YouTube API is already loaded
    if ((window as any).YT && (window as any).YT.Player) {
      initYouTubePlayer();
      return;
    }

    // Load YouTube iframe API
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    // API ready callback
    (window as any).onYouTubeIframeAPIReady = () => {
      initYouTubePlayer();
    };
  };

  const initYouTubePlayer = () => {
    if (!iframeRef.current || !parsed.id) return;

    try {
      playerRef.current = new (window as any).YT.Player(iframeRef.current, {
        videoId: parsed.id,
        height: height,
        width: '100%',
        playerVars: {
          autoplay: autoplay ? 1 : 0,
          controls: showControls ? 1 : 0,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: () => setIsLoading(false),
          onStateChange: (event: any) => {
            setIsPlaying(event.data === (window as any).YT.PlayerState.PLAYING);
          },
          onError: () => setError('Failed to load video'),
        },
      });
    } catch (err) {
      setError('Failed to initialize player');
      setIsLoading(false);
    }
  };

  const togglePlay = () => {
    if (parsed.platform === 'youtube' && playerRef.current) {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    }
    // For Spotify/SoundCloud, we can't control via iframe (requires premium/API)
  };

  const toggleMute = () => {
    if (parsed.platform === 'youtube' && playerRef.current) {
      if (isMuted) {
        playerRef.current.unMute();
      } else {
        playerRef.current.mute();
      }
      setIsMuted(!isMuted);
    }
  };

  if (error) {
    return (
      <div 
        className={`flex items-center justify-center rounded-lg ${className}`}
        style={{ 
          height: `${height}px`,
          background: 'linear-gradient(135deg, #2A2A2A 0%, #1A1A1A 100%)',
          border: '1px solid #3A3A3A',
        }}
      >
        <p className="text-gray-500 text-sm">{error}</p>
      </div>
    );
  }

  if (!parsed.embedUrl) {
    return (
      <div 
        className={`flex items-center justify-center rounded-lg ${className}`}
        style={{ 
          height: `${height}px`,
          background: 'linear-gradient(135deg, #2A2A2A 0%, #1A1A1A 100%)',
          border: '1px solid #3A3A3A',
        }}
      >
        <p className="text-gray-500 text-sm">No playable URL</p>
      </div>
    );
  }

  return (
    <div className={`relative rounded-lg overflow-hidden ${className}`}>
      {/* Platform Badge */}
      <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-1 rounded text-xs font-bold backdrop-blur-sm"
        style={{ 
          background: 'rgba(0, 0, 0, 0.7)',
          color: platformInfo.color,
        }}
      >
        <span>{platformInfo.icon}</span>
        <span>{platformInfo.name}</span>
      </div>

      {/* Open in Platform Button */}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-2 right-2 z-10 p-1.5 rounded backdrop-blur-sm hover:bg-white/20 transition"
        style={{ background: 'rgba(0, 0, 0, 0.7)' }}
      >
        <ExternalLink className="w-4 h-4 text-white" />
      </a>

      {/* Loading Overlay */}
      {isLoading && (
        <div 
          className="absolute inset-0 flex items-center justify-center z-20"
          style={{ background: 'rgba(0, 0, 0, 0.8)' }}
        >
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Iframe Embed */}
      {parsed.platform === 'youtube' ? (
        <div ref={iframeRef} style={{ height: `${height}px` }} />
      ) : (
        <iframe
          ref={iframeRef}
          src={parsed.embedUrl}
          width="100%"
          height={height}
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          onLoad={() => setIsLoading(false)}
          onError={() => setError('Failed to load player')}
        />
      )}

      {/* Custom Controls Overlay (YouTube only) */}
      {parsed.platform === 'youtube' && showControls && !isLoading && (
        <div className="absolute bottom-0 left-0 right-0 p-2 flex items-center gap-2 bg-gradient-to-t from-black/80 to-transparent">
          <button
            onClick={togglePlay}
            className="p-2 rounded-full hover:bg-white/20 transition"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-white" fill="white" />
            ) : (
              <Play className="w-5 h-5 text-white" fill="white" />
            )}
          </button>
          <button
            onClick={toggleMute}
            className="p-2 rounded-full hover:bg-white/20 transition"
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-white" />
            ) : (
              <Volume2 className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
