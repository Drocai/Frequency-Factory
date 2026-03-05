import { COOKIE_NAME } from "../shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { getStripe, TOKEN_PACKS, PROMOTIONS, PRO_PRICE_ID } from "./stripe";

// ============================================
// SUB-ROUTERS — exported for Vercel serverless reuse
// ============================================

export const userRouter = router({
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
      userType: user.userType,
      bio: user.bio,
      socialLinks: user.socialLinks,
      isFounder: user.isFounder === 1,
      founderSlot: user.founderSlot,
      loginStreak: user.loginStreak,
      createdAt: user.createdAt,
    };
  }),

  updateAvatar: protectedProcedure
    .input(z.object({
      avatarId: z.number().min(1).max(6),
      avatarName: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.updateUserAvatar(ctx.user.id, input.avatarId, input.avatarName);
      return { success: true };
    }),

  completeOnboarding: protectedProcedure
    .input(z.object({
      avatarId: z.number().min(1).max(6),
      avatarName: z.string(),
      userType: z.enum(["listener", "artist", "both"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.updateUserAvatar(ctx.user.id, input.avatarId, input.avatarName);
      await db.completeOnboarding(ctx.user.id, input.userType);
      return { success: true };
    }),

  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(64).optional(),
      bio: z.string().max(280).optional(),
      socialLinks: z.string().max(1024).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.updateUserProfile(ctx.user.id, input);
      return { success: true };
    }),

  getPublicProfile: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      return db.getPublicProfile(input.userId);
    }),
});

export const tokensRouter = router({
  getBalance: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.getUserById(ctx.user.id);
    return { balance: user?.tokenBalance ?? 0 };
  }),

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

  getHistory: protectedProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const history = await db.getTokenHistory(ctx.user.id, input?.limit);
      return history;
    }),

  claimDailyBonus: protectedProcedure.mutation(async ({ ctx }) => {
    return db.checkAndAwardDailyBonus(ctx.user.id);
  }),

  getStreak: protectedProcedure.query(async ({ ctx }) => {
    return db.getLoginStreak(ctx.user.id);
  }),
});

export const founderRouter = router({
  checkAndAssign: protectedProcedure.mutation(async ({ ctx }) => {
    return db.checkAndAssignFounder(ctx.user.id);
  }),

  getSlots: publicProcedure.query(async () => {
    return db.getFounderCount();
  }),
});

export const submissionsRouter = router({
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

  list: publicProcedure
    .input(z.object({
      status: z.string().optional(),
      limit: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      return db.getSubmissions(input?.status, input?.limit);
    }),

  mySubmissions: protectedProcedure.query(async ({ ctx }) => {
    return db.getUserSubmissions(ctx.user.id);
  }),

  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      return db.getSubmissionById(input.id);
    }),

  getQueue: publicProcedure.query(async () => {
    return db.getQueuedSubmissions();
  }),

  skipQueue: protectedProcedure
    .input(z.object({ submissionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
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

      await db.updateSubmissionQueuePosition(input.submissionId, 1);

      const queue = await db.getQueuedSubmissions();
      for (const sub of queue) {
        if (sub.id !== input.submissionId && sub.queuePosition) {
          await db.updateSubmissionQueuePosition(sub.id, sub.queuePosition + 1);
        }
      }

      return { success: true, balance: spendResult?.balance };
    }),
});

