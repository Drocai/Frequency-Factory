import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';

export default function Landing() {
    const [, setLocation] = useLocation();
    const [currentSection, setCurrentSection] = useState(0);

    const sections = [
        {
            id: 'hero',
            content: (
                <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
                    {/* User's actual crown logo */}
                    <motion.img 
                        src="/assets/frequency-crown-actual.png" 
                        alt="Frequency Factory"
                        className="w-80 h-80 mb-8 object-contain"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.8 }}
                    />
                    
                    {/* Metallic FREQUENCY FACTORY text */}
                    <h1 className="text-6xl font-bold mb-4 tracking-wider" style={{
                        background: 'linear-gradient(180deg, #C0C0C0 0%, #808080 50%, #606060 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        textShadow: '0 2px 10px rgba(192, 192, 192, 0.3)',
                        fontFamily: 'Impact, "Arial Black", sans-serif',
                        letterSpacing: '0.1em'
                    }}>
                        FREQUENCY<br/>FACTORY
                    </h1>
                    
                    <p className="text-gray-400 text-lg mb-8 max-w-md">
                        Where raw tracks get built into hits
                    </p>
                    
                    <div className="flex flex-col gap-4 w-full max-w-sm">
                        <button 
                            onClick={() => setLocation('/feed')}
                            className="w-full px-8 py-4 rounded-lg font-bold tracking-wider text-white transition-all"
                            style={{ 
                                background: '#FF4500',
                                boxShadow: '0 0 30px rgba(255, 69, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                                border: '1px solid rgba(255, 69, 0, 0.8)'
                            }}
                        >
                            ENTER THE FACTORY
                        </button>
                        
                        <button 
                            onClick={() => setCurrentSection(1)}
                            className="w-full px-8 py-4 rounded-lg font-bold tracking-wider text-gray-300 border-2 transition-all hover:bg-gray-900"
                            style={{ borderColor: '#404040', background: 'transparent' }}
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
                    <div className="max-w-md w-full rounded-2xl p-8 border" style={{ 
                        background: 'linear-gradient(135deg, #1A1A1A 0%, #2A2A2A 100%)',
                        borderColor: '#404040'
                    }}>
                        <img 
                            src="/assets/frequency-crown-actual.png" 
                            alt="QUENCY"
                            className="w-48 h-48 mx-auto mb-6 object-contain"
                        />
                        
                        <h2 className="text-4xl mb-4" style={{ 
                            color: '#8B00FF',
                            fontFamily: 'Impact, "Arial Black", sans-serif',
                            letterSpacing: '0.05em'
                        }}>
                            MEET QUENCY
                        </h2>
                        
                        <p className="text-gray-300 text-lg mb-4">
                            Your AI Superfan guide in the Frequency Factory. QUENCY hosts live streams, awards tokens, and helps you discover the next generation of hits.
                        </p>
                        
                        <p className="text-gray-400 italic">
                            "Welcome to the Factory, where frequencies become legends." - QUENCY
                        </p>
                    </div>
                </div>
            )
        },
        {
            id: 'earn',
            content: (
                <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
                    <div className="max-w-md w-full">
                        <h2 className="text-3xl text-white mb-4" style={{
                            fontFamily: 'Impact, "Arial Black", sans-serif',
                            letterSpacing: '0.05em'
                        }}>EARN TOKENS</h2>
                        
                        <p className="text-gray-300 text-lg mb-8">
                            Correct predictions earn you Frequency Tokens (FT). Climb the leaderboard and unlock rewards.
                        </p>
                        
                        <div className="rounded-2xl p-8 mb-8 border" style={{ 
                            background: 'linear-gradient(135deg, #1A1A1A 0%, #2A2A2A 100%)',
                            borderColor: '#404040'
                        }}>
                            <div className="text-7xl font-bold mb-4" style={{ color: '#FFD700' }}>03</div>
                            <h3 className="text-2xl text-white mb-4" style={{
                                fontFamily: 'Impact, "Arial Black", sans-serif',
                                letterSpacing: '0.05em'
                            }}>REDEEM & FLEX</h3>
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
                        <div className="rounded-2xl p-6 border" style={{ 
                            background: 'linear-gradient(135deg, #1A1A1A 0%, #2A2A2A 100%)',
                            borderColor: '#FF4500'
                        }}>
                            <img 
                                src="/assets/frequency-crown-actual.png" 
                                alt="Token Tiers"
                                className="w-32 h-32 mx-auto mb-4 object-contain"
                            />
                            <h3 className="text-3xl mb-2" style={{ 
                                color: '#FF4500',
                                fontFamily: 'Impact, "Arial Black", sans-serif',
                                letterSpacing: '0.05em'
                            }}>RED FT</h3>
                            <p className="text-gray-400 mb-2">Base Tier • Common</p>
                            <p className="text-gray-300">Earned for basic predictions and engagement</p>
                        </div>
                        
                        {/* Blue FT */}
                        <div className="rounded-2xl p-6 border" style={{ 
                            background: 'linear-gradient(135deg, #1A1A1A 0%, #2A2A2A 100%)',
                            borderColor: '#1E90FF'
                        }}>
                            <img 
                                src="/assets/frequency-crown-actual.png" 
                                alt="Token Tiers"
                                className="w-32 h-32 mx-auto mb-4 object-contain"
                            />
                            <h3 className="text-3xl mb-2" style={{ 
                                color: '#1E90FF',
                                fontFamily: 'Impact, "Arial Black", sans-serif',
                                letterSpacing: '0.05em'
                            }}>BLUE FT</h3>
                            <p className="text-gray-400 mb-2">Mid Tier • Uncommon</p>
                            <p className="text-gray-300">Earned for accurate predictions and consistency</p>
                        </div>
                        
                        {/* Purple FT */}
                        <div className="rounded-2xl p-6 border" style={{ 
                            background: 'linear-gradient(135deg, #1A1A1A 0%, #2A2A2A 100%)',
                            borderColor: '#8B00FF'
                        }}>
                            <img 
                                src="/assets/frequency-crown-actual.png" 
                                alt="Token Tiers"
                                className="w-32 h-32 mx-auto mb-4 object-contain"
                            />
                            <h3 className="text-3xl mb-2" style={{ 
                                color: '#8B00FF',
                                fontFamily: 'Impact, "Arial Black", sans-serif',
                                letterSpacing: '0.05em'
                            }}>PURPLE FT</h3>
                            <p className="text-gray-400 mb-2">High Tier • Rare</p>
                            <p className="text-gray-300">Earned for exceptional prediction accuracy</p>
                        </div>
                        
                        {/* Gold FT */}
                        <div className="rounded-2xl p-6 border" style={{ 
                            background: 'linear-gradient(135deg, #1A1A1A 0%, #2A2A2A 100%)',
                            borderColor: '#FFD700'
                        }}>
                            <img 
                                src="/assets/certified-badge-actual.png" 
                                alt="Gold FT"
                                className="w-32 h-32 mx-auto mb-4 object-contain"
                            />
                            <h3 className="text-3xl mb-2" style={{ 
                                color: '#FFD700',
                                fontFamily: 'Impact, "Arial Black", sans-serif',
                                letterSpacing: '0.05em'
                            }}>GOLD FT</h3>
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
                background: '#0A0A0A',
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
                                background: currentSection === idx ? '#FF4500' : '#404040',
                                boxShadow: currentSection === idx ? '0 0 20px rgba(255, 69, 0, 0.6)' : 'none'
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
                    className="fixed bottom-8 right-1/2 translate-x-1/2 w-16 h-16 rounded-full flex items-center justify-center border-2"
                    style={{ background: '#1A1A1A', borderColor: '#404040' }}
                >
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            )}
        </div>
    );
}
