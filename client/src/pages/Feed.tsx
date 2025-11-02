import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Heart, MessageCircle, Send, Menu, Search, 
    Upload, Star, User, Play, Pause, Eye, EyeOff, Mail, Lock,
    CheckCircle, X, TrendingUp
} from 'lucide-react';
import WaveSurfer from 'wavesurfer.js';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

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
    white: '#FFFFFF',
    textSecondary: '#A0A0A0',
    gradientCard: 'linear-gradient(135deg, #2A2A2A 0%, #1A1A1A 100%)',
    glowRedStrong: '0 0 20px rgba(255, 69, 0, 0.8), 0 0 40px rgba(255, 69, 0, 0.6), 0 0 60px rgba(255, 69, 0, 0.4)',
    gradientPrimary: 'linear-gradient(135deg, #FF4500 0%, #FF6B35 100%)',
};

const tierMap = {
    red: { color: colors.primaryLight, glow: '0 0 10px rgba(255, 69, 0, 0.5)', gradient: [{ offset: 0, color: '#8B0000' }, { offset: 0.5, color: '#FF4500' }, { offset: 1, color: '#FF6B35' }] },
    blue: { color: colors.blueToken, glow: '0 0 10px rgba(30, 144, 255, 0.5)', gradient: [{ offset: 0, color: '#000080' }, { offset: 0.5, color: '#1E90FF' }, { offset: 1, color: '#00BFFF' }] },
    purple: { color: colors.purpleToken, glow: '0 0 10px rgba(139, 0, 255, 0.5)', gradient: [{ offset: 0, color: '#4B0082' }, { offset: 0.5, color: '#8B00FF' }, { offset: 1, color: '#FF00FF' }] },
    gold: { color: colors.goldToken, glow: '0 0 10px rgba(255, 215, 0, 0.5)', gradient: [{ offset: 0, color: '#8B4513' }, { offset: 0.5, color: '#FFA500' }, { offset: 1, color: '#FFD700' }] },
};

// WaveSurfer Player Component
const WaveSurferPlayer = React.memo(({ audioUrl, tierGradientStops }: { audioUrl: string; tierGradientStops: any[] }) => {
    const waveformRef = useRef<HTMLDivElement>(null);
    const wsInstanceRef = useRef<WaveSurfer | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        if (!waveformRef.current) return;
        if (wsInstanceRef.current) wsInstanceRef.current.destroy();
        
        const ws = WaveSurfer.create({
            container: waveformRef.current,
            url: audioUrl,
            height: 40,
            barWidth: 2,
            barGap: 1,
            barRadius: 2,
            waveColor: 'rgba(255, 255, 255, 0.2)',
            progressColor: 'rgba(255, 255, 255, 0.4)',
            cursorColor: colors.primaryLight,
            cursorWidth: 2,
            interact: true,
        });
        
        ws.on('play', () => setIsPlaying(true));
        ws.on('pause', () => setIsPlaying(false));
        ws.on('finish', () => setIsPlaying(false));
        wsInstanceRef.current = ws;
        
        return () => ws.destroy();
    }, [audioUrl, tierGradientStops]);

    const handlePlayPause = () => wsInstanceRef.current?.playPause();

    return (
        <div className="relative cursor-pointer" onClick={handlePlayPause}>
            <div ref={waveformRef} />
            {!isPlaying && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 backdrop-blur-sm">
                    <Play className="w-5 h-5 text-white" fill="white" />
                </div>
            )}
        </div>
    );
});
WaveSurferPlayer.displayName = 'WaveSurferPlayer';

