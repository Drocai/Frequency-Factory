import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Music, CheckCircle } from 'lucide-react';

interface RecentSubmission {
  artistName: string;
  genre: string;
  timestamp: string;
}

const DEMO_SUBMISSIONS: RecentSubmission[] = [
  { artistName: 'MelodyX', genre: 'R&B', timestamp: '2m ago' },
  { artistName: 'BeatForge', genre: 'Hip-Hop', timestamp: '5m ago' },
  { artistName: 'SkylineVox', genre: 'Pop', timestamp: '8m ago' },
  { artistName: 'BassDrop93', genre: 'Electronic', timestamp: '12m ago' },
  { artistName: 'SoulWriter', genre: 'Soul', timestamp: '15m ago' },
  { artistName: 'NightOwlBeats', genre: 'Lo-Fi', timestamp: '18m ago' },
  { artistName: 'VocalFire', genre: 'Afrobeats', timestamp: '22m ago' },
  { artistName: 'ChromeWave', genre: 'Alternative', timestamp: '25m ago' },
];

interface SocialProofMarqueeProps {
  submissions?: RecentSubmission[];
}

export default function SocialProofMarquee({ submissions }: SocialProofMarqueeProps) {
  const items = submissions && submissions.length > 0 ? submissions : DEMO_SUBMISSIONS;
  // Double the items for seamless infinite scroll
  const doubled = [...items, ...items];

  return (
    <div className="w-full overflow-hidden py-3" style={{ background: 'rgba(255,69,0,0.05)', borderTop: '1px solid #222', borderBottom: '1px solid #222' }}>
      <motion.div
        className="flex gap-6 whitespace-nowrap"
        animate={{ x: [0, -(items.length * 240)] }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: 'loop',
            duration: items.length * 5,
            ease: 'linear',
          },
        }}
      >
        {doubled.map((sub, i) => (
          <div
            key={`${sub.artistName}-${i}`}
            className="flex items-center gap-2 shrink-0"
          >
            <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />
            <span className="text-gray-400 text-xs">
              <span className="text-white font-medium">{sub.artistName}</span>
              {' '}just landed
              {' '}<span className="text-orange-400">{sub.genre}</span>
            </span>
            <span className="text-gray-600 text-[10px]">{sub.timestamp}</span>
            <span className="text-gray-700 mx-2">|</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
