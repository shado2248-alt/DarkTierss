import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID ?? "";
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET ?? "";
const BASE_URL = process.env.REPLIT_DEV_DOMAIN
  ? `https://${process.env.REPLIT_DEV_DOMAIN}`
  : "http://localhost:5000";
const REDIRECT_URI = `${BASE_URL}/api/auth/discord/callback`;

router.get("/auth/me", async (req, res): Promise<void> => {
  const session = req.session as any;
  if (!session?.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, session.userId));
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  res.json({
    id: user.id,
    discordId: user.discordId,
    username: user.username,
    displayName: user.displayName,
    avatar: user.avatar,
    role: user.role,
    isSuspended: user.isSuspended,
    createdAt: user.createdAt.toISOString(),
  });
});

router.post("/auth/logout", (req, res): void => {
  const session = req.session as any;
  session.destroy(() => {
    res.json({ success: true });
  });
});

router.get("/auth/discord", (_req, res): void => {
  if (!DISCORD_CLIENT_ID) {
    res.status(503).json({ error: "Discord OAuth not configured" });
    return;
  }
  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: "identify",
  });
  res.redirect(`https://discord.com/api/oauth2/authorize?${params}`);
});

router.get("/auth/discord/callback", async (req, res): Promise<void> => {
  const code = req.query.code as string;
  if (!code) {
    res.redirect("/?error=no_code");
    return;
  }

  try {
    const tokenResp = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });
    const tokenData = (await tokenResp.json()) as any;

    if (!tokenData.access_token) {
      res.redirect("/?error=token_error");
      return;
    }

    const userResp = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const discordUser = (await userResp.json()) as any;

    const [existing] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.discordId, discordUser.id));

    let userId: number;
    if (existing) {
      const [updated] = await db
        .update(usersTable)
        .set({
          username: discordUser.username,
          displayName: discordUser.global_name ?? discordUser.username,
          avatar: discordUser.avatar
            ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
            : null,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
        })
        .where(eq(usersTable.discordId, discordUser.id))
        .returning();
      userId = updated.id;
    } else {
      const [created] = await db
        .insert(usersTable)
        .values({
          discordId: discordUser.id,
          username: discordUser.username,
          displayName: discordUser.global_name ?? discordUser.username,
          avatar: discordUser.avatar
            ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
            : null,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          role: "user",
          isSuspended: false,
        })
        .returning();
      userId = created.id;
    }

    (req.session as any).userId = userId;
    res.redirect("/");
  } catch (err) {
    logger.error({ err }, "Discord OAuth error");
    res.redirect("/?error=oauth_error");
  }
});

export default router;