// Prediction Modal Component
const PredictionModal = ({ track, onClose, onPredict, userId }: any) => {
    const [prediction, setPrediction] = useState(7.0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            // For demo mode, just simulate success without actually inserting
            if (!userId || userId.startsWith('demo-user-')) {
                onPredict(track.id, prediction);
                onClose();
                toast.success(`Prediction locked in: ${prediction}/10`);
                setIsSubmitting(false);
                return;
            }

            const { error } = await supabase
                .from('predictions')
                .insert({ 
                    user_id: userId, 
                    track_id: track.id, 
                    prediction_type: 'range',
                    prediction_value: { score: prediction },
                    confidence: 1.0,
                    star_rating: Math.round(prediction / 2)
                });
            
            if (error) throw error;
            
            onPredict(track.id, prediction);
            onClose();
            toast.success(`Prediction locked in: ${prediction}/10`);
        } catch (error: any) {
            console.error('Error submitting prediction:', error);
            toast.error('Failed to submit prediction');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0, 0, 0, 0.8)' }}
        >
            <motion.div
                initial={{ scale: 0.8, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 50 }}
                className="w-full max-w-sm rounded-2xl p-6"
                style={{ background: colors.gradientCard, border: `1px solid ${colors.gray700}` }}
            >
                <div className="flex justify-between items-center mb-4">
                    <h2 className="font-primary text-2xl text-white tracking-wider">CERTIFY TRACK</h2>
                    <motion.button whileTap={{ scale: 0.8 }} onClick={onClose} className="text-gray-500 hover:text-white">
                        <X className="w-6 h-6" />
                    </motion.button>
                </div>

                <p className="text-gray-400 mb-2">Rate "{track.track_title}" by {track.artist_name}</p>
                
                <div className="text-center my-8">
                    <span className="font-primary text-7xl text-white" style={{ textShadow: `0 0 20px ${colors.primaryLight}` }}>
                        {prediction.toFixed(1)}
                    </span>
                    <p className="font-secondary text-gray-500 uppercase tracking-widest">Prediction Score</p>
                </div>

                <div className="my-4">
                    <input
                        type="range"
                        min="0"
                        max="10"
                        step="0.1"
                        value={prediction}
                        onChange={(e) => setPrediction(parseFloat(e.target.value))}
                        className="w-full h-2 rounded-lg cursor-pointer prediction-slider"
                        style={{ background: `linear-gradient(to right, ${colors.primaryLight} 0%, ${colors.primaryLight} ${(prediction / 10) * 100}%, ${colors.gray700} ${(prediction / 10) * 100}%, ${colors.gray700} 100%)` }}
                    />
                    <div className="flex justify-between text-gray-500 text-xs mt-2">
                        <span>0.0</span>
                        <span>5.0</span>
                        <span>10.0</span>
                    </div>
                </div>

                <motion.button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full p-4 rounded-lg text-white font-bold font-primary tracking-wider text-lg"
                    style={{ background: colors.gradientPrimary, boxShadow: colors.glowRedStrong }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    {isSubmitting ? "LOCKING IN..." : `LOCK IN ${prediction.toFixed(1)}`}
                </motion.button>
            </motion.div>
            
            <style>{`
                .prediction-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 24px;
                    height: 24px;
                    background: ${colors.white};
                    border: 4px solid ${colors.primary};
                    border-radius: 50%;
                    cursor: pointer;
                    margin-top: -10px;
                    box-shadow: 0 0 10px ${colors.primaryLight};
                }
                .prediction-slider::-moz-range-thumb {
                    width: 20px;
                    height: 20px;
                    background: ${colors.white};
                    border: 4px solid ${colors.primary};
                    border-radius: 50%;
                    cursor: pointer;
                }
            `}</style>
        </motion.div>
    );
};

// Track Card Component
const TrackCard = ({ track, onPredictClick, hasPredicted }: any) => {
    const tier = tierMap.red; // Default tier for now

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-4 rounded-2xl p-4"
            style={{ background: colors.gradientCard, border: `1px solid ${colors.gray700}` }}
        >
            <div className="flex gap-4">
                <img 
                    src='/assets/frequency-crown.png' 
                    alt={track.artist_name}
                    className="w-16 h-16 rounded-full object-cover"
                />
                <div className="flex-1">
                    <h3 className="text-white font-semibold text-lg">{track.artist_name}</h3>
                    <p className="text-gray-400">{track.track_title}</p>
                    <span className="text-xs text-gray-500">{track.genre}</span>
                </div>
            </div>

            {track.audio_url && (
                <div className="mt-4">
                    <WaveSurferPlayer audioUrl={track.audio_url} tierGradientStops={tier.gradient} />
                </div>
            )}

            <div className="flex items-center justify-between mt-4">
                <div className="flex gap-4">
                    <button className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition">
                        <Heart className="w-5 h-5" />
                        <span>{track.likes || 0}</span>
                    </button>
                    <button className="flex items-center gap-2 text-gray-400 hover:text-blue-500 transition">
                        <MessageCircle className="w-5 h-5" />
                        <span>{track.comments || 0}</span>
                    </button>
                </div>

                <motion.button
                    onClick={() => onPredictClick(track)}
                    disabled={hasPredicted}
                    className="px-6 py-2 rounded-lg font-bold font-primary tracking-wider"
                    style={{ 
                        background: hasPredicted ? colors.gray700 : colors.gradientPrimary,
                        boxShadow: hasPredicted ? 'none' : colors.glowRedStrong,
                        color: colors.white
                    }}
                    whileHover={{ scale: hasPredicted ? 1 : 1.05 }}
                    whileTap={{ scale: hasPredicted ? 1 : 0.95 }}
                >
                    {hasPredicted ? 'CERTIFIED' : 'CERTIFY'}
                </motion.button>
            </div>
        </motion.div>
    );
};

// Token Balance Component
const TokenBalance = ({ balance }: { balance: number }) => (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: colors.gray800, border: `1px solid ${colors.gray700}` }}>
        <div className="w-6 h-6 rounded-full" style={{ background: colors.gradientPrimary }} />
        <span className="text-white font-bold">{balance} FT</span>
    </div>
);

