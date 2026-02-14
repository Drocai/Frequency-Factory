import { eq, desc, sql, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  tokenTransactions, InsertTokenTransaction,
  submissions, InsertSubmission,
  predictions, InsertPrediction,
  comments, InsertComment,
  likes,
  notifications, InsertNotification,
  claudeLearnings, InsertClaudeLearning
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================
// USER QUERIES
// ============================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserAvatar(userId: number, avatarId: number, avatarName: string) {
  const db = await getDb();
  if (!db) return;

  await db.update(users)
    .set({ avatarId, avatarName, hasCompletedOnboarding: 1 })
    .where(eq(users.id, userId));
}

export async function updateUserTokenBalance(userId: number, newBalance: number) {
  const db = await getDb();
  if (!db) return;

  await db.update(users)
    .set({ tokenBalance: newBalance })
    .where(eq(users.id, userId));
}

// ============================================
// FOUNDER AUTO-ASSIGNMENT
// ============================================

const MAX_FOUNDER_SLOTS = 100;

export async function checkAndAssignFounder(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const user = await getUserById(userId);
  if (!user || user.isFounder === 1) return { alreadyFounder: true, slot: user?.founderSlot };

  // Count current founders
  const [result] = await db.select({ count: sql<number>`COUNT(*)` })
    .from(users)
    .where(eq(users.isFounder, 1));

  const currentFounders = result?.count || 0;

  if (currentFounders >= MAX_FOUNDER_SLOTS) {
    return { assigned: false, slotsRemaining: 0 };
  }

  const slotNumber = currentFounders + 1;

  // Assign founder status
  await db.update(users)
    .set({ isFounder: 1, founderSlot: slotNumber })
    .where(eq(users.id, userId));

  return { assigned: true, slot: slotNumber, slotsRemaining: MAX_FOUNDER_SLOTS - slotNumber };
}

export async function getFounderCount() {
  const db = await getDb();
  if (!db) return { count: 0, remaining: MAX_FOUNDER_SLOTS };

  const [result] = await db.select({ count: sql<number>`COUNT(*)` })
    .from(users)
    .where(eq(users.isFounder, 1));

  const count = result?.count || 0;
  return { count, remaining: MAX_FOUNDER_SLOTS - count };
}

// ============================================
// TOKEN QUERIES
// ============================================

export async function awardTokens(
  userId: number, 
  amount: number, 
  type: InsertTokenTransaction['type'],
  description?: string,
  referenceId?: number
) {
  const db = await getDb();
  if (!db) return null;

  // Get current balance
  const user = await getUserById(userId);
  if (!user) return null;

  const newBalance = user.tokenBalance + amount;

  // Update user balance
  await db.update(users)
    .set({ 
      tokenBalance: newBalance,
      totalTokensEarned: (user.totalTokensEarned || 0) + (amount > 0 ? amount : 0)
    })
    .where(eq(users.id, userId));

  // Record transaction
  await db.insert(tokenTransactions).values({
    userId,
    amount,
    type,
    description,
    referenceId,
    balanceAfter: newBalance,
  });

  return newBalance;
}

export async function spendTokens(
  userId: number, 
  amount: number, 
  type: InsertTokenTransaction['type'],
  description?: string,
  referenceId?: number
) {
  const db = await getDb();
  if (!db) return null;

  // Get current balance
  const user = await getUserById(userId);
  if (!user) return null;

  // Check if user has enough tokens
  if (user.tokenBalance < amount) {
    return { error: 'insufficient_balance', balance: user.tokenBalance };
  }

  const newBalance = user.tokenBalance - amount;

  // Update user balance
  await db.update(users)
    .set({ tokenBalance: newBalance })
    .where(eq(users.id, userId));

  // Record transaction (negative amount)
  await db.insert(tokenTransactions).values({
    userId,
    amount: -amount,
    type,
    description,
    referenceId,
    balanceAfter: newBalance,
  });

  return { success: true, balance: newBalance };
}

export async function getTokenHistory(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select()
    .from(tokenTransactions)
    .where(eq(tokenTransactions.userId, userId))
    .orderBy(desc(tokenTransactions.createdAt))
    .limit(limit);

  return result;
}

// ============================================
// SUBMISSION QUERIES
// ============================================

