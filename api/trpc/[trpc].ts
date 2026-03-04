import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { z } from "zod";
import { COOKIE_NAME } from "../../shared/const";
import { getSessionCookieOptions } from "../../server/_core/cookies";
import { systemRouter } from "../../server/_core/systemRouter";
import {
  publicProcedure,
  protectedProcedure,
  router,
} from "../../server/_core/trpc";
import { createContext } from "../../server/_core/context";
import * as db from "../../server/db";

// Auth + user router — minimal surface for Vercel serverless.
// Exposes: system (framework), auth (me/logout), user (getProfile/updateAvatar).
// NO app feature routers (tokens, submissions, predictions, etc.).
const authApiRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  user: router({
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
    updateAvatar: protectedProcedure
      .input(
        z.object({
          avatarId: z.number().min(1).max(6),
          avatarName: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.updateUserAvatar(
          ctx.user.id,
          input.avatarId,
          input.avatarName
        );
        return { success: true };
      }),
  }),
});

const trpcMiddleware = createExpressMiddleware({
  router: authApiRouter,
  createContext,
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  return trpcMiddleware(req as any, res as any);
}