// Bottom Navigation Item
const BottomNavItem = ({ icon: Icon, label, isActive }: any) => (
    <button className="flex flex-col items-center justify-center flex-1 gap-1">
        <Icon className="w-6 h-6" style={{ color: isActive ? colors.primary : colors.textSecondary }} />
        <span className="text-xs" style={{ color: isActive ? colors.primary : colors.textSecondary }}>{label}</span>
    </button>
);

// Main Feed Component
export default function Feed() {
    const [session, setSession] = useState<any>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [tracks, setTracks] = useState<any[]>([]);
    const [selectedTrack, setSelectedTrack] = useState<any>(null);
    const [userPredictions, setUserPredictions] = useState<Set<number>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [demoMode, setDemoMode] = useState(false);

    useEffect(() => {
        // Get session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUserId(session?.user?.id || null);
        });

        // Auth listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUserId(session?.user?.id || null);
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (!session && !demoMode) {
            setIsLoading(false);
            return;
        }

        // Fetch tracks
        const fetchTracks = async () => {
            const { data, error } = await supabase
                .from('submissions')
                .select('*')
                .eq('status', 'approved')
                .order('submitted_at', { ascending: false })
                .limit(20);

            if (error) {
                console.error('Error fetching tracks:', error);
            } else {
                setTracks(data || []);
            }
            setIsLoading(false);
        };

        fetchTracks();
    }, [session, demoMode]);

    const handlePredictClick = (track: any) => {
        setSelectedTrack(track);
    };

    const handleModalClose = () => {
        setSelectedTrack(null);
    };

    const handlePredictionSubmit = (trackId: number, predictionValue: number) => {
        setUserPredictions(prev => new Set(prev).add(trackId));
        console.log(`Prediction ${predictionValue} locked for track ${trackId}`);
    };

    if (!session && !demoMode) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: colors.gray900 }}>
                <div className="text-center max-w-md mx-auto p-6">
                    <img src="/assets/frequency-crown.png" alt="Frequency Factory" className="w-32 h-32 mx-auto mb-4" />
                    <h1 className="font-primary text-3xl text-white mb-4">FREQUENCY FACTORY</h1>
                    <p className="text-gray-400 mb-6">Sign in to start certifying tracks</p>
                    <div className="space-y-4">
                        <button 
                            onClick={() => {
                                // Demo mode - bypass auth for testing
                                setDemoMode(true);
                                setUserId('demo-user-' + Date.now());
                            }}
                            className="w-full px-8 py-3 rounded-lg font-bold font-primary tracking-wider"
                            style={{ background: colors.gradientPrimary, boxShadow: colors.glowRedStrong, color: colors.white }}
                        >
                            ENTER THE FACTORY
                        </button>
                        <p className="text-xs text-gray-500">Demo mode - No login required</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col" style={{ background: colors.gray900, fontFamily: 'Inter' }}>
            {/* Header */}
            <header className="p-4 flex items-center justify-between shadow-lg" style={{ background: colors.gray900 }}>
                <Menu className="w-6 h-6 text-white" />
                <div className="text-center">
                    <img src="/assets/frequency-crown.png" alt="Logo" className="w-8 h-8 mx-auto mb-1" />
                    <h1 className="font-primary text-xl text-white tracking-wider">FREQUENCY FACTORY</h1>
                </div>
                <TokenBalance balance={50} />
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto pt-4 pb-24">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-white">Loading...</div>
                    </div>
                ) : tracks.length > 0 ? (
                    <>
                        <h2 className="text-white font-semibold text-xl pl-4 mb-4">Personalized feed</h2>
                        <div className="space-y-4">
                            {tracks.map(track => (
                                <TrackCard 
                                    key={track.id} 
                                    track={track} 
                                    onPredictClick={handlePredictClick}
                                    hasPredicted={userPredictions.has(track.id)}
                                />
                            ))}
                        </div>
                    </>
                ) : (
                    <p className="text-center text-gray-500 py-6">No tracks available yet!</p>
                )}
            </main>

            {/* Prediction Modal */}
            <AnimatePresence>
                {selectedTrack && (
                    <PredictionModal 
                        track={selectedTrack} 
                        onClose={handleModalClose} 
                        onPredict={handlePredictionSubmit}
                        userId={userId} 
                    />
                )}
            </AnimatePresence>

            {/* Bottom Navigation */}
            <footer className="fixed bottom-0 left-0 right-0 h-20 shadow-2xl z-40" style={{ background: colors.gray800, borderTop: `1px solid ${colors.gray700}` }}>
                <div className="flex justify-around h-full">
                    <BottomNavItem icon={Menu} label="Home" isActive={true} />
                    <BottomNavItem icon={Search} label="Discover" isActive={false} />
                    <BottomNavItem icon={Upload} label="Submit" isActive={false} />
                    <BottomNavItem icon={Star} label="Rewards" isActive={false} />
                    <BottomNavItem icon={User} label="Profile" isActive={false} />
                </div>
            </footer>
        </div>
    );
}