export async function createSubmission(submission: InsertSubmission) {
  const db = await getDb();
  if (!db) return null;

  // Generate ticket number
  const ticketNumber = `FF-${Date.now().toString(36).toUpperCase()}`;

  // Get next queue position
  const [maxPos] = await db.select({ max: sql<number>`MAX(queuePosition)` })
    .from(submissions)
    .where(eq(submissions.status, 'pending'));
  
  const queuePosition = (maxPos?.max || 0) + 1;

  const result = await db.insert(submissions).values({
    ...submission,
    ticketNumber,
    queuePosition,
  });

  return { 
    id: Number(result[0].insertId), 
    ticketNumber, 
    queuePosition 
  };
}

export async function getSubmissions(status?: string, limit = 50) {
  const db = await getDb();
  if (!db) return [];

  if (status) {
    const result = await db.select()
      .from(submissions)
      .where(eq(submissions.status, status as any))
      .orderBy(desc(submissions.submittedAt))
      .limit(limit);
    return result;
  }

  const result = await db.select()
    .from(submissions)
    .orderBy(desc(submissions.submittedAt))
    .limit(limit);

  return result;
}

export async function getSubmissionById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select()
    .from(submissions)
    .where(eq(submissions.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function getQueuedSubmissions() {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select()
    .from(submissions)
    .where(eq(submissions.status, 'pending'))
    .orderBy(submissions.queuePosition);

  return result;
}

export async function updateSubmissionQueuePosition(id: number, newPosition: number) {
  const db = await getDb();
  if (!db) return;

  await db.update(submissions)
    .set({ queuePosition: newPosition })
    .where(eq(submissions.id, id));
}

export async function incrementSubmissionLikes(id: number) {
  const db = await getDb();
  if (!db) return;

  await db.update(submissions)
    .set({ likes: sql`${submissions.likes} + 1` })
    .where(eq(submissions.id, id));
}

export async function incrementSubmissionComments(id: number) {
  const db = await getDb();
  if (!db) return;

  await db.update(submissions)
    .set({ commentsCount: sql`${submissions.commentsCount} + 1` })
    .where(eq(submissions.id, id));
}

// ============================================
// PREDICTION QUERIES
// ============================================

export async function createPrediction(prediction: InsertPrediction) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(predictions).values(prediction);

  // Update submission metrics (Pro Engine: 4 dimensions)
  const allPredictions = await db.select()
    .from(predictions)
    .where(eq(predictions.submissionId, prediction.submissionId));

  const avgHook = Math.round(allPredictions.reduce((sum, p) => sum + p.hookStrength, 0) / allPredictions.length);
  const avgOriginality = Math.round(allPredictions.reduce((sum, p) => sum + p.originality, 0) / allPredictions.length);
  const avgProduction = Math.round(allPredictions.reduce((sum, p) => sum + p.productionQuality, 0) / allPredictions.length);
  const avgVibe = Math.round(allPredictions.reduce((sum, p) => sum + (p.vibe || 50), 0) / allPredictions.length);

  await db.update(submissions)
    .set({
      avgHookStrength: avgHook,
      avgOriginality,
      avgProductionQuality: avgProduction,
      avgVibe,
      totalCertifications: allPredictions.length,
    })
    .where(eq(submissions.id, prediction.submissionId));

  return { id: Number(result[0].insertId) };
}

export async function getUserPredictionForSubmission(userId: number, submissionId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select()
    .from(predictions)
    .where(and(
      eq(predictions.userId, userId),
      eq(predictions.submissionId, submissionId)
    ))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

// ============================================
// COMMENT QUERIES
// ============================================

export async function createComment(comment: InsertComment) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(comments).values(comment);
  
  // Increment comment count on submission
  await incrementSubmissionComments(comment.submissionId);

  return { id: Number(result[0].insertId) };
}

export async function getCommentsForSubmission(submissionId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select()
    .from(comments)
    .where(eq(comments.submissionId, submissionId))
    .orderBy(desc(comments.createdAt));

  return result;
}

// ============================================
// LIKE QUERIES
// ============================================

export async function toggleLike(userId: number, submissionId: number) {
  const db = await getDb();
  if (!db) return null;

  // Check if already liked
  const existing = await db.select()
    .from(likes)
    .where(and(
      eq(likes.userId, userId),
      eq(likes.submissionId, submissionId)
    ))
    .limit(1);

  if (existing.length > 0) {
    // Unlike
    await db.delete(likes).where(eq(likes.id, existing[0].id));
    await db.update(submissions)
      .set({ likes: sql`${submissions.likes} - 1` })
      .where(eq(submissions.id, submissionId));
    return { liked: false };
  } else {
    // Like
    await db.insert(likes).values({ userId, submissionId });
    await incrementSubmissionLikes(submissionId);
    return { liked: true };
  }
}

export async function getUserLikes(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select({ submissionId: likes.submissionId })
    .from(likes)
    .where(eq(likes.userId, userId));

  return result.map(r => r.submissionId);
}

// ============================================
// LEADERBOARD QUERIES
// ============================================

export async function getTopPredictors(limit = 10) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select({
    id: users.id,
    name: users.name,
    avatarName: users.avatarName,
    tokenBalance: users.tokenBalance,
    totalPredictions: users.totalPredictions,
    accuratePredictions: users.accuratePredictions,
  })
    .from(users)
    .orderBy(desc(users.tokenBalance))
    .limit(limit);

  return result;
}