export const predictionsRouter = router({
  create: protectedProcedure
    .input(z.object({
      submissionId: z.number(),
      hookStrength: z.number().min(0).max(100),
      originality: z.number().min(0).max(100),
      productionQuality: z.number().min(0).max(100),
      vibe: z.number().min(0).max(100).optional(),
      engagementBonus: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await db.getUserPredictionForSubmission(ctx.user.id, input.submissionId);
      if (existing) {
        return { success: false, error: 'already_predicted' };
      }

      const vibeScore = input.vibe ?? 50;
      const overallScore = Math.round(
        (input.hookStrength + input.originality + input.productionQuality + vibeScore) / 4
      );

      const result = await db.createPrediction({
        userId: ctx.user.id,
        submissionId: input.submissionId,
        hookStrength: input.hookStrength,
        originality: input.originality,
        productionQuality: input.productionQuality,
        vibe: vibeScore,
        overallScore,
        engagementBonusAwarded: input.engagementBonus ? 1 : 0,
      });

      if (result) {
        let totalAward = 5;
        let description = 'Certified a track';

        if (input.engagementBonus) {
          totalAward += 2;
          description = 'Certified a track + 17s engagement bonus';
        }

        await db.awardTokens(
          ctx.user.id,
          totalAward,
          'prediction',
          description,
          input.submissionId
        );
      }

      return { success: true, id: result?.id };
    }),

  check: protectedProcedure
    .input(z.object({ submissionId: z.number() }))
    .query(async ({ ctx, input }) => {
      const prediction = await db.getUserPredictionForSubmission(ctx.user.id, input.submissionId);
      return { hasPredicted: !!prediction, prediction };
    }),
});

export const commentsRouter = router({
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

  list: publicProcedure
    .input(z.object({ submissionId: z.number() }))
    .query(async ({ input }) => {
      return db.getCommentsForSubmission(input.submissionId);
    }),
});

export const likesRouter = router({
  toggle: protectedProcedure
    .input(z.object({ submissionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return db.toggleLike(ctx.user.id, input.submissionId);
    }),

  getUserLikes: protectedProcedure.query(async ({ ctx }) => {
    return db.getUserLikes(ctx.user.id);
  }),
});

export const leaderboardRouter = router({
  topPredictors: publicProcedure
    .input(z.object({
      timeFilter: z.enum(['all', 'month', 'week']).optional(),
      limit: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      return db.getTopPredictorsWithFilter(input?.timeFilter || 'all', input?.limit || 10);
    }),

  topTokenEarners: publicProcedure
    .input(z.object({
      timeFilter: z.enum(['all', 'month', 'week']).optional(),
      limit: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      return db.getTopTokenEarners(input?.timeFilter || 'all', input?.limit || 10);
    }),

  mostCertifiedTracks: publicProcedure
    .input(z.object({
      timeFilter: z.enum(['all', 'month', 'week']).optional(),
      limit: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      return db.getMostCertifiedTracks(input?.timeFilter || 'all', input?.limit || 10);
    }),

  topCommenters: publicProcedure
    .input(z.object({
      timeFilter: z.enum(['all', 'month', 'week']).optional(),
      limit: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      return db.getTopCommenters(input?.timeFilter || 'all', input?.limit || 10);
    }),
});

export const notificationsRouter = router({
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
});

export const adminRouter = router({
  getStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }
    return db.getAdminStats();
  }),

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

  deleteSubmission: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
      }
      return db.deleteSubmission(input.id);
    }),

  getUsers: protectedProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
      }
      return db.getAllUsers(input?.limit);
    }),

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

  getRecentActivity: protectedProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
      }
      return db.getRecentActivity(input?.limit);
    }),
});

export const liveRouter = router({
  getActiveSession: publicProcedure.query(async () => {
    return db.getActiveLiveSession();
  }),

  startSession: protectedProcedure
    .input(z.object({ title: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
      }
      return db.startLiveSession(input.title);
    }),

  endSession: protectedProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
      }
      return db.endLiveSession(input.sessionId);
    }),

  claimCheckinReward: protectedProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const alreadyClaimed = await db.hasClaimedCheckinReward(
        ctx.user.id,
        input.sessionId
      );
      if (alreadyClaimed) {
        return { success: false, error: "already_claimed" };
      }

      const newBalance = await db.awardTokens(
        ctx.user.id,
        2,
        "stream_checkin",
        "Checked in to live stream"
      );

      await db.recordCheckinReward(ctx.user.id, input.sessionId);

      return { success: true, awarded: 2, balance: newBalance };
    }),

  claimActivityReward: protectedProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const canClaim = await db.canClaimActivityReward(
        ctx.user.id,
        input.sessionId
      );
      if (!canClaim) {
        return { success: false, error: "cooldown" };
      }

      const newBalance = await db.awardTokens(
        ctx.user.id,
        1,
        "stream_activity",
        "Active during live stream"
      );

      await db.recordActivityReward(ctx.user.id, input.sessionId);

      return { success: true, awarded: 1, balance: newBalance };
    }),

  setAudioStatus: protectedProcedure
    .input(z.object({
      sessionId: z.string().uuid(),
      status: z.enum(['live', 'muted', 'unknown']),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
      }
      return db.setAudioStatus(input.sessionId, input.status);
    }),

  clearAudioReports: protectedProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
      }
      return db.clearAudioReports(input.sessionId);
    }),
});

