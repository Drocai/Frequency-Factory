import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  
  // ============================================
  // AUTH ROUTER
  // ============================================
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============================================
  // USER ROUTER
  // ============================================
  user: router({
    // Get current user's full profile
    getProfile: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user.id);
      if (!user) return null;
      
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tokenBalance: user.tokenBalance,
        avatarId: user.avatarId,
        avatarName: user.avatarName,
        hasCompletedOnboarding: user.hasCompletedOnboarding === 1,
        totalTokensEarned: user.totalTokensEarned,
        totalPredictions: user.totalPredictions,
        accuratePredictions: user.accuratePredictions,
        createdAt: user.createdAt,
      };
    }),

    // Update user's avatar
    updateAvatar: protectedProcedure
      .input(z.object({
        avatarId: z.number().min(1).max(6),
        avatarName: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUserAvatar(ctx.user.id, input.avatarId, input.avatarName);
        return { success: true };
      }),
  }),

  // ============================================
  // TOKENS ROUTER
  // ============================================
  tokens: router({
    // Get current balance
    getBalance: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user.id);
      return { balance: user?.tokenBalance ?? 0 };
    }),

    // Award tokens for an action
    award: protectedProcedure
      .input(z.object({
        amount: z.number().positive(),
        type: z.enum([
          'submit_track',
          'prediction',
          'comment',
          'daily_login',
          'referral',
        ]),
        description: z.string().optional(),
        referenceId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const newBalance = await db.awardTokens(
          ctx.user.id,
          input.amount,
          input.type,
          input.description,
          input.referenceId
        );
        return { success: true, balance: newBalance };
      }),

    // Spend tokens
    spend: protectedProcedure
      .input(z.object({
        amount: z.number().positive(),
        type: z.enum(['skip_queue']),
        description: z.string().optional(),
        referenceId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.spendTokens(
          ctx.user.id,
          input.amount,
          input.type,
          input.description,
          input.referenceId
        );
        
        if (result && 'error' in result) {
          return { success: false, error: result.error, balance: result.balance };
        }
        
        return { success: true, balance: result?.balance ?? 0 };
      }),

    // Get transaction history
    getHistory: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        const history = await db.getTokenHistory(ctx.user.id, input?.limit);
        return history;
      }),

    // Check and claim daily login bonus
    claimDailyBonus: protectedProcedure.mutation(async ({ ctx }) => {
      return db.checkAndAwardDailyBonus(ctx.user.id);
    }),

    // Get login streak info
    getStreak: protectedProcedure.query(async ({ ctx }) => {
      return db.getLoginStreak(ctx.user.id);
    }),
  }),

  // ============================================
  // SUBMISSIONS ROUTER
  // ============================================
  submissions: router({
    // Create a new submission
    create: protectedProcedure
      .input(z.object({
        artistName: z.string().min(1),
        trackTitle: z.string().min(1),
        email: z.string().email().optional(),
        bestTimestamp: z.string().optional(),
        streamingLink: z.string().url().optional(),
        genre: z.string().optional(),
        aiAssisted: z.string().optional(),
        notes: z.string().optional(),
        platform: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.createSubmission({
          ...input,
          userId: ctx.user.id,
        });

        if (result) {
          // Award 1 FT for submission
          await db.awardTokens(
            ctx.user.id,
            1,
            'submit_track',
            `Submitted "${input.trackTitle}"`,
            result.id
          );
        }

        return result;
      }),

    // Get all submissions (public feed)
    list: publicProcedure
      .input(z.object({
        status: z.string().optional(),
        limit: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return db.getSubmissions(input?.status, input?.limit);
      }),

    // Get single submission
    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getSubmissionById(input.id);
      }),

    // Get queue
    getQueue: publicProcedure.query(async () => {
      return db.getQueuedSubmissions();
    }),

    // Skip queue (pay 10 FT)
    skipQueue: protectedProcedure
      .input(z.object({ submissionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Spend 10 tokens
        const spendResult = await db.spendTokens(
          ctx.user.id,
          10,
          'skip_queue',
          'Skipped queue position',
          input.submissionId
        );

        if (spendResult && 'error' in spendResult) {
          return { success: false, error: spendResult.error };
        }

        // Move submission to position 1
        await db.updateSubmissionQueuePosition(input.submissionId, 1);

        // Increment all other positions
        const queue = await db.getQueuedSubmissions();
        for (const sub of queue) {
          if (sub.id !== input.submissionId && sub.queuePosition) {
            await db.updateSubmissionQueuePosition(sub.id, sub.queuePosition + 1);
          }
        }

        return { success: true, balance: spendResult?.balance };
      }),
  }),

  // ============================================
  // PREDICTIONS ROUTER
  // ============================================
  predictions: router({
    // Create a prediction (certify a track)
    create: protectedProcedure
      .input(z.object({
        submissionId: z.number(),
        hookStrength: z.number().min(0).max(100),
        originality: z.number().min(0).max(100),
        productionQuality: z.number().min(0).max(100),
      }))
      .mutation(async ({ ctx, input }) => {
        // Check if user already predicted this track
        const existing = await db.getUserPredictionForSubmission(ctx.user.id, input.submissionId);
        if (existing) {
          return { success: false, error: 'already_predicted' };
        }

        const overallScore = Math.round(
          (input.hookStrength + input.originality + input.productionQuality) / 3
        );

        const result = await db.createPrediction({
          userId: ctx.user.id,
          submissionId: input.submissionId,
          hookStrength: input.hookStrength,
          originality: input.originality,
          productionQuality: input.productionQuality,
          overallScore,
        });

        if (result) {
          // Award 5 FT for prediction
          await db.awardTokens(
            ctx.user.id,
            5,
            'prediction',
            'Certified a track',
            input.submissionId
          );
        }

        return { success: true, id: result?.id };
      }),

    // Check if user has predicted a submission
    check: protectedProcedure
      .input(z.object({ submissionId: z.number() }))
      .query(async ({ ctx, input }) => {
        const prediction = await db.getUserPredictionForSubmission(ctx.user.id, input.submissionId);
        return { hasPredicted: !!prediction, prediction };
      }),

    // Get user's predictions with track info
    list: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        return db.getUserPredictions(ctx.user.id, input?.limit || 10);
      }),
  }),

  // ============================================
  // COMMENTS ROUTER
  // ============================================
  comments: router({
    // Create a comment
    create: protectedProcedure
      .input(z.object({
        submissionId: z.number(),
        content: z.string().min(1).max(500),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserById(ctx.user.id);
        
        const result = await db.createComment({
          userId: ctx.user.id,
          submissionId: input.submissionId,
          userName: user?.name || 'Anonymous',
          userAvatar: user?.avatarName || 'BeatMaster',
          content: input.content,
        });

        if (result) {
          // Award 1 FT for commenting (simplified from 0.5)
          await db.awardTokens(
            ctx.user.id,
            1,
            'comment',
            'Posted a comment',
            input.submissionId
          );
        }

        return { success: true, id: result?.id };
      }),

    // Get comments for a submission
    list: publicProcedure
      .input(z.object({ submissionId: z.number() }))
      .query(async ({ input }) => {
        return db.getCommentsForSubmission(input.submissionId);
      }),
  }),

  // ============================================
  // LIKES ROUTER
  // ============================================
  likes: router({
    // Toggle like
    toggle: protectedProcedure
      .input(z.object({ submissionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return db.toggleLike(ctx.user.id, input.submissionId);
      }),

    // Get user's likes
    getUserLikes: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserLikes(ctx.user.id);
    }),
  }),

  // ============================================
  // LEADERBOARD ROUTER
  // ============================================
  leaderboard: router({
    topPredictors: publicProcedure
      .input(z.object({ 
        timeFilter: z.enum(['all', 'month', 'week']).optional(),
        limit: z.number().optional() 
      }).optional())
      .query(async ({ input }) => {
        return db.getTopPredictorsWithFilter(input?.timeFilter || 'all', input?.limit || 10);
      }),

    topTokenEarners: publicProcedure
      .input(z.object({ 
        timeFilter: z.enum(['all', 'month', 'week']).optional(),
        limit: z.number().optional() 
      }).optional())
      .query(async ({ input }) => {
        return db.getTopTokenEarners(input?.timeFilter || 'all', input?.limit || 10);
      }),

    mostCertifiedTracks: publicProcedure
      .input(z.object({ 
        timeFilter: z.enum(['all', 'month', 'week']).optional(),
        limit: z.number().optional() 
      }).optional())
      .query(async ({ input }) => {
        return db.getMostCertifiedTracks(input?.timeFilter || 'all', input?.limit || 10);
      }),

    topCommenters: publicProcedure
      .input(z.object({ 
        timeFilter: z.enum(['all', 'month', 'week']).optional(),
        limit: z.number().optional() 
      }).optional())
      .query(async ({ input }) => {
        return db.getTopCommenters(input?.timeFilter || 'all', input?.limit || 10);
      }),
  }),

  // ============================================
  // NOTIFICATIONS ROUTER
  // ============================================
  notifications: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        return db.getUserNotifications(ctx.user.id, input?.limit || 20);
      }),

    getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
      return db.getUnreadNotificationCount(ctx.user.id);
    }),

    markRead: protectedProcedure
      .input(z.object({ notificationId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return db.markNotificationRead(input.notificationId, ctx.user.id);
      }),

    markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
      return db.markAllNotificationsRead(ctx.user.id);
    }),
  }),

  // ============================================
  // ADMIN ROUTER (Admin only)
  // ============================================
  admin: router({
    // Get admin dashboard stats
    getStats: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
      }
      return db.getAdminStats();
    }),

    // Get all submissions with filters
    getSubmissions: protectedProcedure
      .input(z.object({
        status: z.string().optional(),
        limit: z.number().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Admin access required');
        }
        return db.getAllSubmissionsAdmin(input?.status, input?.limit);
      }),

    // Update submission status
    updateSubmissionStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(['pending', 'approved', 'rejected']),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Admin access required');
        }
        return db.updateSubmissionStatus(input.id, input.status);
      }),

    // Bulk update submission status
    bulkUpdateStatus: protectedProcedure
      .input(z.object({
        ids: z.array(z.number()),
        status: z.enum(['pending', 'approved', 'rejected']),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Admin access required');
        }
        return db.bulkUpdateSubmissionStatus(input.ids, input.status);
      }),

    // Delete submission
    deleteSubmission: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Admin access required');
        }
        return db.deleteSubmission(input.id);
      }),

    // Get all users
    getUsers: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Admin access required');
        }
        return db.getAllUsers(input?.limit);
      }),

    // Update user role
    updateUserRole: protectedProcedure
      .input(z.object({
        userId: z.number(),
        role: z.enum(['user', 'admin']),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Admin access required');
        }
        return db.updateUserRole(input.userId, input.role);
      }),

    // Get recent activity
    getRecentActivity: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new Error('Unauthorized: Admin access required');
        }
        return db.getRecentActivity(input?.limit);
      }),
  }),

  // ============================================
  // QUENCY AI CHAT ROUTER
  // ============================================
  quency: router({
    chat: publicProcedure
      .input(z.object({
        messages: z.array(z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string(),
        })),
      }))
      .mutation(async ({ input }) => {
        try {
          // Dynamic import to avoid issues if LLM module not available
          const { invokeLLM } = await import("./_core/llm");

          const systemPrompt = `You are QUENCY, the enthusiastic AI Superfan guide for Frequency Factory - a music prediction platform where users predict which tracks will become hits.

Your personality:
- Enthusiastic and supportive music superfan
- Knowledgeable about the platform mechanics
- Uses music-related emojis sparingly (🎵, 🔥, 💰, 🏆)
- Keeps responses concise but helpful

Key platform features you know about:
- Token System: Users earn Frequency Tokens (FT) for predictions (+5 FT), submissions (+1 FT), comments (+1 FT), and daily logins (+1 FT base + streak bonuses)
- Predictions: Users rate tracks on Hook Strength, Originality, and Production Quality (0-100 each)
- Queue System: Tracks enter a queue; users can pay 10 FT to skip ahead
- Rewards: Tokens can be redeemed for merch, Spotify Premium, badges, etc.
- Token Tiers: Red (common), Blue (uncommon), Purple (rare), Gold (legendary)

Always be helpful and encouraging. If you don't know something specific, guide users to explore the app.`;

          const result = await invokeLLM({
            messages: [
              { role: "system", content: systemPrompt },
              ...input.messages.map(m => ({
                role: m.role as "user" | "assistant",
                content: m.content,
              })),
            ],
            maxTokens: 500,
          });

          const responseContent = result.choices[0]?.message?.content;
          const content = typeof responseContent === "string"
            ? responseContent
            : Array.isArray(responseContent)
              ? responseContent.find(c => c.type === "text")?.text || ""
              : "";

          return { success: true, content };
        } catch (error) {
          console.error("QUENCY chat error:", error);
          return {
            success: false,
            content: "",
            error: "Failed to get AI response"
          };
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