// ============================================
// ADMIN QUERIES
// ============================================

export async function getAdminStats() {
  const db = await getDb();
  if (!db) return null;

  const [totalSubmissions] = await db.select({ count: sql<number>`COUNT(*)` }).from(submissions);
  const [pendingSubmissions] = await db.select({ count: sql<number>`COUNT(*)` }).from(submissions).where(eq(submissions.status, 'pending'));
  const [approvedSubmissions] = await db.select({ count: sql<number>`COUNT(*)` }).from(submissions).where(eq(submissions.status, 'approved'));
  const [rejectedSubmissions] = await db.select({ count: sql<number>`COUNT(*)` }).from(submissions).where(eq(submissions.status, 'rejected'));
  const [totalUsers] = await db.select({ count: sql<number>`COUNT(*)` }).from(users);
  const [totalComments] = await db.select({ count: sql<number>`COUNT(*)` }).from(comments);
  const [totalPredictions] = await db.select({ count: sql<number>`COUNT(*)` }).from(predictions);

  return {
    totalSubmissions: totalSubmissions?.count || 0,
    pendingSubmissions: pendingSubmissions?.count || 0,
    approvedSubmissions: approvedSubmissions?.count || 0,
    rejectedSubmissions: rejectedSubmissions?.count || 0,
    totalUsers: totalUsers?.count || 0,
    totalComments: totalComments?.count || 0,
    totalPredictions: totalPredictions?.count || 0,
  };
}

export async function getAllSubmissionsAdmin(status?: string, limit = 100) {
  const db = await getDb();
  if (!db) return [];

  if (status && status !== 'all') {
    const result = await db.select()
      .from(submissions)
      .where(eq(submissions.status, status as any))
      .orderBy(desc(submissions.submittedAt))
      .limit(limit);
    return result;
  }

  const result = await db.select()
    .from(submissions)
    .orderBy(desc(submissions.submittedAt))
    .limit(limit);

  return result;
}

export async function updateSubmissionStatus(id: number, status: 'pending' | 'approved' | 'rejected') {
  const db = await getDb();
  if (!db) return null;

  await db.update(submissions)
    .set({ status })
    .where(eq(submissions.id, id));

  return { success: true };
}

export async function bulkUpdateSubmissionStatus(ids: number[], status: 'pending' | 'approved' | 'rejected') {
  const db = await getDb();
  if (!db) return null;

  for (const id of ids) {
    await db.update(submissions)
      .set({ status })
      .where(eq(submissions.id, id));
  }

  return { success: true, count: ids.length };
}

export async function deleteSubmission(id: number) {
  const db = await getDb();
  if (!db) return null;

  // Delete related records first
  await db.delete(comments).where(eq(comments.submissionId, id));
  await db.delete(predictions).where(eq(predictions.submissionId, id));
  await db.delete(likes).where(eq(likes.submissionId, id));
  
  // Delete the submission
  await db.delete(submissions).where(eq(submissions.id, id));

  return { success: true };
}

export async function getAllUsers(limit = 100) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
    tokenBalance: users.tokenBalance,
    avatarName: users.avatarName,
    createdAt: users.createdAt,
    lastSignedIn: users.lastSignedIn,
  })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(limit);

  return result;
}

