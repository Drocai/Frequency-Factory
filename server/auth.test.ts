import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database functions
vi.mock('./db', () => ({
  getUserById: vi.fn(),
  updateUserAvatar: vi.fn(),
  awardTokens: vi.fn(),
  spendTokens: vi.fn(),
  getTokenHistory: vi.fn(),
  createSubmission: vi.fn(),
  getSubmissions: vi.fn(),
  createPrediction: vi.fn(),
  getUserPredictionForSubmission: vi.fn(),
  createComment: vi.fn(),
  getCommentsForSubmission: vi.fn(),
  toggleLike: vi.fn(),
  getUserLikes: vi.fn(),
}));

import * as db from './db';

describe('User Authentication and Token System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('User Profile', () => {
    it('should return user profile with token balance', async () => {
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        tokenBalance: 50,
        avatarId: 1,
        avatarName: 'BeatMaster',
        hasCompletedOnboarding: 1,
        totalTokensEarned: 100,
        totalPredictions: 5,
        accuratePredictions: 3,
        createdAt: new Date(),
      };

      vi.mocked(db.getUserById).mockResolvedValue(mockUser as any);

      const user = await db.getUserById(1);
      
      expect(user).toBeDefined();
      expect(user?.tokenBalance).toBe(50);
      expect(user?.avatarName).toBe('BeatMaster');
    });

    it('should update user avatar', async () => {
      vi.mocked(db.updateUserAvatar).mockResolvedValue(undefined);

      await db.updateUserAvatar(1, 2, 'SynthQueen');

      expect(db.updateUserAvatar).toHaveBeenCalledWith(1, 2, 'SynthQueen');
    });
  });

  describe('Token System', () => {
    it('should award tokens for submission', async () => {
      vi.mocked(db.awardTokens).mockResolvedValue(51);

      const newBalance = await db.awardTokens(1, 1, 'submit_track', 'Submitted track');

      expect(newBalance).toBe(51);
      expect(db.awardTokens).toHaveBeenCalledWith(1, 1, 'submit_track', 'Submitted track');
    });

    it('should award tokens for prediction', async () => {
      vi.mocked(db.awardTokens).mockResolvedValue(55);

      const newBalance = await db.awardTokens(1, 5, 'prediction', 'Certified a track');

      expect(newBalance).toBe(55);
    });

    it('should award tokens for comment', async () => {
      vi.mocked(db.awardTokens).mockResolvedValue(51);

      const newBalance = await db.awardTokens(1, 1, 'comment', 'Posted a comment');

      expect(newBalance).toBe(51);
    });

    it('should spend tokens for queue skip', async () => {
      vi.mocked(db.spendTokens).mockResolvedValue({ success: true, balance: 40 });

      const result = await db.spendTokens(1, 10, 'skip_queue', 'Skipped queue');

      expect(result).toEqual({ success: true, balance: 40 });
    });

    it('should reject spend when insufficient balance', async () => {
      vi.mocked(db.spendTokens).mockResolvedValue({ error: 'insufficient_balance', balance: 5 });

      const result = await db.spendTokens(1, 10, 'skip_queue', 'Skipped queue');

      expect(result).toEqual({ error: 'insufficient_balance', balance: 5 });
    });

    it('should return token history', async () => {
      const mockHistory = [
        { id: 1, userId: 1, amount: 50, type: 'signup_bonus', balanceAfter: 50, createdAt: new Date() },
        { id: 2, userId: 1, amount: 1, type: 'submit_track', balanceAfter: 51, createdAt: new Date() },
        { id: 3, userId: 1, amount: 5, type: 'prediction', balanceAfter: 56, createdAt: new Date() },
      ];

      vi.mocked(db.getTokenHistory).mockResolvedValue(mockHistory as any);

      const history = await db.getTokenHistory(1, 20);

      expect(history).toHaveLength(3);
      expect(history[0].type).toBe('signup_bonus');
    });
  });

  describe('Submissions', () => {
    it('should create submission and return ticket number', async () => {
      vi.mocked(db.createSubmission).mockResolvedValue({
        id: 1,
        ticketNumber: 'FF-ABC123',
        queuePosition: 1,
      });

      const result = await db.createSubmission({
        userId: 1,
        artistName: 'Test Artist',
        trackTitle: 'Test Track',
        genre: 'Hip-Hop',
      } as any);

      expect(result).toBeDefined();
      expect(result?.ticketNumber).toMatch(/^FF-/);
    });

    it('should return list of submissions', async () => {
      const mockSubmissions = [
        { id: 1, artistName: 'Artist 1', trackTitle: 'Track 1', status: 'approved' },
        { id: 2, artistName: 'Artist 2', trackTitle: 'Track 2', status: 'approved' },
      ];

      vi.mocked(db.getSubmissions).mockResolvedValue(mockSubmissions as any);

      const submissions = await db.getSubmissions('approved', 20);

      expect(submissions).toHaveLength(2);
    });
  });

  describe('Predictions', () => {
    it('should create prediction', async () => {
      vi.mocked(db.createPrediction).mockResolvedValue({ id: 1 });

      const result = await db.createPrediction({
        userId: 1,
        submissionId: 1,
        hookStrength: 75,
        originality: 80,
        productionQuality: 70,
        overallScore: 75,
      } as any);

      expect(result?.id).toBe(1);
    });

    it('should check if user already predicted', async () => {
      vi.mocked(db.getUserPredictionForSubmission).mockResolvedValue({
        id: 1,
        userId: 1,
        submissionId: 1,
        hookStrength: 75,
      } as any);

      const existing = await db.getUserPredictionForSubmission(1, 1);

      expect(existing).toBeDefined();
      expect(existing?.hookStrength).toBe(75);
    });

    it('should return null if no prediction exists', async () => {
      vi.mocked(db.getUserPredictionForSubmission).mockResolvedValue(null);

      const existing = await db.getUserPredictionForSubmission(1, 999);

      expect(existing).toBeNull();
    });
  });

  describe('Comments', () => {
    it('should create comment', async () => {
      vi.mocked(db.createComment).mockResolvedValue({ id: 1 });

      const result = await db.createComment({
        userId: 1,
        submissionId: 1,
        userName: 'BeatMaster',
        content: 'Great track!',
      } as any);

      expect(result?.id).toBe(1);
    });

    it('should return comments for submission', async () => {
      const mockComments = [
        { id: 1, userName: 'User1', content: 'Nice!', createdAt: new Date() },
        { id: 2, userName: 'User2', content: 'Fire!', createdAt: new Date() },
      ];

      vi.mocked(db.getCommentsForSubmission).mockResolvedValue(mockComments as any);

      const comments = await db.getCommentsForSubmission(1);

      expect(comments).toHaveLength(2);
    });
  });

  describe('Likes', () => {
    it('should toggle like on', async () => {
      vi.mocked(db.toggleLike).mockResolvedValue({ liked: true });

      const result = await db.toggleLike(1, 1);

      expect(result?.liked).toBe(true);
    });

    it('should toggle like off', async () => {
      vi.mocked(db.toggleLike).mockResolvedValue({ liked: false });

      const result = await db.toggleLike(1, 1);

      expect(result?.liked).toBe(false);
    });

    it('should return user likes', async () => {
      vi.mocked(db.getUserLikes).mockResolvedValue([1, 2, 3]);

      const likes = await db.getUserLikes(1);

      expect(likes).toEqual([1, 2, 3]);
    });
  });
});

describe('Token Award Amounts', () => {
  it('should award correct amounts for different actions', () => {
    const tokenRewards = {
      signup_bonus: 50,
      submit_track: 1,
      prediction: 5,
      comment: 1,
      daily_login: 1,
      skip_queue: -10,
      referral: 10,
    };

    expect(tokenRewards.signup_bonus).toBe(50);
    expect(tokenRewards.submit_track).toBe(1);
    expect(tokenRewards.prediction).toBe(5);
    expect(tokenRewards.comment).toBe(1);
    expect(tokenRewards.skip_queue).toBe(-10);
  });
});
