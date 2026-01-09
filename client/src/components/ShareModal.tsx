import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Twitter, 
  Instagram, 
  Link2, 
  Download, 
  Check,
  Share2
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: {
    id: number;
    artistName: string;
    trackTitle: string;
    hookStrength?: number;
    originality?: number;
    productionQuality?: number;
    totalCertifications?: number;
  };
}

const colors = {
  primary: '#FF4500',
  primaryLight: '#FF6B35',
  teal: '#14B8A6',
  gold: '#FFD700',
  gray900: '#0A0A0A',
  gray800: '#1A1A1A',
  gray700: '#2A2A2A',
  white: '#FFFFFF',
};

export default function ShareModal({ isOpen, onClose, track }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const shareUrl = `${window.location.origin}/track/${track.id}`;
  const overallScore = track.hookStrength && track.originality && track.productionQuality
    ? Math.round((track.hookStrength + track.originality + track.productionQuality) / 3)
    : null;

  const shareText = overallScore
    ? `🎵 "${track.trackTitle}" by ${track.artistName} just got CERTIFIED on Frequency Factory! Factory Score: ${overallScore}% 🔥 #FrequencyFactory #NewMusic`
    : `🎵 Check out "${track.trackTitle}" by ${track.artistName} on Frequency Factory! 🔥 #FrequencyFactory #NewMusic`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
  };

  const handleInstagramShare = () => {
    // Instagram doesn't have a direct share URL, so we copy the text and show instructions
    navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
    toast.success('Caption copied! Open Instagram and paste in your story or post.');
  };

  const handleDownloadCard = async () => {
    // For now, show a toast - in production you'd use html2canvas or similar
    toast.info('Share card download coming soon!');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.8)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-md rounded-2xl overflow-hidden"
          style={{ background: colors.gray800 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: colors.gray700 }}>
            <div className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-orange-400" />
              <h2 className="text-lg font-bold text-white">Share Track</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-lg">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Preview Card */}
          <div className="p-4">
            <div 
              ref={cardRef}
              className="rounded-xl p-6 relative overflow-hidden"
              style={{ 
                background: `linear-gradient(135deg, ${colors.gray900} 0%, ${colors.gray800} 100%)`,
                border: `2px solid ${colors.primary}40`
              }}
            >
              {/* Crown watermark */}
              <div className="absolute top-4 right-4 opacity-20">
                <svg width="40" height="40" viewBox="0 0 100 100" fill={colors.primary}>
                  <path d="M50 10 L65 40 L90 30 L80 60 L85 80 L50 70 L15 80 L20 60 L10 30 L35 40 Z" />
                </svg>
              </div>

              {/* Content */}
              <div className="relative z-10">
                <p className="text-orange-400 text-sm font-medium mb-1">FREQUENCY FACTORY</p>
                <h3 className="text-2xl font-bold text-white mb-1">{track.trackTitle}</h3>
                <p className="text-gray-400 mb-4">by {track.artistName}</p>

                {overallScore && (
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">Factory Score</span>
                        <span className="text-white font-bold">{overallScore}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-700 overflow-hidden">
                        <div 
                          className="h-full rounded-full"
                          style={{ 
                            width: `${overallScore}%`,
                            background: `linear-gradient(90deg, ${colors.primary}, ${colors.gold})`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {track.totalCertifications && track.totalCertifications > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-400">
                      🏆 {track.totalCertifications} Certifications
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Share Options */}
          <div className="p-4 space-y-3">
            <p className="text-gray-400 text-sm mb-3">Share to:</p>
            
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleTwitterShare}
                className="flex items-center justify-center gap-2 py-3"
                style={{ background: '#1DA1F2' }}
              >
                <Twitter className="w-5 h-5" />
                Twitter / X
              </Button>

              <Button
                onClick={handleInstagramShare}
                className="flex items-center justify-center gap-2 py-3"
                style={{ background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }}
              >
                <Instagram className="w-5 h-5" />
                Instagram
              </Button>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleCopyLink}
                variant="outline"
                className="flex-1 flex items-center justify-center gap-2"
              >
                {copied ? <Check className="w-5 h-5 text-green-400" /> : <Link2 className="w-5 h-5" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </Button>

              <Button
                onClick={handleDownloadCard}
                variant="outline"
                className="flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Share Text Preview */}
          <div className="p-4 border-t" style={{ borderColor: colors.gray700 }}>
            <p className="text-gray-400 text-sm mb-2">Share message:</p>
            <div 
              className="p-3 rounded-lg text-sm text-gray-300"
              style={{ background: colors.gray700 }}
            >
              {shareText}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
