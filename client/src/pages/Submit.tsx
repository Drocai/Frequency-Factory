import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { CheckCircle2, ExternalLink, Sparkles, Check, LogIn } from 'lucide-react';
import { detectPlatform, getPlatformInfo } from '@/lib/streamingUtils';
import { toast } from 'sonner';
import BottomNav from '@/components/BottomNav';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { getLoginUrl } from '@/const';
import { Button } from '@/components/ui/button';

const colors = {
  primary: '#FF4500',
  primaryLight: '#FF6B35',
  teal: '#14B8A6',
  gray900: '#0A0A0A',
  gray800: '#1A1A1A',
  gray700: '#2A2A2A',
  gray600: '#3A3A3A',
  white: '#FFFFFF',
  textSecondary: '#A0A0A0',
};

const genres = [
  'Hip-Hop / Rap',
  'R&B / Soul',
  'Electronic / EDM',
  'Pop',
  'Rock',
  'Indie',
  'Jazz',
  'Lo-Fi',
  'Other',
];

interface FormData {
  artistName: string;
  trackTitle: string;
  email: string;
  bestTimestamp: string;
  streamingLink: string;
  genre: string;
  aiAssisted: string;
  notes: string;
}

export default function Submit() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');

  const [formData, setFormData] = useState<FormData>({
    artistName: '',
    trackTitle: '',
    email: '',
    bestTimestamp: '',
    streamingLink: '',
    genre: 'Hip-Hop / Rap',
    aiAssisted: 'No',
    notes: '',
  });

  // tRPC mutation for creating submission
  const createSubmission = trpc.submissions.create.useMutation({
    onSuccess: (data) => {
      if (data) {
        setTicketNumber(data.ticketNumber || `#${data.id}`);
        setSubmitted(true);
        toast.success(`Track submitted! +1 FT earned`);
      }
    },
    onError: (error) => {
      toast.error('Failed to submit track: ' + error.message);
      setIsSubmitting(false);
    },
  });

  // Calculate completeness score
  const calculateCompleteness = (): number => {
    let score = 0;
    if (formData.artistName.trim()) score += 20;
    if (formData.trackTitle.trim()) score += 20;
    if (formData.email.trim() && formData.email.includes('@')) score += 15;
    if (formData.streamingLink.trim()) score += 25;
    if (formData.genre) score += 10;
    if (formData.bestTimestamp.trim()) score += 10;
    return score;
  };

  const completeness = calculateCompleteness();
  const canSubmit = completeness >= 70 && isAuthenticated;

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error('Please sign in to submit tracks');
      return;
    }

    if (completeness < 70) {
      toast.error('Please fill in more fields (70% required)');
      return;
    }

    setIsSubmitting(true);

    // Detect platform from streaming link
    const platform = detectPlatform(formData.streamingLink);

    createSubmission.mutate({
      artistName: formData.artistName,
      trackTitle: formData.trackTitle,
      email: formData.email || undefined,
      bestTimestamp: formData.bestTimestamp || undefined,
      streamingLink: formData.streamingLink || undefined,
      genre: formData.genre || undefined,
      aiAssisted: formData.aiAssisted,
      notes: formData.notes || undefined,
      platform: platform !== 'unknown' ? platform : undefined,
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col pb-24" style={{ background: colors.gray900 }}>
        <div className="flex-1 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center max-w-md"
          >
            <div 
              className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #0D7377 0%, #14FFEC 100%)' }}
            >
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-2">You're In!</h2>
            <p className="text-gray-400 mb-6">
              Your track is now on the conveyor. You'll appear in the queue within seconds.
            </p>
            
            <div 
              className="p-4 rounded-xl mb-6"
              style={{ background: colors.gray800, border: `1px solid ${colors.gray700}` }}
            >
              <p className="text-gray-400 text-sm">Your Ticket Number</p>
              <p className="text-3xl font-bold text-white">{ticketNumber}</p>
              <p className="text-green-400 text-sm mt-2">+1 FT earned!</p>
            </div>

            <div className="flex gap-3">
              <motion.button
                onClick={() => setLocation('/monitor')}
                className="flex-1 px-6 py-3 rounded-xl font-bold"
                style={{ background: colors.teal, color: colors.white }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Jump to Live Monitor
              </motion.button>
              <motion.button
                onClick={() => {
                  setSubmitted(false);
                  setFormData({
                    artistName: '',
                    trackTitle: '',
                    email: '',
                    bestTimestamp: '',
                    streamingLink: '',
                    genre: 'Hip-Hop / Rap',
                    aiAssisted: 'No',
                    notes: '',
                  });
                }}
                className="px-6 py-3 rounded-xl font-bold"
                style={{ background: colors.gray700, color: colors.white }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Submit Another
              </motion.button>
            </div>
          </motion.div>
        </div>
        <BottomNav activeTab="submit" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pb-24" style={{ background: colors.gray900 }}>
      {/* Header */}
      <header 
        className="p-4 flex items-center justify-between"
        style={{ background: colors.gray800, borderBottom: `1px solid ${colors.gray700}` }}
      >
        <div className="flex items-center gap-3">
          <img src="/assets/frequency-crown.png" alt="FF" className="w-10 h-10" />
          <div>
            <h1 className="text-lg font-bold text-white">Frequency Factory</h1>
            <p className="text-gray-400 text-xs">Where raw tracks roll in & certified records roll out.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setLocation('/monitor')}
            className="px-3 py-1.5 rounded-lg text-sm"
            style={{ background: colors.gray700, color: colors.white }}
          >
            Live Queue Monitor
          </button>
        </div>
      </header>

      {/* Form */}
      <main className="flex-1 p-4 overflow-y-auto">
        <div 
          className="max-w-lg mx-auto p-6 rounded-2xl"
          style={{ background: colors.gray800, border: `1px solid ${colors.gray700}` }}
        >
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Submit your track</h2>
            <p className="text-gray-400 text-sm">
              Drop your info. You'll get a live ticket and appear on the conveyor within seconds.
            </p>
          </div>

          {/* Login Prompt */}
          {!isAuthenticated && (
            <div className="mb-6 p-4 rounded-xl" style={{ background: colors.gray700, border: `1px solid ${colors.gray600}` }}>
              <p className="text-gray-300 text-sm mb-3">Sign in to submit tracks and earn tokens!</p>
              <a href={getLoginUrl()}>
                <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In to Submit
                </Button>
              </a>
            </div>
          )}

          {/* Completeness Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Completeness</span>
              <span 
                className="font-bold"
                style={{ color: completeness >= 70 ? '#10B981' : colors.primaryLight }}
              >
                {completeness}%
              </span>
            </div>
            <div 
              className="h-2 rounded-full overflow-hidden"
              style={{ background: colors.gray700 }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ 
                  background: completeness >= 70 
                    ? 'linear-gradient(90deg, #10B981, #14FFEC)' 
                    : `linear-gradient(90deg, ${colors.primary}, ${colors.primaryLight})`,
                }}
                initial={{ width: 0 }}
                animate={{ width: `${completeness}%` }}
              />
            </div>
            <p className="text-gray-500 text-xs mt-1">70% required to submit</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Artist Name */}
            <div>
              <label className="block text-gray-300 text-sm mb-2">Artist / Act Name *</label>
              <input
                type="text"
                value={formData.artistName}
                onChange={(e) => updateField('artistName', e.target.value)}
                placeholder="e.g., D RoC"
                className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-orange-500"
                style={{ background: colors.gray700 }}
              />
            </div>

            {/* Track Title */}
            <div>
              <label className="block text-gray-300 text-sm mb-2">Track Title *</label>
              <input
                type="text"
                value={formData.trackTitle}
                onChange={(e) => updateField('trackTitle', e.target.value)}
                placeholder="e.g., Frequency Don't Fold"
                className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-orange-500"
                style={{ background: colors.gray700 }}
              />
            </div>

            {/* Email & Timestamp Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 text-sm mb-2">Email (to track your spot)</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-orange-500"
                  style={{ background: colors.gray700 }}
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-2">Best 45s starts at</label>
                <input
                  type="text"
                  value={formData.bestTimestamp}
                  onChange={(e) => updateField('bestTimestamp', e.target.value)}
                  placeholder="e.g., 0:45"
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-orange-500"
                  style={{ background: colors.gray700 }}
                />
              </div>
            </div>

            {/* Streaming Link */}
            <div>
              <label className="block text-gray-300 text-sm mb-2">
                Streaming Link (YouTube / Spotify / SoundCloud) *
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={formData.streamingLink}
                  onChange={(e) => updateField('streamingLink', e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-orange-500 pr-10"
                  style={{ background: colors.gray700 }}
                />
                {formData.streamingLink && detectPlatform(formData.streamingLink) !== 'unknown' ? (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs font-bold"
                    style={{ color: getPlatformInfo(detectPlatform(formData.streamingLink)).color }}
                  >
                    <Check className="w-4 h-4" />
                    {getPlatformInfo(detectPlatform(formData.streamingLink)).name}
                  </div>
                ) : (
                  <ExternalLink className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                )}
              </div>
              <p className="text-gray-500 text-xs mt-1">
                Paste a link to your track on any major platform
              </p>
            </div>

            {/* Genre & AI Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 text-sm mb-2">Genre Lane</label>
                <select
                  value={formData.genre}
                  onChange={(e) => updateField('genre', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-orange-500 appearance-none cursor-pointer"
                  style={{ background: colors.gray700 }}
                >
                  {genres.map(genre => (
                    <option key={genre} value={genre}>{genre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-2">AI-assisted?</label>
                <select
                  value={formData.aiAssisted}
                  onChange={(e) => updateField('aiAssisted', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-orange-500 appearance-none cursor-pointer"
                  style={{ background: colors.gray700 }}
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-gray-300 text-sm mb-2">Notes to Reviewers (optional)</label>
              <textarea
                value={formData.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder="Anything we should know?"
                rows={3}
                className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                style={{ background: colors.gray700 }}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <motion.button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                className="flex-1 px-6 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2"
                style={{ 
                  background: canSubmit ? colors.teal : colors.gray600,
                  color: colors.white,
                  cursor: canSubmit ? 'pointer' : 'not-allowed',
                }}
                whileHover={canSubmit ? { scale: 1.02 } : {}}
                whileTap={canSubmit ? { scale: 0.98 } : {}}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Get Ticket & Join Conveyor
                  </>
                )}
              </motion.button>
            </div>

            <motion.button
              type="button"
              onClick={() => setLocation('/monitor')}
              className="w-full px-6 py-3 rounded-xl font-medium"
              style={{ 
                background: 'transparent',
                border: `1px solid ${colors.gray600}`,
                color: colors.textSecondary,
              }}
              whileHover={{ borderColor: colors.teal }}
            >
              Jump to Live Monitor
            </motion.button>
          </form>

          {/* Token Reward Note */}
          <p className="text-center text-gray-500 text-xs mt-6">
            You'll earn +1 FT for submitting your track
          </p>
        </div>
      </main>

      <BottomNav activeTab="submit" />
    </div>
  );
}
