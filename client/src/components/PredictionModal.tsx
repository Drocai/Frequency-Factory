import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const colors = {
  primary: '#FF4500',
  primaryLight: '#FF6B35',
  gray900: '#0A0A0A',
  gray800: '#1A1A1A',
  gray700: '#2A2A2A',
  white: '#FFFFFF',
  gradientCard: 'linear-gradient(135deg, #2A2A2A 0%, #1A1A1A 100%)',
  glowRedStrong: '0 0 20px rgba(255, 69, 0, 0.8), 0 0 40px rgba(255, 69, 0, 0.6)',
  gradientPrimary: 'linear-gradient(135deg, #FF4500 0%, #FF6B35 100%)',
};

interface FactoryMetric {
  id: string;
  label: string;
  description: string;
  value: number;
}

interface PredictionModalProps {
  track: any;
  onClose: () => void;
  onPredict: (trackId: number, scores: { hookStrength: number; originality: number; productionQuality: number }) => void;
  userId: string;
}

export default function PredictionModal({ track, onClose, onPredict, userId }: PredictionModalProps) {
  const [metrics, setMetrics] = useState<FactoryMetric[]>([
    { id: 'hookStrength', label: 'Hook Strength', description: 'How memorable and infectious is the track?', value: 50 },
    { id: 'originality', label: 'Originality', description: 'Does it push creative boundaries?', value: 50 },
    { id: 'productionQuality', label: 'Production Quality', description: 'Professional mixing and mastering?', value: 50 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateMetric = (id: string, value: number) => {
    setMetrics(prev => prev.map(m => m.id === id ? { ...m, value } : m));
  };

  const overallScore = Math.round(metrics.reduce((sum, m) => sum + m.value, 0) / 3);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    const scores = {
      hookStrength: metrics.find(m => m.id === 'hookStrength')?.value || 50,
      originality: metrics.find(m => m.id === 'originality')?.value || 50,
      productionQuality: metrics.find(m => m.id === 'productionQuality')?.value || 50,
    };

    // Call parent handler which handles the tRPC mutation
    onPredict(track.id, scores);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.85)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 30 }}
        className="w-full max-w-md rounded-2xl p-6 overflow-y-auto max-h-[90vh]"
        style={{ background: colors.gradientCard, border: `1px solid ${colors.gray700}` }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-wide">Factory Metrics</h2>
            <p className="text-gray-400 text-sm mt-1">
              Rate "{track.trackTitle || track.track_title}" by {track.artistName || track.artist_name}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-gray-700 transition"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Description */}
        <p className="text-gray-400 text-sm mb-6 text-center">
          Every track submitted to Frequency Factory goes through our cosmic assembly line, 
          evaluated by our proprietary Factory Metrics system.
        </p>

        {/* Metrics */}
        <div className="space-y-6">
          {metrics.map(metric => (
            <div 
              key={metric.id}
              className="p-4 rounded-xl"
              style={{ background: colors.gray800 }}
            >
              <div className="text-center mb-3">
                <span 
                  className="text-4xl font-bold"
                  style={{ color: colors.primaryLight }}
                >
                  {metric.value}%
                </span>
                <h3 className="text-white font-semibold mt-1">{metric.label}</h3>
                <p className="text-gray-500 text-sm">{metric.description}</p>
              </div>
              
              {/* Slider */}
              <input
                type="range"
                min="0"
                max="100"
                value={metric.value}
                onChange={(e) => updateMetric(metric.id, parseInt(e.target.value))}
                className="w-full h-2 rounded-lg cursor-pointer appearance-none"
                style={{ 
                  background: `linear-gradient(to right, ${colors.primaryLight} 0%, ${colors.primaryLight} ${metric.value}%, ${colors.gray700} ${metric.value}%, ${colors.gray700} 100%)`,
                }}
              />
            </div>
          ))}
        </div>

        {/* Overall Score */}
        <div className="mt-6 p-4 rounded-xl text-center" style={{ background: colors.gray800 }}>
          <span className="text-gray-400 text-sm">Overall Score</span>
          <div 
            className="text-5xl font-bold mt-1"
            style={{ 
              color: colors.white,
              textShadow: `0 0 20px ${colors.primaryLight}`,
            }}
          >
            {overallScore}%
          </div>
        </div>

        {/* Submit Button */}
        <motion.button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full mt-6 p-4 rounded-xl text-white font-bold text-lg tracking-wider"
          style={{ 
            background: colors.gradientPrimary, 
            boxShadow: colors.glowRedStrong,
            opacity: isSubmitting ? 0.7 : 1,
          }}
          whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
          whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
        >
          {isSubmitting ? 'CERTIFYING...' : 'CERTIFY THIS TRACK'}
        </motion.button>

        {/* Token Reward Note */}
        <p className="text-center text-gray-500 text-xs mt-4">
          You'll earn +5 FT for certifying this track
        </p>
      </motion.div>

      {/* Custom slider styles */}
      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          background: ${colors.white};
          border: 3px solid ${colors.primary};
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 10px ${colors.primaryLight};
        }
        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: ${colors.white};
          border: 3px solid ${colors.primary};
          border-radius: 50%;
          cursor: pointer;
        }
      `}</style>
    </motion.div>
  );
}
