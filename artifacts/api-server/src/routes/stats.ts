import { Router, type IRouter } from "express";
import { db, playersTable, matchesTable, testsTable, tierPromotionsTable, gamemodesTable, tiersTable, settingsTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/settings", async (_req, res): Promise<void> => {
  const rows = await db.select().from(settingsTable);
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;
  res.json({ serverIp: map.serverIp ?? "", discordUrl: map.discordUrl ?? "" });
});

router.get("/stats", async (_req, res): Promise<void> => {
  const [{ totalPlayers }] = await db
    .select({ totalPlayers: sql<number>`count(*)::int` })
    .from(playersTable);

  const [{ totalMatches }] = await db
    .select({ totalMatches: sql<number>`count(*)::int` })
    .from(matchesTable);

  const [{ totalTests }] = await db
    .select({ totalTests: sql<number>`count(*)::int` })
    .from(testsTable);

  res.json({
    totalPlayers: totalPlayers ?? 0,
    totalMatches: totalMatches ?? 0,
    totalTests: totalTests ?? 0,
    onlinePlayers: 0,
  });
});

router.get("/stats/recent-activity", async (_req, res): Promise<void> => {
  const recentMatchesRaw = await db
    .select({
      id: matchesTable.id,
      gamemodeId: matchesTable.gamemodeId,
      gamemodeName: gamemodesTable.name,
      player1Id: matchesTable.player1Id,
      player2Id: matchesTable.player2Id,
      winnerId: matchesTable.winnerId,
      score: matchesTable.score,
      ratingChange: matchesTable.ratingChange,
      notes: matchesTable.notes,
      playedAt: matchesTable.playedAt,
      createdAt: matchesTable.createdAt,
    })
    .from(matchesTable)
    .leftJoin(gamemodesTable, eq(matchesTable.gamemodeId, gamemodesTable.id))
    .orderBy(desc(matchesTable.createdAt))
    .limit(5);

  const { playersTable: pt } = await import("@workspace/db");

  const recentMatches = await Promise.all(
    recentMatchesRaw.map(async (m) => {
      const [p1] = await db.select().from(pt).where(eq(pt.id, m.player1Id));
      const [p2] = await db.select().from(pt).where(eq(pt.id, m.player2Id));
      return {
        id: m.id,
        gamemodeId: m.gamemodeId,
        gamemodeName: m.gamemodeName ?? "Unknown",
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
    })
  );

  const recentPromotionsRaw = await db
    .select({
      id: tierPromotionsTable.id,
      playerId: tierPromotionsTable.playerId,
      gamemodeId: tierPromotionsTable.gamemodeId,
      fromTierId: tierPromotionsTable.fromTierId,
      toTierId: tierPromotionsTable.toTierId,
      promotedAt: tierPromotionsTable.promotedAt,
    })
    .from(tierPromotionsTable)
    .orderBy(desc(tierPromotionsTable.promotedAt))
    .limit(5);

  const recentPromotions = await Promise.all(
    recentPromotionsRaw.map(async (p) => {
      const [player] = await db.select().from(pt).where(eq(pt.id, p.playerId));
      const [gm] = await db.select().from(gamemodesTable).where(eq(gamemodesTable.id, p.gamemodeId));
      let fromTier: string | null = null;
      let toTier = "";
      if (p.fromTierId) {
        const [ft] = await db.select().from(tiersTable).where(eq(tiersTable.id, p.fromTierId));
        fromTier = ft?.name ?? null;
      }
      const [tt] = await db.select().from(tiersTable).where(eq(tiersTable.id, p.toTierId));
      toTier = tt?.name ?? "Unknown";
      return {
        id: p.id,
        playerId: p.playerId,
        playerName: player?.username ?? "Unknown",
        gamemodeId: p.gamemodeId,
        gamemodeName: gm?.name ?? "Unknown",
        fromTier,
        toTier,
        promotedAt: p.promotedAt.toISOString(),
      };
    })
  );

  res.json({ recentMatches, recentPromotions });
});

export default router;
