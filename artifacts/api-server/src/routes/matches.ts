import { Router, type IRouter } from "express";
import { db, matchesTable, playersTable, gamemodesTable, playerRatingsTable, tierPromotionsTable, tiersTable, auditLogsTable, usersTable } from "@workspace/db";
import { eq, desc, sql, and } from "drizzle-orm";
import {
  ListMatchesQueryParams,
  CreateMatchBody,
  GetMatchParams,
  UpdateMatchParams,
  UpdateMatchBody,
  DeleteMatchParams,
} from "@workspace/api-zod";
import { webhookMatchCreated, webhookTierPromotion } from "../lib/webhook";

const router: IRouter = Router();

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

function calcElo(winnerRating: number, loserRating: number, kFactor = 32): number {
  const expected = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
  return Math.round(kFactor * (1 - expected));
}

router.get("/matches", async (req, res): Promise<void> => {
  const qp = ListMatchesQueryParams.safeParse(req.query);
  const page = qp.success && qp.data.page ? qp.data.page : 1;
  const limit = qp.success && qp.data.limit ? Math.min(qp.data.limit, 100) : 20;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (qp.success && qp.data.gamemodeId) conditions.push(eq(matchesTable.gamemodeId, qp.data.gamemodeId));
  if (qp.success && qp.data.playerId) {
    conditions.push(
      sql`(${matchesTable.player1Id} = ${qp.data.playerId} OR ${matchesTable.player2Id} = ${qp.data.playerId})`
    );
  }
  const where = conditions.length > 0 ? (conditions.length === 1 ? conditions[0] : and(...conditions)) : undefined;

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

router.post("/matches", async (req, res): Promise<void> => {
  const parsed = CreateMatchBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { gamemodeId, player1Id, player2Id, winnerId, score, notes, playedAt } = parsed.data;
  const loserId = winnerId === player1Id ? player2Id : player1Id;

  // Get or create ratings
  async function getOrCreateRating(playerId: number) {
    const [existing] = await db
      .select()
      .from(playerRatingsTable)
      .where(and(eq(playerRatingsTable.playerId, playerId), eq(playerRatingsTable.gamemodeId, gamemodeId)));
    if (existing) return existing;
    const [created] = await db
      .insert(playerRatingsTable)
      .values({ playerId, gamemodeId, rating: 1000, peakRating: 1000, wins: 0, losses: 0, totalMatches: 0 })
      .returning();
    return created;
  }

  const winnerRating = await getOrCreateRating(winnerId);
  const loserRating  = await getOrCreateRating(loserId);

  const ratingChange   = calcElo(winnerRating.rating, loserRating.rating);
  const newWinnerRating = winnerRating.rating + ratingChange;
  const newLoserRating  = Math.max(100, loserRating.rating - ratingChange);

  // Determine tier from rating
  async function getTierForRating(rating: number) {
    const tiers = await db.select().from(tiersTable).orderBy(tiersTable.rank);
    for (const tier of tiers) {
      if (rating >= tier.minRating && (tier.maxRating == null || rating <= tier.maxRating)) return tier;
    }
    return null;
  }

  const newWinnerTier = await getTierForRating(newWinnerRating);
  const newLoserTier  = await getTierForRating(newLoserRating);
  const tierChanged   = newWinnerTier && (!winnerRating.tierId || winnerRating.tierId !== newWinnerTier.id);

  // Track promotion if tier changed for winner
  if (tierChanged) {
    await db.insert(tierPromotionsTable).values({
      playerId: winnerId,
      gamemodeId,
      fromTierId: winnerRating.tierId,
      toTierId: newWinnerTier!.id,
    });
  }

  // Streak calculation
  const newWinnerStreak    = (winnerRating.currentStreak ?? 0) + 1;
  const newWinnerMaxStreak = Math.max(winnerRating.maxStreak ?? 0, newWinnerStreak);

  // Update ratings + streaks
  await db.update(playerRatingsTable).set({
    rating:       newWinnerRating,
    peakRating:   Math.max(winnerRating.peakRating, newWinnerRating),
    wins:         winnerRating.wins + 1,
    totalMatches: winnerRating.totalMatches + 1,
    tierId:       newWinnerTier?.id ?? winnerRating.tierId,
    currentStreak: newWinnerStreak,
    maxStreak:    newWinnerMaxStreak,
  }).where(and(eq(playerRatingsTable.playerId, winnerId), eq(playerRatingsTable.gamemodeId, gamemodeId)));

  await db.update(playerRatingsTable).set({
    rating:       newLoserRating,
    losses:       loserRating.losses + 1,
    totalMatches: loserRating.totalMatches + 1,
    tierId:       newLoserTier?.id ?? loserRating.tierId,
    currentStreak: 0,
  }).where(and(eq(playerRatingsTable.playerId, loserId), eq(playerRatingsTable.gamemodeId, gamemodeId)));

  const [match] = await db.insert(matchesTable).values({
    gamemodeId,
    player1Id,
    player2Id,
    winnerId,
    score,
    ratingChange,
    notes,
    playedAt: playedAt ? new Date(playedAt) : new Date(),
  }).returning();

  // Audit log
  const session = req.session as any;
  const actorId = session?.userId as number | undefined;
  const [winnerPlayer] = await db.select().from(playersTable).where(eq(playersTable.id, winnerId));
  const [loserPlayer]  = await db.select().from(playersTable).where(eq(playersTable.id, loserId));
  const [gm]           = await db.select().from(gamemodesTable).where(eq(gamemodesTable.id, gamemodeId));

  let actorName = "Unknown";
  if (actorId) {
    const [actor] = await db.select({ username: usersTable.username, displayName: usersTable.displayName }).from(usersTable).where(eq(usersTable.id, actorId));
    if (actor) actorName = actor.displayName ?? actor.username ?? "Unknown";
  }

  db.insert(auditLogsTable).values({
    actorId: actorId ?? null,
    actorName,
    action: "match_created",
    details: {
      matchId:      match.id,
      gamemode:     gm?.name ?? "Unknown",
      winner:       winnerPlayer?.username ?? "Unknown",
      loser:        loserPlayer?.username ?? "Unknown",
      ratingChange,
      score: score ?? null,
    },
  }).catch(() => {});

  // Discord webhooks (fire-and-forget)
  try {
    await webhookMatchCreated({
      winnerName:   winnerPlayer?.username ?? "Unknown",
      loserName:    loserPlayer?.username  ?? "Unknown",
      gamemodeName: gm?.name ?? "Unknown",
      ratingChange,
      score,
    });
    if (tierChanged) {
      const oldTierRow = winnerRating.tierId
        ? (await db.select().from(tiersTable).where(eq(tiersTable.id, winnerRating.tierId)))[0]
        : null;
      await webhookTierPromotion({
        playerName:   winnerPlayer?.username ?? "Unknown",
        gamemodeName: gm?.name ?? "Unknown",
        fromTier:     oldTierRow?.name ?? null,
        toTier:       newWinnerTier!.name,
        newRating:    newWinnerRating,
      });
    }
  } catch { /* webhook errors never block */ }

  res.status(201).json(await formatMatch(match));
});

router.get("/matches/:id", async (req, res): Promise<void> => {
  const params = GetMatchParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [match] = await db.select().from(matchesTable).where(eq(matchesTable.id, params.data.id));
  if (!match) { res.status(404).json({ error: "Match not found" }); return; }
  res.json(await formatMatch(match));
});

router.patch("/matches/:id", async (req, res): Promise<void> => {
  const params = UpdateMatchParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateMatchBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const updates: Record<string, unknown> = {};
  if (parsed.data.score != null) updates.score = parsed.data.score;
  if (parsed.data.notes != null) updates.notes = parsed.data.notes;
  const [match] = await db.update(matchesTable).set(updates).where(eq(matchesTable.id, params.data.id)).returning();
  if (!match) { res.status(404).json({ error: "Match not found" }); return; }
  res.json(await formatMatch(match));
});

router.delete("/matches/:id", async (req, res): Promise<void> => {
  const params = DeleteMatchParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [match] = await db.delete(matchesTable).where(eq(matchesTable.id, params.data.id)).returning();
  if (!match) { res.status(404).json({ error: "Match not found" }); return; }
  res.sendStatus(204);
});

export default router;
