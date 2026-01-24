import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { checkRateLimit, getRateLimitIdentifier, type RateLimitConfig, RATE_LIMITS } from "../rateLimit";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

// Rate limiting middleware factory
export const createRateLimitMiddleware = (
  endpoint: keyof typeof RATE_LIMITS = "default",
  config?: RateLimitConfig
) => {
  return t.middleware(async opts => {
    const { ctx, next } = opts;

    // Get client IP from request headers
    const ip = ctx.req.headers["x-forwarded-for"]?.toString().split(",")[0]
      || ctx.req.socket.remoteAddress
      || "unknown";

    const identifier = getRateLimitIdentifier(ctx.user?.id, ip);
    const result = checkRateLimit(identifier, endpoint, config);

    if (!result.allowed) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Rate limit exceeded. Try again in ${Math.ceil(result.resetIn / 1000)} seconds.`,
      });
    }

    return next();
  });
};

// Rate-limited procedure variants
export const rateLimitedProcedure = t.procedure.use(
  createRateLimitMiddleware("default")
);

export const rateLimitedProtectedProcedure = t.procedure
  .use(requireUser)
  .use(createRateLimitMiddleware("create"));
