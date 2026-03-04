import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../../server/routers";
import { createContext } from "../../server/_core/context";

// Full tRPC router for Vercel serverless — exposes all app routers
// (auth, user, tokens, submissions, predictions, comments, likes,
//  leaderboard, notifications, admin, live, system).
const trpcMiddleware = createExpressMiddleware({
  router: appRouter,
  createContext,
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  return trpcMiddleware(req as any, res as any);
}
