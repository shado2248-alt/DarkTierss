import { Router, type IRouter } from "express";
import { db, usersTable, playersTable, matchesTable, testsTable, playerRatingsTable, tiersTable, tierPromotionsTable, announcementsTable } from "@workspace/db";
import { eq, ilike, desc, sql, and } from "drizzle-orm";
import {
  ListUsersQueryParams,
  UpdateUserParams,
  UpdateUserBody,
  GetAnalyticsQueryParams,
  ResetPlayerRatingParams,
  ResetPlayerRatingBody,
  ChangePlayerTierParams,
  ChangePlayerTierBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatUser(u: typeof usersTable.$inferSelect) {
  return {
    id: u.id,
    email: u.email,
    username: u.username,
    displayName: u.displayName,
    avatar: u.avatar,
    role: u.role,
    isSuspended: u.isSuspended,
    createdAt: u.createdAt.toISOString(),
  };
}

// ── STATS ──────────────────────────────────────────────────────────────────────
router.get("/admin/stats", async (_req, res): Promise<void> => {
  const [{ totalUsers }] = await db.select({ totalUsers: sql<number>`count(*)::int` }).from(usersTable);
  const [{ totalPlayers }] = await db.select({ totalPlayers: sql<number>`count(*)::int` }).from(playersTable);
  const [{ totalMatches }] = await db.select({ totalMatches: sql<number>`count(*)::int` }).from(matchesTable);
  const [{ pendingTests }] = await db.select({ pendingTests: sql<number>`count(*)::int` }).from(testsTable).where(eq(testsTable.status, "pending"));
  const [{ inProgressTests }] = await db.select({ inProgressTests: sql<number>`count(*)::int` }).from(testsTable).where(eq(testsTable.status, "in_progress"));
  const [{ activeStaff }] = await db.select({ activeStaff: sql<number>`count(*)::int` }).from(usersTable).where(sql`${usersTable.role} IN ('owner','admin','moderator','tester')`);
  const [{ totalAnnouncements }] = await db.select({ totalAnnouncements: sql<number>`count(*)::int` }).from(announcementsTable);
  const [{ totalPromotions }] = await db.select({ totalPromotions: sql<number>`count(*)::int` }).from(tierPromotionsTable);
  const [{ totalTesters }] = await db.select({ totalTesters: sql<number>`count(*)::int` }).from(usersTable).where(eq(usersTable.role, "tester"));

  res.json({
    totalUsers: totalUsers ?? 0,
    totalPlayers: totalPlayers ?? 0,
    totalMatches: totalMatches ?? 0,
    pendingTests: pendingTests ?? 0,
    inProgressTests: inProgressTests ?? 0,
    activeStaff: activeStaff ?? 0,
    totalAnnouncements: totalAnnouncements ?? 0,
    totalPromotions: totalPromotions ?? 0,
    totalTesters: totalTesters ?? 0,
  });
});

// ── USERS ──────────────────────────────────────────────────────────────────────
router.get("/admin/users", async (req, res): Promise<void> => {
  const qp = ListUsersQueryParams.safeParse(req.query);
  const page = qp.success && qp.data.page ? qp.data.page : 1;
  const limit = qp.success && qp.data.limit ? Math.min(qp.data.limit, 100) : 20;
  const offset = (page - 1) * limit;

  let where = undefined as any;
  if (qp.success && qp.data.search) {
    where = ilike(usersTable.username, `%${qp.data.search}%`);
  }

  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(usersTable).where(where);
  const users = await db.select().from(usersTable).where(where).orderBy(desc(usersTable.createdAt)).limit(limit).offset(offset);
  res.json({ users: users.map(formatUser), total: count ?? 0, page, limit });
});

router.patch("/admin/users/:id", async (req, res): Promise<void> => {
  const params = UpdateUserParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const session = req.session as any;
  let requesterRole = "user";
  if (session?.userId) {
    const [me] = await db.select({ role: usersTable.role }).from(usersTable).where(eq(usersTable.id, session.userId));
    if (me) requesterRole = me.role;
  }

  const updates: Record<string, unknown> = {};

  if (parsed.data.role != null) {
    const targetRole = parsed.data.role as string;
    if (requesterRole === "owner") {
      updates.role = targetRole;
    } else if (requesterRole === "admin") {
      if (!["user", "tester"].includes(targetRole)) {
        res.status(403).json({ error: "Admins can only assign user or tester roles" }); return;
      }
      updates.role = targetRole;
    } else {
      res.status(403).json({ error: "You do not have permission to change roles" }); return;
    }
  }
  if (parsed.data.isSuspended != null) updates.isSuspended = parsed.data.isSuspended;
  if (parsed.data.playerId != null) updates.playerId = parsed.data.playerId;

  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, params.data.id)).returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json(formatUser(user));
});

