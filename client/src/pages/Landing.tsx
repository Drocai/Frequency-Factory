import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';

// Design system colors
const colors = {
    primary: '#FF4500',
    primaryLight: '#FF6B35',
    blueToken: '#1E90FF',
    purpleToken: '#8B00FF',
    goldToken: '#FFD700',
    gray900: '#0A0A0A',
    gray800: '#1A1A1A',
    gray700: '#2A2A2A',
    gray600: '#3A3A3A',
    white: '#FFFFFF',
    gradientPrimary: 'linear-gradient(135deg, #FF4500 0%, #FF6B35 100%)',
    gradientCard: 'linear-gradient(135deg, #1A1A1A 0%, #2A2A2A 100%)',
    glowRedStrong: '0 0 40px rgba(255, 69, 0, 0.6)',
    glowBlue: '0 0 30px rgba(30, 144, 255, 0.5)',
    glowPurple: '0 0 30px rgba(139, 0, 255, 0.5)',
    glowGold: '0 0 30px rgba(255, 215, 0, 0.5)',
};

export default function Landing() {
    const [, setLocation] = useLocation();
    const [currentSection, setCurrentSection] = useState(0);

    const sections = [
        {
            id: 'hero',
            content: (
                <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
                    <motion.img 
                        src="/assets/frequency-crown.png" 
                        alt="Frequency Factory"
                        className="w-64 h-64 mb-8"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.8 }}
                    />
                    
                    {/* Colorful gradient bars */}
                    <div className="flex gap-2 mb-8">
                        <div className="w-32 h-2 rounded" style={{ background: 'linear-gradient(90deg, #FF4500, #FF1493)' }}></div>
                        <div className="w-32 h-2 rounded" style={{ background: 'linear-gradient(90deg, #1E90FF, #00CED1)' }}></div>
                    </div>
                    
                    <h1 className="font-primary text-4xl text-white mb-4 tracking-wider">
                        Where raw tracks get built into hits
                    </h1>
                    
                    <p className="text-gray-400 text-lg mb-8 max-w-md">
                        Cross the cosmic bridge. Predict the next hit. Earn Frequency Tokens. Become a legend in the music universe.
                    </p>
                    
                    <div className="flex flex-col gap-4 w-full max-w-sm">
                        <button 
                            onClick={() => setLocation('/feed')}
                            className="w-full px-8 py-4 rounded-lg font-bold font-primary tracking-wider text-white"
                            style={{ background: colors.blueToken, boxShadow: colors.glowBlue }}
                        >
                            Begin Your Journey
                        </button>
                        
                        <button 
                            onClick={() => setCurrentSection(1)}
                            className="w-full px-8 py-4 rounded-lg font-bold font-primary tracking-wider text-white border-2"
                            style={{ borderColor: colors.gray600, background: 'transparent' }}
                        >
                            Learn More
                        </button>
                    </div>
                </div>
            )
        },
        {
            id: 'quency',
            content: (
                <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
                    <div className="max-w-md w-full rounded-2xl p-8" style={{ background: colors.gradientCard }}>
                        <img 
                            src="/assets/frequency-crown.png" 
                            alt="QUENCY"
                            className="w-48 h-48 mx-auto mb-6"
                        />
                        
                        <h2 className="font-primary text-4xl mb-4" style={{ color: colors.purpleToken }}>
                            Meet QUENCY
                        </h2>
                        
                        <p className="text-gray-300 text-lg mb-4">
                            Your AI Superfan guide in the Frequency Factory. QUENCY hosts live streams, awards tokens, and helps you discover the next generation of hits.
                        </p>
                        
                        <p className="text-gray-400 italic">
                            "Welcome to the Factory, where frequencies become legends." - QUENCY
                        </p>
                    </div>
                    
                    {/* Colorful gradient bar */}
                    <div className="mt-8 w-64 h-2 rounded" style={{ background: 'linear-gradient(90deg, #FF4500, #1E90FF, #FFD700)' }}></div>
                </div>
            )
        },
        {
            id: 'earn',
            content: (
                <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
                    <div className="max-w-md w-full">
                        <h2 className="font-primary text-3xl text-white mb-4">Earn Tokens</h2>
                        
                        <p className="text-gray-300 text-lg mb-8">
                            Correct predictions earn you Frequency Tokens (FT). Climb the leaderboard and unlock rewards.
                        </p>
                        
                        <div className="rounded-2xl p-8 mb-8" style={{ background: colors.gradientCard }}>
                            <div className="text-7xl font-bold mb-4" style={{ color: colors.goldToken }}>03</div>
                            <h3 className="font-primary text-2xl text-white mb-4">Redeem & Flex</h3>
                            <p className="text-gray-300">
                                Use your tokens for exclusive merch, discount codes, and bragging rights as a music oracle.
                            </p>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'tiers',
            content: (
                <div className="min-h-screen flex flex-col items-center justify-start px-6 py-12 overflow-y-auto">
                    <div className="max-w-md w-full space-y-6 pb-20">
                        {/* Red FT */}
                        <div className="rounded-2xl p-6" style={{ background: colors.gradientCard }}>
                            <img 
                                src="/assets/frequency-crown.png" 
                                alt="Token Tiers"
                                className="w-32 h-32 mx-auto mb-4"
                            />
                            <h3 className="font-primary text-3xl mb-2" style={{ color: colors.primary }}>Red FT</h3>
                            <p className="text-gray-400 mb-2">Base Tier • Common</p>
                            <p className="text-gray-300">Earned for basic predictions and engagement</p>
                        </div>
                        
                        {/* Blue FT */}
                        <div className="rounded-2xl p-6" style={{ background: colors.gradientCard }}>
                            <img 
                                src="/assets/frequency-crown.png" 
                                alt="Token Tiers"
                                className="w-32 h-32 mx-auto mb-4"
                            />
                            <h3 className="font-primary text-3xl mb-2" style={{ color: colors.blueToken }}>Blue FT</h3>
                            <p className="text-gray-400 mb-2">Mid Tier • Uncommon</p>
                            <p className="text-gray-300">Earned for accurate predictions and consistency</p>
                        </div>
                        
                        {/* Purple FT */}
                        <div className="rounded-2xl p-6" style={{ background: colors.gradientCard }}>
                            <img 
                                src="/assets/frequency-crown.png" 
                                alt="Token Tiers"
                                className="w-32 h-32 mx-auto mb-4"
                            />
                            <h3 className="font-primary text-3xl mb-2" style={{ color: colors.purpleToken }}>Purple FT</h3>
                            <p className="text-gray-400 mb-2">High Tier • Rare</p>
                            <p className="text-gray-300">Earned for exceptional prediction accuracy</p>
                        </div>
                        
                        {/* Gold FT */}
                        <div className="rounded-2xl p-6" style={{ background: colors.gradientCard }}>
                            <img 
                                src="/assets/certified-badge.png" 
                                alt="Gold FT"
                                className="w-32 h-32 mx-auto mb-4"
                            />
                            <h3 className="font-primary text-3xl mb-2" style={{ color: colors.goldToken }}>Gold FT</h3>
                            <p className="text-gray-400 mb-2">Top Tier • Legendary</p>
                            <p className="text-gray-300">Earned by top predictors and community legends</p>
                        </div>
                    </div>
                </div>
            )
        }
    ];

    return (
        <div 
            className="relative" 
            style={{ 
                background: colors.gray900,
                backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255, 69, 0, 0.05) 0%, transparent 50%)',
            }}
        >
            {/* Navigation dots */}
            {currentSection > 0 && (
                <div className="fixed top-8 right-8 z-50 flex flex-col gap-2">
                    {sections.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentSection(idx)}
                            className="w-3 h-3 rounded-full transition-all"
                            style={{ 
                                background: currentSection === idx ? colors.primary : colors.gray600,
                                boxShadow: currentSection === idx ? colors.glowRedStrong : 'none'
                            }}
                        />
                    ))}
                </div>
            )}
            
            {/* Current section */}
            <motion.div
                key={currentSection}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5 }}
            >
                {sections[currentSection].content}
            </motion.div>
            
            {/* Navigation arrow */}
            {currentSection < sections.length - 1 && currentSection > 0 && (
                <button
                    onClick={() => setCurrentSection(prev => Math.min(prev + 1, sections.length - 1))}
                    className="fixed bottom-8 right-1/2 translate-x-1/2 w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ background: colors.gray700, border: `2px solid ${colors.gray600}` }}
                >
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            )}
        </div>
    );
}
