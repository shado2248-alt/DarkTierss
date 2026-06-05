import { Router, type IRouter } from "express";
import { db, tiersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { ListTiersQueryParams, CreateTierBody, UpdateTierBody, UpdateTierParams, DeleteTierParams } from "@workspace/api-zod";

const router: IRouter = Router();

function formatTier(t: typeof tiersTable.$inferSelect) {
  return {
    id: t.id,
    name: t.name,
    slug: t.slug,
    rank: t.rank,
    minRating: t.minRating,
    maxRating: t.maxRating,
    color: t.color,
    gamemodeId: t.gamemodeId,
    createdAt: t.createdAt.toISOString(),
  };
}

router.get("/tiers", async (req, res): Promise<void> => {
  const qp = ListTiersQueryParams.safeParse(req.query);
  let query = db.select().from(tiersTable).$dynamic();
  if (qp.success && qp.data.gamemodeId) {
    query = query.where(eq(tiersTable.gamemodeId, qp.data.gamemodeId)) as typeof query;
  }
  const tiers = await query.orderBy(tiersTable.rank);
  res.json(tiers.map(formatTier));
});

router.post("/tiers", async (req, res): Promise<void> => {
  const parsed = CreateTierBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [tier] = await db
    .insert(tiersTable)
    .values({
      name: parsed.data.name,
      slug: parsed.data.slug,
      rank: parsed.data.rank,
      minRating: parsed.data.minRating,
      maxRating: parsed.data.maxRating,
      color: parsed.data.color,
      gamemodeId: parsed.data.gamemodeId,
    })
    .returning();
  res.status(201).json(formatTier(tier));
});

router.patch("/tiers/:id", async (req, res): Promise<void> => {
  const params = UpdateTierParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateTierBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updates: Record<string, unknown> = {};
  if (parsed.data.name != null) updates.name = parsed.data.name;
  if (parsed.data.slug != null) updates.slug = parsed.data.slug;
  if (parsed.data.rank != null) updates.rank = parsed.data.rank;
  if (parsed.data.minRating != null) updates.minRating = parsed.data.minRating;
  if (parsed.data.maxRating != null) updates.maxRating = parsed.data.maxRating;
  if (parsed.data.color != null) updates.color = parsed.data.color;
  const [tier] = await db
    .update(tiersTable)
    .set(updates)
    .where(eq(tiersTable.id, params.data.id))
    .returning();
  if (!tier) {
    res.status(404).json({ error: "Tier not found" });
    return;
  }
  res.json(formatTier(tier));
});

router.delete("/tiers/:id", async (req, res): Promise<void> => {
  const params = DeleteTierParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [tier] = await db
    .delete(tiersTable)
    .where(eq(tiersTable.id, params.data.id))
    .returning();
  if (!tier) {
    res.status(404).json({ error: "Tier not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
