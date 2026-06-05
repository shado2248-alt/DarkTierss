import { Router, type IRouter } from "express";
import { db, playersTable, playerRatingsTable, tiersTable } from "@workspace/db";
import { eq, ilike, desc, sql, and } from "drizzle-orm";
import { GetLeaderboardQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/leaderboard", async (req, res): Promise<void> => {
  const qp = GetLeaderboardQueryParams.safeParse(req.query);
  const page = qp.success && qp.data.page ? qp.data.page : 1;
  const limit = qp.success && qp.data.limit ? Math.min(qp.data.limit, 100) : 20;
  const offset = (page - 1) * limit;
  const sortBy = (qp.success && qp.data.sortBy) ?? "rating";
  const gamemodeId = qp.success ? qp.data.gamemodeId : undefined;
  const region = qp.success ? qp.data.region : undefined;
  const search = qp.success ? qp.data.search : undefined;

  if (gamemodeId) {
    // Single gamemode — show each player's rating for that gamemode, no duplicates
    const conditions = [eq(playerRatingsTable.gamemodeId, gamemodeId)];
    if (region) conditions.push(eq(playersTable.region, region));
    if (search) conditions.push(ilike(playersTable.username, `%${search}%`));
    const where = and(...conditions);

    const [{ total }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(playerRatingsTable)
      .innerJoin(playersTable, eq(playerRatingsTable.playerId, playersTable.id))
      .where(where);

    const orderCol =
      sortBy === "wins"
        ? desc(playerRatingsTable.wins)
        : sortBy === "matches"
        ? desc(playerRatingsTable.totalMatches)
        : desc(playerRatingsTable.rating);

    const entries = await db
      .select({
        playerId: playersTable.id,
        username: playersTable.username,
        uuid: playersTable.uuid,
        region: playersTable.region,
        rating: playerRatingsTable.rating,
        peakRating: playerRatingsTable.peakRating,
        wins: playerRatingsTable.wins,
        losses: playerRatingsTable.losses,
        totalMatches: playerRatingsTable.totalMatches,
        tierId: playerRatingsTable.tierId,
      })
      .from(playerRatingsTable)
      .innerJoin(playersTable, eq(playerRatingsTable.playerId, playersTable.id))
      .where(where)
      .orderBy(orderCol)
      .limit(limit)
      .offset(offset);

    const formatted = await formatEntries(entries, offset);
    res.json({ entries: formatted, total: total ?? 0, page, limit });
    return;
  }

  // All modes — deduplicate by player, show their best (highest) rating
  // Use Drizzle's execute with a raw SQL that groups by player
  const regionFilter = region ? sql`AND p.region = ${region}` : sql``;
  const searchFilter = search ? sql`AND p.username ILIKE ${"%" + search + "%"}` : sql``;

  const orderExpr =
    sortBy === "wins"
      ? sql`SUM(pr.wins) DESC`
      : sortBy === "matches"
      ? sql`SUM(pr.total_matches) DESC`
      : sql`MAX(pr.rating) DESC`;

  const countResult = await db.execute<{ total: number }>(
    sql`SELECT COUNT(DISTINCT p.id)::int AS total
        FROM player_ratings pr
        INNER JOIN players p ON pr.player_id = p.id
        WHERE 1=1 ${regionFilter} ${searchFilter}`
  );
  const total = Number(countResult.rows[0]?.total ?? 0);

  const rows = await db.execute<{
    player_id: number;
    username: string;
    uuid: string;
    region: string;
    best_rating: number;
    total_wins: number;
    total_losses: number;
    total_matches: number;
    tier_id: number | null;
  }>(
    sql`SELECT
          p.id AS player_id,
          p.username,
          p.uuid,
          p.region,
          MAX(pr.rating) AS best_rating,
          SUM(pr.wins) AS total_wins,
          SUM(pr.losses) AS total_losses,
          SUM(pr.total_matches) AS total_matches,
          (SELECT pr2.tier_id FROM player_ratings pr2 WHERE pr2.player_id = p.id ORDER BY pr2.rating DESC LIMIT 1) AS tier_id
        FROM player_ratings pr
        INNER JOIN players p ON pr.player_id = p.id
        WHERE 1=1 ${regionFilter} ${searchFilter}
        GROUP BY p.id, p.username, p.uuid, p.region
        ORDER BY ${orderExpr}
        LIMIT ${limit} OFFSET ${offset}`
  );

  const formatted = await Promise.all(
    rows.rows.map(async (e, idx) => {
      let tierInfo = { tierName: null as string | null, tierColor: null as string | null, tierSlug: null as string | null };
      if (e.tier_id) {
        const [tier] = await db.select().from(tiersTable).where(eq(tiersTable.id, Number(e.tier_id)));
        if (tier) tierInfo = { tierName: tier.name, tierColor: tier.color, tierSlug: tier.slug };
      }
      return {
        rank: offset + idx + 1,
        playerId: Number(e.player_id),
        username: e.username,
        uuid: e.uuid,
        region: e.region,
        rating: Number(e.best_rating),
        peakRating: Number(e.best_rating),
        wins: Number(e.total_wins),
        losses: Number(e.total_losses),
        totalMatches: Number(e.total_matches),
        tierId: e.tier_id ? Number(e.tier_id) : null,
        ...tierInfo,
      };
    })
  );

  res.json({ entries: formatted, total, page, limit });
});

async function formatEntries(
  entries: Array<{
    playerId: number;
    username: string;
    uuid: string;
    region: string;
    rating: number;
    peakRating: number;
    wins: number;
    losses: number;
    totalMatches: number;
    tierId: number | null;
  }>,
  offset: number
) {
  return Promise.all(
    entries.map(async (e, idx) => {
      let tierInfo = { tierName: null as string | null, tierColor: null as string | null, tierSlug: null as string | null };
      if (e.tierId) {
        const [tier] = await db.select().from(tiersTable).where(eq(tiersTable.id, e.tierId));
        if (tier) tierInfo = { tierName: tier.name, tierColor: tier.color, tierSlug: tier.slug };
      }
      return {
        rank: offset + idx + 1,
        playerId: e.playerId,
        username: e.username,
        uuid: e.uuid,
        region: e.region,
        rating: e.rating,
        peakRating: e.peakRating,
        wins: e.wins,
        losses: e.losses,
        totalMatches: e.totalMatches,
        tierId: e.tierId,
        ...tierInfo,
      };
    })
  );
}

export default router;
