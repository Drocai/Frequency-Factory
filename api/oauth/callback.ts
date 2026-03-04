import type { VercelRequest, VercelResponse } from "@vercel/node";
import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const";
import { getSessionCookieOptions } from "../../server/_core/cookies";
import { sdk } from "../../server/_core/sdk";
import * as db from "../../server/db";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const code = req.query.code as string | undefined;
  const state = req.query.state as string | undefined;

  if (!code || !state) {
    return res.status(400).json({ error: "code and state are required" });
  }

  try {
    const tokenResponse = await sdk.exchangeCodeForToken(code, state);
    const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

    if (!userInfo.openId) {
      return res.status(400).json({ error: "openId missing from user info" });
    }

    await db.upsertUser({
      openId: userInfo.openId,
      name: userInfo.name || null,
      email: userInfo.email ?? null,
      loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
      lastSignedIn: new Date(),
    });

    const sessionToken = await sdk.createSessionToken(userInfo.openId, {
      name: userInfo.name || "",
      expiresInMs: ONE_YEAR_MS,
    });

    // Cookie attributes MUST match _core expectations exactly:
    //   httpOnly: true, path: "/", sameSite: "none", secure: true (on HTTPS)
    // getSessionCookieOptions() handles this — same function _core uses.
    const cookieOptions = getSessionCookieOptions(req as any);
    const parts = [
      `${COOKIE_NAME}=${sessionToken}`,
      `HttpOnly`,
      `Path=${cookieOptions.path || "/"}`,
      `SameSite=${cookieOptions.sameSite === "none" ? "None" : cookieOptions.sameSite || "None"}`,
      `Max-Age=${Math.floor(ONE_YEAR_MS / 1000)}`,
    ];
    if (cookieOptions.secure) {
      parts.push("Secure");
    }
    res.setHeader("Set-Cookie", parts.join("; "));

    return res.redirect(302, "/");
  } catch (error) {
    console.error("[OAuth] Callback failed", error);
    return res.status(500).json({ error: "OAuth callback failed" });
  }
}
