import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';

// Avatar data matching the mockup
const avatars = [
  { id: 'beatmaster', name: 'BeatMaster', color: '#1E90FF', tier: 'silver', description: 'The rhythm architect' },
  { id: 'synthqueen', name: 'SynthQueen', color: '#FF4500', tier: 'gold', description: 'Electronic royalty' },
  { id: 'synthqueen2', name: 'SynthQueen', color: '#FF6B35', tier: 'gold', description: 'Synth wave master' },
  { id: 'dj_pulse', name: 'DJ_Pulse', color: '#9B30FF', tier: 'silver', description: 'Bass drop specialist' },
  { id: 'audiophreak', name: 'AudioPhreak', color: '#32CD32', tier: 'silver', description: 'Sound explorer' },
  { id: 'freq_factory', name: 'Freq_Factory', color: '#9ACD32', tier: 'silver', description: 'Factory original' },
];

// Gear frame SVG component
const GearFrame = ({ color, tier, isSelected, children }: { color: string; tier: 'silver' | 'gold'; isSelected: boolean; children: React.ReactNode }) => {
  const frameColor = tier === 'gold' ? '#D4AF37' : '#A8A9AD';
  const frameGradient = tier === 'gold' 
    ? 'linear-gradient(135deg, #D4AF37 0%, #FFD700 50%, #B8860B 100%)'
    : 'linear-gradient(135deg, #A8A9AD 0%, #E8E8E8 50%, #6B6B6B 100%)';
  
  return (
    <motion.div
      className="relative cursor-pointer"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      animate={isSelected ? { scale: 1.1 } : { scale: 1 }}
    >
      {/* Outer gear frame */}
      <div 
        className="relative w-28 h-28 md:w-36 md:h-36"
        style={{
          background: frameGradient,
          borderRadius: '50%',
          padding: '4px',
          boxShadow: isSelected 
            ? `0 0 30px ${color}, 0 0 60px ${color}40`
            : `0 4px 20px rgba(0,0,0,0.5)`,
        }}
      >
        {/* Gear teeth - simplified CSS version */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              repeating-conic-gradient(
                from 0deg,
                ${frameColor} 0deg 15deg,
                transparent 15deg 30deg
              )
            `,
            borderRadius: '50%',
            mask: 'radial-gradient(circle at center, transparent 60%, black 60%)',
            WebkitMask: 'radial-gradient(circle at center, transparent 60%, black 60%)',
          }}
        />
        
        {/* Inner circle */}
        <div 
          className="absolute inset-2 rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #1A1A1A 0%, #0A0A0A 100%)',
            border: `3px solid ${frameColor}`,
          }}
        >
          {children}
        </div>
      </div>
      
      {/* Selection ring */}
      {isSelected && (
        <motion.div
          className="absolute -inset-2 rounded-full"
          style={{
            border: `3px solid ${color}`,
            boxShadow: `0 0 20px ${color}`,
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        />
      )}
    </motion.div>
  );
};

// Crown logo SVG with color
const CrownLogo = ({ color }: { color: string }) => (
  <svg viewBox="0 0 100 80" className="w-16 h-12 md:w-20 md:h-16">
    {/* Waveform crown shape */}
    <defs>
      <linearGradient id={`crown-${color.replace('#', '')}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={color} stopOpacity="0.8" />
        <stop offset="50%" stopColor={color} />
        <stop offset="100%" stopColor={color} stopOpacity="0.6" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    
    {/* Main crown waveform */}
    <path
      d="M10 60 L10 45 Q20 50 25 35 Q30 20 35 40 Q40 55 50 15 Q60 55 65 40 Q70 20 75 35 Q80 50 90 45 L90 60 Z"
      fill={`url(#crown-${color.replace('#', '')})`}
      filter="url(#glow)"
    />
    
    {/* Inner waveform lines */}
    <path
      d="M15 55 Q25 45 30 38 Q40 50 50 20 Q60 50 70 38 Q75 45 85 55"
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      opacity="0.6"
    />
    
    {/* Text */}
    <text x="50" y="72" textAnchor="middle" fill={color} fontSize="8" fontFamily="Rajdhani, sans-serif" fontWeight="bold">
      FREQUENCY FACTORY
    </text>
  </svg>
);

export default function AvatarSelection() {
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  const handleSelect = (avatarId: string) => {
    setSelectedAvatar(avatarId);
  };

  const handleConfirm = () => {
    if (selectedAvatar) {
      // Save to localStorage for now (will integrate with user profile later)
      localStorage.setItem('selectedAvatar', selectedAvatar);
      setLocation('/feed');
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{
        background: 'linear-gradient(180deg, #0A0A0A 0%, #1A1A1A 50%, #0A0A0A 100%)',
      }}
    >
      {/* Background circuit pattern */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(90deg, #FF4500 1px, transparent 1px),
            linear-gradient(180deg, #FF4500 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Avatar Grid */}
      <div className="relative z-10 grid grid-cols-3 gap-4 md:gap-8 mb-8">
        {avatars.map((avatar) => (
          <div key={avatar.id} className="flex flex-col items-center">
            <GearFrame 
              color={avatar.color} 
              tier={avatar.tier as 'silver' | 'gold'}
              isSelected={selectedAvatar === avatar.id}
            >
              <div onClick={() => handleSelect(avatar.id)}>
                <CrownLogo color={avatar.color} />
              </div>
            </GearFrame>
            <p 
              className="mt-3 text-sm md:text-base font-medium tracking-wide"
              style={{ 
                color: selectedAvatar === avatar.id ? avatar.color : '#A0A0A0',
                textShadow: selectedAvatar === avatar.id ? `0 0 10px ${avatar.color}` : 'none',
              }}
            >
              {avatar.name}
            </p>
          </div>
        ))}
      </div>

      {/* Choose Button */}
      <motion.button
        onClick={handleConfirm}
        disabled={!selectedAvatar}
        className="relative px-12 py-4 rounded-lg font-bold text-lg tracking-widest uppercase"
        style={{
          background: selectedAvatar 
            ? 'linear-gradient(135deg, #1E90FF 0%, #00BFFF 100%)'
            : 'linear-gradient(135deg, #333 0%, #222 100%)',
          color: selectedAvatar ? '#FFFFFF' : '#666',
          border: '2px solid',
          borderColor: selectedAvatar ? '#1E90FF' : '#333',
          boxShadow: selectedAvatar 
            ? '0 0 20px rgba(30, 144, 255, 0.5), inset 0 0 20px rgba(30, 144, 255, 0.2)'
            : 'none',
          cursor: selectedAvatar ? 'pointer' : 'not-allowed',
        }}
        whileHover={selectedAvatar ? { scale: 1.05 } : {}}
        whileTap={selectedAvatar ? { scale: 0.95 } : {}}
      >
        <span className="relative z-10">CHOOSE YOUR AVATAR</span>
        
        {/* Animated border */}
        {selectedAvatar && (
          <motion.div
            className="absolute inset-0 rounded-lg"
            style={{
              border: '2px solid transparent',
              background: 'linear-gradient(90deg, #1E90FF, #00BFFF, #1E90FF) border-box',
              WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
            }}
            animate={{
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
      </motion.button>

      {/* Helper text */}
      <p className="mt-4 text-gray-500 text-sm text-center">
        {selectedAvatar 
          ? `Selected: ${avatars.find(a => a.id === selectedAvatar)?.name}`
          : 'Tap an avatar to select your vibe-atar'
        }
      </p>
    </div>
  );
}