export async function updateUserRole(userId: number, role: 'user' | 'admin') {
  const db = await getDb();
  if (!db) return null;

  await db.update(users)
    .set({ role })
    .where(eq(users.id, userId));

  return { success: true };
}

export async function getRecentActivity(limit = 20) {
  const db = await getDb();
  if (!db) return [];

  // Get recent submissions
  const recentSubmissions = await db.select({
    type: sql<string>`'submission'`,
    id: submissions.id,
    title: submissions.trackTitle,
    artist: submissions.artistName,
    createdAt: submissions.submittedAt,
  })
    .from(submissions)
    .orderBy(desc(submissions.submittedAt))
    .limit(limit);

  // Get recent comments
  const recentComments = await db.select({
    type: sql<string>`'comment'`,
    id: comments.id,
    content: comments.content,
    userName: comments.userName,
    createdAt: comments.createdAt,
  })
    .from(comments)
    .orderBy(desc(comments.createdAt))
    .limit(limit);

  // Combine and sort by date
  const activities = [
    ...recentSubmissions.map(s => ({ 
      type: 'submission' as const, 
      id: s.id, 
      description: `${s.artist} submitted "${s.title}"`,
      createdAt: s.createdAt 
    })),
    ...recentComments.map(c => ({ 
      type: 'comment' as const, 
      id: c.id, 
      description: `${c.userName} commented: "${c.content?.slice(0, 50)}..."`,
      createdAt: c.createdAt 
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
   .slice(0, limit);

  return activities;
}


// ============================================
// DAILY LOGIN BONUS QUERIES
// ============================================

export async function checkAndAwardDailyBonus(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const user = await getUserById(userId);
  if (!user) return null;

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  const lastBonusDate = user.lastDailyBonusDate;

  // Already claimed today
  if (lastBonusDate === today) {
    return { 
      alreadyClaimed: true, 
      streak: user.loginStreak || 0,
      balance: user.tokenBalance 
    };
  }

  // Calculate streak
  let newStreak = 1;
  if (lastBonusDate) {
    const lastDate = new Date(lastBonusDate);
    const todayDate = new Date(today);
    const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      // Consecutive day - increase streak
      newStreak = (user.loginStreak || 0) + 1;
    } else {
      // Streak broken - reset to 1
      newStreak = 1;
    }
  }

  // Calculate bonus amount
  let bonusAmount = 1; // Base daily bonus
  let streakBonus = 0;
  
  // Streak bonuses
  if (newStreak === 7) {
    streakBonus = 5; // 7-day streak bonus
  } else if (newStreak === 30) {
    streakBonus = 20; // 30-day streak bonus
  } else if (newStreak % 7 === 0) {
    streakBonus = 3; // Weekly milestone bonus
  }

  const totalBonus = bonusAmount + streakBonus;

  // Update user with new streak and last bonus date
  await db.update(users)
    .set({ 
      lastDailyBonusDate: today,
      loginStreak: newStreak,
    })
    .where(eq(users.id, userId));

  // Award the tokens
  const newBalance = await awardTokens(
    userId,
    totalBonus,
    'daily_login',
    streakBonus > 0 
      ? `Daily login bonus + ${newStreak}-day streak bonus!` 
      : 'Daily login bonus'
  );

  return {
    alreadyClaimed: false,
    awarded: totalBonus,
    baseBonus: bonusAmount,
    streakBonus,
    streak: newStreak,
    balance: newBalance,
  };
}

export async function getLoginStreak(userId: number) {
  const user = await getUserById(userId);
  if (!user) return { streak: 0, lastBonusDate: null };

  return {
    streak: user.loginStreak || 0,
    lastBonusDate: user.lastDailyBonusDate,
  };
}


// ============================================
// NOTIFICATION QUERIES
// ============================================

export async function createNotification(data: {
  userId: number;
  type: InsertNotification['type'];
  title: string;
  message: string;
  referenceId?: number;
  referenceType?: string;
}) {
  const db = await getDb();
  if (!db) return null;

  const [result] = await db.insert(notifications).values({
    userId: data.userId,
    type: data.type,
    title: data.title,
    message: data.message,
    referenceId: data.referenceId,
    referenceType: data.referenceType,
  });

  return result;
}

export async function getUserNotifications(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);

  return result;
}

export async function getUnreadNotificationCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;

  const [result] = await db.select({ count: sql<number>`COUNT(*)` })
    .from(notifications)
    .where(and(
      eq(notifications.userId, userId),
      eq(notifications.isRead, 0)
    ));

  return result?.count || 0;
}

export async function markNotificationRead(notificationId: number, userId: number) {
  const db = await getDb();
  if (!db) return null;

  await db.update(notifications)
    .set({ isRead: 1 })
    .where(and(
      eq(notifications.id, notificationId),
      eq(notifications.userId, userId)
    ));

  return { success: true };
}

export async function markAllNotificationsRead(userId: number) {
  const db = await getDb();
  if (!db) return null;

  await db.update(notifications)
    .set({ isRead: 1 })
    .where(eq(notifications.userId, userId));

  return { success: true };
}

// ============================================
// LEADERBOARD QUERIES (with time filters)
// ============================================

export async function getTopPredictorsWithFilter(timeFilter: 'all' | 'month' | 'week' = 'all', limit = 10) {
  const db = await getDb();
  if (!db) return [];

  // For simplicity, using user stats which are cumulative
  // In production, you'd filter predictions by date
  const result = await db.select({
    userId: users.id,
    userName: users.name,
    avatarId: users.avatarId,
    totalPredictions: users.totalPredictions,
    avgScore: sql<number>`COALESCE(${users.accuratePredictions} * 100 / NULLIF(${users.totalPredictions}, 0), 0)`,
  })
    .from(users)
    .where(sql`${users.totalPredictions} > 0`)
    .orderBy(desc(users.totalPredictions))
    .limit(limit);

  return result;
}

export async function getTopTokenEarners(timeFilter: 'all' | 'month' | 'week' = 'all', limit = 10) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select({
    userId: users.id,
    userName: users.name,
    avatarId: users.avatarId,
    totalEarned: users.totalTokensEarned,
    currentBalance: users.tokenBalance,
  })
    .from(users)
    .orderBy(desc(users.totalTokensEarned))
    .limit(limit);

  return result;
}

