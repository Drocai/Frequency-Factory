import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extended with token balance and avatar for Frequency Factory.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  
  // Frequency Factory specific fields
  /** User's token balance (Frequency Tokens) */
  tokenBalance: int("tokenBalance").default(50).notNull(),
  /** Selected avatar ID (1-6) */
  avatarId: int("avatarId").default(1),
  /** Selected avatar name */
  avatarName: varchar("avatarName", { length: 64 }).default("BeatMaster"),
  /** Whether user has completed onboarding */
  hasCompletedOnboarding: int("hasCompletedOnboarding").default(0),
  /** Total tokens earned all time */
  totalTokensEarned: int("totalTokensEarned").default(50),
  /** Total predictions made */
  totalPredictions: int("totalPredictions").default(0),
  /** Accurate predictions count */
  accuratePredictions: int("accuratePredictions").default(0),
  
  /** Whether user is a Founding Artist (first 100 signups) */
  isFounder: int("isFounder").default(0),
  /** Founder slot number (1-100) */
  founderSlot: int("founderSlot"),

  /** Last date user claimed daily bonus (YYYY-MM-DD format) */
  lastDailyBonusDate: varchar("lastDailyBonusDate", { length: 10 }),
  /** Current login streak (consecutive days) */
  loginStreak: int("loginStreak").default(0),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Token transactions table for tracking all token movements
 */
export const tokenTransactions = mysqlTable("tokenTransactions", {
  id: int("id").autoincrement().primaryKey(),
  /** User who received/spent tokens */
  userId: int("userId").notNull(),
  /** Amount of tokens (positive for earn, negative for spend) */
  amount: int("amount").notNull(),
  /** Type of transaction */
  type: mysqlEnum("type", [
    "signup_bonus",      // Initial 50 FT
    "submit_track",      // +1 FT for submitting
    "prediction",        // +5 FT for accurate prediction
    "comment",           // +0.5 FT for commenting (stored as 1 for simplicity)
    "daily_login",       // +1 FT for daily login
    "skip_queue",        // -10 FT for skipping queue
    "referral",          // +10 FT for referral
    "admin_grant",       // Admin granted tokens
    "admin_deduct",      // Admin deducted tokens
  ]).notNull(),
  /** Optional reference to related entity (submission_id, comment_id, etc.) */
  referenceId: int("referenceId"),
  /** Description of the transaction */
  description: text("description"),
  /** Balance after this transaction */
  balanceAfter: int("balanceAfter").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TokenTransaction = typeof tokenTransactions.$inferSelect;
export type InsertTokenTransaction = typeof tokenTransactions.$inferInsert;

/**
 * Submissions table for track submissions
 */
export const submissions = mysqlTable("submissions", {
  id: int("id").autoincrement().primaryKey(),
  /** User who submitted (null for anonymous/demo) */
  userId: int("userId"),
  artistName: varchar("artistName", { length: 255 }).notNull(),
  trackTitle: varchar("trackTitle", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  bestTimestamp: varchar("bestTimestamp", { length: 10 }),
  streamingLink: varchar("streamingLink", { length: 512 }),
  genre: varchar("genre", { length: 64 }),
  aiAssisted: varchar("aiAssisted", { length: 10 }).default("no"),
  notes: text("notes"),
  platform: varchar("platform", { length: 32 }),
  status: mysqlEnum("status", ["pending", "processing", "approved", "rejected"]).default("pending"),
  ticketNumber: varchar("ticketNumber", { length: 20 }),
  queuePosition: int("queuePosition"),
  
  // Engagement metrics
  plays: int("plays").default(0),
  likes: int("likes").default(0),
  commentsCount: int("commentsCount").default(0),
  
  // Factory metrics (from predictions - Pro Engine)
  avgHookStrength: int("avgHookStrength").default(0),
  avgOriginality: int("avgOriginality").default(0),
  avgProductionQuality: int("avgProductionQuality").default(0),
  avgVibe: int("avgVibe").default(0),
  totalCertifications: int("totalCertifications").default(0),
  
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
  processedAt: timestamp("processedAt"),
});

export type Submission = typeof submissions.$inferSelect;
export type InsertSubmission = typeof submissions.$inferInsert;

/**
 * Predictions table for user certifications/predictions
 */
export const predictions = mysqlTable("predictions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  submissionId: int("submissionId").notNull(),
  hookStrength: int("hookStrength").notNull(),
  originality: int("originality").notNull(),
  productionQuality: int("productionQuality").notNull(),
  /** Vibe metric: overall feel, energy & replay value (0-100) */
  vibe: int("vibe").default(50).notNull(),
  overallScore: int("overallScore").notNull(),
  /** Whether this prediction was accurate (determined later) */
  wasAccurate: int("wasAccurate").default(0),
  /** Tokens awarded for this prediction */
  tokensAwarded: int("tokensAwarded").default(0),
  /** Whether user completed the 17-second engagement protocol */
  engagementBonusAwarded: int("engagementBonusAwarded").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Prediction = typeof predictions.$inferSelect;
export type InsertPrediction = typeof predictions.$inferInsert;

/**
 * Comments table for track comments
 */
export const comments = mysqlTable("comments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  submissionId: int("submissionId").notNull(),
  userName: varchar("userName", { length: 255 }),
  userAvatar: varchar("userAvatar", { length: 64 }),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;

/**
 * Likes table for track likes
 */
export const likes = mysqlTable("likes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  submissionId: int("submissionId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Like = typeof likes.$inferSelect;
export type InsertLike = typeof likes.$inferInsert;


/**
 * Notifications table for user notifications
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", [
    "track_approved",
    "track_rejected",
    "track_certified",
    "new_comment",
    "tokens_earned",
    "daily_bonus",
    "streak_milestone",
    "system",
  ]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  /** Whether notification has been read */
  isRead: int("isRead").default(0),
  /** Optional reference to related entity */
  referenceId: int("referenceId"),
  /** Reference type (submission, comment, etc.) */
  referenceType: varchar("referenceType", { length: 32 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
