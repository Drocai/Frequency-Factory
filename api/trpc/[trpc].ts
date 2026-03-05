import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { createClient } from "@supabase/supabase-js";
import { publicProcedure, router } from "../../server/_core/trpc";
import { systemRouter } from "../../server/_core/systemRouter";
import * as db from "../../server/db";
import {
  userRouter,
  tokensRouter,
  founderRouter,
  submissionsRouter,
  predictionsRouter,
  commentsRouter,
  likesRouter,
  leaderboardRouter,
  notificationsRouter,
  adminRouter,
  liveRouter,
  badgesRouter,
  stripeRouter,
  tipsRouter,
} from "../../server/routers";

// ── Supabase Admin client ──────────────────────────────────
const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  "https://waapstehyslrjuqnthyj.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

function getSupabaseAdmin() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ── Cookie helpers ─────────────────────────────────────────
const SB_COOKIE = "sb-access-token";

function parseCookie(header: string, name: string): string | null {
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// ── tRPC context (Supabase auth) ───────────────────────────
async function createContext(opts: { req: VercelRequest; res: VercelResponse }) {
  let user: Awaited<ReturnType<typeof db.getUserByOpenId>> | null = null;

  try {
    const cookieHeader = (opts.req.headers.cookie as string) || "";
    const token = parseCookie(cookieHeader, SB_COOKIE);

    if (token && SUPABASE_SERVICE_KEY) {
      const sbAdmin = getSupabaseAdmin();
      const {
        data: { user: sbUser },
        error,
      } = await sbAdmin.auth.getUser(token);

      if (sbUser && !error) {
        let dbUser = await db.getUserByOpenId(sbUser.id);

        if (!dbUser) {
          await db.upsertUser({
            openId: sbUser.id,
            name: sbUser.user_metadata?.name || sbUser.email?.split("@")[0] || null,
            email: sbUser.email || null,
            loginMethod: "email",
            lastSignedIn: new Date(),
          });
          dbUser = await db.getUserByOpenId(sbUser.id);
        } else {
          await db.upsertUser({
            openId: sbUser.id,
            lastSignedIn: new Date(),
          });
        }

        user = dbUser || null;
      }
    }
  } catch {
    user = null;
  }

  return { req: opts.req, res: opts.res, user };
}

// ── Router (full app router with Supabase auth override) ───
const vercelRouter = router({
  system: systemRouter,
  dbPing: publicProcedure.query(async () => {
    return db.dbPing();
  }),

  // Auth uses Supabase cookie (overrides the Manus-based auth in appRouter)
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.setHeader(
        "Set-Cookie",
        `${SB_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`,
      );
      return { success: true } as const;
    }),
  }),

  // All other routers imported from server/routers.ts
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

// ── Express-style middleware → Vercel handler ──────────────
const trpcMiddleware = createExpressMiddleware({
  router: vercelRouter,
  createContext,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const trpcPath = Array.isArray(req.query.trpc)
    ? req.query.trpc.join("/")
    : (req.query.trpc as string) || "";
  const qs = (req.url || "").includes("?")
    ? (req.url || "").slice((req.url || "").indexOf("?"))
    : "";

  (req as any).path = `/${trpcPath}`;
  (req as any).url = `/${trpcPath}${qs}`;
  (req as any).baseUrl = "";

  return trpcMiddleware(req as any, res as any, () => {});
}
