import { Router, type IRouter } from "express";
import { db, playersTable, playerRatingsTable, tiersTable, gamemodesTable, settingsTable } from "@workspace/db";
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

// Overall leaderboard: rank each player by their combined tier score across all gamemodes
// Score = average tier rank (1=HT1 best, 10=LT5 worst). Lower score = higher overall rank.
// All registered players are included; unranked players appear at the bottom.
router.get("/leaderboard/overall", async (_req, res): Promise<void> => {
  // Get all gamemodes
  const gamemodes = await db.select().from(gamemodesTable).orderBy(gamemodesTable.id);

  // Read leaderboard start date from settings
  const startDateSetting = await db.select().from(settingsTable).where(eq(settingsTable.key, "leaderboard_start_date"));
  const startDate = startDateSetting[0]?.value ?? null;
  const startDateFilter = startDate
    ? sql`AND pr.updated_at >= ${startDate}::timestamptz`
    : sql``;

  // Get all players who have at least one rating with a tier assigned (deduplicated by lowercase username)
  const rows = await db.execute<{
    player_id: number;
    username: string;
    uuid: string;
    region: string;
  }>(
    sql`SELECT DISTINCT ON (LOWER(p.username)) p.id AS player_id, p.username, p.uuid, p.region
        FROM players p
        INNER JOIN player_ratings pr ON pr.player_id = p.id
        WHERE pr.tier_id IS NOT NULL ${startDateFilter}
        ORDER BY LOWER(p.username), p.id ASC`
  );

  const players = rows.rows;

  // For each player, get all their gamemode ratings with tier info
  const results = await Promise.all(
    players.map(async (p) => {
      const ratings = await db
        .select({
          gamemodeId: playerRatingsTable.gamemodeId,
          rating: playerRatingsTable.rating,
          peakRating: playerRatingsTable.peakRating,
          tierId: playerRatingsTable.tierId,
        })
        .from(playerRatingsTable)
        .where(eq(playerRatingsTable.playerId, Number(p.player_id)));

      // Build per-gamemode tier map
      const gamemodeRatings: Record<
        number,
        { tierName: string | null; tierColor: string | null; tierSlug: string | null; tierRank: number; rating: number; peakRating: number }
      > = {};

      let totalTierRank = 0;
      let rankedCount = 0;

      for (const r of ratings) {
        let tierName: string | null = null;
        let tierColor: string | null = null;
        let tierSlug: string | null = null;
        let tierRank = 999;

        if (r.tierId) {
          const [tier] = await db.select().from(tiersTable).where(eq(tiersTable.id, r.tierId));
          if (tier) {
            tierName = tier.name;
            tierColor = tier.color;
            tierSlug = tier.slug;
            tierRank = tier.rank;
          }
        }

        gamemodeRatings[r.gamemodeId] = { tierName, tierColor, tierSlug, tierRank, rating: r.rating, peakRating: r.peakRating ?? r.rating };
        if (tierName) {
          totalTierRank += tierRank;
          rankedCount++;
        }
      }

      const overallScore = rankedCount > 0 ? totalTierRank / rankedCount : 999;

      return {
        playerId: Number(p.player_id),
        username: p.username,
        uuid: p.uuid,
        region: p.region,
        overallScore,
        rankedGamemodes: rankedCount,
        gamemodeRatings,
      };
    })
  );

  // Sort by overallScore ascending (lower = better tiers), then by rankedGamemodes descending
  results.sort((a, b) => {
    if (a.overallScore !== b.overallScore) return a.overallScore - b.overallScore;
    return b.rankedGamemodes - a.rankedGamemodes;
  });

  const formatted = results.map((r, idx) => ({
    rank: idx + 1,
    playerId: r.playerId,
    username: r.username,
    uuid: r.uuid,
    region: r.region,
    overallScore: Math.round(r.overallScore * 10) / 10,
    rankedGamemodes: r.rankedGamemodes,
    gamemodes: gamemodes.map((gm) => ({
      gamemodeId: gm.id,
      gamemodeName: gm.name,
      gamemodeSlug: gm.slug,
      ...( r.gamemodeRatings[gm.id] ?? { tierName: null, tierColor: null, tierSlug: null, tierRank: null, rating: null, peakRating: null }),
    })),
  }));

  res.json({ players: formatted, total: formatted.length });
});

export default router;
