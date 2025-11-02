/**
 * CosmicBackground - Layered cosmic environment
 * 
 * Creates the immersive space environment with:
 * - Animated starfield
 * - Nebula clouds
 * - Hexagonal grid overlay
 * - Floating particles
 */

import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
}

export function CosmicBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas to full viewport
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize stars
    const initStars = () => {
      const stars: Star[] = [];
      const starCount = 200;
      
      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 0.5,
          speed: Math.random() * 0.5 + 0.1,
          opacity: Math.random() * 0.5 + 0.5,
        });
      }
      
      starsRef.current = stars;
    };

    initStars();

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw stars
      starsRef.current.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.fill();

        // Twinkle effect
        star.opacity += (Math.random() - 0.5) * 0.02;
        star.opacity = Math.max(0.3, Math.min(1, star.opacity));

        // Slow drift
        star.y += star.speed;
        if (star.y > canvas.height) {
          star.y = 0;
          star.x = Math.random() * canvas.width;
        }
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Deep space gradient background */}
      <div className="absolute inset-0 cosmic-bg-void" />
      
      {/* Nebula clouds */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: `
            radial-gradient(ellipse at 20% 30%, rgba(255, 107, 26, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 70%, rgba(153, 51, 255, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(51, 153, 255, 0.1) 0%, transparent 50%)
          `,
        }}
      />

      {/* Animated starfield canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
      />

      {/* Hexagonal grid overlay */}
      <div className="absolute inset-0 hexagonal-grid opacity-20" />

      {/* Vignette effect */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, transparent 0%, rgba(0, 0, 0, 0.5) 100%)',
        }}
      />
    </div>
  );
}

/**
 * FrequencyBridge - The hexagonal light bridge animation
 * Used for loading states and page transitions
 */

interface FrequencyBridgeProps {
  /** Whether the bridge is currently active/visible */
  active?: boolean;
  /** Callback when animation completes */
  onComplete?: () => void;
}

export function FrequencyBridge({ active = false, onComplete }: FrequencyBridgeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let progress = 0;
    const duration = 2000; // 2 seconds
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      progress = Math.min(elapsed / duration, 1);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw hexagonal bridge extending from bottom to top
      const centerX = canvas.width / 2;
      const hexSize = 40;
      const rows = Math.floor(canvas.height / (hexSize * 1.5)) + 2;
      const cols = Math.floor(canvas.width / (hexSize * 2)) + 2;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = col * hexSize * 1.5 + (row % 2) * hexSize * 0.75;
          const y = row * hexSize * 1.3;

          // Only draw hexagons that are part of the bridge path
          const distanceFromCenter = Math.abs(x - centerX) / canvas.width;
          const bridgeWidth = 0.3 - distanceFromCenter;
          
          if (bridgeWidth > 0 && y < canvas.height * progress) {
            drawHexagon(ctx, x, y, hexSize, progress);
          }
        }
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else if (onComplete) {
        onComplete();
      }
    };

    animate();
  }, [active, onComplete]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 cosmic-bg-void" />
      <canvas ref={canvasRef} className="absolute inset-0" />
      <div className="relative z-10 text-center">
        <div className="text-4xl font-bold ft-gold-glow mb-4">
          FREQUENCY FACTORY
        </div>
        <div className="text-lg text-foreground/60">
          Crossing the cosmic bridge...
        </div>
      </div>
    </div>
  );
}

function drawHexagon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  progress: number
) {
  ctx.beginPath();
  
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    const hx = x + size * Math.cos(angle);
    const hy = y + size * Math.sin(angle);
    
    if (i === 0) {
      ctx.moveTo(hx, hy);
    } else {
      ctx.lineTo(hx, hy);
    }
  }
  
  ctx.closePath();

  // Gradient fill based on progress
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
  const opacity = 0.3 + progress * 0.4;
  gradient.addColorStop(0, `hsla(25, 95%, 53%, ${opacity})`);
  gradient.addColorStop(1, `hsla(270, 80%, 60%, ${opacity * 0.5})`);

  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.strokeStyle = `hsla(45, 100%, 50%, ${opacity})`;
  ctx.lineWidth = 2;
  ctx.stroke();
}