export async function getMostCertifiedTracks(timeFilter: 'all' | 'month' | 'week' = 'all', limit = 10) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select({
    id: submissions.id,
    artistName: submissions.artistName,
    trackTitle: submissions.trackTitle,
    totalCertifications: submissions.totalCertifications,
    avgHookStrength: submissions.avgHookStrength,
    avgOriginality: submissions.avgOriginality,
    avgProductionQuality: submissions.avgProductionQuality,
  })
    .from(submissions)
    .where(eq(submissions.status, 'approved'))
    .orderBy(desc(submissions.totalCertifications))
    .limit(limit);

  return result;
}

export async function getTopCommenters(timeFilter: 'all' | 'month' | 'week' = 'all', limit = 10) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select({
    userId: comments.userId,
    userName: comments.userName,
    totalComments: sql<number>`COUNT(*)`,
  })
    .from(comments)
    .where(sql`${comments.userId} IS NOT NULL`)
    .groupBy(comments.userId, comments.userName)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(limit);

  // Get avatar info for each user
  const enrichedResults = await Promise.all(
    result.map(async (r) => {
      if (r.userId) {
        const user = await getUserById(r.userId);
        return {
          ...r,
          avatarId: user?.avatarId || 1,
        };
      }
      return { ...r, avatarId: 1 };
    })
  );

  return enrichedResults;
}

// ============================================
// CLAUDE LEARNINGS QUERIES
// ============================================

export async function addLearning(learning: Omit<InsertClaudeLearning, 'id' | 'createdAt'>) {
  const db = await getDb();
  if (!db) return null;

  const [result] = await db.insert(claudeLearnings).values(learning);
  return { id: Number(result.insertId) };
}

export async function getLearnings(category?: string, limit = 50) {
  const db = await getDb();
  if (!db) return [];

  if (category) {
    return db.select()
      .from(claudeLearnings)
      .where(eq(claudeLearnings.category, category))
      .orderBy(desc(claudeLearnings.createdAt))
      .limit(limit);
  }

  return db.select()
    .from(claudeLearnings)
    .orderBy(desc(claudeLearnings.createdAt))
    .limit(limit);
}

export async function resolveLearning(id: number) {
  const db = await getDb();
  if (!db) return null;

  await db.update(claudeLearnings)
    .set({ resolved: 1 })
    .where(eq(claudeLearnings.id, id));

  return { success: true };
}
