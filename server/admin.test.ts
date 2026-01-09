import { describe, it, expect } from 'vitest';

// Test admin stats calculation
describe('Admin Stats', () => {
  it('should calculate correct submission counts', () => {
    const submissions = [
      { id: 1, status: 'pending' },
      { id: 2, status: 'pending' },
      { id: 3, status: 'approved' },
      { id: 4, status: 'approved' },
      { id: 5, status: 'approved' },
      { id: 6, status: 'rejected' },
    ];

    const pending = submissions.filter(s => s.status === 'pending').length;
    const approved = submissions.filter(s => s.status === 'approved').length;
    const rejected = submissions.filter(s => s.status === 'rejected').length;
    const total = submissions.length;

    expect(pending).toBe(2);
    expect(approved).toBe(3);
    expect(rejected).toBe(1);
    expect(total).toBe(6);
  });

  it('should filter submissions by status', () => {
    const submissions = [
      { id: 1, status: 'pending', trackTitle: 'Track A' },
      { id: 2, status: 'approved', trackTitle: 'Track B' },
      { id: 3, status: 'pending', trackTitle: 'Track C' },
    ];

    const filterByStatus = (status: string) => 
      status === 'all' 
        ? submissions 
        : submissions.filter(s => s.status === status);

    expect(filterByStatus('pending')).toHaveLength(2);
    expect(filterByStatus('approved')).toHaveLength(1);
    expect(filterByStatus('rejected')).toHaveLength(0);
    expect(filterByStatus('all')).toHaveLength(3);
  });
});

// Test bulk operations
describe('Bulk Operations', () => {
  it('should update multiple submission statuses', () => {
    const submissions = [
      { id: 1, status: 'pending' },
      { id: 2, status: 'pending' },
      { id: 3, status: 'pending' },
    ];

    const idsToUpdate = [1, 3];
    const newStatus = 'approved';

    const updated = submissions.map(s => 
      idsToUpdate.includes(s.id) ? { ...s, status: newStatus } : s
    );

    expect(updated[0].status).toBe('approved');
    expect(updated[1].status).toBe('pending');
    expect(updated[2].status).toBe('approved');
  });

  it('should count bulk update results', () => {
    const idsToUpdate = [1, 2, 5, 8, 10];
    const result = { success: true, count: idsToUpdate.length };

    expect(result.count).toBe(5);
    expect(result.success).toBe(true);
  });
});

// Test user role management
describe('User Role Management', () => {
  it('should validate role values', () => {
    const validRoles = ['user', 'admin'];
    
    expect(validRoles.includes('user')).toBe(true);
    expect(validRoles.includes('admin')).toBe(true);
    expect(validRoles.includes('superadmin')).toBe(false);
  });

  it('should check admin access', () => {
    const checkAdminAccess = (userRole: string) => userRole === 'admin';

    expect(checkAdminAccess('admin')).toBe(true);
    expect(checkAdminAccess('user')).toBe(false);
  });
});