// ── TESTERS LIST ───────────────────────────────────────────────────────────────
router.get("/admin/testers", async (_req, res): Promise<void> => {
  const testers = await db
    .select({ id: usersTable.id, username: usersTable.username, displayName: usersTable.displayName, role: usersTable.role, avatar: usersTable.avatar })
    .from(usersTable)
    .where(sql`${usersTable.role} IN ('tester','moderator','admin','owner')`)
    .orderBy(usersTable.username);
  res.json(testers);
});

// ── ANALYTICS ──────────────────────────────────────────────────────────────────
router.get("/admin/analytics", async (req, res): Promise<void> => {
  const qp = GetAnalyticsQueryParams.safeParse(req.query);
  const period = (qp.success && qp.data.period) ?? "30d";
  const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;

  const userGrowthRaw = await db.execute(
    sql`SELECT DATE(created_at) as date, COUNT(*)::int as value FROM users WHERE created_at >= NOW() - INTERVAL '${sql.raw(String(days))} days' GROUP BY DATE(created_at) ORDER BY date`
  );
  const matchActivityRaw = await db.execute(
    sql`SELECT DATE(created_at) as date, COUNT(*)::int as value FROM matches WHERE created_at >= NOW() - INTERVAL '${sql.raw(String(days))} days' GROUP BY DATE(created_at) ORDER BY date`
  );
  const tierDistRaw = await db.execute(
    sql`SELECT t.name as label, COUNT(pr.id)::int as value FROM tiers t LEFT JOIN player_ratings pr ON pr.tier_id = t.id GROUP BY t.name ORDER BY value DESC`
  );
  const gamemodePopRaw = await db.execute(
    sql`SELECT g.name as label, COUNT(m.id)::int as value FROM gamemodes g LEFT JOIN matches m ON m.gamemode_id = g.id GROUP BY g.name ORDER BY value DESC`
  );
  const regionalRaw = await db.execute(
    sql`SELECT COALESCE(region, 'Unknown') as label, COUNT(*)::int as value FROM players GROUP BY region ORDER BY value DESC`
  );

  res.json({
    userGrowth: (userGrowthRaw.rows as any[]).map(r => ({ date: String(r.date), value: Number(r.value) })),
    matchActivity: (matchActivityRaw.rows as any[]).map(r => ({ date: String(r.date), value: Number(r.value) })),
    tierDistribution: (tierDistRaw.rows as any[]).map(r => ({ label: String(r.label), value: Number(r.value) })),
    gamemodePopularity: (gamemodePopRaw.rows as any[]).map(r => ({ label: String(r.label), value: Number(r.value) })),
    regionalDistribution: (regionalRaw.rows as any[]).map(r => ({ label: String(r.label), value: Number(r.value) })),
  });
});

// ── PLAYERS ────────────────────────────────────────────────────────────────────
router.post("/admin/players/:id/reset-rating", async (req, res): Promise<void> => {
  const params = ResetPlayerRatingParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = ResetPlayerRatingBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const newRating = parsed.data.newRating ?? 1000;
  await db.update(playerRatingsTable)
    .set({ rating: newRating, peakRating: newRating, wins: 0, losses: 0, totalMatches: 0 })
    .where(and(eq(playerRatingsTable.playerId, params.data.id), eq(playerRatingsTable.gamemodeId, parsed.data.gamemodeId)));

  const [player] = await db.select().from(playersTable).where(eq(playersTable.id, params.data.id));
  if (!player) { res.status(404).json({ error: "Player not found" }); return; }
  res.json({ id: player.id, username: player.username, uuid: player.uuid, region: player.region, country: player.country, userId: player.userId, createdAt: player.createdAt.toISOString(), updatedAt: player.updatedAt.toISOString() });
});

router.post("/admin/players/:id/change-tier", async (req, res): Promise<void> => {
  const params = ChangePlayerTierParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = ChangePlayerTierBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [existing] = await db.select().from(playerRatingsTable)
    .where(and(eq(playerRatingsTable.playerId, params.data.id), eq(playerRatingsTable.gamemodeId, parsed.data.gamemodeId)));

  if (existing) {
    await db.insert(tierPromotionsTable).values({ playerId: params.data.id, gamemodeId: parsed.data.gamemodeId, fromTierId: existing.tierId, toTierId: parsed.data.tierId });
    await db.update(playerRatingsTable)
      .set({ tierId: parsed.data.tierId })
      .where(and(eq(playerRatingsTable.playerId, params.data.id), eq(playerRatingsTable.gamemodeId, parsed.data.gamemodeId)));
  }

  const [player] = await db.select().from(playersTable).where(eq(playersTable.id, params.data.id));
  if (!player) { res.status(404).json({ error: "Player not found" }); return; }
  res.json({ id: player.id, username: player.username, uuid: player.uuid, region: player.region, country: player.country, userId: player.userId, createdAt: player.createdAt.toISOString(), updatedAt: player.updatedAt.toISOString() });
});

export default router;
