import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { COOKIE_NAME } from "../../shared/const";
import { getSessionCookieOptions } from "../../server/_core/cookies";
import { systemRouter } from "../../server/_core/systemRouter";
import { publicProcedure, router } from "../../server/_core/trpc";
import { createContext } from "../../server/_core/context";

// Auth-only router — NO app feature routers exposed.
// Reduces cold start, prevents MySQL feature endpoints from being public,
// and eliminates crashes from feature routers hitting missing DB state.
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