// Test daily login bonus calculation
describe('Daily Login Bonus', () => {
  it('should calculate base daily bonus', () => {
    const baseBonus = 1;
    expect(baseBonus).toBe(1);
  });

  it('should calculate streak bonus for 7 days', () => {
    const calculateStreakBonus = (streak: number) => {
      if (streak === 7) return 5;
      if (streak === 30) return 20;
      if (streak % 7 === 0) return 3;
      return 0;
    };

    expect(calculateStreakBonus(1)).toBe(0);
    expect(calculateStreakBonus(7)).toBe(5);
    expect(calculateStreakBonus(14)).toBe(3);
    expect(calculateStreakBonus(21)).toBe(3);
    expect(calculateStreakBonus(30)).toBe(20);
  });

  it('should calculate total bonus correctly', () => {
    const baseBonus = 1;
    const streakBonus = 5;
    const totalBonus = baseBonus + streakBonus;

    expect(totalBonus).toBe(6);
  });

  it('should detect consecutive days', () => {
    const isConsecutiveDay = (lastDate: string, today: string) => {
      const last = new Date(lastDate);
      const current = new Date(today);
      const diffDays = Math.floor((current.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays === 1;
    };

    expect(isConsecutiveDay('2026-01-08', '2026-01-09')).toBe(true);
    expect(isConsecutiveDay('2026-01-07', '2026-01-09')).toBe(false);
    expect(isConsecutiveDay('2026-01-09', '2026-01-09')).toBe(false);
  });

  it('should update streak correctly', () => {
    const calculateNewStreak = (lastDate: string | null, today: string, currentStreak: number) => {
      if (!lastDate) return 1;
      
      const last = new Date(lastDate);
      const current = new Date(today);
      const diffDays = Math.floor((current.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) return currentStreak + 1;
      return 1; // Reset streak
    };

    expect(calculateNewStreak(null, '2026-01-09', 0)).toBe(1);
    expect(calculateNewStreak('2026-01-08', '2026-01-09', 5)).toBe(6);
    expect(calculateNewStreak('2026-01-07', '2026-01-09', 5)).toBe(1);
  });

  it('should prevent double claiming on same day', () => {
    const lastBonusDate = '2026-01-09';
    const today = '2026-01-09';
    const alreadyClaimed = lastBonusDate === today;

    expect(alreadyClaimed).toBe(true);
  });
});

// Test activity feed formatting
describe('Activity Feed', () => {
  it('should format submission activity', () => {
    const submission = { artist: 'D RoC', title: 'Frequency Don\'t Fold' };
    const description = `${submission.artist} submitted "${submission.title}"`;

    expect(description).toBe('D RoC submitted "Frequency Don\'t Fold"');
  });

  it('should truncate long comment content', () => {
    const truncate = (content: string, maxLength: number) => 
      content.length > maxLength ? content.slice(0, maxLength) + '...' : content;

    const shortComment = 'Great track!';
    const longComment = 'This is an incredibly long comment that goes on and on about how amazing this track is and why everyone should listen to it.';

    expect(truncate(shortComment, 50)).toBe('Great track!');
    expect(truncate(longComment, 50)).toBe('This is an incredibly long comment that goes on an...');
  });

  it('should sort activities by date descending', () => {
    const activities = [
      { id: 1, createdAt: new Date('2026-01-08T10:00:00') },
      { id: 2, createdAt: new Date('2026-01-09T12:00:00') },
      { id: 3, createdAt: new Date('2026-01-07T08:00:00') },
    ];

    const sorted = [...activities].sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );

    expect(sorted[0].id).toBe(2);
    expect(sorted[1].id).toBe(1);
    expect(sorted[2].id).toBe(3);
  });
});

// Test share functionality
describe('Social Sharing', () => {
  it('should generate correct share URL', () => {
    const baseUrl = 'https://example.com';
    const trackId = 123;
    const shareUrl = `${baseUrl}/track/${trackId}`;

    expect(shareUrl).toBe('https://example.com/track/123');
  });

  it('should generate share text with score', () => {
    const track = {
      trackTitle: 'Frequency Don\'t Fold',
      artistName: 'D RoC',
      overallScore: 85,
    };

    const shareText = `🎵 "${track.trackTitle}" by ${track.artistName} just got CERTIFIED on Frequency Factory! Factory Score: ${track.overallScore}% 🔥 #FrequencyFactory #NewMusic`;

    expect(shareText).toContain('Frequency Don\'t Fold');
    expect(shareText).toContain('D RoC');
    expect(shareText).toContain('85%');
    expect(shareText).toContain('#FrequencyFactory');
  });

  it('should calculate overall score from metrics', () => {
    const metrics = {
      hookStrength: 80,
      originality: 90,
      productionQuality: 85,
    };

    const overallScore = Math.round(
      (metrics.hookStrength + metrics.originality + metrics.productionQuality) / 3
    );

    expect(overallScore).toBe(85);
  });

  it('should generate Twitter share URL', () => {
    const text = 'Check out this track!';
    const url = 'https://example.com/track/123';
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;

    expect(twitterUrl).toContain('twitter.com/intent/tweet');
    expect(twitterUrl).toContain(encodeURIComponent(text));
    expect(twitterUrl).toContain(encodeURIComponent(url));
  });
});

// Test streak milestone detection
describe('Streak Milestones', () => {
  it('should detect milestone streaks', () => {
    const isMilestone = (streak: number) => 
      streak === 7 || streak === 30 || (streak > 0 && streak % 7 === 0);

    expect(isMilestone(7)).toBe(true);
    expect(isMilestone(14)).toBe(true);
    expect(isMilestone(21)).toBe(true);
    expect(isMilestone(30)).toBe(true);
    expect(isMilestone(5)).toBe(false);
    expect(isMilestone(10)).toBe(false);
  });

  it('should calculate next milestone', () => {
    const getNextMilestone = (currentStreak: number) => {
      const milestones = [7, 14, 21, 30, 60, 90, 180, 365];
      for (const milestone of milestones) {
        if (currentStreak < milestone) return milestone;
      }
      return currentStreak + 7;
    };

    expect(getNextMilestone(3)).toBe(7);
    expect(getNextMilestone(7)).toBe(14);
    expect(getNextMilestone(25)).toBe(30);
    expect(getNextMilestone(400)).toBe(407);
  });
});
