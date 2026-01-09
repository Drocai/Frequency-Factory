import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, Flame, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DailyBonusModalProps {
  isOpen: boolean;
  onClose: () => void;
  bonusData: {
    awarded: number;
    baseBonus: number;
    streakBonus: number;
    streak: number;
    balance: number;
  } | null;
}

const colors = {
  primary: '#FF4500',
  primaryLight: '#FF6B35',
  gold: '#FFD700',
  teal: '#14B8A6',
  gray900: '#0A0A0A',
  gray800: '#1A1A1A',
  gray700: '#2A2A2A',
  white: '#FFFFFF',
};

export default function DailyBonusModal({ isOpen, onClose, bonusData }: DailyBonusModalProps) {
  if (!isOpen || !bonusData) return null;

  const isStreakMilestone = bonusData.streakBonus > 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.85)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 20 }}
          className="w-full max-w-sm rounded-2xl overflow-hidden relative"
          style={{ background: colors.gray800 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Confetti/Celebration Background */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              background: `radial-gradient(circle at 30% 20%, ${colors.gold}40 0%, transparent 50%),
                          radial-gradient(circle at 70% 80%, ${colors.primary}40 0%, transparent 50%)`,
            }}
          />

          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-700 rounded-lg z-10"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>

          {/* Content */}
          <div className="relative z-10 p-6 text-center">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ 
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.gold} 100%)`,
                boxShadow: `0 0 30px ${colors.gold}60`,
              }}
            >
              {isStreakMilestone ? (
                <Trophy className="w-10 h-10 text-white" />
              ) : (
                <Gift className="w-10 h-10 text-white" />
              )}
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-white mb-2"
            >
              {isStreakMilestone ? 'Streak Milestone!' : 'Daily Bonus!'}
            </motion.h2>

            {/* Streak Display */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-center gap-2 mb-4"
            >
              <Flame className="w-5 h-5 text-orange-400" />
              <span className="text-orange-400 font-bold">{bonusData.streak} Day Streak</span>
            </motion.div>

            {/* Token Award */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, type: 'spring' }}
              className="mb-6"
            >
              <div 
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl"
                style={{ 
                  background: colors.gray700,
                  border: `2px solid ${colors.gold}40`,
                }}
              >
                <span className="text-4xl font-bold text-white">+{bonusData.awarded}</span>
                <span className="text-2xl font-bold text-orange-400">FT</span>
              </div>
            </motion.div>

            {/* Breakdown */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="space-y-2 mb-6"
            >
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Daily Bonus</span>
                <span className="text-white">+{bonusData.baseBonus} FT</span>
              </div>
              {bonusData.streakBonus > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-orange-400">🔥 Streak Bonus</span>
                  <span className="text-orange-400 font-bold">+{bonusData.streakBonus} FT</span>
                </div>
              )}
              <div className="border-t pt-2 mt-2" style={{ borderColor: colors.gray700 }}>
                <div className="flex justify-between">
                  <span className="text-gray-400">New Balance</span>
                  <span className="text-white font-bold">{bonusData.balance} FT</span>
                </div>
              </div>
            </motion.div>

            {/* Streak Progress */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mb-6"
            >
              <p className="text-gray-400 text-sm mb-2">Next milestone: {getNextMilestone(bonusData.streak)} days</p>
              <div className="h-2 rounded-full bg-gray-700 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${getStreakProgress(bonusData.streak)}%` }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                  className="h-full rounded-full"
                  style={{ 
                    background: `linear-gradient(90deg, ${colors.primary}, ${colors.gold})`,
                  }}
                />
              </div>
            </motion.div>

            {/* CTA */}
            <Button
              onClick={onClose}
              className="w-full py-3 font-bold"
              style={{ 
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)`,
              }}
            >
              Awesome!
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function getNextMilestone(currentStreak: number): number {
  const milestones = [7, 14, 21, 30, 60, 90, 180, 365];
  for (const milestone of milestones) {
    if (currentStreak < milestone) return milestone;
  }
  return currentStreak + 7; // After 365, every 7 days
}

function getStreakProgress(currentStreak: number): number {
  const nextMilestone = getNextMilestone(currentStreak);
  const prevMilestone = getPrevMilestone(currentStreak);
  const progress = ((currentStreak - prevMilestone) / (nextMilestone - prevMilestone)) * 100;
  return Math.min(100, Math.max(0, progress));
}

function getPrevMilestone(currentStreak: number): number {
  const milestones = [0, 7, 14, 21, 30, 60, 90, 180, 365];
  for (let i = milestones.length - 1; i >= 0; i--) {
    if (currentStreak >= milestones[i]) return milestones[i];
  }
  return 0;
}
