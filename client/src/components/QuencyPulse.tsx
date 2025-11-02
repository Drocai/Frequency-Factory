/**
 * QuencyPulse - QUENCY's Animated Waveform Avatar
 * 
 * A pulsating, ethereal waveform that represents QUENCY's presence.
 * The waveform animates with frequency colors (red, purple, blue, gold)
 * and responds to different states (idle, speaking, listening).
 */

import { useEffect, useRef, useState } from 'react';

interface QuencyPulseProps {
  /** Current state of QUENCY */
  state?: 'idle' | 'speaking' | 'listening';
  /** Size of the avatar in pixels */
  size?: number;
  /** Whether to show the glow effect */
  showGlow?: boolean;
  /** Custom className for styling */
  className?: string;
}

export function QuencyPulse({ 
  state = 'idle', 
  size = 200, 
  showGlow = true,
  className = '' 
}: QuencyPulseProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const [time, setTime] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = size;
    canvas.height = size;

    const centerX = size / 2;
    const centerY = size / 2;
    const baseRadius = size * 0.3;

    // Animation parameters based on state
    const stateParams = {
      idle: { speed: 0.02, amplitude: 0.15, frequency: 3 },
      speaking: { speed: 0.05, amplitude: 0.3, frequency: 5 },
      listening: { speed: 0.03, amplitude: 0.2, frequency: 4 },
    };

    const params = stateParams[state];

    const animate = () => {
      ctx.clearRect(0, 0, size, size);

      // Draw multiple waveform layers with different colors
      const colors = [
        { hue: 0, sat: 100, light: 50 },     // Red
        { hue: 270, sat: 100, light: 60 },   // Purple
        { hue: 210, sat: 100, light: 50 },   // Blue
        { hue: 45, sat: 100, light: 50 },    // Gold
      ];

      colors.forEach((color, index) => {
        ctx.beginPath();
        
        for (let angle = 0; angle < Math.PI * 2; angle += 0.01) {
          // Calculate waveform radius with multiple sine waves
          const wave1 = Math.sin(angle * params.frequency + time + index * 0.5) * params.amplitude;
          const wave2 = Math.sin(angle * (params.frequency * 2) - time * 0.5) * (params.amplitude * 0.5);
          const radius = baseRadius + (baseRadius * (wave1 + wave2));

          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;

          if (angle === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.closePath();

        // Create gradient for the waveform
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, baseRadius * 1.5);
        gradient.addColorStop(0, `hsla(${color.hue}, ${color.sat}%, ${color.light}%, 0.8)`);
        gradient.addColorStop(1, `hsla(${color.hue}, ${color.sat}%, ${color.light}%, 0.2)`);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.stroke();

        if (showGlow) {
          ctx.shadowBlur = 20;
          ctx.shadowColor = `hsl(${color.hue}, ${color.sat}%, ${color.light}%)`;
        }
      });

      setTime((t: number) => t + params.speed);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [state, size, showGlow, time]);

  return (
    <div className={`relative inline-block ${className}`}>
      <canvas
        ref={canvasRef}
        className="block"
        style={{ width: size, height: size }}
      />
      {showGlow && (
        <div 
          className="absolute inset-0 blur-xl opacity-50 animate-pulse-cosmic"
          style={{
            background: 'radial-gradient(circle, rgba(255,107,26,0.3) 0%, rgba(153,51,255,0.2) 50%, rgba(51,153,255,0.1) 100%)',
          }}
        />
      )}
    </div>
  );
}

/**
 * QuencyAvatar - A simpler, static version of QUENCY's avatar
 * Uses the frequency crown logo with a pulsing glow effect
 */

interface QuencyAvatarProps {
  size?: number;
  className?: string;
}

export function QuencyAvatar({ size = 100, className = '' }: QuencyAvatarProps) {
  return (
    <div className={`relative inline-block ${className}`}>
      <img
        src="/assets/logo-frequency-crown.png"
        alt="QUENCY"
        className="block animate-glow-pulse"
        style={{ width: size, height: size }}
      />
      <div 
        className="absolute inset-0 blur-lg opacity-30 animate-pulse-cosmic"
        style={{
          background: 'radial-gradient(circle, rgba(255,107,26,0.5) 0%, rgba(153,51,255,0.3) 100%)',
        }}
      />
    </div>
  );
}
