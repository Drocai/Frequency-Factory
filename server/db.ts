import { eq, desc, sql, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  tokenTransactions, InsertTokenTransaction,
  submissions, InsertSubmission,
  predictions, InsertPrediction,
  comments, InsertComment,
  likes
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

  // Update submission metrics
  const allPredictions = await db.select()
    .from(predictions)
    .where(eq(predictions.submissionId, prediction.submissionId));

  const avgHook = Math.round(allPredictions.reduce((sum, p) => sum + p.hookStrength, 0) / allPredictions.length);
  const avgOriginality = Math.round(allPredictions.reduce((sum, p) => sum + p.originality, 0) / allPredictions.length);
  const avgProduction = Math.round(allPredictions.reduce((sum, p) => sum + p.productionQuality, 0) / allPredictions.length);

  await db.update(submissions)
    .set({
      avgHookStrength: avgHook,
      avgOriginality,
      avgProductionQuality: avgProduction,
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
