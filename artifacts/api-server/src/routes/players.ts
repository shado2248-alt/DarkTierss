import { Router, type IRouter } from "express";
import { db, playersTable, playerRatingsTable, gamemodesTable, tiersTable, matchesTable, usersTable } from "@workspace/db";
import { eq, ilike, and, desc, asc, sql } from "drizzle-orm";
import {
  ListPlayersQueryParams,
  CreatePlayerBody,
  GetPlayerParams,
  UpdatePlayerParams,
  UpdatePlayerBody,
  DeletePlayerParams,
  GetPlayerRatingsParams,
  ListPlayerMatchesQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function formatRating(r: typeof playerRatingsTable.$inferSelect) {
  const [gm] = await db.select().from(gamemodesTable).where(eq(gamemodesTable.id, r.gamemodeId));
  let tierInfo = { tierId: null as number | null, tierName: null as string | null, tierColor: null as string | null, tierSlug: null as string | null };
  if (r.tierId) {
    const [tier] = await db.select().from(tiersTable).where(eq(tiersTable.id, r.tierId));
    if (tier) tierInfo = { tierId: tier.id, tierName: tier.name, tierColor: tier.color, tierSlug: tier.slug };
  }
  return {
    id: r.id,
    playerId: r.playerId,
    gamemodeId: r.gamemodeId,
    gamemodeName: gm?.name ?? "Unknown",
    gamemodeSlug: gm?.slug ?? "",
    rating: r.rating,
    peakRating: r.peakRating,
    wins: r.wins,
    losses: r.losses,
    totalMatches: r.totalMatches,
    currentStreak: r.currentStreak ?? 0,
    maxStreak: r.maxStreak ?? 0,
    ...tierInfo,
    season: r.season,
    updatedAt: r.updatedAt.toISOString(),
  };
}

async function formatMatch(m: typeof matchesTable.$inferSelect) {
  const [gm] = await db.select().from(gamemodesTable).where(eq(gamemodesTable.id, m.gamemodeId));
  const [p1] = await db.select().from(playersTable).where(eq(playersTable.id, m.player1Id));
  const [p2] = await db.select().from(playersTable).where(eq(playersTable.id, m.player2Id));
  return {
    id: m.id,
    gamemodeId: m.gamemodeId,
    gamemodeName: gm?.name ?? "Unknown",
    player1Id: m.player1Id,
    player1Name: p1?.username ?? "Unknown",
    player2Id: m.player2Id,
    player2Name: p2?.username ?? "Unknown",
    winnerId: m.winnerId,
    score: m.score,
    ratingChange: m.ratingChange,
    notes: m.notes,
    playedAt: m.playedAt.toISOString(),
    createdAt: m.createdAt.toISOString(),
  };
}

router.get("/players", async (req, res): Promise<void> => {
  const qp = ListPlayersQueryParams.safeParse(req.query);
  const page = qp.success && qp.data.page ? qp.data.page : 1;
  const limit = qp.success && qp.data.limit ? Math.min(qp.data.limit, 100) : 20;
  const offset = (page - 1) * limit;

  let where = undefined as any;
  if (qp.success && qp.data.search) {
    where = ilike(playersTable.username, `%${qp.data.search}%`);
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(playersTable)
    .where(where);

  const players = await db
    .select()
    .from(playersTable)
    .where(where)
    .orderBy(asc(playersTable.username))
    .limit(limit)
    .offset(offset);

  res.json({
    players: players.map((p) => ({
      id: p.id,
      username: p.username,
      uuid: p.uuid,
      region: p.region,
      country: p.country,
      userId: p.userId,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    })),
    total: count ?? 0,
    page,
    limit,
  });
});

router.post("/players", async (req, res): Promise<void> => {
  const parsed = CreatePlayerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [player] = await db
    .insert(playersTable)
    .values({
      username: parsed.data.username,
      uuid: parsed.data.uuid,
      region: parsed.data.region,
      country: parsed.data.country,
      userId: parsed.data.userId,
    })
    .returning();
  res.status(201).json({
    id: player.id,
    username: player.username,
    uuid: player.uuid,
    region: player.region,
    country: player.country,
    userId: player.userId,
    createdAt: player.createdAt.toISOString(),
    updatedAt: player.updatedAt.toISOString(),
  });
});

router.get("/players/:id", async (req, res): Promise<void> => {
  const params = GetPlayerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [player] = await db
    .select()
    .from(playersTable)
    .where(eq(playersTable.id, params.data.id));
  if (!player) {
    res.status(404).json({ error: "Player not found" });
    return;
  }
  const ratingsRaw = await db
    .select()
    .from(playerRatingsTable)
    .where(eq(playerRatingsTable.playerId, player.id));
  const ratings = await Promise.all(ratingsRaw.map(formatRating));

  const matchesRaw = await db
    .select()
    .from(matchesTable)
    .where(
      sql`${matchesTable.player1Id} = ${player.id} OR ${matchesTable.player2Id} = ${player.id}`
    )
    .orderBy(desc(matchesTable.playedAt))
    .limit(10);
  const recentMatches = await Promise.all(matchesRaw.map(formatMatch));

  res.json({
    id: player.id,
    username: player.username,
    uuid: player.uuid,
    region: player.region,
    country: player.country,
    userId: player.userId,
    createdAt: player.createdAt.toISOString(),
    updatedAt: player.updatedAt.toISOString(),
    ratings,
    recentMatches,
  });
});

router.patch("/players/:id", async (req, res): Promise<void> => {
  const params = UpdatePlayerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdatePlayerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updates: Record<string, unknown> = {};
  if (parsed.data.username != null) updates.username = parsed.data.username;
  if (parsed.data.uuid != null) updates.uuid = parsed.data.uuid;
  if (parsed.data.region != null) updates.region = parsed.data.region;
  if (parsed.data.country != null) updates.country = parsed.data.country;
  if (parsed.data.userId != null) updates.userId = parsed.data.userId;
  const [player] = await db
    .update(playersTable)
    .set(updates)
    .where(eq(playersTable.id, params.data.id))
    .returning();
  if (!player) {
    res.status(404).json({ error: "Player not found" });
    return;
  }
  res.json({
    id: player.id,
    username: player.username,
    uuid: player.uuid,
    region: player.region,
    country: player.country,
    userId: player.userId,
    createdAt: player.createdAt.toISOString(),
    updatedAt: player.updatedAt.toISOString(),
  });
});

router.delete("/players/:id", async (req, res): Promise<void> => {
  const params = DeletePlayerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [player] = await db
    .delete(playersTable)
    .where(eq(playersTable.id, params.data.id))
    .returning();
  if (!player) {
    res.status(404).json({ error: "Player not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/players/:id/ratings", async (req, res): Promise<void> => {
  const params = GetPlayerRatingsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const ratings = await db
    .select()
    .from(playerRatingsTable)
    .where(eq(playerRatingsTable.playerId, params.data.id));
  const formatted = await Promise.all(ratings.map(formatRating));
  res.json(formatted);
});

router.get("/player-match-history", async (req, res): Promise<void> => {
  const qp = ListPlayerMatchesQueryParams.safeParse(req.query);
  if (!qp.success) {
    res.status(400).json({ error: qp.error.message });
    return;
  }
  const page = qp.data.page ?? 1;
  const limit = Math.min(qp.data.limit ?? 20, 100);
  const offset = (page - 1) * limit;

  let where = eq(
    sql`(${matchesTable.player1Id} = ${qp.data.playerId} OR ${matchesTable.player2Id} = ${qp.data.playerId})`,
    sql`true`
  ) as any;

  if (qp.data.gamemodeId) {
    where = and(
      sql`(${matchesTable.player1Id} = ${qp.data.playerId} OR ${matchesTable.player2Id} = ${qp.data.playerId})`,
      eq(matchesTable.gamemodeId, qp.data.gamemodeId)
    );
  } else {
    where = sql`(${matchesTable.player1Id} = ${qp.data.playerId} OR ${matchesTable.player2Id} = ${qp.data.playerId})`;
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(matchesTable)
    .where(where);

  const matches = await db
    .select()
    .from(matchesTable)
    .where(where)
    .orderBy(desc(matchesTable.playedAt))
    .limit(limit)
    .offset(offset);

  const formatted = await Promise.all(matches.map(formatMatch));
  res.json({ matches: formatted, total: count ?? 0, page, limit });
});

// ── CLAIM ─────────────────────────────────────────────────────────────────────
router.post("/players/:id/claim", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid player id" }); return; }

  const sessionUserId = (req.session as any).userId as number | undefined;
  if (!sessionUserId) { res.status(401).json({ error: "Login required to claim a profile" }); return; }

  const [player] = await db.select().from(playersTable).where(eq(playersTable.id, id));
  if (!player) { res.status(404).json({ error: "Player not found" }); return; }

  if (player.userId) {
    if (player.userId === sessionUserId) {
      res.status(400).json({ error: "You already own this profile" }); return;
    }
    res.status(409).json({ error: "This profile has already been claimed" }); return;
  }

  // Check this user hasn't claimed another player already
  const [alreadyClaimed] = await db.select().from(playersTable).where(eq(playersTable.userId, sessionUserId));
  if (alreadyClaimed) {
    res.status(409).json({ error: `You already have a linked profile: ${alreadyClaimed.username}` }); return;
  }

  const [updated] = await db.update(playersTable)
    .set({ userId: sessionUserId, isVerified: true })
    .where(eq(playersTable.id, id))
    .returning();

  res.json({ id: updated.id, username: updated.username, isVerified: updated.isVerified });
});

export default router;
