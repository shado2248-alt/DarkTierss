import { Router, type IRouter } from "express";
import { db, playersTable, playerRatingsTable, gamemodesTable, tiersTable } from "@workspace/db";
import { eq, and, ilike } from "drizzle-orm";

const router: IRouter = Router();
const EXTERNAL_URL = "https://tierlist-bot.vercel.app/api/dark-tiers";

const RANK_TO_SLUG: Record<string, string> = {
  "High Tier 1": "ht1", "Low Tier 1": "lt1",
  "High Tier 2": "ht2", "Low Tier 2": "lt2",
  "High Tier 3": "ht3", "Low Tier 3": "lt3",
  "High Tier 4": "ht4", "Low Tier 4": "lt4",
  "High Tier 5": "ht5", "Low Tier 5": "lt5",
};

const GAMEMODE_NAME_MAP: Record<string, string> = {
  Sword: "sword", Axe: "axe", "Axe Pvp": "axe", SMP: "smp", Crystal: "crystal",
  UHC: "uhc", DiaPot: "diapot", NethPot: "nethpot", Mace: "mace",
  Cart: "cart", Manhunt: "manhunt",
};

type TierResult = {
  username: string;
  region: string;
  gamemode: string;
  rankEarned: string;
  timestamp: string;
};

async function syncPlayersFromExternalData(results: TierResult[], logger: { error: (...a: any[]) => void }) {
  try {
    const [gamemodes, tiers] = await Promise.all([
      db.select().from(gamemodesTable),
      db.select().from(tiersTable),
    ]);

    // Deduplicate: per username+gamemode keep the most recent result
    const dedupMap = new Map<string, TierResult>();
    for (const r of results) {
      const key = `${r.username.toLowerCase()}::${r.gamemode.toLowerCase()}`;
      const cur = dedupMap.get(key);
      if (!cur || new Date(r.timestamp) > new Date(cur.timestamp)) dedupMap.set(key, r);
    }

    // Group per username
    const byPlayer = new Map<string, TierResult[]>();
    for (const r of dedupMap.values()) {
      const k = r.username.toLowerCase();
      if (!byPlayer.has(k)) byPlayer.set(k, []);
      byPlayer.get(k)!.push(r);
    }

    for (const [, playerResults] of byPlayer) {
      const { username, region } = playerResults[0];

      // Find existing player by username (case-insensitive)
      const [existing] = await db.select().from(playersTable)
        .where(ilike(playersTable.username, username));

      let playerId: number;

      if (existing) {
        playerId = existing.id;
        if (existing.region !== region && region) {
          await db.update(playersTable).set({ region }).where(eq(playersTable.id, existing.id));
        }
      } else {
        // Fetch UUID from Mojang
        let uuid: string;
        try {
          const mRes = await fetch(
            `https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(username)}`,
            { signal: AbortSignal.timeout(5000) },
          );
          if (!mRes.ok) continue;
          const mData = await mRes.json() as { id: string; name: string };
          const raw = mData.id;
          uuid = `${raw.slice(0, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}-${raw.slice(16, 20)}-${raw.slice(20)}`;
        } catch {
          continue;
        }

        try {
          const [inserted] = await db.insert(playersTable)
            .values({ username, uuid, region: region || "NA" })
            .onConflictDoUpdate({
              target: playersTable.uuid,
              set: { username, region: region || "NA" },
            })
            .returning();
          playerId = inserted.id;
        } catch {
          // If insert failed (race), try to find by uuid
          const [found] = await db.select().from(playersTable)
            .where(ilike(playersTable.username, username));
          if (!found) continue;
          playerId = found.id;
        }
      }

      // Sync each gamemode rating
      for (const result of playerResults) {
        const tierSlug = RANK_TO_SLUG[result.rankEarned];
        if (!tierSlug) continue;
        const gmSlug = GAMEMODE_NAME_MAP[result.gamemode];
        if (!gmSlug) continue;

        const gm = gamemodes.find(g => g.slug === gmSlug);
        if (!gm) continue;
        const tier = tiers.find(t => t.slug === tierSlug && t.gamemodeId === gm.id);
        if (!tier) continue;

        const [existing] = await db.select().from(playerRatingsTable)
          .where(and(
            eq(playerRatingsTable.playerId, playerId),
            eq(playerRatingsTable.gamemodeId, gm.id),
          ));

        if (existing) {
          // Only update tier — don't touch ELO/win-loss data
          await db.update(playerRatingsTable)
            .set({ tierId: tier.id })
            .where(eq(playerRatingsTable.id, existing.id));
        } else {
          // New rating row — insert with defaults and the tier
          await db.insert(playerRatingsTable)
            .values({ playerId, gamemodeId: gm.id, tierId: tier.id })
            .onConflictDoNothing();
        }
      }
    }
  } catch (err) {
    logger.error({ err }, "Background tierlist sync failed");
  }
}

router.get("/tierlist", async (req, res): Promise<void> => {
  try {
    const response = await fetch(EXTERNAL_URL, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) {
      res.status(502).json({ error: "Upstream API error", status: response.status });
      return;
    }
    const data = await response.json() as TierResult[];
    res.setHeader("Cache-Control", "no-store");
    res.json(data);

    // Fire-and-forget background sync — never blocks the response
    syncPlayersFromExternalData(data, req.log).catch(() => {});
  } catch (err: any) {
    req.log.error({ err }, "Failed to proxy tierlist");
    res.status(502).json({ error: "Failed to reach tierlist API" });
  }
});

export default router;