export const stripeRouter = router({
  createCheckoutSession: protectedProcedure
    .input(z.object({
      type: z.enum(["token_pack", "promotion", "subscription"]),
      packId: z.string().optional(),
      promotionType: z.enum(["skip_queue", "featured", "priority_review"]).optional(),
      submissionId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const stripe = getStripe();
      if (!stripe) return { error: "Stripe not configured" };

      const baseUrl = ctx.req.headers.origin || "https://frequency-factory.vercel.app";
      let lineItems: { price_data: { currency: string; product_data: { name: string }; unit_amount: number }; quantity: number }[] = [];
      let mode: "payment" | "subscription" = "payment";
      const metadata: Record<string, string> = {
        userId: String(ctx.user.id),
        type: input.type,
      };

      if (input.type === "token_pack" && input.packId) {
        const pack = TOKEN_PACKS.find(p => p.id === input.packId);
        if (!pack) return { error: "Invalid pack" };
        lineItems = [{
          price_data: { currency: "usd", product_data: { name: `${pack.label} Token Pack` }, unit_amount: pack.priceUsd },
          quantity: 1,
        }];
        metadata.packId = pack.id;
        metadata.tokens = String(pack.tokens);
      } else if (input.type === "promotion" && input.promotionType && input.submissionId) {
        const promo = PROMOTIONS[input.promotionType];
        lineItems = [{
          price_data: { currency: "usd", product_data: { name: promo.label }, unit_amount: promo.priceUsd },
          quantity: 1,
        }];
        metadata.promotionType = input.promotionType;
        metadata.submissionId = String(input.submissionId);
      } else if (input.type === "subscription") {
        if (!PRO_PRICE_ID) return { error: "Pro subscription not configured" };
        mode = "subscription";
      }

      const sessionParams: Record<string, unknown> = {
        mode,
        success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/checkout/cancel`,
        metadata,
      };

      if (mode === "subscription") {
        sessionParams.line_items = [{ price: PRO_PRICE_ID, quantity: 1 }];
      } else {
        sessionParams.line_items = lineItems;
      }

      // Get or create Stripe customer
      const user = await db.getUserById(ctx.user.id);
      if (user?.stripeCustomerId) {
        sessionParams.customer = user.stripeCustomerId;
      } else {
        sessionParams.customer_email = user?.email || undefined;
      }

      const session = await stripe.checkout.sessions.create(sessionParams as any);

      // Record pending payment
      await db.recordPayment({
        userId: ctx.user.id,
        stripeSessionId: session.id,
        type: input.type === "subscription" ? "subscription" : input.type,
        amount: mode === "subscription" ? 799 : (lineItems[0]?.price_data?.unit_amount ?? 0),
        status: "pending",
        metadata: JSON.stringify(metadata),
      });

      return { url: session.url };
    }),

  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const sub = await db.getUserSubscription(ctx.user.id);
    const user = await db.getUserById(ctx.user.id);
    return {
      plan: user?.subscriptionPlan || "free",
      status: sub?.status || null,
      currentPeriodEnd: sub?.currentPeriodEnd || null,
    };
  }),
});

export const tipsRouter = router({
  send: protectedProcedure
    .input(z.object({
      toUserId: z.number(),
      amount: z.number().min(1).max(100),
      submissionId: z.number().optional(),
      message: z.string().max(200).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.id === input.toUserId) return { error: "Cannot tip yourself" };
      return db.sendTokenTip(ctx.user.id, input.toUserId, input.amount, input.submissionId, input.message);
    }),
});

export const badgesRouter = router({
  list: publicProcedure.query(async () => {
    return db.getAllBadges();
  }),

  getUserBadges: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      return db.getUserBadges(input.userId);
    }),

  myBadges: protectedProcedure.query(async ({ ctx }) => {
    return db.getUserBadges(ctx.user.id);
  }),

  checkAndAward: protectedProcedure.mutation(async ({ ctx }) => {
    return db.checkAndAwardBadges(ctx.user.id);
  }),
});

// ============================================
// COMPOSED APP ROUTER
// ============================================

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  user: userRouter,
  tokens: tokensRouter,
  founder: founderRouter,
  submissions: submissionsRouter,
  predictions: predictionsRouter,
  comments: commentsRouter,
  likes: likesRouter,
  leaderboard: leaderboardRouter,
  notifications: notificationsRouter,
  admin: adminRouter,
  live: liveRouter,
  badges: badgesRouter,
  stripe: stripeRouter,
  tips: tipsRouter,
});

export type AppRouter = typeof appRouter;
